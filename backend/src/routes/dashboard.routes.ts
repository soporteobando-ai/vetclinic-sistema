import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import {
  getMetricas, getTurnosHoy, getActividadReciente,
  getAlertasStock, getVacunasProximas, getIngresosPorPeriodo
} from '../controllers/dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.use(autenticar);
dashboardRoutes.get('/metricas', getMetricas);
dashboardRoutes.get('/turnos-hoy', getTurnosHoy);
dashboardRoutes.get('/actividad-reciente', getActividadReciente);
dashboardRoutes.get('/alertas-stock', getAlertasStock);
dashboardRoutes.get('/vacunas-proximas', getVacunasProximas);
dashboardRoutes.get('/ingresos-periodo', getIngresosPorPeriodo);
