import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const listar = async (_req: AuthRequest, res: Response) => {
  const veterinarias = await prisma.veterinaria.findMany({
    include: {
      _count: {
        select: { usuarios: true, clientes: true, mascotas: true, turnos: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(veterinarias);
};

export const obtener = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const vet = await prisma.veterinaria.findUnique({
    where: { id },
    include: {
      _count: { select: { usuarios: true, clientes: true, mascotas: true, turnos: true } },
      usuarios: {
        select: {
          id: true, nombre: true, apellido: true, email: true, activo: true,
          roles: { include: { rol: { select: { nombre: true, esAdmin: true } } } },
        },
        orderBy: { nombre: 'asc' },
      },
    },
  });
  if (!vet) return res.status(404).json({ error: 'Veterinaria no encontrada' });
  res.json(vet);
};

export const crear = async (req: AuthRequest, res: Response) => {
  const { nombre, direccion, telefono, email, adminNombre, adminApellido, adminEmail, adminPassword } = req.body;
  try {
    const vet = await prisma.$transaction(async (tx) => {
      const veterinaria = await tx.veterinaria.create({
        data: { nombre, direccion: direccion || null, telefono: telefono || null, email: email || null },
      });

      // Load global permisos
      const permisos = await tx.permiso.findMany();
      const pMap = Object.fromEntries(permisos.map(p => [p.codigo, p.id]));
      const pIds = (codigos: string[]) =>
        codigos.filter(c => pMap[c]).map(c => ({ permisoId: pMap[c] }));

      // Create default roles
      const rolAdmin = await tx.rol.create({
        data: { veterinariaId: veterinaria.id, nombre: 'ADMIN', descripcion: 'Administrador con acceso total', esAdmin: true },
      });

      await tx.rol.create({
        data: {
          veterinariaId: veterinaria.id, nombre: 'VETERINARIO', descripcion: 'Veterinario clínico',
          permisos: { create: pIds(['dashboard:read', 'clientes:read', 'clientes:write', 'mascotas:read', 'mascotas:write', 'agenda:read', 'agenda:write', 'consultas:read', 'consultas:write', 'inventario:read']) },
        },
      });

      await tx.rol.create({
        data: {
          veterinariaId: veterinaria.id, nombre: 'RECEPCIONISTA', descripcion: 'Recepcionista y administrativa',
          permisos: { create: pIds(['dashboard:read', 'clientes:read', 'clientes:write', 'mascotas:read', 'mascotas:write', 'agenda:read', 'agenda:write', 'estetica:read', 'estetica:write', 'inventario:read', 'inventario:write', 'facturacion:read', 'facturacion:write']) },
        },
      });

      await tx.rol.create({
        data: {
          veterinariaId: veterinaria.id, nombre: 'ESTILISTA', descripcion: 'Groomer / Estilista',
          permisos: { create: pIds(['dashboard:read', 'mascotas:read', 'agenda:read', 'estetica:read', 'estetica:write']) },
        },
      });

      // Create initial admin user
      const hash = await bcrypt.hash(adminPassword || 'Veterinaria123', 10);
      await tx.usuario.create({
        data: {
          veterinariaId: veterinaria.id,
          nombre: adminNombre, apellido: adminApellido,
          email: adminEmail, password: hash,
          roles: { create: { rolId: rolAdmin.id } },
        },
      });

      return veterinaria;
    });

    res.status(201).json(vet);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El email del administrador ya está registrado' });
    res.status(500).json({ error: 'Error al crear veterinaria' });
  }
};

export const actualizar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nombre, direccion, telefono, email } = req.body;
  try {
    const vet = await prisma.veterinaria.update({
      where: { id },
      data: { nombre, direccion: direccion || null, telefono: telefono || null, email: email || null },
    });
    res.json(vet);
  } catch {
    res.status(500).json({ error: 'Error al actualizar veterinaria' });
  }
};

export const toggleActivo = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    const vet = await prisma.veterinaria.update({
      where: { id },
      data: { activo: Boolean(activo) },
    });
    res.json(vet);
  } catch {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};
