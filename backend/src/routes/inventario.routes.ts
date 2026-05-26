import { Router } from 'express';
import { autenticar, autorizar } from '../middleware/auth.middleware';
import {
  listarProductos, crearProducto, actualizarProducto,
  registrarMovimiento, getMovimientos, getVencimientosProximos
} from '../controllers/inventario.controller';

export const inventarioRoutes = Router();

inventarioRoutes.use(autenticar);
inventarioRoutes.get('/', listarProductos);
inventarioRoutes.post('/', autorizar('ADMIN', 'RECEPCIONISTA'), crearProducto);
inventarioRoutes.put('/:id', autorizar('ADMIN', 'RECEPCIONISTA'), actualizarProducto);
inventarioRoutes.get('/vencimientos', getVencimientosProximos);
inventarioRoutes.post('/movimiento', autorizar('ADMIN', 'RECEPCIONISTA', 'VETERINARIO'), registrarMovimiento);
inventarioRoutes.get('/:productoId/movimientos', getMovimientos);
