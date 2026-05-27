import { Router } from 'express';
import { autenticar, verificarPermiso } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, actualizarEstado, cancelar, getCalendario, verificarConflicto } from '../controllers/turnos.controller';

export const turnoRoutes = Router();

turnoRoutes.use(autenticar);
turnoRoutes.get('/',                   verificarPermiso('agenda:read'),  listar);
turnoRoutes.get('/calendario',         verificarPermiso('agenda:read'),  getCalendario);
turnoRoutes.post('/verificar-conflicto', verificarPermiso('agenda:read'), verificarConflicto);
turnoRoutes.post('/',                  verificarPermiso('agenda:write'), crear);
turnoRoutes.get('/:id',               verificarPermiso('agenda:read'),  obtener);
turnoRoutes.put('/:id',               verificarPermiso('agenda:write'), actualizar);
turnoRoutes.patch('/:id/estado',      verificarPermiso('agenda:write'), actualizarEstado);
turnoRoutes.patch('/:id/cancelar',    verificarPermiso('agenda:write'), cancelar);
