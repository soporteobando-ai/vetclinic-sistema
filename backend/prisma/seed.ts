import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hash(p, 10);

async function main() {
  console.log('🌱 Iniciando seed...');

  // Skip if already seeded
  const existing = await prisma.veterinaria.findFirst();
  if (existing) {
    console.log('✅ Base de datos ya tiene datos. Ejecutando upsert de password admin...');
    await prisma.usuario.updateMany({
      where: { email: 'admin@vetclinic.com' },
      data: { password: await hash('admin123') },
    });
    console.log('✅ Password admin actualizado. Seed omitido.');
    return;
  }

  // ─── Veterinaria ─────────────────────────────
  const vet = await prisma.veterinaria.create({
    data: {
      nombre: 'VetClinic Demo',
      direccion: 'Av. Corrientes 1234, Buenos Aires',
      telefono: '11-1234-5678',
      email: 'info@vetclinic.com',
    },
  });
  console.log('✅ Veterinaria creada:', vet.nombre);

  // ─── Permisos (globales) ──────────────────────
  const permisosCodigos = [
    { codigo: 'dashboard:read',    nombre: 'Ver Dashboard',         modulo: 'dashboard' },
    { codigo: 'clientes:read',     nombre: 'Ver Clientes',          modulo: 'clientes' },
    { codigo: 'clientes:write',    nombre: 'Crear/Editar Clientes', modulo: 'clientes' },
    { codigo: 'clientes:delete',   nombre: 'Eliminar Clientes',     modulo: 'clientes' },
    { codigo: 'mascotas:read',     nombre: 'Ver Mascotas',          modulo: 'mascotas' },
    { codigo: 'mascotas:write',    nombre: 'Crear/Editar Mascotas', modulo: 'mascotas' },
    { codigo: 'mascotas:delete',   nombre: 'Eliminar Mascotas',     modulo: 'mascotas' },
    { codigo: 'agenda:read',       nombre: 'Ver Agenda',            modulo: 'agenda' },
    { codigo: 'agenda:write',      nombre: 'Gestionar Turnos',      modulo: 'agenda' },
    { codigo: 'consultas:read',    nombre: 'Ver Consultas',         modulo: 'consultas' },
    { codigo: 'consultas:write',   nombre: 'Crear/Editar Consultas',modulo: 'consultas' },
    { codigo: 'estetica:read',     nombre: 'Ver Estética',          modulo: 'estetica' },
    { codigo: 'estetica:write',    nombre: 'Gestionar Estética',    modulo: 'estetica' },
    { codigo: 'inventario:read',   nombre: 'Ver Inventario',        modulo: 'inventario' },
    { codigo: 'inventario:write',  nombre: 'Gestionar Inventario',  modulo: 'inventario' },
    { codigo: 'facturacion:read',  nombre: 'Ver Facturación',       modulo: 'facturacion' },
    { codigo: 'facturacion:write', nombre: 'Gestionar Facturación', modulo: 'facturacion' },
    { codigo: 'reportes:read',     nombre: 'Ver Reportes',          modulo: 'reportes' },
    { codigo: 'usuarios:read',     nombre: 'Ver Usuarios',          modulo: 'usuarios' },
    { codigo: 'usuarios:write',    nombre: 'Gestionar Usuarios',    modulo: 'usuarios' },
  ];

  const permisos: Record<string, { id: string }> = {};
  for (const p of permisosCodigos) {
    permisos[p.codigo] = await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    });
  }
  console.log('✅ Permisos creados');

  // ─── Roles ────────────────────────────────────
  const rolAdmin = await prisma.rol.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'ADMIN',
      descripcion: 'Administrador con acceso total',
      esAdmin: true,
    },
  });

  const permisosVet = [
    'dashboard:read', 'clientes:read', 'clientes:write',
    'mascotas:read', 'mascotas:write',
    'agenda:read', 'agenda:write',
    'consultas:read', 'consultas:write',
    'inventario:read',
  ];
  const rolVet = await prisma.rol.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'VETERINARIO',
      descripcion: 'Veterinario clínico',
      permisos: {
        create: permisosVet.map(c => ({ permisoId: permisos[c].id })),
      },
    },
  });

  const permisosRecep = [
    'dashboard:read',
    'clientes:read', 'clientes:write',
    'mascotas:read', 'mascotas:write',
    'agenda:read', 'agenda:write',
    'estetica:read', 'estetica:write',
    'inventario:read', 'inventario:write',
    'facturacion:read', 'facturacion:write',
  ];
  const rolRecep = await prisma.rol.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'RECEPCIONISTA',
      descripcion: 'Recepcionista y administrativa',
      permisos: {
        create: permisosRecep.map(c => ({ permisoId: permisos[c].id })),
      },
    },
  });

  const permisosEstilista = [
    'dashboard:read',
    'mascotas:read',
    'agenda:read',
    'estetica:read', 'estetica:write',
  ];
  const rolEstilista = await prisma.rol.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'ESTILISTA',
      descripcion: 'Groomer / Estilista',
      permisos: {
        create: permisosEstilista.map(c => ({ permisoId: permisos[c].id })),
      },
    },
  });

  console.log('✅ Roles creados');

  // ─── Usuarios ─────────────────────────────────
  const admin = await prisma.usuario.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'Admin', apellido: 'Sistema',
      email: 'admin@vetclinic.com',
      password: await hash('admin123'),
      esSuperAdmin: true,
      roles: { create: { rolId: rolAdmin.id } },
    },
  });

  const veterinario = await prisma.usuario.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'Valentina', apellido: 'García',
      email: 'dra.garcia@vetclinic.com',
      password: await hash('vet123'),
      telefono: '11-2222-3333',
      roles: { create: { rolId: rolVet.id } },
    },
  });

  const estilista = await prisma.usuario.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'Lucas', apellido: 'Romero',
      email: 'lucas@vetclinic.com',
      password: await hash('groomer123'),
      telefono: '11-4444-5555',
      roles: { create: { rolId: rolEstilista.id } },
    },
  });

  const recepcionista = await prisma.usuario.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'Sofía', apellido: 'Martínez',
      email: 'sofia@vetclinic.com',
      password: await hash('recep123'),
      roles: { create: { rolId: rolRecep.id } },
    },
  });

  console.log('✅ Usuarios creados');

  // ─── Clientes y mascotas ─────────────────────
  const cliente1 = await prisma.cliente.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'María', apellido: 'González',
      dni: '30123456', telefono: '11-6677-8899',
      email: 'maria.gonzalez@email.com',
      direccion: 'Av. Santa Fe 2345', ciudad: 'Buenos Aires',
      fidelidad: 4,
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'Carlos', apellido: 'López',
      dni: '28456789', telefono: '11-5544-3322',
      email: 'carlos.lopez@email.com',
      ciudad: 'Buenos Aires',
      fidelidad: 2,
    },
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      veterinariaId: vet.id,
      nombre: 'Ana', apellido: 'Fernández',
      dni: '35789012', telefono: '11-9988-7766',
      email: 'ana.fernandez@email.com',
      direccion: 'Calle Florida 890', ciudad: 'Buenos Aires',
      fidelidad: 5,
    },
  });

  console.log('✅ Clientes creados');

  const mascota1 = await prisma.mascota.create({
    data: {
      veterinariaId: vet.id, clienteId: cliente1.id,
      nombre: 'Max', especie: 'PERRO', raza: 'Labrador Retriever',
      sexo: 'MACHO', color: 'Dorado',
      fechaNacimiento: new Date('2019-03-15'),
      peso: 28.5, microchip: '985112345678901',
      esterilizado: true,
    },
  });

  const mascota2 = await prisma.mascota.create({
    data: {
      veterinariaId: vet.id, clienteId: cliente1.id,
      nombre: 'Luna', especie: 'GATO', raza: 'Persa',
      sexo: 'HEMBRA', color: 'Blanca',
      fechaNacimiento: new Date('2021-07-20'),
      peso: 4.2, microchip: '985198765432109',
      esterilizado: true, alergias: 'Polvo',
    },
  });

  const mascota3 = await prisma.mascota.create({
    data: {
      veterinariaId: vet.id, clienteId: cliente2.id,
      nombre: 'Rocky', especie: 'PERRO', raza: 'Bulldog Francés',
      sexo: 'MACHO', color: 'Atigrado',
      fechaNacimiento: new Date('2020-11-08'),
      peso: 11.3, microchip: '985111222333444',
      esterilizado: false,
      condicionesCronicas: 'Displasia de cadera leve',
    },
  });

  const mascota4 = await prisma.mascota.create({
    data: {
      veterinariaId: vet.id, clienteId: cliente3.id,
      nombre: 'Mia', especie: 'GATO', raza: 'Siamés',
      sexo: 'HEMBRA', color: 'Siamés clásico',
      fechaNacimiento: new Date('2022-01-10'),
      peso: 3.8, microchip: '985155566677788',
      esterilizado: true,
    },
  });

  console.log('✅ Mascotas creadas');

  // ─── Camas de internación ────────────────────
  for (let i = 1; i <= 6; i++) {
    await prisma.camaInternacion.create({
      data: {
        veterinariaId: vet.id,
        numero: `C-${String(i).padStart(2, '0')}`,
        sector: i <= 3 ? 'Perros' : 'Gatos',
      },
    });
  }

  // ─── Boxes de guardería ──────────────────────
  for (let i = 1; i <= 8; i++) {
    await prisma.boxGuarderia.create({
      data: {
        veterinariaId: vet.id,
        numero: `G-${String(i).padStart(2, '0')}`,
        tipo: i <= 4 ? 'Perros pequeños' : i <= 6 ? 'Perros grandes' : 'Gatos',
      },
    });
  }

  console.log('✅ Camas e infraestructura creadas');

  // ─── Vacunas ─────────────────────────────────
  await prisma.vacuna.create({
    data: {
      mascotaId: mascota1.id, nombre: 'Séxtuple',
      laboratorio: 'Nobivac', lote: 'LOT2024-A',
      fechaAplicacion: new Date('2024-02-10'),
      proximaDosis: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.vacuna.create({
    data: {
      mascotaId: mascota2.id, nombre: 'Triple Felina',
      laboratorio: 'Purevax', lote: 'PF2024-B',
      fechaAplicacion: new Date('2024-01-15'),
      proximaDosis: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.vacuna.create({
    data: {
      mascotaId: mascota3.id, nombre: 'Antirrábica',
      laboratorio: 'Defensor', lote: 'DEF2024-C',
      fechaAplicacion: new Date('2024-03-01'),
      proximaDosis: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Vacunas creadas');

  // ─── Turnos de hoy ──────────────────────────
  const hoy = new Date();
  const crearFecha = (h: number, m: number) => {
    const d = new Date(hoy);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const turno1 = await prisma.turno.create({
    data: {
      veterinariaId: vet.id,
      mascotaId: mascota1.id, clienteId: cliente1.id,
      profesionalId: veterinario.id,
      tipo: 'CONSULTA_VETERINARIA', estado: 'CONFIRMADO',
      fechaHora: crearFecha(9, 0), duracionMin: 30,
      motivo: 'Control anual y vacunas',
    },
  });

  const turno2 = await prisma.turno.create({
    data: {
      veterinariaId: vet.id,
      mascotaId: mascota3.id, clienteId: cliente2.id,
      profesionalId: estilista.id,
      tipo: 'BANO', estado: 'EN_CURSO',
      fechaHora: crearFecha(10, 0), duracionMin: 60,
    },
  });

  const turno3 = await prisma.turno.create({
    data: {
      veterinariaId: vet.id,
      mascotaId: mascota2.id, clienteId: cliente1.id,
      profesionalId: veterinario.id,
      tipo: 'VACUNACION', estado: 'PENDIENTE',
      fechaHora: crearFecha(11, 30), duracionMin: 20,
    },
  });

  const turno4 = await prisma.turno.create({
    data: {
      veterinariaId: vet.id,
      mascotaId: mascota4.id, clienteId: cliente3.id,
      profesionalId: estilista.id,
      tipo: 'CORTE_PELO', estado: 'EN_CURSO',
      fechaHora: crearFecha(14, 0), duracionMin: 45,
    },
  });

  await prisma.turno.create({
    data: {
      veterinariaId: vet.id,
      mascotaId: mascota1.id, clienteId: cliente1.id,
      profesionalId: veterinario.id,
      tipo: 'GUARDERIA_DIARIA', estado: 'COMPLETADO',
      fechaHora: crearFecha(8, 0), duracionMin: 480,
    },
  });

  console.log('✅ Turnos del día creados');

  // ─── Servicio de estética ────────────────────
  await prisma.servicioEstetica.create({
    data: {
      veterinariaId: vet.id,
      turnoId: turno2.id, mascotaId: mascota3.id,
      estilistId: estilista.id,
      servicios: JSON.stringify(['BANO_SECADO', 'CORTE_ESTANDAR', 'CORTE_UNAS']),
      estadoGrooming: 'EN_PROCESO',
      condicionPelaje: 'Pelaje denso, algo enredado',
    },
  });

  await prisma.servicioEstetica.create({
    data: {
      veterinariaId: vet.id,
      turnoId: turno4.id, mascotaId: mascota4.id,
      estilistId: estilista.id,
      servicios: JSON.stringify(['BANO_SECADO', 'CORTE_RAZA', 'PERFUMADO_MOÑO']),
      estadoGrooming: 'LISTO_RETIRAR',
      observaciones: 'Quedó hermosa! Listo para retirar.',
    },
  });

  console.log('✅ Servicios de estética creados');

  // ─── Consulta veterinaria ────────────────────
  const consulta1 = await prisma.consulta.create({
    data: {
      veterinariaId: vet.id,
      turnoId: turno1.id, mascotaId: mascota1.id,
      veterinarioId: veterinario.id,
      motivo: 'Control anual',
      sintomas: 'Sin síntomas. Paciente alerta y activo.',
      exploracionFisica: 'Mucosas rosadas, hidratado. Auscultación cardiopulmonar normal.',
      temperatura: 38.5, frecuenciaCardiaca: 80, pesoConsulta: 28.5,
      diagnosticoDefinitivo: 'Paciente sano. Control preventivo.',
      planTratamiento: 'Continuar dieta balanceada. Revisar desparasitación.',
      observaciones: 'Se recomienda control odontológico preventivo.',
    },
  });

  await prisma.receta.create({
    data: {
      consultaId: consulta1.id,
      medicamento: 'Nexgard Spectra', principioActivo: 'Afoxolaner + Milbemicina',
      dosis: '1 comprimido', frecuencia: 'Mensual', duracion: '3 meses',
      indicaciones: 'Administrar con comida.',
    },
  });

  console.log('✅ Consulta con receta creada');

  // ─── Inventario ───────────────────────────────
  const productosData = [
    { nombre: 'Amoxicilina 250mg',         categoria: 'MEDICAMENTO',      principioActivo: 'Amoxicilina',             marca: 'Calier',       stockActual: 45, stockMinimo: 10, precio: 850,  unidad: 'caja' },
    { nombre: 'Dexametasona 4mg/ml',        categoria: 'MEDICAMENTO',      principioActivo: 'Dexametasona',            marca: 'Vetnil',       stockActual: 3,  stockMinimo: 5,  precio: 1200, unidad: 'unidad' },
    { nombre: 'Nexgard Spectra medianos',   categoria: 'MEDICAMENTO',      principioActivo: 'Afoxolaner+Milbemicina',  marca: 'Boehringer',   stockActual: 12, stockMinimo: 8,  precio: 2800, unidad: 'caja' },
    { nombre: 'Shampoo antipulgas',         categoria: 'PRODUCTO_ESTETICA',                                             marca: 'FrontlinePet', stockActual: 2,  stockMinimo: 5,  precio: 950,  unidad: 'unidad' },
    { nombre: 'Acondicionador hidratante',  categoria: 'PRODUCTO_ESTETICA',                                             marca: 'GoldGroomer',  stockActual: 8,  stockMinimo: 3,  precio: 780,  unidad: 'unidad' },
    { nombre: 'Perfume para mascotas',      categoria: 'PRODUCTO_ESTETICA',                                             marca: 'PetScent',     stockActual: 15, stockMinimo: 5,  precio: 450,  unidad: 'unidad' },
    { nombre: 'Guantes quirúrgicos x50',    categoria: 'INSUMO',                                                                               stockActual: 4,  stockMinimo: 10, precio: 1100, unidad: 'caja' },
    { nombre: 'Jeringa 10ml x100',          categoria: 'INSUMO',                                                                               stockActual: 22, stockMinimo: 15, precio: 650,  unidad: 'caja' },
    { nombre: 'Pedigree adulto 15kg',       categoria: 'ALIMENTO',                                                      marca: 'Pedigree',     stockActual: 6,  stockMinimo: 3,  precio: 8500, unidad: 'bolsa' },
    { nombre: 'Collar antipulgas Seresto',  categoria: 'ACCESORIO',                                                     marca: 'Seresto',      stockActual: 9,  stockMinimo: 5,  precio: 3200, unidad: 'unidad' },
  ];

  for (const prod of productosData) {
    await prisma.producto.create({ data: { veterinariaId: vet.id, ...prod } });
  }

  console.log('✅ Inventario cargado');

  // ─── Facturas ─────────────────────────────────
  const factura1 = await prisma.factura.create({
    data: {
      veterinariaId: vet.id,
      numero: 'FAC-000001', clienteId: cliente1.id,
      estado: 'PAGADA', subtotal: 4500, descuento: 0, total: 4500,
      medioPago: 'EFECTIVO',
      detalles: {
        create: [
          { descripcion: 'Consulta veterinaria', cantidad: 1, precioUnit: 2500, subtotal: 2500 },
          { descripcion: 'Vacuna Séxtuple',       cantidad: 1, precioUnit: 2000, subtotal: 2000 },
        ],
      },
    },
  });

  await prisma.pago.create({
    data: { facturaId: factura1.id, monto: 4500, medioPago: 'EFECTIVO' },
  });

  await prisma.factura.create({
    data: {
      veterinariaId: vet.id,
      numero: 'FAC-000002', clienteId: cliente2.id,
      estado: 'PENDIENTE', subtotal: 3800, descuento: 200, total: 3600,
      detalles: {
        create: [
          { descripcion: 'Baño completo con secado', cantidad: 1, precioUnit: 2200, subtotal: 2200 },
          { descripcion: 'Corte estándar',           cantidad: 1, precioUnit: 1600, subtotal: 1600 },
        ],
      },
    },
  });

  console.log('✅ Facturas creadas');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Admin:        admin@vetclinic.com      / admin123');
  console.log('   Veterinario:  dra.garcia@vetclinic.com / vet123');
  console.log('   Groomer:      lucas@vetclinic.com      / groomer123');
  console.log('   Recepción:    sofia@vetclinic.com      / recep123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
