# Manual de Usuario — VetClinic

**Sistema de Gestión Veterinaria Multi-Empresa**

---

## Índice

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Dashboard](#2-dashboard)
3. [Clientes](#3-clientes)
4. [Mascotas](#4-mascotas)
5. [Agenda](#5-agenda)
6. [Módulo Clínico](#6-módulo-clínico)
7. [Estética y Grooming](#7-estética-y-grooming)
8. [Inventario](#8-inventario)
9. [Facturación](#9-facturación)
10. [Reportes](#10-reportes)
11. [Usuarios y Roles](#11-usuarios-y-roles)
12. [Gestión de Veterinarias (Super-Admin)](#12-gestión-de-veterinarias-super-admin)

---

## 1. Acceso al sistema

### Iniciar sesión
1. Ingresá a la URL del sistema
2. Completá tu **correo electrónico** y **contraseña**
3. Hacé click en **Ingresar**

### Permisos y menú
El menú lateral solo muestra las secciones a las que tu rol tiene acceso. Si no ves una opción, no tenés permiso para ese módulo — contactá al administrador de tu clínica.

### Contraseña inicial
Cuando un administrador crea tu usuario, la contraseña inicial es `Veterinaria123`. Podés cambiarla desde tu perfil.

### Modo oscuro
Hacé click en el ícono de luna/sol en el encabezado para alternar entre modo claro y oscuro.

---

## 2. Dashboard

Vista general con métricas del día y del mes para tu veterinaria.

| Métrica | Descripción |
|---|---|
| Turnos hoy | Total de turnos programados para hoy |
| Consultas hoy | Consultas clínicas del día |
| Turnos del mes | Acumulado mensual |
| Ingresos del mes | Facturación total cobrada |
| Stock crítico | Productos por debajo del stock mínimo |
| Vacunas próximas | Mascotas con vacuna vencida o por vencer en 7 días |

La sección **Turnos del día** lista los turnos con su estado actual. El gráfico de **Ingresos** muestra la evolución de los últimos meses.

> Los datos del dashboard son exclusivos de tu veterinaria. Nunca verás información de otras clínicas.

---

## 3. Clientes

Gestión del padrón de clientes (dueños de mascotas).

### Buscar un cliente
Usá la barra de búsqueda para filtrar por nombre, apellido, DNI o teléfono en tiempo real.

### Crear cliente
1. Click en **Nuevo cliente**
2. Completá los datos (nombre, apellido y teléfono son obligatorios)
3. Click en **Guardar**

### Ver detalle de cliente
Click en el nombre del cliente para ver:
- Datos de contacto
- Sus mascotas registradas
- Historial de turnos
- Facturas asociadas

### Editar / Eliminar
Desde la tabla o el detalle podés editar los datos o eliminar el cliente (solo si no tiene registros asociados).

---

## 4. Mascotas

### Registrar una mascota
1. Desde **Mascotas** → **Nueva mascota**, o desde el detalle del cliente
2. Completá especie, nombre, sexo (obligatorios) y los datos opcionales (raza, peso, microchip, etc.)
3. Guardá

### Historial clínico
Desde el detalle de la mascota podés ver:
- Consultas anteriores con diagnósticos y recetas
- Vacunas aplicadas y próximas dosis
- Desparasitaciones
- Internaciones previas

### Dar de baja una mascota
Usá el botón **Dar de baja** para desactivarla sin eliminar su historial. Podés reactivarla en cualquier momento.

---

## 5. Agenda

Calendario semanal de turnos con vista por día.

### Crear un turno
1. Click en **Nuevo turno** o directamente en una celda del calendario
2. Seleccioná: mascota, cliente, tipo de turno, profesional y fecha/hora
3. El sistema verifica conflictos de horario automáticamente
4. Guardá

### Tipos de turno
Consulta veterinaria · Cirugía · Vacunación · Baño · Corte de pelo · Peinado · Tratamiento pulgas · Limpieza dental · Corte de uñas · Hidratación de pelaje · Aromaterapia · Masaje · Guardería diaria · Guardería nocturna

### Estados de turno
| Estado | Descripción |
|---|---|
| Pendiente | Turno agendado, sin confirmar |
| Confirmado | Cliente confirmó asistencia |
| En curso | Atención en progreso |
| Completado | Atención finalizada |
| Cancelado | Turno cancelado |
| Lista de espera | Sin horario confirmado |

### Cambiar estado
Hacé click en el turno y usá el selector de estado. Los cambios se reflejan en tiempo real para todos los usuarios conectados.

---

## 6. Módulo Clínico

Registro de consultas veterinarias. Accesible desde un turno con estado **En curso** o **Completado**.

### Abrir una consulta
Desde la agenda, click en el turno → **Iniciar consulta**.

### Formulario de consulta
- **Anamnesis**: motivo, síntomas
- **Exploración física**: temperatura, frecuencia cardíaca, peso
- **Diagnóstico**: diferencial y definitivo
- **Plan de tratamiento**
- **Próximo control**

### Recetas
Dentro de la consulta, sección **Recetas** → **Agregar receta**. Completá medicamento, dosis, frecuencia y duración.

### Estudios complementarios
Sección **Estudios** → **Agregar estudio**. Podés subir archivos (resultados de laboratorio, radiografías).

### Vacunas
Registrá la vacuna aplicada directamente desde la consulta, incluyendo laboratorio, lote y próxima dosis.

### Completar consulta
Click en **Completar consulta** para cerrarla. Una vez completada no se puede editar.

---

## 7. Estética y Grooming

Tablero Kanban para el seguimiento de servicios estéticos en tiempo real.

### Columnas del tablero
1. **En cola** — turno de estética creado, esperando atención
2. **En proceso** — mascota siendo atendida
3. **Listo para retirar** — servicio finalizado, esperando al dueño
4. **Retirado** — mascota entregada

### Mover una tarjeta
Click en la tarjeta y cambiá el estado con los botones de acción, o usá el selector de estado.

### Registrar un servicio estético
Al crear un turno de tipo baño, corte u otros servicios, el sistema genera automáticamente una tarjeta en el tablero de estética.

### Detalle del servicio
Desde la tarjeta podés registrar:
- Servicios realizados
- Condición del pelaje
- Reacciones de la mascota
- Productos utilizados
- Observaciones

---

## 8. Inventario

Control de stock de medicamentos, insumos, productos de estética y accesorios.

### Agregar producto
1. Click en **Nuevo producto**
2. Completá nombre, categoría, stock actual, stock mínimo y precio
3. Guardá

### Categorías
Medicamento · Producto estética · Accesorio · Alimento · Insumo

### Alertas de stock
Los productos con stock por debajo del mínimo aparecen resaltados en rojo. El Dashboard también muestra el contador de **Stock crítico**.

### Registrar movimiento
Para entradas o salidas de stock (sin pasar por facturación), usá **Registrar movimiento** → indicá tipo (entrada/salida), cantidad y motivo.

### Vencimientos
La pestaña **Vencimientos** lista los productos con fecha de vencimiento próxima o vencida.

---

## 9. Facturación

### Crear factura
1. Click en **Nueva factura**
2. Seleccioná el cliente
3. Agregá líneas de detalle (descripción, cantidad, precio unitario)
4. Aplicá descuento si corresponde
5. Guardá

### Registrar pago
Desde la factura → **Registrar pago** → seleccioná medio de pago y monto.

### Medios de pago aceptados
Efectivo · Tarjeta de débito · Tarjeta de crédito · Transferencia · Billetera digital · Cuotas · Seguro

### Estados de factura
| Estado | Descripción |
|---|---|
| Pendiente | Sin cobrar |
| Parcial | Cobro parcial registrado |
| Pagada | Cobrada en su totalidad |
| Anulada | Factura anulada |

### Caja diaria
La pestaña **Caja** muestra el resumen de cobros del día agrupados por medio de pago.

### Anular factura
Desde el detalle → **Anular**. Esta acción no se puede deshacer.

---

## 10. Reportes

Gráficos e indicadores de rendimiento del negocio. Solo visible para el rol Administrador.

Incluye:
- Ingresos por período
- Turnos por tipo de servicio
- Especies más atendidas
- Evolución de clientes nuevos
- Productos más utilizados

---

## 11. Usuarios y Roles

Accesible desde **Profesionales** en el menú lateral. Solo visible para administradores.

### Tab Usuarios

#### Crear usuario
1. Click en **Nuevo usuario**
2. Completá nombre, apellido, email y asigná un rol
3. La contraseña inicial es `Veterinaria123` si se deja vacío el campo
4. Guardá

#### Editar usuario
Click en **Editar** en la fila del usuario. Podés cambiar datos, rol y contraseña.

#### Dar de baja / Reactivar
Usa el botón correspondiente en la fila. Un usuario dado de baja no puede iniciar sesión.

### Tab Roles y permisos

#### Crear un rol
1. Click en **Nuevo rol**
2. Asigná un nombre y seleccioná los permisos módulo por módulo
3. Marcá **Acceso de administrador** si el rol debe tener acceso total sin restricciones
4. Guardá

#### Permisos disponibles por módulo
Cada módulo tiene permisos de lectura (`:read`) y escritura (`:write`). Algunos tienen también borrado (`:delete`).

Módulos: Dashboard · Clientes · Mascotas · Agenda · Consultas · Estética · Inventario · Facturación · Reportes · Usuarios

#### Editar un rol existente
Click en **Editar** en la card del rol. Podés modificar nombre, descripción y permisos. Los cambios aplican de inmediato a todos los usuarios con ese rol.

> Los cambios de permisos toman efecto en el próximo inicio de sesión del usuario.

---

## 12. Gestión de Veterinarias (Super-Admin)

Esta sección solo es visible para el usuario con privilegios de **Super-Administrador** de la plataforma. Permite gestionar todas las empresas registradas en el sistema.

### Ver veterinarias
En el menú lateral aparece la opción **Veterinarias** exclusivamente para el super-admin. Muestra todas las clínicas registradas con sus estadísticas:
- Cantidad de usuarios, clientes, mascotas y turnos

### Crear nueva veterinaria
1. Click en **Nueva veterinaria**
2. Completá los datos del negocio (nombre obligatorio, dirección, teléfono, email opcionales)
3. Completá los datos del **administrador inicial** (nombre, apellido, email, contraseña)
4. Click en **Crear veterinaria**

Al crear una veterinaria el sistema genera automáticamente:
- Los 4 roles por defecto: ADMIN, VETERINARIO, RECEPCIONISTA, ESTILISTA
- El usuario administrador con acceso total

### Ver el equipo de una veterinaria
Click en **Ver equipo** en la card de la veterinaria. Se abre un panel lateral con todos los usuarios de esa clínica, su rol y estado.

### Agregar usuario a una veterinaria
Desde el panel lateral **Ver equipo** → **Agregar usuario**. Completá los datos del nuevo usuario y seleccioná su rol (los roles disponibles son los de esa veterinaria específica).

### Editar una veterinaria
Click en **Editar** en la card → modificá nombre, dirección, teléfono o email → **Guardar cambios**.

### Activar / Desactivar veterinaria
Usá el botón de estado en la card. Una veterinaria desactivada sigue existiendo con todos sus datos pero sus usuarios no pueden iniciar sesión.

> El aislamiento de datos es total: los usuarios de una veterinaria nunca pueden ver ni modificar datos de otra, independientemente de su rol.

---

## Preguntas frecuentes

**¿Puedo recuperar datos eliminados?**
Los registros eliminados (clientes, mascotas, etc.) no se pueden recuperar. Los que tienen opción de "dar de baja" sí se pueden reactivar.

**¿Qué pasa si un usuario cambia de rol?**
El nuevo permiso aplica en el próximo inicio de sesión. Si el usuario está conectado, necesita cerrar sesión y volver a ingresar.

**¿Puedo tener más de un rol?**
El sistema soporta múltiples roles por usuario. Los permisos se combinan — si un rol tiene acceso a X y otro a Y, el usuario tiene acceso a ambos.

**¿Los datos de una clínica son visibles para otra?**
No. Cada veterinaria opera en un espacio completamente aislado. Es imposible ver datos de otra clínica desde cualquier rol.

**¿Quién puede crear nuevas veterinarias?**
Solo el Super-Administrador de la plataforma. Los administradores de cada clínica solo gestionan su propia veterinaria.
