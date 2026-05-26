import { useForm } from 'react-hook-form';
import { turnosApi, clientesApi, mascotasApi } from '../../../services/api';
import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const TIPOS_TURNO = [
  { value: 'CONSULTA_VETERINARIA', label: 'Consulta veterinaria', grupo: 'Clínico' },
  { value: 'CIRUGIA', label: 'Cirugía', grupo: 'Clínico' },
  { value: 'VACUNACION', label: 'Vacunación', grupo: 'Clínico' },
  { value: 'BANO', label: 'Baño con secado', grupo: 'Estética' },
  { value: 'CORTE_PELO', label: 'Corte de pelo', grupo: 'Estética' },
  { value: 'PEINADO', label: 'Peinado y cepillado', grupo: 'Estética' },
  { value: 'TRATAMIENTO_PULGAS', label: 'Tratamiento antipulgas', grupo: 'Estética' },
  { value: 'LIMPIEZA_DENTAL', label: 'Limpieza dental', grupo: 'Estética' },
  { value: 'CORTE_UNAS', label: 'Corte de uñas', grupo: 'Estética' },
  { value: 'HIDRATACION_PELAJE', label: 'Hidratación de pelaje', grupo: 'Estética' },
  { value: 'AROMATERAPIA', label: 'Aromaterapia', grupo: 'Estética' },
  { value: 'MASAJE', label: 'Masaje relajante', grupo: 'Estética' },
  { value: 'GUARDERIA_DIARIA', label: 'Guardería diaria', grupo: 'Guardería' },
  { value: 'GUARDERIA_NOCTURNA', label: 'Guardería nocturna', grupo: 'Guardería' },
];

const DURACIONES = [15, 30, 45, 60, 90, 120, 180];

interface Props {
  fechaInicial: Date;
  onClose: () => void;
  onSuccess: () => void;
  turnoInicial?: any;
}

export default function ModalTurno({ fechaInicial, onClose, onSuccess, turnoInicial }: Props) {
  const [loading, setLoading] = useState(false);
  const [clienteId, setClienteId] = useState(turnoInicial?.clienteId || '');
  const [buscarCliente, setBuscarCliente] = useState('');

  const fechaStr = format(fechaInicial, "yyyy-MM-dd'T'HH:mm");

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: turnoInicial || {
      fechaHora: fechaStr,
      duracionMin: 30,
      tipo: 'CONSULTA_VETERINARIA',
    },
  });

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-buscar', buscarCliente],
    queryFn: () => clientesApi.listar({ buscar: buscarCliente }),
    enabled: buscarCliente.length >= 2,
  });

  const { data: mascotasData } = useQuery({
    queryKey: ['mascotas-cliente', clienteId],
    queryFn: () => mascotasApi.listar({ clienteId }),
    enabled: !!clienteId,
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await turnosApi.crear({ ...data, clienteId });
      toast.success('Turno confirmado correctamente');
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al crear turno');
    } finally {
      setLoading(false);
    }
  };

  const clienteSeleccionado = clientesData?.clientes?.find((c: any) => c.id === clienteId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo turno</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Búsqueda de cliente */}
          <div>
            <label className="label">Cliente *</label>
            {clienteSeleccionado ? (
              <div className="flex items-center justify-between p-2.5 border border-primary-300 dark:border-primary-700 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                </span>
                <button type="button" onClick={() => { setClienteId(''); setBuscarCliente(''); setValue('mascotaId', ''); }} className="text-xs text-red-500 hover:underline">Cambiar</button>
              </div>
            ) : (
              <>
                <input
                  value={buscarCliente}
                  onChange={e => setBuscarCliente(e.target.value)}
                  placeholder="Buscar cliente por nombre..."
                  className="input"
                />
                {clientesData?.clientes?.length > 0 && (
                  <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {clientesData.clientes.slice(0, 4).map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setClienteId(c.id); setBuscarCliente(''); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        {c.nombre} {c.apellido} · {c.telefono}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mascota */}
          <div>
            <label className="label">Mascota *</label>
            <select {...register('mascotaId', { required: true })} className="input" disabled={!clienteId}>
              <option value="">Seleccionar mascota...</option>
              {(mascotasData || []).map((m: any) => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.especie})</option>
              ))}
            </select>
          </div>

          {/* Tipo de turno */}
          <div>
            <label className="label">Tipo de servicio *</label>
            <select {...register('tipo', { required: true })} className="input">
              {['Clínico', 'Estética', 'Guardería'].map(grupo => (
                <optgroup key={grupo} label={grupo}>
                  {TIPOS_TURNO.filter(t => t.grupo === grupo).map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha y hora *</label>
              <input {...register('fechaHora', { required: true })} type="datetime-local" className="input" />
            </div>
            <div>
              <label className="label">Duración</label>
              <select {...register('duracionMin', { valueAsNumber: true })} className="input">
                {DURACIONES.map(d => (
                  <option key={d} value={d}>{d >= 60 ? `${d / 60}h` : `${d}min`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="label">Motivo / descripción</label>
            <textarea {...register('motivo')} className="input resize-none" rows={2} placeholder="Descripción del motivo del turno..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading || !clienteId} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
