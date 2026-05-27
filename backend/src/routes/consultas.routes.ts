import { Router } from 'express';
import { autenticar, verificarPermiso } from '../middleware/auth.middleware';
import {
  crear, obtener, actualizar, agregarReceta, editarReceta, eliminarReceta,
  agregarEstudio, editarEstudio, eliminarEstudio,
  registrarVacuna, registrarDesparasitacion, completarConsulta
} from '../controllers/consultas.controller';

export const consultaRoutes = Router();

consultaRoutes.use(autenticar);
consultaRoutes.post('/',                           verificarPermiso('consultas:write'), crear);
consultaRoutes.get('/:id',                         verificarPermiso('consultas:read'),  obtener);
consultaRoutes.put('/:id',                         verificarPermiso('consultas:write'), actualizar);
consultaRoutes.patch('/:id/completar',             verificarPermiso('consultas:write'), completarConsulta);
consultaRoutes.post('/:consultaId/recetas',        verificarPermiso('consultas:write'), agregarReceta);
consultaRoutes.put('/recetas/:recetaId',           verificarPermiso('consultas:write'), editarReceta);
consultaRoutes.delete('/recetas/:recetaId',        verificarPermiso('consultas:write'), eliminarReceta);
consultaRoutes.post('/:consultaId/estudios',       verificarPermiso('consultas:write'), agregarEstudio);
consultaRoutes.put('/estudios/:estudioId',         verificarPermiso('consultas:write'), editarEstudio);
consultaRoutes.delete('/estudios/:estudioId',      verificarPermiso('consultas:write'), eliminarEstudio);
consultaRoutes.post('/vacunas',                    verificarPermiso('consultas:write'), registrarVacuna);
consultaRoutes.post('/desparasitaciones',          verificarPermiso('consultas:write'), registrarDesparasitacion);
