import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AuthRequest, filtroTenant } from '../middleware/auth.middleware';

const SELECT_USUARIO = {
  id: true, nombre: true, apellido: true, email: true,
  telefono: true, avatar: true, activo: true, createdAt: true,
  roles: {
    select: {
      rol: { select: { id: true, nombre: true, esAdmin: true } },
    },
  },
};

const formatear = (u: any) => {
  const { roles, ...base } = u;
  return {
    ...base,
    roles: roles.map((r: any) => r.rol),
    rol: roles[0]?.rol.nombre ?? 'USUARIO',
    esAdmin: roles.some((r: any) => r.rol.esAdmin),
  };
};

export const listar = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  const { activo } = req.query;
  const where: any = { veterinariaId: tenant.veterinariaId };
  if (activo !== undefined) where.activo = activo === 'true';

  const usuarios = await prisma.usuario.findMany({
    where,
    select: SELECT_USUARIO,
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
  });
  res.json(usuarios.map(formatear));
};

export const obtener = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const tenant = filtroTenant(req);
  const usuario = await prisma.usuario.findFirst({
    where: { id, veterinariaId: tenant.veterinariaId },
    select: SELECT_USUARIO,
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(formatear(usuario));
};

export const crear = async (req: AuthRequest, res: Response) => {
  const { nombre, apellido, email, password, rolId, telefono } = req.body;
  const tenant = filtroTenant(req);
  try {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    if (rolId) {
      const rol = await prisma.rol.findFirst({ where: { id: rolId, veterinariaId: tenant.veterinariaId } });
      if (!rol) return res.status(400).json({ error: 'Rol inválido' });
    }

    const hash = await bcrypt.hash(password || 'Veterinaria123', 10);
    const usuario = await prisma.usuario.create({
      data: {
        veterinariaId: tenant.veterinariaId,
        nombre, apellido, email,
        password: hash,
        telefono: telefono || null,
        ...(rolId ? { roles: { create: { rolId } } } : {}),
      },
      select: SELECT_USUARIO,
    });
    res.status(201).json(formatear(usuario));
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const actualizar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, password, rolId } = req.body;
  const tenant = filtroTenant(req);
  try {
    const existing = await prisma.usuario.findFirst({ where: { id, veterinariaId: tenant.veterinariaId } });
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const data: any = { nombre, apellido, telefono: telefono || null };
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);

    await prisma.usuario.update({ where: { id }, data });

    if (rolId) {
      const rol = await prisma.rol.findFirst({ where: { id: rolId, veterinariaId: tenant.veterinariaId } });
      if (!rol) return res.status(400).json({ error: 'Rol inválido' });

      await prisma.usuarioRol.deleteMany({ where: { usuarioId: id } });
      await prisma.usuarioRol.create({ data: { usuarioId: id, rolId } });
    }

    const updated = await prisma.usuario.findUnique({ where: { id }, select: SELECT_USUARIO });
    res.json(formatear(updated!));
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const cambiarEstado = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  const tenant = filtroTenant(req);
  try {
    const existing = await prisma.usuario.findFirst({ where: { id, veterinariaId: tenant.veterinariaId } });
    if (!existing) return res.status(404).json({ error: 'Usuario no encontrado' });

    const usuario = await prisma.usuario.update({ where: { id }, data: { activo: Boolean(activo) }, select: SELECT_USUARIO });
    res.json(formatear(usuario));
  } catch {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// ─── Gestión de Roles ──────────────────────────

export const listarRoles = async (req: AuthRequest, res: Response) => {
  const tenant = filtroTenant(req);
  const roles = await prisma.rol.findMany({
    where: { veterinariaId: tenant.veterinariaId, activo: true },
    include: {
      permisos: { include: { permiso: true } },
      _count: { select: { usuarios: true } },
    },
    orderBy: { nombre: 'asc' },
  });
  res.json(roles);
};

export const crearRol = async (req: AuthRequest, res: Response) => {
  const { nombre, descripcion, esAdmin, permisoCodigos } = req.body;
  const tenant = filtroTenant(req);
  try {
    const rol = await prisma.rol.create({
      data: {
        veterinariaId: tenant.veterinariaId,
        nombre, descripcion: descripcion || null,
        esAdmin: Boolean(esAdmin),
        ...(permisoCodigos?.length ? {
          permisos: {
            create: (await Promise.all(
              permisoCodigos.map(async (codigo: string) => {
                const p = await prisma.permiso.findUnique({ where: { codigo } });
                return p ? { permisoId: p.id } : null;
              })
            )).filter(Boolean) as { permisoId: string }[],
          },
        } : {}),
      },
      include: { permisos: { include: { permiso: true } } },
    });
    res.status(201).json(rol);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

export const actualizarRol = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nombre, descripcion, esAdmin, permisoCodigos } = req.body;
  const tenant = filtroTenant(req);
  try {
    const existing = await prisma.rol.findFirst({ where: { id, veterinariaId: tenant.veterinariaId } });
    if (!existing) return res.status(404).json({ error: 'Rol no encontrado' });

    await prisma.rol.update({ where: { id }, data: { nombre, descripcion: descripcion || null, esAdmin: Boolean(esAdmin) } });

    if (permisoCodigos !== undefined) {
      await prisma.rolPermiso.deleteMany({ where: { rolId: id } });
      for (const codigo of permisoCodigos) {
        const p = await prisma.permiso.findUnique({ where: { codigo } });
        if (p) await prisma.rolPermiso.create({ data: { rolId: id, permisoId: p.id } });
      }
    }

    const updated = await prisma.rol.findUnique({ where: { id }, include: { permisos: { include: { permiso: true } } } });
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

export const listarPermisos = async (_req: AuthRequest, res: Response) => {
  const permisos = await prisma.permiso.findMany({ orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }] });
  res.json(permisos);
};
