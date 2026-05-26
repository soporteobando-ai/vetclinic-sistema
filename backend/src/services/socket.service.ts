import { Server } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    socket.on('unirse-sala', (sala: string) => {
      socket.join(sala);
    });

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });
};

export const emitirActualizacion = (io: Server, sala: string, evento: string, data: any) => {
  io.to(sala).emit(evento, data);
};
