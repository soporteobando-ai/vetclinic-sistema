import { Router } from 'express';
import { autenticar, verificarPermiso, filtroTenant, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const guarderiaRoutes = Router();

guarderiaRoutes.use(autenticar);

guarderiaRoutes.get('/', verificarPermiso('agenda:read'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const guarderias = await prisma.guarderia.findMany({
    where: { ...tenant, fechaEgreso: null },
    include: {
      turno: { include: { mascota: true, cliente: { select: { nombre: true, apellido: true, telefono: true } } } },
      box: true,
      novedadesDiarias: { take: 1, orderBy: { fecha: 'desc' } },
    },
  });
  res.json(guarderias);
});

guarderiaRoutes.post('/', verificarPermiso('agenda:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  try {
    const guarderia = await prisma.guarderia.create({
      data: { ...req.body, ...tenant },
      include: { turno: true, box: true },
    });
    res.status(201).json(guarderia);
  } catch {
    res.status(500).json({ error: 'Error al registrar ingreso a guardería' });
  }
});

guarderiaRoutes.get('/boxes', verificarPermiso('agenda:read'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const boxes = await prisma.boxGuarderia.findMany({ where: { ...tenant, activo: true } });
  res.json(boxes);
});

guarderiaRoutes.post('/:id/novedad', verificarPermiso('agenda:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const existing = await prisma.guarderia.findFirst({ where: { id: req.params.id, ...tenant } });
  if (!existing) return res.status(404).json({ error: 'Guardería no encontrada' });

  const novedad = await prisma.novedadGuarderia.create({
    data: { ...req.body, guarderiaId: req.params.id },
  });
  res.status(201).json(novedad);
});

guarderiaRoutes.patch('/:id/egreso', verificarPermiso('agenda:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const existing = await prisma.guarderia.findFirst({ where: { id: req.params.id, ...tenant } });
  if (!existing) return res.status(404).json({ error: 'Guardería no encontrada' });

  const guarderia = await prisma.guarderia.update({ where: { id: req.params.id }, data: { fechaEgreso: new Date() } });
  res.json({ mensaje: 'Egreso registrado', guarderia });
});
