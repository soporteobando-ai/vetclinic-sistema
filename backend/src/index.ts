import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { authRoutes } from './routes/auth.routes';
import { clienteRoutes } from './routes/clientes.routes';
import { mascotaRoutes } from './routes/mascotas.routes';
import { turnoRoutes } from './routes/turnos.routes';
import { consultaRoutes } from './routes/consultas.routes';
import { esteticaRoutes } from './routes/estetica.routes';
import { inventarioRoutes } from './routes/inventario.routes';
import { facturaRoutes } from './routes/facturas.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { internacionRoutes } from './routes/internaciones.routes';
import { guarderiaRoutes } from './routes/guarderia.routes';
import { usuarioRoutes } from './routes/usuarios.routes';
import { veterinariaRoutes } from './routes/veterinarias.routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './services/socket.service';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Inyectar io en las rutas
app.use((req: any, _res, next) => { req.io = io; next(); });

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/estetica', esteticaRoutes);
app.use('/api/internaciones', internacionRoutes);
app.use('/api/guarderia', guarderiaRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/veterinarias', veterinariaRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// WebSockets
setupSocketHandlers(io);

// Manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🐾 Servidor veterinaria corriendo en http://localhost:${PORT}`);
});

export { io };
