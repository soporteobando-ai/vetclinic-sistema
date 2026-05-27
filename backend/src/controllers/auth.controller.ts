import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            rol: {
              include: {
                permisos: { include: { permiso: true } },
              },
            },
          },
        },
      },
      // esSuperAdmin is included via include all fields (default behavior)
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario.id, veterinariaId: usuario.veterinariaId, email: usuario.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    const esAdmin = usuario.roles.some(ur => ur.rol.esAdmin);
    const permisos = [...new Set(
      usuario.roles.flatMap(ur => ur.rol.permisos.map(rp => rp.permiso.codigo))
    )];

    const nombreRol = usuario.roles[0]?.rol.nombre ?? 'USUARIO';

    const { password: _, roles: __, ...base } = usuario;
    res.json({
      token,
      usuario: {
        ...base,
        rol: nombreRol,
        esAdmin,
        esSuperAdmin: usuario.esSuperAdmin,
        permisos,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const registro = async (req: Request, res: Response) => {
  const { nombre, apellido, email, password, telefono, veterinariaId } = req.body;
  try {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, apellido, email, password: hash, veterinariaId, telefono },
      select: { id: true, nombre: true, apellido: true, email: true, veterinariaId: true, createdAt: true },
    });

    res.status(201).json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const perfil = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario!.id },
      select: {
        id: true, nombre: true, apellido: true, email: true,
        veterinariaId: true, telefono: true, avatar: true, esSuperAdmin: true,
        roles: {
          include: {
            rol: {
              include: { permisos: { include: { permiso: true } } },
            },
          },
        },
      },
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { roles, ...base } = usuario;
    const esAdmin = roles.some(ur => ur.rol.esAdmin);
    const permisos = [...new Set(roles.flatMap(ur => ur.rol.permisos.map(rp => rp.permiso.codigo)))];
    const nombreRol = roles[0]?.rol.nombre ?? 'USUARIO';

    res.json({ ...base, rol: nombreRol, esAdmin, esSuperAdmin: base.esSuperAdmin, permisos });
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

export const cambiarPassword = async (req: AuthRequest, res: Response) => {
  const { actual, nueva } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
    const valido = await bcrypt.compare(actual, usuario!.password);
    if (!valido) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(nueva, 10);
    await prisma.usuario.update({ where: { id: req.usuario!.id }, data: { password: hash } });
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};
