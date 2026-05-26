import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, turnosApi } from '../../../services/api';
import { Turno, EstadoTurno } from '../../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle, PlayCircle, ChevronRight, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalEditarTurno from '../../../components/ModalEditarTurno';

const estadoConfig: Record<EstadoTurno, { label: string; clase: string }> = {
  PENDIENTE:    { label: 'Pendiente',    clase: 'badge-yellow' },
  CONFIRMADO:   { label: 'Confirmado',   clase: 'badge-blue' },
  EN_CURSO:     { label: 'En curso',     clase: 'badge-purple' },
  COMPLETADO:   { label: 'Completado',   clase: 'badge-green' },
  CANCELADO:    { label: 'Cancelado',    clase: 'badge-red' },
  LISTA_ESPERA: { label: 'En espera',    clase: 'badge-gray' },
};

const tipoLabel: Record<string, string> = {
  CONSULTA_VETERINARIA: 'Consulta',
  CIRUGIA: 'Cirugía',
  VACUNACION: 'Vacunación',
  BANO: 'Baño',
  CORTE_PELO: 'Corte de pelo',
  PEINADO: 'Peinado',
  TRATAMIENTO_PULGAS: 'Antipulgas',
  LIMPIEZA_DENTAL: 'Limpieza dental',
  CORTE_UNAS: 'Corte de uñas',
  HIDRATACION_PELAJE: 'Hidratación',
  AROMATERAPIA: 'Aromaterapia',
  MASAJE: 'Masaje',
  GUARDERIA_DIARIA: 'Guardería',
  GUARDERIA_NOCTURNA: 'Guardería nocturna',
};

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇',
  HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

export default function TurnosHoy() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [turnoEditando, setTurnoEditando] = useState<any>(null);

  const { data: turnos = [], isLoading } = useQuery<Turno[]>({
    queryKey: ['turnos-hoy'],
    queryFn: dashboardApi.getTurnosHoy,
    refetchInterval: 30000,
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      turnosApi.actualizarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['turnos-hoy'] });
      qc.invalidateQueries({ queryKey: ['metricas'] });
      toast.success('Estado actualizado');
    },
  });

  const iniciarTurno = (turno: any) => {
    cambiarEstado.mutate({ id: turno.id, estado: 'EN_CURSO' });
    const mascotaId = turno.mascota?.id;
    if (mascotaId) navigate(`/mascotas/${mascotaId}`);
  };

  const pendientes  = turnos.filter(t => t.estado === 'PENDIENTE' || t.estado === 'CONFIRMADO');
  const enCurso    = turnos.filter(t => t.estado === 'EN_CURSO');
  const completados = turnos.filter(t => t.estado === 'COMPLETADO');

  // Orden de atención: correlativo por fecha de registro (createdAt)
  const ordenMap = new Map<string, number>();
  [...turnos]
    .sort((a, b) => new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime())
    .forEach((t, i) => ordenMap.set(t.id, i + 1));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Turnos de hoy
          <span className="ml-2 badge badge-blue">{turnos.length}</span>
        </h2>
        <a href="/agenda" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
          Ver agenda completa <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : turnos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No hay turnos para hoy</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {/* En curso primero */}
          {[...enCurso, ...pendientes, ...completados].map(turno => {
            const cfg = estadoConfig[turno.estado];
            const orden = ordenMap.get(turno.id) ?? '—';
            return (
              <div
                key={turno.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors
                  ${turno.estado === 'EN_CURSO'
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                {/* Número de orden */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${turno.estado === 'COMPLETADO'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : turno.estado === 'EN_CURSO'
                    ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  {orden}
                </div>

                {/* Hora */}
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {format(new Date(turno.fechaHora), 'HH:mm')}
                  </p>
                  <p className="text-xs text-gray-400">{turno.duracionMin}min</p>
                </div>

                {/* Mascota */}
                <div className="text-xl w-7 text-center flex-shrink-0">
                  {especieEmoji[(turno.mascota as any)?.especie || 'OTRO']}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(turno.mascota as any)?.nombre}
                    </p>
                    <span className={`badge ${cfg.clase}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {tipoLabel[turno.tipo] ?? turno.tipo} · {(turno.cliente as any)?.nombre} {(turno.cliente as any)?.apellido}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {(turno as any).profesional
                      ? `Dr/a. ${(turno as any).profesional.nombre} ${(turno as any).profesional.apellido}`
                      : 'Sin profesional asignado'}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setTurnoEditando(turno)}
                    className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {turno.estado !== 'COMPLETADO' && turno.estado !== 'CANCELADO' && (
                    <>
                      {turno.estado !== 'EN_CURSO' && (
                        <button
                          type="button"
                          onClick={() => iniciarTurno(turno)}
                          className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 text-purple-600 dark:text-purple-300 flex items-center justify-center transition-colors"
                          title="Iniciar turno"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => cambiarEstado.mutate({ id: turno.id, estado: 'COMPLETADO' })}
                        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-300 flex items-center justify-center transition-colors"
                        title="Completar"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarEstado.mutate({ id: turno.id, estado: 'CANCELADO' })}
                        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-300 flex items-center justify-center transition-colors"
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {turnoEditando && (
        <ModalEditarTurno
          turno={turnoEditando}
          onClose={() => setTurnoEditando(null)}
          onSuccess={() => setTurnoEditando(null)}
        />
      )}

      {/* Resumen */}
      {turnos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-600">{pendientes.length}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">{enCurso.length}</p>
            <p className="text-xs text-gray-500">En curso</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{completados.length}</p>
            <p className="text-xs text-gray-500">Completados</p>
          </div>
        </div>
      )}
    </div>
  );
}
