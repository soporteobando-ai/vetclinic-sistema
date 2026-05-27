import { Router } from 'express';
import { autenticar, soloAdmin } from '../middleware/auth.middleware';
import {
  listar, obtener, crear, actualizar, cambiarEstado,
  listarRoles, crearRol, actualizarRol, listarPermisos,
} from '../controllers/usuarios.controller';

export const usuarioRoutes = Router();

usuarioRoutes.use(autenticar, soloAdmin);

usuarioRoutes.get('/',    listar);
usuarioRoutes.get('/:id', obtener);
usuarioRoutes.post('/',   crear);
usuarioRoutes.put('/:id', actualizar);
usuarioRoutes.patch('/:id/estado', cambiarEstado);

// Roles y permisos
usuarioRoutes.get('/roles/list',    listarRoles);
usuarioRoutes.post('/roles',        crearRol);
usuarioRoutes.put('/roles/:id',     actualizarRol);
usuarioRoutes.get('/permisos/list', listarPermisos);
