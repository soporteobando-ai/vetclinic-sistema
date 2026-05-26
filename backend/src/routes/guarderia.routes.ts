import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const guarderiaRoutes = Router();

guarderiaRoutes.use(autenticar);

guarderiaRoutes.get('/', async (_req, res) => {
  const guarderias = await prisma.guarderia.findMany({
    where: { fechaEgreso: null },
    include: {
      turno: { include: { mascota: true, cliente: { select: { nombre: true, apellido: true, telefono: true } } } },
      box: true,
      novedadesDiarias: { take: 1, orderBy: { fecha: 'desc' } },
    },
  });
  res.json(guarderias);
});

guarderiaRoutes.post('/', async (req, res) => {
  try {
    const guarderia = await prisma.guarderia.create({
      data: req.body,
      include: { turno: true, box: true },
    });
    res.status(201).json(guarderia);
  } catch {
    res.status(500).json({ error: 'Error al registrar ingreso a guardería' });
  }
});

guarderiaRoutes.get('/boxes', async (_req, res) => {
  const boxes = await prisma.boxGuarderia.findMany({ where: { activo: true } });
  res.json(boxes);
});

guarderiaRoutes.post('/:id/novedad', async (req, res) => {
  const novedad = await prisma.novedadGuarderia.create({
    data: { ...req.body, guarderiaId: req.params.id },
  });
  res.status(201).json(novedad);
});

guarderiaRoutes.patch('/:id/egreso', async (req, res) => {
  const guarderia = await prisma.guarderia.update({
    where: { id: req.params.id },
    data: { fechaEgreso: new Date() },
  });
  res.json({ mensaje: 'Egreso registrado', guarderia });
});
