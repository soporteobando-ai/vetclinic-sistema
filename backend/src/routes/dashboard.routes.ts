import { Router } from 'express';
import { autenticar, verificarPermiso } from '../middleware/auth.middleware';
import {
  getMetricas, getTurnosHoy, getActividadReciente,
  getAlertasStock, getVacunasProximas, getIngresosPorPeriodo
} from '../controllers/dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.use(autenticar);
dashboardRoutes.get('/metricas',          verificarPermiso('dashboard:read'), getMetricas);
dashboardRoutes.get('/turnos-hoy',        verificarPermiso('dashboard:read'), getTurnosHoy);
dashboardRoutes.get('/actividad-reciente',verificarPermiso('dashboard:read'), getActividadReciente);
dashboardRoutes.get('/alertas-stock',     verificarPermiso('dashboard:read'), getAlertasStock);
dashboardRoutes.get('/vacunas-proximas',  verificarPermiso('dashboard:read'), getVacunasProximas);
dashboardRoutes.get('/ingresos-periodo',  verificarPermiso('reportes:read'),  getIngresosPorPeriodo);
