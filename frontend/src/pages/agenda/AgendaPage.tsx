import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turnosApi } from '../../services/api';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Turno, EstadoTurno } from '../../types';
import ModalTurnoRapido from '../../components/ModalTurnoRapido';
import ModalEditarTurno from '../../components/ModalEditarTurno';
import toast from 'react-hot-toast';

const HORAS = Array.from({ length: 13 }, (_, i) => i + 8);

const estadoColor: Record<EstadoTurno, string> = {
  PENDIENTE:    'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300',
  CONFIRMADO:   'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
  EN_CURSO:     'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
  COMPLETADO:   'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
  CANCELADO:    'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
  LISTA_ESPERA: 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
};

const estadoBadge: Record<EstadoTurno, string> = {
  PENDIENTE:    'bg-yellow-100 text-yellow-700',
  CONFIRMADO:   'bg-blue-100 text-blue-700',
  EN_CURSO:     'bg-purple-100 text-purple-700',
  COMPLETADO:   'bg-green-100 text-green-700',
  CANCELADO:    'bg-red-100 text-red-700',
  LISTA_ESPERA: 'bg-gray-100 text-gray-600',
};

const tipoLabel: Record<string, string> = {
  CONSULTA_VETERINARIA: 'Consulta', CIRUGIA: 'Cirugía', VACUNACION: 'Vacunación',
  BANO: 'Baño', CORTE_PELO: 'Corte', PEINADO: 'Peinado',
  TRATAMIENTO_PULGAS: 'Antipulgas', LIMPIEZA_DENTAL: 'Limpieza dental',
  CORTE_UNAS: 'Uñas', HIDRATACION_PELAJE: 'Hidratación',
  AROMATERAPIA: 'Aromaterapia', MASAJE: 'Masaje',
  GUARDERIA_DIARIA: 'Guardería', GUARDERIA_NOCTURNA: 'Guardería noche',
};

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇', HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

export default function AgendaPage() {
  const isMobile = window.innerWidth < 1024;
  const [vista, setVista] = useState<'semana' | 'dia'>(isMobile ? 'dia' : 'semana');
  const [fechaBase, setFechaBase] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date());
  const [modalNuevo, setModalNuevo] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState<any>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const qc = useQueryClient();

  const inicioSemana = startOfWeek(fechaBase, { weekStartsOn: 1 });
  const finSemana = endOfWeek(fechaBase, { weekStartsOn: 1 });
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));

  // Adaptar vista al cambiar tamaño de pantalla
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 1024) setVista('dia');
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const { data: turnos = [] } = useQuery<Turno[]>({
    queryKey: ['calendario', inicioSemana.toISOString(), finSemana.toISOString()],
    queryFn: () => turnosApi.calendario(inicioSemana.toISOString(), finSemana.toISOString()),
    refetchInterval: 30000,
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => turnosApi.actualizarEstado(id, estado),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendario'] }); toast.success('Estado actualizado'); },
  });

  const turnosDelDia = (dia: Date) =>
    turnos.filter(t => isSameDay(new Date(t.fechaHora), dia))
          .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

  const navegarSemana = (dir: number) => {
    const nueva = addDays(fechaBase, dir * 7);
    setFechaBase(nueva);
    if (vista === 'dia') setDiaSeleccionado(addDays(diaSeleccionado, dir * 7));
  };
  const navegarDia = (dir: number) => {
    const nuevo = addDays(diaSeleccionado, dir);
    setDiaSeleccionado(nuevo);
    setFechaBase(nuevo);
  };

  const turnosDiaActual = turnosDelDia(diaSeleccionado);

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-shrink-0 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>
          <p className="text-xs sm:text-sm text-gray-500 capitalize">
            {vista === 'dia'
              ? format(diaSeleccionado, "EEEE d 'de' MMMM, yyyy", { locale: es })
              : `${format(inicioSemana, "d 'de' MMMM", { locale: es })} — ${format(finSemana, "d 'de' MMMM, yyyy", { locale: es })}`
            }
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Semana / Día — oculto en mobile (forzado a día) */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setVista('semana')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${vista === 'semana' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setVista('dia')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${vista === 'dia' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
            >
              Día
            </button>
          </div>

          {/* Navegación */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => vista === 'dia' ? navegarDia(-1) : navegarSemana(-1)}
              className="btn-ghost px-2 py-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setFechaBase(new Date()); setDiaSeleccionado(new Date()); }}
              className="btn-ghost text-xs sm:text-sm px-2 sm:px-3 py-1.5"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => vista === 'dia' ? navegarDia(1) : navegarSemana(1)}
              className="btn-ghost px-2 py-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setFechaSeleccionada(diaSeleccionado); setModalNuevo(true); }}
            className="btn-primary text-sm px-3 py-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo turno</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* ───── VISTA DÍA (mobile + opción desktop) ───── */}
      {vista === 'dia' && (
        <div className="flex flex-col gap-3 flex-1">
          {/* Selector de días — scroll horizontal */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0 -mx-1 px-1">
            {diasSemana.map(dia => {
              const esHoy = isSameDay(dia, new Date());
              const esSeleccionado = isSameDay(dia, diaSeleccionado);
              const cant = turnosDelDia(dia).length;
              return (
                <button
                  type="button"
                  key={dia.toISOString()}
                  onClick={() => setDiaSeleccionado(dia)}
                  className={`flex flex-col items-center flex-shrink-0 w-12 py-2 rounded-xl transition-colors
                    ${esSeleccionado
                      ? 'bg-primary-600 text-white'
                      : esHoy
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  <span className="text-xs font-medium uppercase">{format(dia, 'EEE', { locale: es })}</span>
                  <span className="text-lg font-bold leading-none mt-0.5">{format(dia, 'd')}</span>
                  {cant > 0 && (
                    <span className={`text-xs mt-0.5 font-medium ${esSeleccionado ? 'text-white/80' : 'text-primary-500'}`}>
                      {cant}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lista de turnos del día */}
          <div className="card p-0 overflow-hidden flex-1">
            {turnosDiaActual.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Clock className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Sin turnos para este día</p>
                <button
                  type="button"
                  onClick={() => { setFechaSeleccionada(diaSeleccionado); setModalNuevo(true); }}
                  className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  + Agregar turno
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {turnosDiaActual.map(turno => (
                  <div
                    key={turno.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Hora */}
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {format(new Date(turno.fechaHora), 'HH:mm')}
                      </p>
                      <p className="text-xs text-gray-400">{turno.duracionMin}min</p>
                    </div>

                    {/* Emoji especie */}
                    <div className="text-xl w-7 text-center flex-shrink-0">
                      {especieEmoji[(turno.mascota as any)?.especie || 'OTRO']}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {(turno.mascota as any)?.nombre}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[turno.estado]}`}>
                          {turno.estado.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {tipoLabel[turno.tipo] ?? turno.tipo} · {(turno.cliente as any)?.nombre} {(turno.cliente as any)?.apellido}
                      </p>
                      {(turno as any).profesional && (
                        <p className="text-xs text-gray-400">
                          Dr/a. {(turno as any).profesional.nombre} {(turno as any).profesional.apellido}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <button
                      type="button"
                      onClick={() => setTurnoEditando(turno)}
                      className="flex-shrink-0 text-xs text-primary-600 dark:text-primary-400 hover:underline px-2"
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── VISTA SEMANA (solo desktop) ───── */}
      {vista === 'semana' && (
        <div className="card p-0 overflow-hidden flex-1 flex flex-col hidden lg:flex">
          {/* Encabezado días */}
          <div className="grid border-b border-gray-200 dark:border-gray-800 [grid-template-columns:64px_repeat(7,1fr)]">
            <div className="border-r border-gray-100 dark:border-gray-800" />
            {diasSemana.map(dia => {
              const esHoy = isSameDay(dia, new Date());
              const cantTurnos = turnosDelDia(dia).length;
              return (
                <div
                  key={dia.toISOString()}
                  className={`p-3 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${esHoy ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                  onClick={() => { setFechaSeleccionada(dia); setModalNuevo(true); }}
                >
                  <p className={`text-xs font-medium uppercase ${esHoy ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                    {format(dia, 'EEE', { locale: es })}
                  </p>
                  <p className={`text-xl font-bold mt-0.5 ${esHoy ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                    {format(dia, 'd')}
                  </p>
                  {cantTurnos > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-primary-500 text-white mt-0.5">
                      {cantTurnos}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grilla horaria */}
          <div className="overflow-y-auto flex-1">
            <div className="grid min-h-full [grid-template-columns:64px_repeat(7,1fr)]">
              <div className="border-r border-gray-100 dark:border-gray-800">
                {HORAS.map(h => (
                  <div key={h} className="h-20 border-b border-gray-50 dark:border-gray-800/50 flex items-start justify-end pr-2 pt-1">
                    <span className="text-xs text-gray-400">{h}:00</span>
                  </div>
                ))}
              </div>
              {diasSemana.map(dia => {
                const esHoy = isSameDay(dia, new Date());
                const turnosDia = turnosDelDia(dia);
                return (
                  <div
                    key={dia.toISOString()}
                    className={`border-r border-gray-100 dark:border-gray-800 last:border-0 relative ${esHoy ? 'bg-primary-50/30 dark:bg-primary-900/5' : ''}`}
                  >
                    {HORAS.map(h => (
                      <div key={h} className="h-20 border-b border-gray-50 dark:border-gray-800/50" />
                    ))}
                    <div className="absolute inset-0 p-1">
                      {turnosDia.map(turno => {
                        const hora = new Date(turno.fechaHora).getHours();
                        const min = new Date(turno.fechaHora).getMinutes();
                        const top = ((hora - 8) * 80) + (min / 60 * 80);
                        const height = Math.max(((turno.duracionMin || 30) / 60) * 80 - 4, 20);
                        return (
                          <div
                            key={turno.id}
                            className={`absolute left-1 right-1 rounded border-l-2 px-1.5 py-1 text-xs overflow-hidden cursor-pointer hover:z-10 hover:shadow-md transition-shadow ${estadoColor[turno.estado]}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            title={`${(turno.mascota as any)?.nombre} — ${tipoLabel[turno.tipo]}`}
                            onClick={() => setTurnoEditando(turno)}
                          >
                            <p className="font-semibold truncate">
                              {especieEmoji[(turno.mascota as any)?.especie || 'OTRO']} {(turno.mascota as any)?.nombre}
                            </p>
                            {height > 35 && <p className="truncate opacity-80">{tipoLabel[turno.tipo]}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {modalNuevo && (
        <ModalTurnoRapido
          fechaInicial={fechaSeleccionada || diaSeleccionado}
          onClose={() => setModalNuevo(false)}
          onSuccess={() => {
            setModalNuevo(false);
            qc.invalidateQueries({ queryKey: ['calendario'] });
          }}
        />
      )}

      {turnoEditando && (
        <ModalEditarTurno
          turno={turnoEditando}
          onClose={() => setTurnoEditando(null)}
          onSuccess={() => {
            setTurnoEditando(null);
            qc.invalidateQueries({ queryKey: ['calendario'] });
          }}
        />
      )}
    </div>
  );
}
