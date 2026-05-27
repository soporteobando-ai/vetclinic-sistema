export type Rol = 'ADMIN' | 'VETERINARIO' | 'RECEPCIONISTA' | 'ESTILISTA' | 'CLIENTE';
export type Especie = 'PERRO' | 'GATO' | 'AVE' | 'CONEJO' | 'HAMSTER' | 'REPTIL' | 'OTRO';
export type Sexo = 'MACHO' | 'HEMBRA';
export type EstadoTurno = 'PENDIENTE' | 'CONFIRMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO' | 'LISTA_ESPERA';
export type TipoTurno =
  | 'CONSULTA_VETERINARIA' | 'CIRUGIA' | 'VACUNACION' | 'BANO'
  | 'CORTE_PELO' | 'PEINADO' | 'TRATAMIENTO_PULGAS' | 'LIMPIEZA_DENTAL'
  | 'CORTE_UNAS' | 'HIDRATACION_PELAJE' | 'AROMATERAPIA' | 'MASAJE'
  | 'GUARDERIA_DIARIA' | 'GUARDERIA_NOCTURNA';
export type EstadoGrooming = 'EN_COLA' | 'EN_PROCESO' | 'LISTO_RETIRAR' | 'RETIRADO';
export type MedioPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'BILLETERA_DIGITAL' | 'CUOTAS' | 'SEGURO';
export type EstadoFactura = 'PENDIENTE' | 'PAGADA' | 'ANULADA' | 'PARCIAL';
export type CategoriaProducto = 'MEDICAMENTO' | 'PRODUCTO_ESTETICA' | 'ACCESORIO' | 'ALIMENTO' | 'INSUMO';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  veterinariaId: string;
  esAdmin: boolean;
  esSuperAdmin: boolean;
  permisos: string[];
  telefono?: string;
  avatar?: string;
}

export interface Veterinaria {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo?: string;
  activo: boolean;
  createdAt: string;
  _count?: {
    usuarios: number;
    clientes: number;
    mascotas: number;
    turnos: number;
  };
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string;
  email?: string;
  telefono: string;
  telefonoAlt?: string;
  direccion?: string;
  ciudad?: string;
  notas?: string;
  fidelidad: number;
  saldoCuenta: number;
  mascotas?: Mascota[];
}

export interface Mascota {
  id: string;
  clienteId: string;
  nombre: string;
  especie: Especie;
  raza?: string;
  sexo: Sexo;
  fechaNacimiento?: string;
  color?: string;
  peso?: number;
  microchip?: string;
  foto?: string;
  esterilizado: boolean;
  alergias?: string;
  condicionesCronicas?: string;
  activo: boolean;
  cliente?: Cliente;
}

export interface Turno {
  id: string;
  mascotaId: string;
  clienteId: string;
  profesionalId?: string;
  tipo: TipoTurno;
  estado: EstadoTurno;
  fechaHora: string;
  duracionMin: number;
  motivo?: string;
  notas?: string;
  mascota?: Mascota;
  cliente?: Cliente;
  profesional?: Usuario;
}

export interface Consulta {
  id: string;
  turnoId: string;
  mascotaId: string;
  veterinarioId: string;
  fecha: string;
  motivo: string;
  sintomas?: string;
  exploracionFisica?: string;
  temperatura?: number;
  pesoConsulta?: number;
  diagnosticoDefinitivo?: string;
  planTratamiento?: string;
  observaciones?: string;
  proximoControl?: string;
  recetas?: Receta[];
  estudios?: Estudio[];
  veterinario?: Usuario;
  mascota?: Mascota;
}

export interface Receta {
  id: string;
  consultaId: string;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones?: string;
}

export interface Estudio {
  id: string;
  consultaId: string;
  tipo: string;
  descripcion: string;
  archivo?: string;
  resultado?: string;
  fecha: string;
}

export interface Vacuna {
  id: string;
  mascotaId: string;
  nombre: string;
  laboratorio?: string;
  lote?: string;
  fechaAplicacion: string;
  proximaDosis?: string;
  mascota?: Mascota & { cliente?: Cliente };
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaProducto;
  principioActivo?: string;
  marca?: string;
  proveedor?: string;
  stockActual: number;
  stockMinimo: number;
  precio: number;
  unidad: string;
  vencimiento?: string;
}

export interface Factura {
  id: string;
  numero: string;
  clienteId: string;
  estado: EstadoFactura;
  subtotal: number;
  descuento: number;
  total: number;
  medioPago?: MedioPago;
  fechaEmision: string;
  cliente?: Cliente;
  detalles?: DetalleFactura[];
  pagos?: Pago[];
}

export interface DetalleFactura {
  id: string;
  facturaId: string;
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
}

export interface Pago {
  id: string;
  facturaId: string;
  monto: number;
  medioPago: MedioPago;
  fecha: string;
}

export interface MetricasDashboard {
  turnosHoy: number;
  turnosMes: number;
  pacientesTotal: number;
  clientesTotal: number;
  consultasHoy: number;
  ingresosMes: number;
  stockCritico: number;
  vacunasProximas: number;
  internacionesActivas: number;
  groomingActivo: number;
}

export interface ServicioEstetica {
  id: string;
  turnoId: string;
  mascotaId: string;
  estadoGrooming: EstadoGrooming;
  servicios: string[];
  condicionPelaje?: string;
  reaccionesMascota?: string;
  productosUsados?: string;
  observaciones?: string;
  mascota?: Mascota;
  turno?: Turno;
  estilista?: Usuario;
}
