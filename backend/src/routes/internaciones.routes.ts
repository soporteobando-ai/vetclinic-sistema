import { Router } from 'express';
import { autenticar, verificarPermiso, filtroTenant, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { referenciaInvalida, tomarCampos } from '../utils/tenant';

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
    const data: any = {
      ...tomarCampos(req.body, [
        'mascotaId', 'camaId', 'veterinarioId', 'fechaIngreso', 'motivoIngreso', 'diagnostico', 'tratamiento',
      ]),
      ...tenant,
    };
    const campo = await referenciaInvalida(tenant.veterinariaId, data);
    if (campo) return res.status(400).json({ error: `Referencia inválida: ${campo}` });
    const internacion = await prisma.internacion.create({
      data,
      include: { mascota: true, cama: true },
    });
    await prisma.camaInternacion.update({ where: { id: internacion.camaId }, data: { estado: 'OCUPADA' } });
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

  const datos = tomarCampos(req.body, ['fecha', 'veterinarioId', 'temperatura', 'peso', 'estadoGeneral', 'notas']);
  const campo = await referenciaInvalida(tenant.veterinariaId, datos);
  if (campo) return res.status(400).json({ error: `Referencia inválida: ${campo}` });

  const evolucion = await prisma.evolucionInternacion.create({
    data: { ...datos, internacionId: req.params.id } as any,
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
