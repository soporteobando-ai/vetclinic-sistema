import { Router } from 'express';
import { autenticar, soloSuperAdmin } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, toggleActivo } from '../controllers/veterinarias.controller';

export const veterinariaRoutes = Router();

veterinariaRoutes.use(autenticar, soloSuperAdmin);

veterinariaRoutes.get('/', listar);
veterinariaRoutes.get('/:id', obtener);
veterinariaRoutes.post('/', crear);
veterinariaRoutes.put('/:id', actualizar);
veterinariaRoutes.patch('/:id/estado', toggleActivo);
