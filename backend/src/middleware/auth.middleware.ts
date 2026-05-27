import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export interface UsuarioAuth {
  id: string;
  veterinariaId: string;
  email: string;
  esAdmin: boolean;
  esSuperAdmin: boolean;
  permisos: Set<string>;
}

export interface AuthRequest extends Request {
  usuario?: UsuarioAuth;
}

interface JwtPayload {
  id: string;
  veterinariaId: string;
  email: string;
}

export const autenticar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        veterinariaId: true,
        email: true,
        activo: true,
        esSuperAdmin: true,
        roles: {
          select: {
            rol: {
              select: {
                esAdmin: true,
                permisos: { select: { permiso: { select: { codigo: true } } } },
              },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario inactivo o no encontrado' });
    }

    const esAdmin = usuario.roles.some(ur => ur.rol.esAdmin);
    const permisos = new Set<string>();
    for (const ur of usuario.roles) {
      for (const rp of ur.rol.permisos) {
        permisos.add(rp.permiso.codigo);
      }
    }

    req.usuario = {
      id: usuario.id,
      veterinariaId: usuario.veterinariaId,
      email: usuario.email,
      esAdmin,
      esSuperAdmin: usuario.esSuperAdmin,
      permisos,
    };

    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const verificarPermiso = (...codigos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
    if (req.usuario.esAdmin) return next();
    const tiene = codigos.some(c => req.usuario!.permisos.has(c));
    if (!tiene) return res.status(403).json({ error: 'Permisos insuficientes' });
    next();
  };
};

export const soloAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
  if (!req.usuario.esAdmin) return res.status(403).json({ error: 'Solo administradores' });
  next();
};

export const soloSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
  if (!req.usuario.esSuperAdmin) return res.status(403).json({ error: 'Acceso restringido a super-administradores' });
  next();
};

export const filtroTenant = (req: AuthRequest) => ({
  veterinariaId: req.usuario!.veterinariaId,
});

// Kept for backward compatibility — now a no-op, use verificarPermiso instead
export const autorizar = (..._roles: string[]) => {
  return (_req: AuthRequest, _res: Response, next: NextFunction) => next();
};
