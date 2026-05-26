import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const listar = async (req: Request, res: Response) => {
  const { buscar, pagina = '1', porPagina = '20' } = req.query;
  const skip = (Number(pagina) - 1) * Number(porPagina);

  const where: any = {};
  if (buscar) {
    const q = { contains: String(buscar), mode: 'insensitive' as const };
    where.OR = [
      { nombre: q }, { apellido: q }, { email: q },
      { telefono: q }, { dni: q },
    ];
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      skip,
      take: Number(porPagina),
      include: { mascotas: { where: { activo: true }, select: { id: true, nombre: true, especie: true, foto: true } } },
      orderBy: { apellido: 'asc' },
    }),
    prisma.cliente.count({ where }),
  ]);

  res.json({ clientes, total, pagina: Number(pagina), porPagina: Number(porPagina) });
};

export const obtener = async (req: Request, res: Response) => {
  const { id } = req.params;
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      mascotas: { where: { activo: true }, include: { vacunas: { take: 3, orderBy: { fechaAplicacion: 'desc' } } } },
      turnos: { take: 10, orderBy: { fechaHora: 'desc' }, include: { mascota: true } },
      facturas: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(cliente);
};

// Extrae solo los campos del modelo Cliente (descarta relaciones anidadas)
const sanitizarCliente = (body: any) => {
  const CAMPOS_CLIENTE = [
    'usuarioId', 'nombre', 'apellido', 'dni', 'email', 'telefono',
    'telefonoAlt', 'direccion', 'ciudad', 'notas', 'fidelidad', 'saldoCuenta',
  ];
  const data: any = {};
  for (const campo of CAMPOS_CLIENTE) {
    if (campo in body) data[campo] = body[campo];
  }
  if (!data.dni || String(data.dni).trim() === '') data.dni = null;
  if (!data.email || String(data.email).trim() === '') data.email = null;
  return data;
};

export const crear = async (req: Request, res: Response) => {
  try {
    const cliente = await prisma.cliente.create({ data: sanitizarCliente(req.body) });
    res.status(201).json(cliente);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'DNI o email ya registrado' });
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

export const actualizar = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const cliente = await prisma.cliente.update({ where: { id }, data: sanitizarCliente(req.body) });
    res.json(cliente);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'DNI o email ya registrado' });
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

export const eliminar = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.cliente.delete({ where: { id } });
    res.json({ mensaje: 'Cliente eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};
