# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sistema de gestión veterinaria **multi-tenant**. `backend/`: Express + TypeScript + Prisma + PostgreSQL + Socket.io, auth con JWT. `frontend/`: React 18 + Vite + Tailwind + React Query + Zustand. Son dos paquetes npm independientes (no hay `package.json` raíz). El código, el dominio y los commits están en español. [MANUAL.md](MANUAL.md) describe el comportamiento funcional desde el punto de vista del usuario.

## Comandos

```bash
# Base de datos local (usa la DATABASE_URL de ejemplo de backend/.env.example)
docker compose up -d postgres

# backend/ (puerto 3001)
npm run dev          # nodemon + ts-node
npm run build        # tsc → dist/
npm run db:generate  # regenerar Prisma Client; necesario tras cambiar schema.prisma
npm run db:push      # sincronizar el esquema (usa --accept-data-loss: puede borrar datos)
npm run db:seed
npm run db:studio

# frontend/ (puerto 5173)
npm run dev
npm run build        # solo vite build, NO chequea tipos
npx tsc --noEmit     # chequeo de tipos
```

Para un setup nuevo: copiar `backend/.env.example` a `backend/.env`, `npm install`, `db:push`, `db:seed`. El repo no versiona migraciones y producción usa `prisma db push`, aunque exista el script `db:migrate`. Antes de correr `db:push`, verificar que `DATABASE_URL` no apunte a producción.

Credenciales demo del seed: `admin@vetclinic.com` / `admin123` (es además super-admin).

### Verificación

- No hay tests ni test runner configurado.
- `npm run lint` del frontend no funciona: ESLint no está en las dependencias ni tiene configuración.
- La verificación disponible es `npx tsc --noEmit` en ambos paquetes; los dos deben dar cero errores.
- Si el `tsc` del backend dice que no existen `esSuperAdmin` o `roles` en `Usuario`, el Prisma Client generado está desactualizado: correr `npm run db:generate`.

## Arquitectura

### Multi-tenancy

Casi todas las entidades raíz tienen `veterinariaId`. No hay aislamiento automático en Prisma: **cada query debe filtrar a mano** con `filtroTenant(req)` ([auth.middleware.ts](backend/src/middleware/auth.middleware.ts)).

- Antes de un `update`/`delete` por id, el patrón es `findFirst({ where: { id, ...tenant } })` y responder 404 si no existe.
- Los modelos hijos sin `veterinariaId` (`Receta`, `Estudio`, `Vacuna`, `Desparasitacion`, `Pago`, `MovimientoStock`, etc.) se protegen a través del padre.
- En escrituras no pasar `req.body` a Prisma: usar `tomarCampos` (lista de campos permitidos) y validar con `referenciaInvalida` que cada `*Id` recibido sea de la misma veterinaria ([tenant.ts](backend/src/utils/tenant.ts)). Si se agrega una relación nueva, sumarla a `REFERENCIAS`. Poner `...tenant` al final.
- No usar `include: { <relación a Usuario>: true }`: devuelve el hash de la contraseña. Usar `select`.
- Las restricciones de unicidad suelen ser por tenant (`@@unique([veterinariaId, ...])`). `Usuario.email` y `Mascota.microchip` son globales.

### RBAC

Los roles son filas en la base (`Rol` por veterinaria → `RolPermiso` → `Permiso` global con códigos `modulo:accion`), **no un enum**.

- `autenticar` relee usuario, roles y permisos de la base en cada request (`cargarUsuario`); del JWT solo se usa el id. Rechaza usuarios y veterinarias inactivos, salvo que el usuario sea super-admin. Un admin que no es super-admin no puede modificar a un super-admin.
- En rutas se usa `verificarPermiso(...codigos)` (alcanza con uno; `esAdmin` pasa siempre), `soloAdmin` o `soloSuperAdmin`. `autorizar` es un no-op heredado: no protege nada.
- `esSuperAdmin` es un flag de `Usuario`, independiente de los roles, que habilita `/veterinarias` y la gestión de usuarios de otras clínicas.
- En el frontend, `tienePermiso()` de [authStore.ts](frontend/src/store/authStore.ts) filtra el menú en `Sidebar.tsx`. Las rutas de `App.tsx` solo exigen token, así que el control real es el del backend. `/api/usuarios` exige `soloAdmin` aunque el menú "Profesionales" se muestre con `usuarios:read`.
- La lista de permisos vive en [seed.ts](backend/prisma/seed.ts). Los permisos de los roles por defecto están **duplicados** en el seed y en `veterinarias.controller.ts` (alta de clínica). El seed se saltea si ya hay una veterinaria, por lo que un permiso nuevo no llega solo a una base existente.

### Backend

- La mayoría de los módulos siguen `routes/` → `controllers/`. Estética, internaciones y guardería tienen la lógica inline en el archivo de rutas. Internaciones y guardería todavía no tienen UI.
- Express 4 no captura errores de handlers async: usar `try/catch` en cada handler, porque `errorHandler` no recibe las promesas rechazadas.
- Los campos tipo estado/tipo son `String`, no enums de Prisma. Las listas (`servicios`, `fotosAntes`, `fotosDespues`) se guardan como JSON serializado en `String`: hay que hacer `stringify` al escribir y `parse` al leer.
- Los formularios mandan `''` en campos opcionales: convertirlo a `null` u omitirlo antes de pasarlo a Prisma, sobre todo en fechas y números.
- Crear un turno de un tipo incluido en `TIPOS_ESTETICA` (`turnos.controller.ts`) crea en la misma transacción un `ServicioEstetica` en `EN_COLA`, que alimenta el Kanban (`EN_COLA → EN_PROCESO → LISTO_RETIRAR`). Crear una consulta pasa su turno a `EN_CURSO`; completarla, a `COMPLETADO`.

### Frontend

- Las llamadas HTTP se agrupan por módulo en [services/api.ts](frontend/src/services/api.ts); los tipos del dominio están en `types/index.ts`. El interceptor toma el token de `localStorage['token']`, que `authStore` mantiene aparte de su estado persistido.
- En dev, Vite reenvía `/api` a `localhost:3001`. En producción se usan `VITE_API_URL` y `VITE_SOCKET_URL`.
- Datos remotos con React Query: tras una mutación hay que invalidar todas las `queryKey` afectadas (un turno aparece en `calendario`, `turnos-hoy` y `cliente`, entre otras).
- Tiempo real: la conexión de Socket.io exige el JWT (`auth.token`) y el servidor une cada socket a la sala de su veterinaria. Emitir siempre con `emitirAVeterinaria(req.io, veterinariaId, ...)`, nunca con `io.emit`. `Layout.tsx` escucha y muestra toasts.

## Despliegue

Backend en Render ([render.yaml](render.yaml)) con base en Neon; frontend en Vercel ([vercel.json](frontend/vercel.json)).

- Cada build de Render ejecuta `prisma db push` sobre la base de producción y después `db:seed` (si el seed falla, se ignora). Un cambio en `schema.prisma` se aplica al desplegar; no agregar `--force-reset` ni `--accept-data-loss`.
- El seed no modifica nada si la base ya está poblada. Sobre una base vacía con `NODE_ENV=production` exige `SEED_ADMIN_PASSWORD` (12+ caracteres), que usa para todos los usuarios iniciales.
- Las variables `CLOUDINARY_*` están declaradas, pero el código todavía no las usa.
