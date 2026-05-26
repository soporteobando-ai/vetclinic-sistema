import { Router } from 'express';
import { autenticar } from '../middleware/auth.middleware';
import { listar, obtener, crear, registrarPago, anular, getCajaDiaria } from '../controllers/facturas.controller';

export const facturaRoutes = Router();

facturaRoutes.use(autenticar);
facturaRoutes.get('/', listar);
facturaRoutes.get('/caja-diaria', getCajaDiaria);
facturaRoutes.post('/', crear);
facturaRoutes.get('/:id', obtener);
facturaRoutes.post('/:facturaId/pago', registrarPago);
facturaRoutes.patch('/:id/anular', anular);
