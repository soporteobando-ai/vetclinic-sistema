import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays } from '../utils/fechas';

export const getMetricas = async (_req: AuthRequest, res: Response) => {
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
      stockCritico,
      vacunasProximas,
      internacionesActivas,
      groomingActivo,
    ] = await Promise.all([
      prisma.turno.count({ where: { fechaHora: { gte: inicioHoy, lte: finHoy } } }),
      prisma.turno.count({ where: { fechaHora: { gte: inicioMes, lte: finMes }, estado: { not: 'CANCELADO' } } }),
      prisma.mascota.count({ where: { activo: true } }),
      prisma.cliente.count(),
      prisma.consulta.count({ where: { fecha: { gte: inicioHoy, lte: finHoy } } }),
      prisma.factura.aggregate({
        where: { fechaEmision: { gte: inicioMes, lte: finMes }, estado: { not: 'ANULADA' } },
        _sum: { total: true },
      }),
      prisma.producto.count({ where: { activo: true } }),
      prisma.vacuna.count({ where: { proximaDosis: { gte: hoy, lte: en7Dias } } }),
      prisma.internacion.count({ where: { activa: true } }),
      prisma.servicioEstetica.count({ where: { estadoGrooming: { in: ['EN_COLA', 'EN_PROCESO'] } } }),
    ]);

    // Stock crítico real (comparación en JS)
    const productosStockBajo = await prisma.producto.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true },
    });
    const stockCriticoReal = productosStockBajo.filter(p => p.stockActual <= p.stockMinimo);

    res.json({
      turnosHoy,
      turnosMes,
      pacientesTotal,
      clientesTotal,
      consultasHoy,
      ingresosMes: ingresosMes._sum.total || 0,
      stockCritico: stockCriticoReal.length,
      vacunasProximas,
      internacionesActivas,
      groomingActivo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
};

export const getTurnosHoy = async (_req: AuthRequest, res: Response) => {
  try {
    const hoy = new Date();
    const turnos = await prisma.turno.findMany({
      where: {
        fechaHora: { gte: startOfDay(hoy), lte: endOfDay(hoy) },
      },
      include: {
        mascota: { select: { id: true, nombre: true, especie: true, raza: true, foto: true } },
        cliente: { select: { id: true, nombre: true, apellido: true, telefono: true } },
        profesional: { select: { id: true, nombre: true, apellido: true, rol: true } },
      },
      orderBy: { fechaHora: 'asc' },
    });
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos de hoy' });
  }
};

export const getActividadReciente = async (_req: AuthRequest, res: Response) => {
  try {
    const [ultimasConsultas, ultimosTurnos, ultimasFacturas] = await Promise.all([
      prisma.consulta.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          mascota: { select: { nombre: true, especie: true } },
          veterinario: { select: { nombre: true, apellido: true } },
        },
      }),
      prisma.turno.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { estado: 'COMPLETADO' },
        include: {
          mascota: { select: { nombre: true } },
          cliente: { select: { nombre: true, apellido: true } },
        },
      }),
      prisma.factura.findMany({
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

export const getAlertasStock = async (_req: AuthRequest, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { stockActual: 'asc' },
    });
    const criticos = productos.filter(p => p.stockActual <= p.stockMinimo);
    res.json(criticos);
  } catch {
    res.status(500).json({ error: 'Error al obtener alertas de stock' });
  }
};

export const getVacunasProximas = async (_req: AuthRequest, res: Response) => {
  try {
    const en15Dias = addDays(new Date(), 15);
    const vacunas = await prisma.vacuna.findMany({
      where: { proximaDosis: { gte: new Date(), lte: en15Dias } },
      include: { mascota: { include: { cliente: { select: { nombre: true, apellido: true, telefono: true } } } } },
      orderBy: { proximaDosis: 'asc' },
    });
    res.json(vacunas);
  } catch {
    res.status(500).json({ error: 'Error al obtener vacunas próximas' });
  }
};

export const getIngresosPorPeriodo = async (_req: AuthRequest, res: Response) => {
  try {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicio = startOfMonth(fecha);
      const fin = endOfMonth(fecha);

      const resultado = await prisma.factura.aggregate({
        where: { fechaEmision: { gte: inicio, lte: fin }, estado: { not: 'ANULADA' } },
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
