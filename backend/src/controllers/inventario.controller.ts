import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const listarProductos = async (req: Request, res: Response) => {
  const { buscar, categoria, stockCritico } = req.query;
  const where: any = { activo: true };
  if (categoria) where.categoria = String(categoria);
  if (buscar) {
    where.OR = [
      { nombre: { contains: String(buscar) } },
      { principioActivo: { contains: String(buscar) } },
      { marca: { contains: String(buscar) } },
    ];
  }

  const productos = await prisma.producto.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });

  const resultado = stockCritico === 'true'
    ? productos.filter(p => p.stockActual <= p.stockMinimo)
    : productos;

  res.json(resultado);
};

export const crearProducto = async (req: Request, res: Response) => {
  try {
    const producto = await prisma.producto.create({ data: req.body });
    res.status(201).json(producto);
  } catch {
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const actualizarProducto = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const producto = await prisma.producto.update({ where: { id }, data: req.body });
    res.json(producto);
  } catch {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

export const registrarMovimiento = async (req: Request, res: Response) => {
  const { productoId, tipo, cantidad, motivo, referencia } = req.body;
  try {
    const [movimiento, producto] = await prisma.$transaction([
      prisma.movimientoStock.create({
        data: { productoId, tipo, cantidad, motivo, referencia },
      }),
      prisma.producto.update({
        where: { id: productoId },
        data: {
          stockActual: tipo === 'ENTRADA'
            ? { increment: cantidad }
            : { decrement: cantidad },
        },
      }),
    ]);

    // Alerta si stock bajo
    if (producto.stockActual <= producto.stockMinimo) {
      const io = (req as any).io;
      if (io) io.emit('stock:alerta', { productoId, nombre: producto.nombre, stock: producto.stockActual });
    }

    res.status(201).json({ movimiento, stockActual: producto.stockActual });
  } catch {
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
};

export const getMovimientos = async (req: Request, res: Response) => {
  const { productoId } = req.params;
  const movimientos = await prisma.movimientoStock.findMany({
    where: { productoId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(movimientos);
};

export const getVencimientosProximos = async (_req: Request, res: Response) => {
  const en30Dias = new Date();
  en30Dias.setDate(en30Dias.getDate() + 30);

  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      vencimiento: { gte: new Date(), lte: en30Dias },
    },
    orderBy: { vencimiento: 'asc' },
  });
  res.json(productos);
};
