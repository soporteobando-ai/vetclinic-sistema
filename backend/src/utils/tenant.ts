import prisma from '../config/prisma';

// Copia solo los campos permitidos del body. Nunca incluir `id` ni `veterinariaId`.
// En los campos *Id, '' se interpreta como "sin asignar".
export const tomarCampos = (body: any, campos: readonly string[]): any => {
  const data: any = {};
  for (const campo of campos) {
    if (!body || !Object.prototype.hasOwnProperty.call(body, campo)) continue;
    data[campo] = campo.endsWith('Id') && body[campo] === '' ? null : body[campo];
  }
  return data;
};

type Contador = (id: string, veterinariaId: string) => Promise<number>;

const usuario: Contador = (id, veterinariaId) => prisma.usuario.count({ where: { id, veterinariaId } });

const REFERENCIAS: Record<string, Contador> = {
  clienteId:     (id, veterinariaId) => prisma.cliente.count({ where: { id, veterinariaId } }),
  mascotaId:     (id, veterinariaId) => prisma.mascota.count({ where: { id, veterinariaId } }),
  turnoId:       (id, veterinariaId) => prisma.turno.count({ where: { id, veterinariaId } }),
  productoId:    (id, veterinariaId) => prisma.producto.count({ where: { id, veterinariaId } }),
  presupuestoId: (id, veterinariaId) => prisma.presupuesto.count({ where: { id, veterinariaId } }),
  boxId:         (id, veterinariaId) => prisma.boxGuarderia.count({ where: { id, veterinariaId } }),
  camaId:        (id, veterinariaId) => prisma.camaInternacion.count({ where: { id, veterinariaId } }),
  profesionalId: usuario,
  veterinarioId: usuario,
  estilistId:    usuario,
};

// Devuelve el nombre del primer campo que apunta a un registro de otra veterinaria
// (o inexistente, o que no es un string), o null si todas las referencias son válidas.
export const referenciaInvalida = async (veterinariaId: string, data: any): Promise<string | null> => {
  for (const [campo, contar] of Object.entries(REFERENCIAS)) {
    const id = data[campo];
    if (id === undefined || id === null) continue;
    if (typeof id !== 'string' || !(await contar(id, veterinariaId))) return campo;
  }
  return null;
};
