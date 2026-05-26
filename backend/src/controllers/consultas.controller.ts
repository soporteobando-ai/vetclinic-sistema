import { Request, Response } from 'express';
import prisma from '../config/prisma';

const parsearFecha = (valor: any): Date | null => {
  if (!valor || valor === '') return null;
  const str = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00.000Z');
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const sanitizarConsulta = (body: any) => {
  const CAMPOS = [
    'turnoId', 'mascotaId', 'veterinarioId', 'motivo', 'sintomas',
    'exploracionFisica', 'temperatura', 'frecuenciaCardiaca', 'frecuenciaRespiratoria',
    'pesoConsulta', 'diagnosticoDiferencial', 'diagnosticoDefinitivo',
    'planTratamiento', 'observaciones', 'proximoControl',
  ];
  const data: any = {};
  for (const campo of CAMPOS) {
    if (campo in body) data[campo] = body[campo];
  }
  data.proximoControl = parsearFecha(data.proximoControl);
  if (data.temperatura === '' || isNaN(Number(data.temperatura))) data.temperatura = null;
  if (data.frecuenciaCardiaca === '' || isNaN(Number(data.frecuenciaCardiaca))) data.frecuenciaCardiaca = null;
  if (data.frecuenciaRespiratoria === '' || isNaN(Number(data.frecuenciaRespiratoria))) data.frecuenciaRespiratoria = null;
  if (data.pesoConsulta === '' || isNaN(Number(data.pesoConsulta))) data.pesoConsulta = null;
  return data;
};

export const crear = async (req: Request, res: Response) => {
  try {
    const consulta = await prisma.consulta.create({
      data: sanitizarConsulta(req.body),
      include: {
        mascota: true,
        veterinario: { select: { nombre: true, apellido: true } },
        recetas: true,
      },
    });

    // Actualizar estado del turno a EN_CURSO
    await prisma.turno.update({
      where: { id: consulta.turnoId },
      data: { estado: 'EN_CURSO' },
    });

    res.status(201).json(consulta);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Ya existe una consulta para este turno' });
    res.status(500).json({ error: 'Error al crear consulta' });
  }
};

export const obtener = async (req: Request, res: Response) => {
  const { id } = req.params;
  const consulta = await prisma.consulta.findUnique({
    where: { id },
    include: {
      mascota: { include: { cliente: true } },
      veterinario: { select: { nombre: true, apellido: true } },
      recetas: true,
      estudios: true,
    },
  });
  if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
  res.json(consulta);
};

export const actualizar = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const consulta = await prisma.consulta.update({ where: { id }, data: sanitizarConsulta(req.body) });
    res.json(consulta);
  } catch {
    res.status(500).json({ error: 'Error al actualizar consulta' });
  }
};

export const agregarReceta = async (req: Request, res: Response) => {
  const { consultaId } = req.params;
  try {
    const { medicamento, principioActivo, dosis, frecuencia, duracion, cantidad, indicaciones } = req.body;
    const receta = await prisma.receta.create({
      data: { consultaId, medicamento, principioActivo: principioActivo || null, dosis, frecuencia, duracion, cantidad: cantidad || null, indicaciones: indicaciones || null },
    });
    res.status(201).json(receta);
  } catch {
    res.status(500).json({ error: 'Error al agregar receta' });
  }
};

export const editarReceta = async (req: Request, res: Response) => {
  const { recetaId } = req.params;
  try {
    const { medicamento, principioActivo, dosis, frecuencia, duracion, cantidad, indicaciones } = req.body;
    const receta = await prisma.receta.update({
      where: { id: recetaId },
      data: { medicamento, principioActivo: principioActivo || null, dosis, frecuencia, duracion, cantidad: cantidad || null, indicaciones: indicaciones || null },
    });
    res.json(receta);
  } catch {
    res.status(500).json({ error: 'Error al editar receta' });
  }
};

export const eliminarReceta = async (req: Request, res: Response) => {
  const { recetaId } = req.params;
  try {
    await prisma.receta.delete({ where: { id: recetaId } });
    res.json({ mensaje: 'Receta eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar receta' });
  }
};

export const agregarEstudio = async (req: Request, res: Response) => {
  const { consultaId } = req.params;
  try {
    const { tipo, descripcion, laboratorio, resultado } = req.body;
    const estudio = await prisma.estudio.create({
      data: { consultaId, tipo, descripcion, laboratorio: laboratorio || null, resultado: resultado || null },
    });
    res.status(201).json(estudio);
  } catch {
    res.status(500).json({ error: 'Error al agregar estudio' });
  }
};

export const editarEstudio = async (req: Request, res: Response) => {
  const { estudioId } = req.params;
  try {
    const { tipo, descripcion, laboratorio, resultado } = req.body;
    const estudio = await prisma.estudio.update({
      where: { id: estudioId },
      data: { tipo, descripcion, laboratorio: laboratorio || null, resultado: resultado || null },
    });
    res.json(estudio);
  } catch {
    res.status(500).json({ error: 'Error al editar estudio' });
  }
};

export const eliminarEstudio = async (req: Request, res: Response) => {
  const { estudioId } = req.params;
  try {
    await prisma.estudio.delete({ where: { id: estudioId } });
    res.json({ mensaje: 'Estudio eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar estudio' });
  }
};

export const registrarVacuna = async (req: Request, res: Response) => {
  try {
    const { mascotaId, veterinarioId, nombre, laboratorio, lote, notas, fechaAplicacion, proximaDosis } = req.body;
    const vacuna = await prisma.vacuna.create({
      data: {
        mascotaId,
        veterinarioId: veterinarioId || null,
        nombre,
        laboratorio: laboratorio || null,
        lote: lote || null,
        notas: notas || null,
        fechaAplicacion: parsearFecha(fechaAplicacion) ?? new Date(),
        proximaDosis: parsearFecha(proximaDosis),
      },
    });
    res.status(201).json(vacuna);
  } catch (e: any) {
    console.error('Error registrar vacuna:', e.message);
    res.status(500).json({ error: 'Error al registrar vacuna' });
  }
};

export const registrarDesparasitacion = async (req: Request, res: Response) => {
  try {
    const { mascotaId, veterinarioId, producto, tipo, notas, fechaAplicacion, proximaDosis } = req.body;
    const d = await prisma.desparasitacion.create({
      data: {
        mascotaId,
        veterinarioId: veterinarioId || null,
        producto,
        tipo,
        notas: notas || null,
        fechaAplicacion: parsearFecha(fechaAplicacion) ?? new Date(),
        proximaDosis: parsearFecha(proximaDosis),
      },
    });
    res.status(201).json(d);
  } catch (e: any) {
    console.error('Error registrar desparasitación:', e.message);
    res.status(500).json({ error: 'Error al registrar desparasitación' });
  }
};

export const completarConsulta = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const consulta = await prisma.consulta.findUnique({ where: { id } });
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });

    await prisma.turno.update({
      where: { id: consulta.turnoId },
      data: { estado: 'COMPLETADO' },
    });

    res.json({ mensaje: 'Consulta completada' });
  } catch {
    res.status(500).json({ error: 'Error al completar consulta' });
  }
};
