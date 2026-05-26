# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack tecnológico

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Query + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Base de datos**: PostgreSQL
- **Tiempo real**: Socket.io
- **Auth**: JWT (jsonwebtoken) + bcryptjs

## Comandos principales

### Backend (`/backend`)
```bash
npm install          # Instalar dependencias
npm run db:generate  # Generar Prisma client
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Cargar datos de prueba
npm run db:studio    # Abrir Prisma Studio (GUI de BD)
npm run dev          # Servidor de desarrollo (puerto 3001)
```

### Frontend (`/frontend`)
```bash
npm install   # Instalar dependencias
npm run dev   # Servidor de desarrollo (puerto 5173)
npm run build # Build de producción
```

## Instalación completa

### 1. Pre-requisitos
- Node.js 18+
- PostgreSQL 14+

### 2. Backend
```bash
cd backend
cp .env.example .env
# Editar DATABASE_URL en .env con tus credenciales de PostgreSQL
npm install
npm run db:generate
npm run db:migrate   # Crea todas las tablas
npm run db:seed      # Carga datos de demo
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Acceso
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Credenciales demo: `admin@vetclinic.com` / `admin123`

## Arquitectura

### Backend (`/backend/src/`)
- `index.ts` — Servidor principal, monta rutas y Socket.io
- `config/prisma.ts` — Singleton de Prisma Client
- `middleware/auth.middleware.ts` — JWT + control de roles (`autenticar`, `autorizar`)
- `routes/` — Un archivo por módulo, usan `autenticar` de base
- `controllers/` — Lógica de negocio separada por entidad
- `services/socket.service.ts` — Handlers de WebSocket y helper `emitirActualizacion`
- `utils/fechas.ts` — Helpers de fechas (`startOfDay`, `endOfDay`, etc.)
- `prisma/schema.prisma` — Esquema completo de la BD
- `prisma/seed.ts` — Datos de prueba

### Frontend (`/frontend/src/`)
- `App.tsx` — Rutas con React Router. `ProtectedRoute` envuelve rutas autenticadas
- `store/authStore.ts` — Estado global de autenticación (Zustand + persist)
- `services/api.ts` — Instancia de Axios + funciones tipadas por módulo
- `types/index.ts` — Todos los tipos TypeScript del dominio
- `components/layout/` — `Layout`, `Sidebar`, `Header`
- `pages/dashboard/` — Dashboard con métricas, turnos del día, gráfico de ingresos
- `pages/pacientes/` — Clientes y mascotas con historial clínico
- `pages/agenda/` — Calendario semanal con drag visual de turnos
- `pages/clinico/` — Formulario de consulta con recetas, estudios y vacunas
- `pages/estetica/` — Tablero Kanban de grooming (EN_COLA → EN_PROCESO → LISTO_RETIRAR)
- `pages/inventario/` — Gestión de stock con alertas de stock bajo
- `pages/facturacion/` — Facturas, cobros y caja diaria
- `pages/reportes/` — Gráficos con Recharts

### Patrones clave
- Todas las queries usan `@tanstack/react-query` con `queryKey` descriptivos
- Los modals de creación/edición siguen el patrón `Modal<Entidad>.tsx` con `onClose`/`onSuccess`
- Los eventos en tiempo real se emiten desde el backend con `req.io.emit(evento, data)` y se escuchan en `Layout.tsx`
- Los roles del enum `Rol` controlan qué elementos de menú ve cada usuario (filtro en `Sidebar.tsx`)

## Módulos disponibles

| Módulo | Ruta | Roles |
|--------|------|-------|
| Dashboard | `/dashboard` | Todos |
| Clientes | `/clientes` | Admin, Vet, Recep |
| Mascotas | `/mascotas` | Todos |
| Agenda | `/agenda` | Todos |
| Consulta clínica | `/consultas/:turnoId` | Vet, Admin |
| Estética/Grooming | `/estetica` | Admin, Estilista, Recep |
| Inventario | `/inventario` | Admin, Recep, Vet |
| Facturación | `/facturacion` | Admin, Recep |
| Reportes | `/reportes` | Admin |

## Variables de entorno requeridas

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/veterinaria_db"
JWT_SECRET="secreto_aleatorio_largo"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```
