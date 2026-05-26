import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { esteticaApi } from '../../services/api';
import { ServicioEstetica, EstadoGrooming } from '../../types';
import { Scissors, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNAS: { estado: EstadoGrooming; titulo: string; color: string; icono: React.ElementType }[] = [
  { estado: 'EN_COLA',        titulo: 'En cola',           color: 'yellow', icono: Clock },
  { estado: 'EN_PROCESO',     titulo: 'En proceso',        color: 'purple', icono: Scissors },
  { estado: 'LISTO_RETIRAR',  titulo: 'Listo para retirar', color: 'green', icono: CheckCircle },
];

const coloresKanban: Record<string, { header: string; card: string; badge: string }> = {
  yellow: {
    header: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    card:   'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
    badge:  'badge-yellow',
  },
  purple: {
    header: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    card:   'bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
    badge:  'badge-purple',
  },
  green: {
    header: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    card:   'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
    badge:  'badge-green',
  },
};

const SERVICIOS_LABEL: Record<string, string> = {
  // Claves del tipo de turno
  BANO: 'Baño', CORTE_PELO: 'Corte', PEINADO: 'Peinado',
  TRATAMIENTO_PULGAS: 'Antipulgas', LIMPIEZA_DENTAL: 'Limpieza dental',
  CORTE_UNAS: 'Uñas', HIDRATACION_PELAJE: 'Hidratación',
  AROMATERAPIA: 'Aromaterapia', MASAJE: 'Masaje',
  // Claves heredadas
  BANO_SECADO: 'Baño', CORTE_ESTANDAR: 'Corte', CORTE_RAZA: 'Corte raza',
  PEINADO_CEPILLADO: 'Peinado', LIMPIEZA_OIDOS: 'Oídos',
  ANTIPULGAS_GARRAPATAS: 'Antipulgas', HIDRATACION_BRILLO: 'Hidratación',
  PERFUMADO_MOÑO: 'Perfumado', TINTURA_PELAJE: 'Tintura',
  MASAJE_RELAJANTE: 'Masaje', TRATAMIENTO_PIEL: 'Piel',
};

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇', HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

export default function EsteticaPage() {
  const qc = useQueryClient();

  const { data: servicios = [], isLoading } = useQuery<ServicioEstetica[]>({
    queryKey: ['estetica'],
    queryFn: () => esteticaApi.listar(),
    refetchInterval: 15000,
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoGrooming }) =>
      esteticaApi.actualizarEstado(id, estado),
    onSuccess: (_, { estado }) => {
      qc.invalidateQueries({ queryKey: ['estetica'] });
      if (estado === 'LISTO_RETIRAR') toast.success('¡Mascota lista para retirar! 🐾', { duration: 5000 });
      else toast.success('Estado actualizado');
    },
  });

  const siguienteEstado: Record<EstadoGrooming, EstadoGrooming | null> = {
    EN_COLA: 'EN_PROCESO',
    EN_PROCESO: 'LISTO_RETIRAR',
    LISTO_RETIRAR: 'RETIRADO',
    RETIRADO: null,
  };

  const porColumna = (estado: EstadoGrooming) =>
    servicios.filter(s => s.estadoGrooming === estado);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-6 h-6 text-primary-600" />
            Estética & Grooming
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {servicios.filter(s => s.estadoGrooming !== 'RETIRADO').length} mascotas en proceso
          </p>
        </div>
      </div>

      {/* Tablero Kanban */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {COLUMNAS.map(({ estado, titulo, color, icono: Icono }) => {
            const items = porColumna(estado);
            const cfg = coloresKanban[color];

            return (
              <div key={estado} className="flex flex-col min-h-0">
                {/* Header columna */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl border ${cfg.header}`}>
                  <Icono className="w-4 h-4" />
                  <h2 className="font-semibold text-sm">{titulo}</h2>
                  <span className={`ml-auto badge ${cfg.badge}`}>{items.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 p-3 space-y-3">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Sin mascotas aquí
                    </div>
                  ) : (
                    items.map(s => (
                      <div
                        key={s.id}
                        className={`border rounded-xl p-4 space-y-3 ${cfg.card}`}
                      >
                        {/* Info mascota */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{especieEmoji[s.mascota?.especie || 'OTRO']}</span>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{s.mascota?.nombre}</p>
                              <p className="text-xs text-gray-500">{s.mascota?.raza || s.mascota?.especie}</p>
                            </div>
                          </div>
                          {s.estilista && (
                            <span className="badge badge-gray text-xs">
                              {s.estilista.nombre}
                            </span>
                          )}
                        </div>

                        {/* Dueño */}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          👤 {s.turno?.cliente?.nombre} {s.turno?.cliente?.apellido}
                          {s.turno?.cliente?.telefono && ` · ${s.turno.cliente.telefono}`}
                        </p>

                        {/* Servicios */}
                        <div className="flex flex-wrap gap-1">
                          {(s.servicios || []).map(sv => (
                            <span key={sv} className="badge badge-blue text-xs">
                              {SERVICIOS_LABEL[sv] || sv}
                            </span>
                          ))}
                        </div>

                        {/* Observaciones */}
                        {s.observaciones && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">{s.observaciones}</p>
                        )}

                        {/* Botón avanzar */}
                        {siguienteEstado[s.estadoGrooming] && (
                          <button
                            type="button"
                            onClick={() => cambiarEstado.mutate({
                              id: s.id,
                              estado: siguienteEstado[s.estadoGrooming]!,
                            })}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            {estado === 'EN_COLA' && 'Iniciar proceso'}
                            {estado === 'EN_PROCESO' && 'Marcar como listo'}
                            {estado === 'LISTO_RETIRAR' && 'Registrar retiro'}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Retirados del día */}
      {servicios.filter(s => s.estadoGrooming === 'RETIRADO').length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Retirados hoy ({servicios.filter(s => s.estadoGrooming === 'RETIRADO').length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {servicios.filter(s => s.estadoGrooming === 'RETIRADO').map(s => (
              <span key={s.id} className="badge badge-green">
                {especieEmoji[s.mascota?.especie || 'OTRO']} {s.mascota?.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
