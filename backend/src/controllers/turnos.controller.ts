import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest, filtroTenant } from '../middleware/auth.middleware';
import { startOfDay, endOfDay } from '../utils/fechas';

const profesionalSelect = { id: true, nombre: true, apellido: true };

export const listar = async (req: AuthRequest, res: Response) => {
  const { fecha, profesionalId, estado, tipo, mascotaId } = req.query;
  const tenant = filtroTenant(req);
  const where: any = { ...tenant };

  if (fecha) {
    const d = new Date(String(fecha));
    where.fechaHora = { gte: startOfDay(d), lte: endOfDay(d) };
  }
  if (profesionalId) where.profesionalId = String(profesionalId);
  if (estado) where.estado = String(estado);
  if (tipo) where.tipo = String(tipo);
  if (mascotaId) where.mascotaId = String(mascotaId);

  const turnos = await prisma.turno.findMany({
    where,
    include: {
      mascota: { select: { id: true, nombre: true, especie: true, raza: true, foto: true } },
      cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
      profesional: { select: profesionalSelect },
    },
    orderBy: { fechaHora: 'asc' },
  });
  res.json(turnos);
};

export const obtener = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  const turno = await prisma.turno.findFirst({
    where: { id, ...tenant },
    include: {
      mascota: true,
      cliente: true,
      profesional: true,
      consulta: { include: { recetas: true, estudios: true } },
      servicioEstetica: true,
      guarderia: { include: { novedadesDiarias: true } },
    },
  });
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
  res.json(turno);
};

const parsearFechaHora = (valor: any): Date => new Date(String(valor));

const TIPOS_ESTETICA = new Set([
  'BANO', 'CORTE_PELO', 'PEINADO', 'TRATAMIENTO_PULGAS',
  'LIMPIEZA_DENTAL', 'CORTE_UNAS', 'HIDRATACION_PELAJE',
  'AROMATERAPIA', 'MASAJE',
]);

export const crear = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const data = { ...req.body, ...tenant };
    if (data.fechaHora) data.fechaHora = parsearFechaHora(data.fechaHora);

    const include = {
      mascota: { select: { nombre: true, especie: true } },
      cliente: { select: { nombre: true, apellido: true, telefono: true } },
      profesional: { select: profesionalSelect },
    };

    let turno;
    if (TIPOS_ESTETICA.has(data.tipo)) {
      turno = await prisma.$transaction(async (tx) => {
        const t = await tx.turno.create({ data, include });
        await tx.servicioEstetica.create({
          data: {
            veterinariaId: tenant.veterinariaId,
            turnoId: t.id,
            mascotaId: t.mascotaId,
            servicios: JSON.stringify([data.tipo]),
            estadoGrooming: 'EN_COLA',
          },
        });
        return t;
      });
    } else {
      turno = await prisma.turno.create({ data, include });
    }

    const io = (req as any).io;
    if (io) io.emit('turno:nuevo', turno);

    res.status(201).json(turno);
  } catch (e: any) {
    console.error('Error crear turno:', e.message);
    res.status(500).json({ error: 'Error al crear turno' });
  }
};

export const actualizarEstado = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { estado, notas } = req.body;
  const tenant = filtroTenant(req);
  try {
    const existing = await prisma.turno.findFirst({ where: { id, ...tenant } });
    if (!existing) return res.status(404).json({ error: 'Turno no encontrado' });

    const turno = await prisma.turno.update({
      where: { id },
      data: { estado, notas },
      include: {
        mascota: { select: { nombre: true } },
        cliente: { select: { nombre: true, apellido: true } },
      },
    });

    const io = (req as any).io;
    if (io) io.emit('turno:actualizado', turno);

    res.json(turno);
  } catch {
    res.status(500).json({ error: 'Error al actualizar turno' });
  }
};

export const actualizar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  try {
    const existing = await prisma.turno.findFirst({ where: { id, ...tenant } });
    if (!existing) return res.status(404).json({ error: 'Turno no encontrado' });

    const data = { ...req.body };
    if (data.fechaHora) data.fechaHora = parsearFechaHora(data.fechaHora);
    const turno = await prisma.turno.update({ where: { id }, data });
    res.json(turno);
  } catch {
    res.status(500).json({ error: 'Error al actualizar turno' });
  }
};

export const verificarConflicto = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const { profesionalId, fechaHora, duracionMin, turnoId } = req.body;
    if (!profesionalId || !fechaHora) return res.json({ conflicto: false, turnos: [] });

    const inicio = new Date(String(fechaHora));
    const duracion = Number(duracionMin) || 30;
    const fin = new Date(inicio.getTime() + duracion * 60 * 1000);

    const where: any = {
      ...tenant,
      profesionalId,
      estado: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO'] },
      fechaHora: { lt: fin },
    };
    if (turnoId) where.id = { not: turnoId };

    const candidatos = await prisma.turno.findMany({
      where,
      include: {
        mascota: { select: { nombre: true, especie: true } },
        cliente: { select: { nombre: true, apellido: true } },
      },
    });

    const conflictos = candidatos.filter(t => {
      const tFin = new Date(t.fechaHora).getTime() + (t.duracionMin || 30) * 60 * 1000;
      return tFin > inicio.getTime();
    });

    res.json({ conflicto: conflictos.length > 0, turnos: conflictos });
  } catch {
    res.status(500).json({ error: 'Error al verificar conflicto' });
  }
};

export const cancelar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const tenant = filtroTenant(req);
  const existing = await prisma.turno.findFirst({ where: { id, ...tenant } });
  if (!existing) return res.status(404).json({ error: 'Turno no encontrado' });
  await prisma.turno.update({ where: { id }, data: { estado: 'CANCELADO', notas: motivo } });
  res.json({ mensaje: 'Turno cancelado' });
};

export const getCalendario = async (req: AuthRequest, res: Response) => {
  const { inicio, fin } = req.query;
  if (!inicio || !fin) return res.status(400).json({ error: 'Fechas requeridas' });
  const tenant = filtroTenant(req);

  const turnos = await prisma.turno.findMany({
    where: {
      ...tenant,
      fechaHora: { gte: new Date(String(inicio)), lte: new Date(String(fin)) },
    },
    include: {
      mascota: { select: { nombre: true, especie: true } },
      cliente: { select: { nombre: true, apellido: true } },
      profesional: { select: profesionalSelect },
    },
    orderBy: { fechaHora: 'asc' },
  });
  res.json(turnos);
};
