import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { turnosApi, usuariosApi } from '../services/api';
import { useForm } from 'react-hook-form';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const TIPOS_TURNO = [
  { value: 'CONSULTA_VETERINARIA', label: 'Consulta veterinaria', grupo: 'Clínico' },
  { value: 'CIRUGIA',              label: 'Cirugía',               grupo: 'Clínico' },
  { value: 'VACUNACION',           label: 'Vacunación',            grupo: 'Clínico' },
  { value: 'BANO',                 label: 'Baño con secado',        grupo: 'Estética' },
  { value: 'CORTE_PELO',           label: 'Corte de pelo',          grupo: 'Estética' },
  { value: 'PEINADO',              label: 'Peinado y cepillado',    grupo: 'Estética' },
  { value: 'TRATAMIENTO_PULGAS',   label: 'Tratamiento antipulgas', grupo: 'Estética' },
  { value: 'LIMPIEZA_DENTAL',      label: 'Limpieza dental',        grupo: 'Estética' },
  { value: 'CORTE_UNAS',           label: 'Corte de uñas',          grupo: 'Estética' },
  { value: 'HIDRATACION_PELAJE',   label: 'Hidratación de pelaje',  grupo: 'Estética' },
  { value: 'AROMATERAPIA',         label: 'Aromaterapia',           grupo: 'Estética' },
  { value: 'MASAJE',               label: 'Masaje relajante',       grupo: 'Estética' },
  { value: 'GUARDERIA_DIARIA',     label: 'Guardería diaria',       grupo: 'Guardería' },
  { value: 'GUARDERIA_NOCTURNA',   label: 'Guardería nocturna',     grupo: 'Guardería' },
];

const DURACIONES = [15, 30, 45, 60, 90, 120, 180];

const ESTADOS = [
  { value: 'PENDIENTE',    label: 'Pendiente' },
  { value: 'CONFIRMADO',   label: 'Confirmado' },
  { value: 'EN_CURSO',     label: 'En curso' },
  { value: 'COMPLETADO',   label: 'Completado' },
  { value: 'CANCELADO',    label: 'Cancelado' },
  { value: 'LISTA_ESPERA', label: 'Lista de espera' },
];

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇',
  HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

interface Props {
  turno: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarTurno({ turno, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [conflictos, setConflictos] = useState<any[] | null>(null);
  const [datosGuardar, setDatosGuardar] = useState<any>(null);

  const fechaStr = format(new Date(turno.fechaHora), "yyyy-MM-dd'T'HH:mm");

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      tipo:          turno.tipo,
      fechaHora:     fechaStr,
      duracionMin:   turno.duracionMin ?? 30,
      motivo:        turno.motivo ?? '',
      notas:         turno.notas ?? '',
      estado:        turno.estado,
      profesionalId: turno.profesionalId ?? '',
    },
  });

  const { data: profesionales = [] } = useQuery<any[]>({
    queryKey: ['profesionales-activos'],
    queryFn: () => usuariosApi.listar({ activo: true }),
  });

  const guardarTurno = async (data: any) => {
    setLoading(true);
    try {
      await turnosApi.actualizar(turno.id, {
        tipo:          data.tipo,
        fechaHora:     data.fechaHora,
        duracionMin:   Number(data.duracionMin),
        motivo:        data.motivo || null,
        notas:         data.notas || null,
        estado:        data.estado,
        profesionalId: data.profesionalId || null,
      });
      qc.invalidateQueries({ queryKey: ['turnos-hoy'] });
      qc.invalidateQueries({ queryKey: ['calendario'] });
      qc.invalidateQueries({ queryKey: ['turno', turno.id] });
      toast.success('Turno actualizado');
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al actualizar turno');
    } finally {
      setLoading(false);
      setConflictos(null);
      setDatosGuardar(null);
    }
  };

  const onSubmit = async (data: any) => {
    // Verificar conflicto si cambiaron profesional o fecha/hora
    const profesionalCambio = data.profesionalId && data.profesionalId !== turno.profesionalId;
    const fechaCambio = data.fechaHora !== fechaStr;
    const duracionCambio = Number(data.duracionMin) !== turno.duracionMin;

    if (data.profesionalId && (profesionalCambio || fechaCambio || duracionCambio)) {
      setLoading(true);
      try {
        const resultado = await turnosApi.verificarConflicto({
          profesionalId: data.profesionalId,
          fechaHora:     data.fechaHora,
          duracionMin:   data.duracionMin,
          turnoId:       turno.id,
        });
        if (resultado.conflicto) {
          setConflictos(resultado.turnos);
          setDatosGuardar(data);
          setLoading(false);
          return;
        }
      } catch {
        // Si falla la verificación, continuar igual
      } finally {
        setLoading(false);
      }
    }
    await guardarTurno(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{especieEmoji[turno.mascota?.especie || 'OTRO']}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar turno — {turno.mascota?.nombre}
              </h2>
              <p className="text-sm text-gray-500">
                {turno.cliente?.nombre} {turno.cliente?.apellido}
                {turno.cliente?.telefono && ` · ${turno.cliente.telefono}`}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

          {/* Profesional */}
          <div>
            <label className="label">Profesional</label>
            <select {...register('profesionalId')} className="input">
              <option value="">Sin asignar</option>
              {profesionales.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} — {p.rol === 'VETERINARIO' ? 'Vet.' : p.rol === 'ESTILISTA' ? 'Estilista' : p.rol}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
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

          {/* Fecha/hora + duración */}
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

          {/* Estado */}
          <div>
            <label className="label">Estado</label>
            <select {...register('estado')} className="input">
              {ESTADOS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="label">Motivo</label>
            <textarea {...register('motivo')} className="input resize-none" rows={2} placeholder="Motivo de la consulta..." />
          </div>

          {/* Notas internas */}
          <div>
            <label className="label">Notas internas</label>
            <textarea {...register('notas')} className="input resize-none" rows={2} placeholder="Observaciones internas..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {/* Popup conflicto */}
      {conflictos && conflictos.length > 0 && datosGuardar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Solapamiento de horario</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  El profesional ya tiene {conflictos.length === 1 ? 'un turno' : 'turnos'} en ese horario:
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {conflictos.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <span className="text-xl">{especieEmoji[t.mascota?.especie] ?? '🐾'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t.mascota?.nombre}
                      <span className="font-normal text-gray-500 ml-1">— {t.cliente?.nombre} {t.cliente?.apellido}</span>
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      {format(new Date(t.fechaHora), 'HH:mm', { locale: es })} · {t.duracionMin}min · {t.estado}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              ¿Querés guardar de todas formas (doble agenda) o modificar los datos?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setConflictos(null); setDatosGuardar(null); }}
                className="btn-ghost flex-1 justify-center"
              >
                Modificar datos
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => guardarTurno(datosGuardar)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar igual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
