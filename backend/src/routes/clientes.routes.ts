import { Router } from 'express';
import { autenticar, verificarPermiso } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, eliminar } from '../controllers/clientes.controller';

export const clienteRoutes = Router();

clienteRoutes.use(autenticar);
clienteRoutes.get('/',    verificarPermiso('clientes:read'),   listar);
clienteRoutes.post('/',   verificarPermiso('clientes:write'),  crear);
clienteRoutes.get('/:id', verificarPermiso('clientes:read'),   obtener);
clienteRoutes.put('/:id', verificarPermiso('clientes:write'),  actualizar);
clienteRoutes.delete('/:id', verificarPermiso('clientes:delete'), eliminar);
