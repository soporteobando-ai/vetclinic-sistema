import { Router } from 'express';
import { autenticar, autorizar } from '../middleware/auth.middleware';
import {
  crear, obtener, actualizar, agregarReceta, editarReceta, eliminarReceta,
  agregarEstudio, editarEstudio, eliminarEstudio,
  registrarVacuna, registrarDesparasitacion, completarConsulta
} from '../controllers/consultas.controller';

export const consultaRoutes = Router();

consultaRoutes.use(autenticar);
consultaRoutes.post('/', autorizar('VETERINARIO', 'ADMIN'), crear);
consultaRoutes.get('/:id', obtener);
consultaRoutes.put('/:id', autorizar('VETERINARIO', 'ADMIN'), actualizar);
consultaRoutes.patch('/:id/completar', autorizar('VETERINARIO', 'ADMIN'), completarConsulta);
consultaRoutes.post('/:consultaId/recetas', autorizar('VETERINARIO', 'ADMIN'), agregarReceta);
consultaRoutes.put('/recetas/:recetaId', autorizar('VETERINARIO', 'ADMIN'), editarReceta);
consultaRoutes.delete('/recetas/:recetaId', autorizar('VETERINARIO', 'ADMIN'), eliminarReceta);
consultaRoutes.post('/:consultaId/estudios', autorizar('VETERINARIO', 'ADMIN'), agregarEstudio);
consultaRoutes.put('/estudios/:estudioId', autorizar('VETERINARIO', 'ADMIN'), editarEstudio);
consultaRoutes.delete('/estudios/:estudioId', autorizar('VETERINARIO', 'ADMIN'), eliminarEstudio);
consultaRoutes.post('/vacunas', autorizar('VETERINARIO', 'ADMIN'), registrarVacuna);
consultaRoutes.post('/desparasitaciones', autorizar('VETERINARIO', 'ADMIN'), registrarDesparasitacion);
