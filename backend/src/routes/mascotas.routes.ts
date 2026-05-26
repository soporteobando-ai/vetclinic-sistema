import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, darDeBaja, historialClinico } from '../controllers/mascotas.controller';

export const mascotaRoutes = Router();

mascotaRoutes.use(autenticar);
mascotaRoutes.get('/', listar);
mascotaRoutes.post('/', crear);
mascotaRoutes.get('/:id', obtener);
mascotaRoutes.put('/:id', actualizar);
mascotaRoutes.patch('/:id/baja', darDeBaja);
mascotaRoutes.get('/:id/historial', historialClinico);
