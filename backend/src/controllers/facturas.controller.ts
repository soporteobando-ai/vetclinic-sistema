import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest, filtroTenant } from '../middleware/auth.middleware';

const generarNumero = async (veterinariaId: string): Promise<string> => {
  const ultima = await prisma.factura.findFirst({
    where: { veterinariaId },
    orderBy: { createdAt: 'desc' },
  });
  const num = ultima ? parseInt(ultima.numero.split('-')[1]) + 1 : 1;
  return `FAC-${String(num).padStart(6, '0')}`;
};

export const listar = async (req: AuthRequest, res: Response) => {
  const { clienteId, estado, desde, hasta } = req.query;
  const tenant = filtroTenant(req);
  const where: any = { ...tenant };
  if (clienteId) where.clienteId = String(clienteId);
  if (estado) where.estado = String(estado);
  if (desde || hasta) {
    where.fechaEmision = {};
    if (desde) where.fechaEmision.gte = new Date(String(desde));
    if (hasta) where.fechaEmision.lte = new Date(String(hasta));
  }

  const facturas = await prisma.factura.findMany({
    where,
    include: {
      cliente: { select: { nombre: true, apellido: true } },
      detalles: true,
      pagos: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(facturas);
};

export const obtener = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  const factura = await prisma.factura.findFirst({
    where: { id, ...tenant },
    include: {
      cliente: true,
      detalles: { include: { producto: true } },
      pagos: true,
      presupuesto: true,
    },
  });
  if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
  res.json(factura);
};

export const crear = async (req: AuthRequest, res: Response) => {
  const { clienteId, detalles, descuento = 0, medioPago, notas, presupuestoId } = req.body;
  const tenant = filtroTenant(req);
  try {
    const numero = await generarNumero(tenant.veterinariaId);
    const subtotal = detalles.reduce((acc: number, d: any) => acc + d.subtotal, 0);
    const total = subtotal - descuento;

    const factura = await prisma.factura.create({
      data: {
        ...tenant,
        numero, clienteId, presupuestoId, subtotal, descuento, total, medioPago, notas,
        detalles: { create: detalles },
      },
      include: { detalles: true, cliente: { select: { nombre: true, apellido: true } } },
    });

    res.status(201).json(factura);
  } catch {
    res.status(500).json({ error: 'Error al crear factura' });
  }
};

export const registrarPago = async (req: AuthRequest, res: Response) => {
  const { facturaId } = req.params;
  const { monto, medioPago, referencia, notas } = req.body;
  const tenant = filtroTenant(req);
  try {
    const facturaExisting = await prisma.factura.findFirst({ where: { id: facturaId, ...tenant } });
    if (!facturaExisting) return res.status(404).json({ error: 'Factura no encontrada' });

    const pago = await prisma.pago.create({ data: { facturaId, monto, medioPago, referencia, notas } });

    const factura = await prisma.factura.findUnique({ where: { id: facturaId }, include: { pagos: true } });
    const totalPagado = factura!.pagos.reduce((acc, p) => acc + p.monto, 0);
    const nuevoEstado = totalPagado >= factura!.total ? 'PAGADA'
      : totalPagado > 0 ? 'PARCIAL' : 'PENDIENTE';

    await prisma.factura.update({ where: { id: facturaId }, data: { estado: nuevoEstado } });
    res.status(201).json(pago);
  } catch {
    res.status(500).json({ error: 'Error al registrar pago' });
  }
};

export const anular = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  const existing = await prisma.factura.findFirst({ where: { id, ...tenant } });
  if (!existing) return res.status(404).json({ error: 'Factura no encontrada' });
  await prisma.factura.update({ where: { id }, data: { estado: 'ANULADA' } });
  res.json({ mensaje: 'Factura anulada' });
};

export const getCajaDiaria = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const pagos = await prisma.pago.findMany({
    where: {
      fecha: { gte: hoy, lt: manana },
      factura: { veterinariaId: tenant.veterinariaId },
    },
    include: { factura: { include: { cliente: { select: { nombre: true, apellido: true } } } } },
    orderBy: { fecha: 'asc' },
  });

  const totalCaja = pagos.reduce((acc, p) => acc + p.monto, 0);
  const porMedioPago = pagos.reduce((acc: any, p) => {
    acc[p.medioPago] = (acc[p.medioPago] || 0) + p.monto;
    return acc;
  }, {});

  res.json({ pagos, totalCaja, porMedioPago });
};
