import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '../types';
import api from '../services/api';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  modoOscuro: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  toggleModoOscuro: () => void;
  tienePermiso: (codigo: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      modoOscuro: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        set({ usuario: data.usuario, token: data.token });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ usuario: null, token: null });
      },

      toggleModoOscuro: () => {
        set(state => {
          const nuevoModo = !state.modoOscuro;
          document.documentElement.classList.toggle('dark', nuevoModo);
          return { modoOscuro: nuevoModo };
        });
      },

      tienePermiso: (codigo: string) => {
        const { usuario } = get();
        if (!usuario) return false;
        if (usuario.esAdmin) return true;
        return usuario.permisos?.includes(codigo) ?? false;
      },
    }),
    {
      name: 'vetclinic-auth',
      partialize: (state) => ({ usuario: state.usuario, token: state.token, modoOscuro: state.modoOscuro }),
    }
  )
);
