import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    console.log('[AUTH]', email, 'found:', !!usuario, 'activo:', usuario?.activo, 'hashPrefix:', usuario?.password?.substring(0,7));
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const valido = await bcrypt.compare(password, usuario.password);
    console.log('[AUTH] password valid:', valido);
    if (!valido) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, email: usuario.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    const { password: _, ...usuarioSinPassword } = usuario;
    res.json({ token, usuario: usuarioSinPassword });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const registro = async (req: Request, res: Response) => {
  const { nombre, apellido, email, password, rol, telefono } = req.body;
  try {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, apellido, email, password: hash, rol, telefono },
      select: { id: true, nombre: true, apellido: true, email: true, rol: true, createdAt: true },
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
      select: { id: true, nombre: true, apellido: true, email: true, rol: true, telefono: true, avatar: true },
    });
    res.json(usuario);
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
