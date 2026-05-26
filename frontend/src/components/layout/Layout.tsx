import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar sidebar al navegar en mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    socket.on('turno:nuevo', (turno) => {
      toast.success(`Nuevo turno: ${turno.mascota?.nombre} — ${turno.cliente?.nombre}`);
    });
    socket.on('grooming:listo', () => {
      toast.success('¡Mascota lista para retirar!', { icon: '✂️' });
    });
    socket.on('stock:alerta', ({ nombre, stock }) => {
      toast(`⚠️ Stock bajo: ${nombre} (${stock} unidades)`, {
        style: { background: '#fef3c7', color: '#92400e' },
      });
    });
    return () => { socket.off(); };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Overlay backdrop — solo mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
