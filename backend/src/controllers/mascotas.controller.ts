import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const listar = async (req: Request, res: Response) => {
  const { buscar, clienteId, especie } = req.query;
  const where: any = { activo: true };
  if (clienteId) where.clienteId = String(clienteId);
  if (especie) where.especie = String(especie);
  if (buscar) {
    const q = { contains: String(buscar), mode: 'insensitive' as const };
    where.OR = [{ nombre: q }, { raza: q }, { microchip: q }];
  }

  const mascotas = await prisma.mascota.findMany({
    where,
    include: { cliente: { select: { nombre: true, apellido: true, telefono: true } } },
    orderBy: { nombre: 'asc' },
  });
  res.json(mascotas);
};

export const obtener = async (req: Request, res: Response) => {
  const { id } = req.params;
  const mascota = await prisma.mascota.findUnique({
    where: { id },
    include: {
      cliente: true,
      consultas: {
        take: 10,
        orderBy: { fecha: 'desc' },
        include: { veterinario: { select: { nombre: true, apellido: true } }, recetas: true },
      },
      vacunas: { orderBy: { fechaAplicacion: 'desc' } },
      desparasitaciones: { orderBy: { fechaAplicacion: 'desc' } },
      serviciosEstetica: { take: 5, orderBy: { createdAt: 'desc' } },
      internaciones: { where: { activa: true } },
      carnetDigital: true,
    },
  });
  if (!mascota) return res.status(404).json({ error: 'Mascota no encontrada' });
  res.json(mascota);
};

const parsearFecha = (valor: any): Date | null => {
  if (!valor || valor === '') return null;
  if (valor instanceof Date) return valor;
  const str = String(valor).trim();
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00.000Z');
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

// Extrae solo los campos del modelo Mascota (descarta relaciones anidadas que envía el frontend)
const sanitizarMascota = (body: any) => {
  const CAMPOS_MASCOTA = [
    'clienteId', 'nombre', 'especie', 'raza', 'sexo', 'fechaNacimiento',
    'color', 'peso', 'microchip', 'foto', 'esterilizado',
    'alergias', 'condicionesCronicas', 'activo',
  ];
  const data: any = {};
  for (const campo of CAMPOS_MASCOTA) {
    if (campo in body) data[campo] = body[campo];
  }
  data.fechaNacimiento = parsearFecha(data.fechaNacimiento);
  if (!data.microchip || String(data.microchip).trim() === '') data.microchip = null;
  if (data.peso === '' || data.peso === null || isNaN(Number(data.peso))) data.peso = null;
  return data;
};

export const crear = async (req: Request, res: Response) => {
  try {
    const data = sanitizarMascota(req.body);
    const mascota = await prisma.mascota.create({
      data,
      include: { cliente: { select: { nombre: true, apellido: true } } },
    });
    res.status(201).json(mascota);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Microchip ya registrado' });
    res.status(500).json({ error: 'Error al crear mascota' });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = sanitizarMascota(req.body);
    const mascota = await prisma.mascota.update({ where: { id }, data });
    res.json(mascota);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Microchip ya registrado' });
    res.status(500).json({ error: 'Error al actualizar mascota' });
  }
};

export const darDeBaja = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.mascota.update({ where: { id }, data: { activo: false } });
  res.json({ mensaje: 'Mascota dada de baja' });
};

const parseJsonField = (value: string, fallback: any[] = []) => {
  try { return JSON.parse(value || '[]'); } catch { return fallback; }
};

export const historialClinico = async (req: Request, res: Response) => {
  const { id } = req.params;
  const [consultas, vacunas, desparasitaciones, rawEstetica] = await Promise.all([
    prisma.consulta.findMany({
      where: { mascotaId: id },
      include: {
        veterinario: { select: { nombre: true, apellido: true } },
        recetas: true,
        estudios: true,
      },
      orderBy: { fecha: 'desc' },
    }),
    prisma.vacuna.findMany({ where: { mascotaId: id }, orderBy: { fechaAplicacion: 'desc' } }),
    prisma.desparasitacion.findMany({ where: { mascotaId: id }, orderBy: { fechaAplicacion: 'desc' } }),
    prisma.servicioEstetica.findMany({
      where: { mascotaId: id },
      include: {
        turno: { select: { fechaHora: true, profesional: { select: { nombre: true, apellido: true } } } },
        estilista: { select: { nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const serviciosEstetica = rawEstetica.map(s => ({
    ...s,
    servicios:    parseJsonField(s.servicios),
    fotosAntes:   parseJsonField(s.fotosAntes),
    fotosDespues: parseJsonField(s.fotosDespues),
  }));

  res.json({ consultas, vacunas, desparasitaciones, serviciosEstetica });
};
