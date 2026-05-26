import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';

const SELECT_PUBLICO = {
  id: true, nombre: true, apellido: true, email: true,
  rol: true, telefono: true, activo: true, createdAt: true,
};

export const listar = async (req: Request, res: Response) => {
  const { rol, activo } = req.query;
  const where: any = {};
  if (rol) where.rol = String(rol);
  if (activo !== undefined) where.activo = activo === 'true';

  const usuarios = await prisma.usuario.findMany({
    where,
    select: SELECT_PUBLICO,
    orderBy: [{ rol: 'asc' }, { apellido: 'asc' }],
  });
  res.json(usuarios);
};

export const obtener = async (req: Request, res: Response) => {
  const { id } = req.params;
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: SELECT_PUBLICO });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
};

export const crear = async (req: Request, res: Response) => {
  const { nombre, apellido, email, password, rol, telefono } = req.body;
  try {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    const hash = await bcrypt.hash(password || 'Veterinaria123', 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, apellido, email, password: hash, rol: rol || 'VETERINARIO', telefono: telefono || null },
      select: SELECT_PUBLICO,
    });
    res.status(201).json(usuario);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error al crear profesional' });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, email, rol, telefono, password } = req.body;
  try {
    const data: any = { nombre, apellido, rol, telefono: telefono || null };
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.update({ where: { id }, data, select: SELECT_PUBLICO });
    res.json(usuario);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error al actualizar profesional' });
  }
};

export const cambiarEstado = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { activo: Boolean(activo) },
      select: SELECT_PUBLICO,
    });
    res.json(usuario);
  } catch {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};
