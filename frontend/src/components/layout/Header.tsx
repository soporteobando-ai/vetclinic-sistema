import { Bell, Moon, Sun, LogOut, Menu, CalendarPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ModalTurnoRapido from '../ModalTurnoRapido';

interface Props {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: Props) {
  const { logout, modoOscuro, toggleModoOscuro } = useAuthStore();
  const navigate = useNavigate();
  const [modalTurno, setModalTurno] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-14 lg:h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 gap-3">
        {/* Hamburger — solo mobile */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo text mobile */}
        <span className="lg:hidden font-bold text-gray-900 dark:text-white text-base">VetClinic</span>

        {/* Spacer para alinear acciones a la derecha en mobile */}
        <div className="flex-1 lg:flex-initial" />

        {/* Acciones */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setModalTurno(true)}
            title="Nuevo turno"
            className="flex items-center gap-1.5 px-2.5 lg:px-3 h-9 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
          >
            <CalendarPlus className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Nuevo turno</span>
          </button>

          <button
            type="button"
            onClick={toggleModoOscuro}
            title={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {modoOscuro ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            type="button"
            title="Notificaciones"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {modalTurno && (
        <ModalTurnoRapido onClose={() => setModalTurno(false)} />
      )}
    </>
  );
}
