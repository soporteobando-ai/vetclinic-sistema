import { Response } from 'express';
import { AuthRequest, filtroTenant } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays } from '../utils/fechas';

export const getMetricas = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const hoy = new Date();
    const inicioHoy = startOfDay(hoy);
    const finHoy = endOfDay(hoy);
    const inicioMes = startOfMonth(hoy);
    const finMes = endOfMonth(hoy);
    const en7Dias = addDays(hoy, 7);

    const [
      turnosHoy,
      turnosMes,
      pacientesTotal,
      clientesTotal,
      consultasHoy,
      ingresosMes,
      vacunasProximas,
      internacionesActivas,
      groomingActivo,
    ] = await Promise.all([
      prisma.turno.count({ where: { ...tenant, fechaHora: { gte: inicioHoy, lte: finHoy } } }),
      prisma.turno.count({ where: { ...tenant, fechaHora: { gte: inicioMes, lte: finMes }, estado: { not: 'CANCELADO' } } }),
      prisma.mascota.count({ where: { ...tenant, activo: true } }),
      prisma.cliente.count({ where: tenant }),
      prisma.consulta.count({ where: { ...tenant, fecha: { gte: inicioHoy, lte: finHoy } } }),
      prisma.factura.aggregate({
        where: { ...tenant, fechaEmision: { gte: inicioMes, lte: finMes }, estado: { not: 'ANULADA' } },
        _sum: { total: true },
      }),
      prisma.vacuna.count({
        where: {
          proximaDosis: { gte: hoy, lte: en7Dias },
          mascota: { veterinariaId: tenant.veterinariaId },
        },
      }),
      prisma.internacion.count({ where: { ...tenant, activa: true } }),
      prisma.servicioEstetica.count({ where: { ...tenant, estadoGrooming: { in: ['EN_COLA', 'EN_PROCESO'] } } }),
    ]);

    const productosStockBajo = await prisma.producto.findMany({
      where: { ...tenant, activo: true },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true },
    });
    const stockCritico = productosStockBajo.filter(p => p.stockActual <= p.stockMinimo).length;

    res.json({
      turnosHoy, turnosMes, pacientesTotal, clientesTotal, consultasHoy,
      ingresosMes: ingresosMes._sum.total || 0,
      stockCritico, vacunasProximas, internacionesActivas, groomingActivo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
};

export const getTurnosHoy = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const hoy = new Date();
    const turnos = await prisma.turno.findMany({
      where: { ...tenant, fechaHora: { gte: startOfDay(hoy), lte: endOfDay(hoy) } },
      include: {
        mascota: { select: { id: true, nombre: true, especie: true, raza: true, foto: true } },
        cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
        profesional: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaHora: 'asc' },
    });
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos de hoy' });
  }
};

export const getActividadReciente = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const [ultimasConsultas, ultimosTurnos, ultimasFacturas] = await Promise.all([
      prisma.consulta.findMany({
        where: tenant,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          mascota: { select: { nombre: true, especie: true } },
          veterinario: { select: { nombre: true, apellido: true } },
        },
      }),
      prisma.turno.findMany({
        where: { ...tenant, estado: 'COMPLETADO' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          mascota: { select: { nombre: true } },
          cliente: { select: { nombre: true, apellido: true } },
        },
      }),
      prisma.factura.findMany({
        where: tenant,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { cliente: { select: { nombre: true, apellido: true } } },
      }),
    ]);

    res.json({ ultimasConsultas, ultimosTurnos, ultimasFacturas });
  } catch {
    res.status(500).json({ error: 'Error al obtener actividad reciente' });
  }
};

export const getAlertasStock = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const productos = await prisma.producto.findMany({
      where: { ...tenant, activo: true },
      orderBy: { stockActual: 'asc' },
    });
    const criticos = productos.filter(p => p.stockActual <= p.stockMinimo);
    res.json(criticos);
  } catch {
    res.status(500).json({ error: 'Error al obtener alertas de stock' });
  }
};

export const getVacunasProximas = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const en15Dias = addDays(new Date(), 15);
    const vacunas = await prisma.vacuna.findMany({
      where: {
        proximaDosis: { gte: new Date(), lte: en15Dias },
        mascota: { veterinariaId: tenant.veterinariaId },
      },
      include: { mascota: { include: { cliente: { select: { nombre: true, apellido: true, telefono: true } } } } },
      orderBy: { proximaDosis: 'asc' },
    });
    res.json(vacunas);
  } catch {
    res.status(500).json({ error: 'Error al obtener vacunas próximas' });
  }
};

export const getIngresosPorPeriodo = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  try {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicio = startOfMonth(fecha);
      const fin = endOfMonth(fecha);

      const resultado = await prisma.factura.aggregate({
        where: { ...tenant, fechaEmision: { gte: inicio, lte: fin }, estado: { not: 'ANULADA' } },
        _sum: { total: true },
      });

      meses.push({
        mes: inicio.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
        ingresos: resultado._sum.total || 0,
      });
    }
    res.json(meses);
  } catch {
    res.status(500).json({ error: 'Error al obtener ingresos' });
  }
};
