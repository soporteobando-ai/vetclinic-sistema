import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '../../services/api';
import { Cliente } from '../../types';
import { UserPlus, Search, Phone, Mail, PawPrint, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ModalCliente from './components/ModalCliente';

export default function ClientesPage() {
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', buscar],
    queryFn: () => clientesApi.listar({ buscar }),
  });

  const clientes: Cliente[] = data?.clientes || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {data?.total || 0} clientes registrados
          </p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="btn-primary text-sm">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo cliente</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono o DNI..."
          className="input pl-9"
        />
      </div>

      {/* ── TABLA — visible desde md ── */}
      <div className="card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wider">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wider">Contacto</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wider">Mascotas</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wider">Fidelidad</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[1,2,3,4,5].map(j => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : clientes.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      No se encontraron clientes
                    </td>
                  </tr>
                )
                : clientes.map(cliente => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clientes/${cliente.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {cliente.nombre[0]}{cliente.apellido[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {cliente.nombre} {cliente.apellido}
                          </p>
                          {cliente.dni && <p className="text-xs text-gray-400">DNI: {cliente.dni}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" /> {cliente.telefono}
                      </p>
                      {cliente.email && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 flex-shrink-0" /> {cliente.email}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(cliente.mascotas || []).slice(0, 3).map(m => (
                          <span key={m.id} className="badge badge-blue flex items-center gap-1">
                            <PawPrint className="w-2.5 h-2.5" /> {m.nombre}
                          </span>
                        ))}
                        {(cliente.mascotas?.length || 0) > 3 && (
                          <span className="badge badge-gray">+{(cliente.mascotas?.length || 0) - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < Math.min(cliente.fidelidad, 5) ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TARJETAS — visible solo en mobile ── */}
      <div className="md:hidden space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))
          : clientes.length === 0
          ? (
            <div className="text-center py-12 text-gray-400">
              <p>No se encontraron clientes</p>
            </div>
          )
          : clientes.map(cliente => (
            <div
              key={cliente.id}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-3"
              onClick={() => navigate(`/clientes/${cliente.id}`)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {cliente.nombre[0]}{cliente.apellido[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {cliente.nombre} {cliente.apellido}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                  <Phone className="w-3 h-3 flex-shrink-0" /> {cliente.telefono}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(cliente.mascotas || []).slice(0, 2).map(m => (
                    <span key={m.id} className="badge badge-blue text-xs flex items-center gap-0.5">
                      <PawPrint className="w-2 h-2" /> {m.nombre}
                    </span>
                  ))}
                  {(cliente.mascotas?.length || 0) > 2 && (
                    <span className="badge badge-gray text-xs">+{(cliente.mascotas?.length || 0) - 2}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          ))}
      </div>

      {modalAbierto && (
        <ModalCliente
          onClose={() => setModalAbierto(false)}
          onSuccess={() => {
            setModalAbierto(false);
            qc.invalidateQueries({ queryKey: ['clientes'] });
            toast.success('Cliente registrado');
          }}
        />
      )}
    </div>
  );
}
