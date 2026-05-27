import { Router } from 'express';
import { autenticar, verificarPermiso } from '../middleware/auth.middleware';
import { listar, obtener, crear, registrarPago, anular, getCajaDiaria } from '../controllers/facturas.controller';

export const facturaRoutes = Router();

facturaRoutes.use(autenticar);
facturaRoutes.get('/',                 verificarPermiso('facturacion:read'),  listar);
facturaRoutes.get('/caja-diaria',      verificarPermiso('facturacion:read'),  getCajaDiaria);
facturaRoutes.post('/',                verificarPermiso('facturacion:write'), crear);
facturaRoutes.get('/:id',              verificarPermiso('facturacion:read'),  obtener);
facturaRoutes.post('/:facturaId/pago', verificarPermiso('facturacion:write'), registrarPago);
facturaRoutes.patch('/:id/anular',     verificarPermiso('facturacion:write'), anular);
