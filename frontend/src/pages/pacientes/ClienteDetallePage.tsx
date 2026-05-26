import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '../../services/api';
import { ArrowLeft, Phone, Mail, MapPin, Plus, Edit, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import ModalCliente from './components/ModalCliente';
import ModalMascota from './components/ModalMascota';
import ModalTurnoRapido from '../../components/ModalTurnoRapido';
import toast from 'react-hot-toast';

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇',
  HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modalEditar, setModalEditar] = useState(false);
  const [modalMascota, setModalMascota] = useState(false);
  const [modalTurno, setModalTurno] = useState(false);

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesApi.obtener(id!),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!cliente) return <div>Cliente no encontrado</div>;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clientes')} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {cliente.nombre} {cliente.apellido}
          </h1>
          {cliente.dni && <p className="text-gray-500 text-sm">DNI: {cliente.dni}</p>}
        </div>
        <button type="button" onClick={() => setModalTurno(true)} className="btn-primary">
          <CalendarPlus className="w-4 h-4" /> Nuevo turno
        </button>
        <button type="button" onClick={() => setModalEditar(true)} className="btn-ghost">
          <Edit className="w-4 h-4" /> Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info del cliente */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Información de contacto
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{cliente.telefono}</span>
              </div>
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{cliente.email}</span>
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{cliente.direccion}, {cliente.ciudad}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cuenta corriente */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cuenta</h2>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Saldo</span>
              <span className={`font-semibold ${cliente.saldoCuenta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${cliente.saldoCuenta.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Fidelidad</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < cliente.fidelidad ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Notas */}
          {cliente.notas && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{cliente.notas}</p>
            </div>
          )}
        </div>

        {/* Mascotas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mascotas <span className="text-gray-400 font-normal text-base">({cliente.mascotas?.length || 0})</span>
            </h2>
            <button type="button" onClick={() => setModalMascota(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Agregar mascota
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(cliente.mascotas || []).map((m: any) => (
              <div
                key={m.id}
                className="card cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                onClick={() => navigate(`/mascotas/${m.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{especieEmoji[m.especie]}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{m.nombre}</p>
                    <p className="text-xs text-gray-500">{m.raza || m.especie}</p>
                  </div>
                  <span className={`ml-auto badge ${m.sexo === 'MACHO' ? 'badge-blue' : 'badge-purple'}`}>
                    {m.sexo === 'MACHO' ? '♂' : '♀'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {m.peso && <span>Peso: {m.peso}kg</span>}
                  {m.esterilizado && <span className="badge badge-green">Esterilizado/a</span>}
                  {m.alergias && <span className="badge badge-red">Alergias</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Últimos turnos */}
          {(cliente.turnos?.length > 0) && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Últimos turnos</h3>
              <div className="space-y-2">
                {cliente.turnos.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="text-gray-700 dark:text-gray-300">{t.mascota?.nombre} — {t.tipo.replace(/_/g, ' ')}</span>
                    <span className="text-gray-400">{new Date(t.fechaHora).toLocaleDateString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modalEditar && (
        <ModalCliente
          clienteInicial={cliente}
          onClose={() => setModalEditar(false)}
          onSuccess={() => {
            setModalEditar(false);
            qc.invalidateQueries({ queryKey: ['cliente', id] });
            toast.success('Cliente actualizado');
          }}
        />
      )}

      {modalMascota && (
        <ModalMascota
          clienteId={id!}
          onClose={() => setModalMascota(false)}
          onSuccess={() => {
            setModalMascota(false);
            qc.invalidateQueries({ queryKey: ['cliente', id] });
            toast.success('Mascota registrada');
          }}
        />
      )}

      {modalTurno && cliente && (
        <ModalTurnoRapido
          clienteInicial={{ id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido, telefono: cliente.telefono }}
          onClose={() => setModalTurno(false)}
          onSuccess={() => {
            setModalTurno(false);
            qc.invalidateQueries({ queryKey: ['cliente', id] });
          }}
        />
      )}
    </div>
  );
}
