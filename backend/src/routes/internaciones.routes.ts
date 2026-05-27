import { Router } from 'express';
import { autenticar, verificarPermiso, filtroTenant, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const internacionRoutes = Router();

internacionRoutes.use(autenticar);

internacionRoutes.get('/', verificarPermiso('consultas:read'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const internaciones = await prisma.internacion.findMany({
    where: { ...tenant, activa: true },
    include: {
      mascota: { include: { cliente: { select: { nombre: true, apellido: true, telefono: true } } } },
      cama: true,
      evolucionesDiarias: { take: 1, orderBy: { fecha: 'desc' } },
    },
    orderBy: { fechaIngreso: 'desc' },
  });
  res.json(internaciones);
});

internacionRoutes.post('/', verificarPermiso('consultas:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  try {
    const internacion = await prisma.internacion.create({
      data: { ...req.body, ...tenant },
      include: { mascota: true, cama: true },
    });
    await prisma.camaInternacion.update({ where: { id: req.body.camaId }, data: { estado: 'OCUPADA' } });
    res.status(201).json(internacion);
  } catch {
    res.status(500).json({ error: 'Error al registrar internación' });
  }
});

internacionRoutes.get('/camas', verificarPermiso('consultas:read'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const camas = await prisma.camaInternacion.findMany({ where: tenant, orderBy: { numero: 'asc' } });
  res.json(camas);
});

internacionRoutes.post('/:id/evolucion', verificarPermiso('consultas:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const existing = await prisma.internacion.findFirst({ where: { id: req.params.id, ...tenant } });
  if (!existing) return res.status(404).json({ error: 'Internación no encontrada' });

  const evolucion = await prisma.evolucionInternacion.create({
    data: { ...req.body, internacionId: req.params.id },
  });
  res.status(201).json(evolucion);
});

internacionRoutes.patch('/:id/alta', verificarPermiso('consultas:write'), async (req: AuthRequest, res) => {
  const tenant = filtroTenant(req);
  const existing = await prisma.internacion.findFirst({ where: { id: req.params.id, ...tenant } });
  if (!existing) return res.status(404).json({ error: 'Internación no encontrada' });

  const internacion = await prisma.internacion.update({
    where: { id: req.params.id },
    data: { activa: false, fechaAlta: new Date() },
  });
  await prisma.camaInternacion.update({ where: { id: internacion.camaId }, data: { estado: 'DISPONIBLE' } });
  res.json({ mensaje: 'Alta médica registrada' });
});
