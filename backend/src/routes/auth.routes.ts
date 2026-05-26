import { Router } from 'express';
import { login, registro, perfil, cambiarPassword } from '../controllers/auth.controller';
import { autenticar, autorizar } from '../middleware/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/registro', autenticar, autorizar('ADMIN'), registro);
authRoutes.get('/perfil', autenticar, perfil);
authRoutes.put('/cambiar-password', autenticar, cambiarPassword);
