import { Router } from 'express';
import { autenticar, verificarPermiso } from '../middleware/auth.middleware';
import {
  listarProductos, crearProducto, actualizarProducto,
  registrarMovimiento, getMovimientos, getVencimientosProximos
} from '../controllers/inventario.controller';

export const inventarioRoutes = Router();

inventarioRoutes.use(autenticar);
inventarioRoutes.get('/',                        verificarPermiso('inventario:read'),  listarProductos);
inventarioRoutes.post('/',                       verificarPermiso('inventario:write'), crearProducto);
inventarioRoutes.put('/:id',                     verificarPermiso('inventario:write'), actualizarProducto);
inventarioRoutes.get('/vencimientos',            verificarPermiso('inventario:read'),  getVencimientosProximos);
inventarioRoutes.post('/movimiento',             verificarPermiso('inventario:write'), registrarMovimiento);
inventarioRoutes.get('/:productoId/movimientos', verificarPermiso('inventario:read'),  getMovimientos);
