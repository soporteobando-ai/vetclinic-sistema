import { Router } from 'express';
import { autenticar, verificarPermiso, filtroTenant, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const esteticaRoutes = Router();

const parsarServicios = (s: any) => ({
  ...s,
  servicios:    (() => { try { return JSON.parse(s.servicios    || '[]'); } catch { return []; } })(),
  fotosAntes:   (() => { try { return JSON.parse(s.fotosAntes   || '[]'); } catch { return []; } })(),
  fotosDespues: (() => { try { return JSON.parse(s.fotosDespues || '[]'); } catch { return []; } })(),
});

esteticaRoutes.use(autenticar);

esteticaRoutes.get('/', verificarPermiso('estetica:read'), async (req: AuthRequest, res) => {
  const { estado } = req.query;
  const tenant = filtroTenant(req);
  const where: any = { ...tenant };
  if (estado) where.estadoGrooming = String(estado);

  const servicios = await prisma.servicioEstetica.findMany({
    where,
    include: {
      mascota: { select: { nombre: true, especie: true, raza: true, foto: true } },
      turno: { include: { cliente: { select: { nombre: true, apellido: true, telefono: true } } } },
      estilista: { select: { nombre: true, apellido: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(servicios.map(parsarServicios));
});

esteticaRoutes.post('/', verificarPermiso('estetica:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  try {
    const body = { ...req.body, ...tenant };
    if (Array.isArray(body.servicios)) body.servicios = JSON.stringify(body.servicios);
    const servicio = await prisma.servicioEstetica.create({
      data: body,
      include: { mascota: true, turno: true },
    });
    res.status(201).json(parsarServicios(servicio));
  } catch {
    res.status(500).json({ error: 'Error al crear servicio de estética' });
  }
});

esteticaRoutes.get('/:id', verificarPermiso('estetica:read'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const servicio = await prisma.servicioEstetica.findFirst({
    where: { id: req.params.id, ...tenant },
    include: { mascota: true, turno: { include: { cliente: true } }, estilista: true },
  });
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });
  res.json(parsarServicios(servicio));
});

esteticaRoutes.put('/:id', verificarPermiso('estetica:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  try {
    const existing = await prisma.servicioEstetica.findFirst({ where: { id: req.params.id, ...tenant } });
    if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });

    const body = { ...req.body };
    if (Array.isArray(body.servicios)) body.servicios = JSON.stringify(body.servicios);
    const servicio = await prisma.servicioEstetica.update({ where: { id: req.params.id }, data: body });

    if (req.body.estadoGrooming === 'LISTO_RETIRAR') {
      const io = (req as any).io;
      if (io) io.emit('grooming:listo', { servicioId: servicio.id, mascotaId: servicio.mascotaId });
    }

    res.json(parsarServicios(servicio));
  } catch {
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

esteticaRoutes.patch('/:id/estado', verificarPermiso('estetica:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const { estadoGrooming } = req.body;
  try {
    const existing = await prisma.servicioEstetica.findFirst({ where: { id: req.params.id, ...tenant } });
    if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });

    const servicio = await prisma.servicioEstetica.update({
      where: { id: req.params.id },
      data: { estadoGrooming },
      include: { mascota: { select: { nombre: true } } },
    });

    const io = (req as any).io;
    if (io) io.emit('grooming:estado', parsarServicios(servicio));

    res.json(parsarServicios(servicio));
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});
