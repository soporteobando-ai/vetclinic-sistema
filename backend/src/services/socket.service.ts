import { Server } from 'socket.io';
import { cargarUsuario } from '../middleware/auth.middleware';

const salaVeterinaria = (veterinariaId: string) => `veterinaria:${veterinariaId}`;

export const setupSocketHandlers = (io: Server) => {
  // La conexión exige el mismo JWT que la API
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const usuario = typeof token === 'string' ? await cargarUsuario(token) : null;
      if (!usuario) return next(new Error('No autorizado'));
      socket.data.veterinariaId = usuario.veterinariaId;
      next();
    } catch {
      next(new Error('No autorizado'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);
    // La sala la decide el servidor: el cliente no puede elegirla
    socket.join(salaVeterinaria(socket.data.veterinariaId));

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });
};

export const emitirAVeterinaria = (io: Server, veterinariaId: string, evento: string, data: unknown) => {
  io.to(salaVeterinaria(veterinariaId)).emit(evento, data);
};
