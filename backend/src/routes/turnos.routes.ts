import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, actualizarEstado, cancelar, getCalendario, verificarConflicto } from '../controllers/turnos.controller';

export const turnoRoutes = Router();

turnoRoutes.use(autenticar);
turnoRoutes.get('/', listar);
turnoRoutes.get('/calendario', getCalendario);
turnoRoutes.post('/verificar-conflicto', verificarConflicto);
turnoRoutes.post('/', crear);
turnoRoutes.get('/:id', obtener);
turnoRoutes.put('/:id', actualizar);
turnoRoutes.patch('/:id/estado', actualizarEstado);
turnoRoutes.patch('/:id/cancelar', cancelar);
