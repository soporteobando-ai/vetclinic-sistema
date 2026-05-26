import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, PawPrint, Calendar,
  Scissors, Package, Receipt, BarChart3, Heart, UserCog, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',     roles: ['ADMIN','VETERINARIO','RECEPCIONISTA','ESTILISTA'] },
  { to: '/clientes',      icon: Users,           label: 'Clientes',      roles: ['ADMIN','VETERINARIO','RECEPCIONISTA'] },
  { to: '/mascotas',      icon: PawPrint,        label: 'Mascotas',      roles: ['ADMIN','VETERINARIO','RECEPCIONISTA','ESTILISTA'] },
  { to: '/agenda',        icon: Calendar,        label: 'Agenda',        roles: ['ADMIN','VETERINARIO','RECEPCIONISTA','ESTILISTA'] },
  { to: '/estetica',      icon: Scissors,        label: 'Estética',      roles: ['ADMIN','ESTILISTA','RECEPCIONISTA'] },
  { to: '/inventario',    icon: Package,         label: 'Inventario',    roles: ['ADMIN','RECEPCIONISTA','VETERINARIO'] },
  { to: '/facturacion',   icon: Receipt,         label: 'Facturación',   roles: ['ADMIN','RECEPCIONISTA'] },
  { to: '/profesionales', icon: UserCog,         label: 'Profesionales', roles: ['ADMIN'] },
  { to: '/reportes',      icon: BarChart3,       label: 'Reportes',      roles: ['ADMIN'] },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const { usuario, logout } = useAuthStore();

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex-shrink-0 bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo + botón cerrar mobile */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-base leading-none">VetClinic</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sistema Veterinario</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems
          .filter(item => !usuario?.rol || item.roles.includes(usuario.rol))
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Usuario */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {usuario?.nombre} {usuario?.apellido}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {usuario?.rol?.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
