import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest, filtroTenant } from '../middleware/auth.middleware';

export const listar = async (req: AuthRequest, res: Response) => {
  const { buscar, pagina = '1', porPagina = '20' } = req.query;
  const tenant = filtroTenant(req);
  const where: any = { ...tenant };

  if (buscar) {
    const q = { contains: String(buscar), mode: 'insensitive' as const };
    where.OR = [
      { nombre: q }, { apellido: q }, { dni: q },
      { email: q }, { telefono: q },
    ];
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      include: { mascotas: { where: { activo: true }, select: { id: true, nombre: true, especie: true } } },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      skip: (Number(pagina) - 1) * Number(porPagina),
      take: Number(porPagina),
    }),
    prisma.cliente.count({ where }),
  ]);

  res.json({ clientes, total });
};

export const obtener = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  const cliente = await prisma.cliente.findFirst({
    where: { id, ...tenant },
    include: {
      mascotas: { where: { activo: true } },
      turnos: { take: 5, orderBy: { fechaHora: 'desc' }, include: { mascota: { select: { nombre: true } } } },
      facturas: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
};

export const crear = async (req: AuthRequest, res: Response) => {
  const { nombre, apellido, dni, email, telefono, telefonoAlt, direccion, ciudad, notas } = req.body;
  const tenant = filtroTenant(req);
  try {
    const cliente = await prisma.cliente.create({
      data: {
        ...tenant, nombre, apellido,
        dni: dni || null, email: email || null, telefono,
        telefonoAlt: telefonoAlt || null, direccion: direccion || null,
        ciudad: ciudad || null, notas: notas || null,
      },
    });
    res.status(201).json(cliente);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'DNI ya registrado en esta clínica' });
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

export const actualizar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  const { nombre, apellido, dni, email, telefono, telefonoAlt, direccion, ciudad, notas } = req.body;
  try {
    const existing = await prisma.cliente.findFirst({ where: { id, ...tenant } });
    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre, apellido, dni: dni || null, email: email || null, telefono,
        telefonoAlt: telefonoAlt || null, direccion: direccion || null,
        ciudad: ciudad || null, notas: notas || null,
      },
    });
    res.json(cliente);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'DNI ya registrado en esta clínica' });
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

export const eliminar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  try {
    const existing = await prisma.cliente.findFirst({ where: { id, ...tenant } });
    if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
    await prisma.cliente.delete({ where: { id } });
    res.json({ mensaje: 'Cliente eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};
