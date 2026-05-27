import { Router } from 'express';
import { autenticar, verificarPermiso } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, darDeBaja, historialClinico } from '../controllers/mascotas.controller';

export const mascotaRoutes = Router();

mascotaRoutes.use(autenticar);
mascotaRoutes.get('/',              verificarPermiso('mascotas:read'),   listar);
mascotaRoutes.post('/',             verificarPermiso('mascotas:write'),  crear);
mascotaRoutes.get('/:id',           verificarPermiso('mascotas:read'),   obtener);
mascotaRoutes.put('/:id',           verificarPermiso('mascotas:write'),  actualizar);
mascotaRoutes.patch('/:id/baja',    verificarPermiso('mascotas:delete'), darDeBaja);
mascotaRoutes.get('/:id/historial', verificarPermiso('mascotas:read'),   historialClinico);
