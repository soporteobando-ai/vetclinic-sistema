import { Router } from 'express';
import { autenticar, autorizar } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, cambiarEstado } from '../controllers/usuarios.controller';

export const usuarioRoutes = Router();

usuarioRoutes.use(autenticar);
usuarioRoutes.get('/', listar);
usuarioRoutes.get('/:id', obtener);
usuarioRoutes.post('/', autorizar('ADMIN'), crear);
usuarioRoutes.put('/:id', autorizar('ADMIN'), actualizar);
usuarioRoutes.patch('/:id/estado', autorizar('ADMIN'), cambiarEstado);
