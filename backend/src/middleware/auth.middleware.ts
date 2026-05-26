import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type Rol = 'ADMIN' | 'VETERINARIO' | 'RECEPCIONISTA' | 'ESTILISTA' | 'CLIENTE';

export interface AuthRequest extends Request {
  usuario?: { id: string; rol: Rol; email: string };
}

export const autenticar = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.usuario = { id: payload.id, rol: payload.rol, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const autorizar = (...roles: Rol[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    next();
  };
};
