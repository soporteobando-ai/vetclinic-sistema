import { Router } from 'express';
import { autenticar, autorizar } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const internacionRoutes = Router();

internacionRoutes.use(autenticar);

internacionRoutes.get('/', async (_req, res) => {
  const internaciones = await prisma.internacion.findMany({
    where: { activa: true },
    include: {
      mascota: { include: { cliente: { select: { nombre: true, apellido: true, telefono: true } } } },
      cama: true,
      evolucionesDiarias: { take: 1, orderBy: { fecha: 'desc' } },
    },
    orderBy: { fechaIngreso: 'desc' },
  });
  res.json(internaciones);
});

internacionRoutes.post('/', autorizar('VETERINARIO', 'ADMIN'), async (req, res) => {
  try {
    const internacion = await prisma.internacion.create({
      data: req.body,
      include: { mascota: true, cama: true },
    });
    await prisma.camaInternacion.update({
      where: { id: req.body.camaId },
      data: { estado: 'OCUPADA' },
    });
    res.status(201).json(internacion);
  } catch {
    res.status(500).json({ error: 'Error al registrar internación' });
  }
});

internacionRoutes.get('/camas', async (_req, res) => {
  const camas = await prisma.camaInternacion.findMany({ orderBy: { numero: 'asc' } });
  res.json(camas);
});

internacionRoutes.post('/:id/evolucion', autorizar('VETERINARIO', 'ADMIN'), async (req, res) => {
  const evolucion = await prisma.evolucionInternacion.create({
    data: { ...req.body, internacionId: req.params.id },
  });
  res.status(201).json(evolucion);
});

internacionRoutes.patch('/:id/alta', autorizar('VETERINARIO', 'ADMIN'), async (req, res) => {
  const internacion = await prisma.internacion.update({
    where: { id: req.params.id },
    data: { activa: false, fechaAlta: new Date() },
  });
  await prisma.camaInternacion.update({
    where: { id: internacion.camaId },
    data: { estado: 'DISPONIBLE' },
  });
  res.json({ mensaje: 'Alta médica registrada' });
});
