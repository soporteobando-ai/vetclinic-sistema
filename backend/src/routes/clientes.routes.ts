import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { listar, obtener, crear, actualizar, eliminar } from '../controllers/clientes.controller';

export const clienteRoutes = Router();

clienteRoutes.use(autenticar);
clienteRoutes.get('/', listar);
clienteRoutes.post('/', crear);
clienteRoutes.get('/:id', obtener);
clienteRoutes.put('/:id', actualizar);
clienteRoutes.delete('/:id', eliminar);
