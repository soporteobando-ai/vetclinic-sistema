import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ─── Usuarios ───────────────────────────────
  const hash = (p: string) => bcrypt.hash(p, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@vetclinic.com' },
    update: {},
    create: {
      nombre: 'Admin', apellido: 'Sistema',
      email: 'admin@vetclinic.com',
      password: await hash('admin123'),
      rol: 'ADMIN',
    },
  });

  const veterinario = await prisma.usuario.upsert({
    where: { email: 'dra.garcia@vetclinic.com' },
    update: {},
    create: {
      nombre: 'Valentina', apellido: 'García',
      email: 'dra.garcia@vetclinic.com',
      password: await hash('vet123'),
      rol: 'VETERINARIO',
      telefono: '11-2222-3333',
    },
  });

  const estilista = await prisma.usuario.upsert({
    where: { email: 'lucas@vetclinic.com' },
    update: {},
    create: {
      nombre: 'Lucas', apellido: 'Romero',
      email: 'lucas@vetclinic.com',
      password: await hash('groomer123'),
      rol: 'ESTILISTA',
      telefono: '11-4444-5555',
    },
  });

  const recepcionista = await prisma.usuario.upsert({
    where: { email: 'sofia@vetclinic.com' },
    update: {},
    create: {
      nombre: 'Sofía', apellido: 'Martínez',
      email: 'sofia@vetclinic.com',
      password: await hash('recep123'),
      rol: 'RECEPCIONISTA',
    },
  });

  console.log('✅ Usuarios creados');

  // ─── Clientes y mascotas ─────────────────────
  const cliente1 = await prisma.cliente.upsert({
    where: { dni: '30123456' },
    update: {},
    create: {
      nombre: 'María', apellido: 'González',
      dni: '30123456', telefono: '11-6677-8899',
      email: 'maria.gonzalez@email.com',
      direccion: 'Av. Santa Fe 2345', ciudad: 'Buenos Aires',
      fidelidad: 4,
    },
  });

  const cliente2 = await prisma.cliente.upsert({
    where: { dni: '28456789' },
    update: {},
    create: {
      nombre: 'Carlos', apellido: 'López',
      dni: '28456789', telefono: '11-5544-3322',
      email: 'carlos.lopez@email.com',
      ciudad: 'Buenos Aires',
      fidelidad: 2,
    },
  });

  const cliente3 = await prisma.cliente.upsert({
    where: { dni: '35789012' },
    update: {},
    create: {
      nombre: 'Ana', apellido: 'Fernández',
      dni: '35789012', telefono: '11-9988-7766',
      email: 'ana.fernandez@email.com',
      direccion: 'Calle Florida 890', ciudad: 'Buenos Aires',
      fidelidad: 5,
    },
  });

  console.log('✅ Clientes creados');

  const mascota1 = await prisma.mascota.upsert({
    where: { microchip: '985112345678901' },
    update: {},
    create: {
      clienteId: cliente1.id, nombre: 'Max',
      especie: 'PERRO', raza: 'Labrador Retriever',
      sexo: 'MACHO', color: 'Dorado',
      fechaNacimiento: new Date('2019-03-15'),
      peso: 28.5, microchip: '985112345678901',
      esterilizado: true,
    },
  });

  const mascota2 = await prisma.mascota.upsert({
    where: { microchip: '985198765432109' },
    update: {},
    create: {
      clienteId: cliente1.id, nombre: 'Luna',
      especie: 'GATO', raza: 'Persa',
      sexo: 'HEMBRA', color: 'Blanca',
      fechaNacimiento: new Date('2021-07-20'),
      peso: 4.2, microchip: '985198765432109',
      esterilizado: true, alergias: 'Polvo',
    },
  });

  const mascota3 = await prisma.mascota.upsert({
    where: { microchip: '985111222333444' },
    update: {},
    create: {
      clienteId: cliente2.id, nombre: 'Rocky',
      especie: 'PERRO', raza: 'Bulldog Francés',
      sexo: 'MACHO', color: 'Atigrado',
      fechaNacimiento: new Date('2020-11-08'),
      peso: 11.3, microchip: '985111222333444',
      esterilizado: false,
      condicionesCronicas: 'Displasia de cadera leve',
    },
  });

  const mascota4 = await prisma.mascota.upsert({
    where: { microchip: '985155566677788' },
    update: {},
    create: {
      clienteId: cliente3.id, nombre: 'Mia',
      especie: 'GATO', raza: 'Siamés',
      sexo: 'HEMBRA', color: 'Siamés clásico',
      fechaNacimiento: new Date('2022-01-10'),
      peso: 3.8, microchip: '985155566677788',
      esterilizado: true,
    },
  });

  console.log('✅ Mascotas creadas');

  // ─── Camas de internación ────────────────────
  for (let i = 1; i <= 6; i++) {
    await prisma.camaInternacion.upsert({
      where: { numero: `C-${String(i).padStart(2,'0')}` },
      update: {},
      create: { numero: `C-${String(i).padStart(2,'0')}`, sector: i <= 3 ? 'Perros' : 'Gatos' },
    });
  }

  // ─── Boxes de guardería ──────────────────────
  for (let i = 1; i <= 8; i++) {
    await prisma.boxGuarderia.upsert({
      where: { numero: `G-${String(i).padStart(2,'0')}` },
      update: {},
      create: {
        numero: `G-${String(i).padStart(2,'0')}`,
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
      proximaDosis: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // en 5 días
    },
  });

  await prisma.vacuna.create({
    data: {
      mascotaId: mascota2.id, nombre: 'Triple Felina',
      laboratorio: 'Purevax', lote: 'PF2024-B',
      fechaAplicacion: new Date('2024-01-15'),
      proximaDosis: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // en 10 días
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

  const crearTurno = (h: number, m: number) => {
    const fecha = new Date(hoy);
    fecha.setHours(h, m, 0, 0);
    return fecha;
  };

  const turno1 = await prisma.turno.create({
    data: {
      mascotaId: mascota1.id, clienteId: cliente1.id,
      profesionalId: veterinario.id,
      tipo: 'CONSULTA_VETERINARIA',
      estado: 'CONFIRMADO',
      fechaHora: crearTurno(9, 0),
      duracionMin: 30,
      motivo: 'Control anual y vacunas',
    },
  });

  const turno2 = await prisma.turno.create({
    data: {
      mascotaId: mascota3.id, clienteId: cliente2.id,
      profesionalId: estilista.id,
      tipo: 'BANO',
      estado: 'EN_CURSO',
      fechaHora: crearTurno(10, 0),
      duracionMin: 60,
    },
  });

  const turno3 = await prisma.turno.create({
    data: {
      mascotaId: mascota2.id, clienteId: cliente1.id,
      profesionalId: veterinario.id,
      tipo: 'VACUNACION',
      estado: 'PENDIENTE',
      fechaHora: crearTurno(11, 30),
      duracionMin: 20,
    },
  });

  const turno4 = await prisma.turno.create({
    data: {
      mascotaId: mascota4.id, clienteId: cliente3.id,
      profesionalId: estilista.id,
      tipo: 'CORTE_PELO',
      estado: 'EN_CURSO',
      fechaHora: crearTurno(14, 0),
      duracionMin: 45,
    },
  });

  const turno5 = await prisma.turno.create({
    data: {
      mascotaId: mascota1.id, clienteId: cliente1.id,
      profesionalId: veterinario.id,
      tipo: 'GUARDERIA_DIARIA',
      estado: 'COMPLETADO',
      fechaHora: crearTurno(8, 0),
      duracionMin: 480,
    },
  });

  console.log('✅ Turnos del día creados');

  // ─── Servicio de estética (grooming Kanban) ──
  await prisma.servicioEstetica.create({
    data: {
      turnoId: turno2.id, mascotaId: mascota3.id,
      estilistId: estilista.id,
      servicios: JSON.stringify(['BANO_SECADO', 'CORTE_ESTANDAR', 'CORTE_UNAS']),
      estadoGrooming: 'EN_PROCESO',
      condicionPelaje: 'Pelaje denso, algo enredado',
    },
  });

  await prisma.servicioEstetica.create({
    data: {
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
      turnoId: turno1.id, mascotaId: mascota1.id,
      veterinarioId: veterinario.id,
      motivo: 'Control anual',
      sintomas: 'Sin síntomas. Paciente alerta y activo.',
      exploracionFisica: 'Mucosas rosadas, hidratado. Auscultación cardiopulmonar normal. Abdomen sin dolor.',
      temperatura: 38.5,
      frecuenciaCardiaca: 80,
      pesoConsulta: 28.5,
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

  console.log('✅ Consulta veterinaria con receta creada');

  // ─── Inventario ───────────────────────────────
  const productos = [
    { nombre: 'Amoxicilina 250mg', categoria: 'MEDICAMENTO' as const, principioActivo: 'Amoxicilina', marca: 'Calier', stockActual: 45, stockMinimo: 10, precio: 850, unidad: 'caja' },
    { nombre: 'Dexametasona 4mg/ml', categoria: 'MEDICAMENTO' as const, principioActivo: 'Dexametasona', marca: 'Vetnil', stockActual: 3, stockMinimo: 5, precio: 1200, unidad: 'unidad' },
    { nombre: 'Nexgard Spectra (perros medianos)', categoria: 'MEDICAMENTO' as const, principioActivo: 'Afoxolaner + Milbemicina', stockActual: 12, stockMinimo: 8, precio: 2800, unidad: 'caja' },
    { nombre: 'Shampoo antipulgas', categoria: 'PRODUCTO_ESTETICA' as const, marca: 'FrontlinePet', stockActual: 2, stockMinimo: 5, precio: 950, unidad: 'unidad' },
    { nombre: 'Acondicionador hidratante', categoria: 'PRODUCTO_ESTETICA' as const, marca: 'GoldGroomer', stockActual: 8, stockMinimo: 3, precio: 780, unidad: 'unidad' },
    { nombre: 'Perfume para mascotas', categoria: 'PRODUCTO_ESTETICA' as const, marca: 'PetScent', stockActual: 15, stockMinimo: 5, precio: 450, unidad: 'unidad' },
    { nombre: 'Guantes quirúrgicos (caja x50)', categoria: 'INSUMO' as const, stockActual: 4, stockMinimo: 10, precio: 1100, unidad: 'caja' },
    { nombre: 'Jeringa 10ml (caja x100)', categoria: 'INSUMO' as const, stockActual: 22, stockMinimo: 15, precio: 650, unidad: 'caja' },
    { nombre: 'Pedigree adulto 15kg', categoria: 'ALIMENTO' as const, marca: 'Pedigree', stockActual: 6, stockMinimo: 3, precio: 8500, unidad: 'bolsa' },
    { nombre: 'Collar antipulgas', categoria: 'ACCESORIO' as const, marca: 'Seresto', stockActual: 9, stockMinimo: 5, precio: 3200, unidad: 'unidad' },
  ];

  for (const prod of productos) {
    await prisma.producto.create({ data: prod });
  }

  console.log('✅ Inventario cargado');

  // ─── Facturas ─────────────────────────────────
  const factura1 = await prisma.factura.create({
    data: {
      numero: 'FAC-000001',
      clienteId: cliente1.id,
      estado: 'PAGADA',
      subtotal: 4500, descuento: 0, total: 4500,
      medioPago: 'EFECTIVO',
      detalles: {
        create: [
          { descripcion: 'Consulta veterinaria', cantidad: 1, precioUnit: 2500, subtotal: 2500 },
          { descripcion: 'Vacuna Séxtuple', cantidad: 1, precioUnit: 2000, subtotal: 2000 },
        ],
      },
    },
  });

  await prisma.pago.create({
    data: { facturaId: factura1.id, monto: 4500, medioPago: 'EFECTIVO' },
  });

  const factura2 = await prisma.factura.create({
    data: {
      numero: 'FAC-000002',
      clienteId: cliente2.id,
      estado: 'PENDIENTE',
      subtotal: 3800, descuento: 200, total: 3600,
      detalles: {
        create: [
          { descripcion: 'Baño completo con secado', cantidad: 1, precioUnit: 2200, subtotal: 2200 },
          { descripcion: 'Corte estándar', cantidad: 1, precioUnit: 1600, subtotal: 1600 },
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
