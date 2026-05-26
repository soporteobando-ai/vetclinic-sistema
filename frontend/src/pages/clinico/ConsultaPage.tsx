import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { turnosApi, consultasApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Loader2, Stethoscope, Pill, FileText, Syringe, Printer, MessageCircle, Pencil, Trash2, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇', HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

const formatFechaInput = (iso?: string | null) => (iso ? iso.split('T')[0] : '');

export default function ConsultaPage() {
  const { turnoId } = useParams<{ turnoId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [tab, setTab] = useState<'examen' | 'recetas' | 'estudios' | 'vacunas'>('examen');
  const [guardando, setGuardando] = useState(false);
  const [consultaId, setConsultaId] = useState<string | null>(null);

  const { data: turno } = useQuery({
    queryKey: ['turno', turnoId],
    queryFn: () => turnosApi.obtener(turnoId!),
  });

  const { register, handleSubmit, reset } = useForm();

  // Cargar datos de consulta existente al montar
  useEffect(() => {
    if (!turno) return;
    if (turno.consulta) {
      setConsultaId(turno.consulta.id);
      reset({
        motivo: turno.consulta.motivo || turno.motivo || '',
        sintomas: turno.consulta.sintomas || '',
        exploracionFisica: turno.consulta.exploracionFisica || '',
        temperatura: turno.consulta.temperatura ?? '',
        frecuenciaCardiaca: turno.consulta.frecuenciaCardiaca ?? '',
        frecuenciaRespiratoria: turno.consulta.frecuenciaRespiratoria ?? '',
        pesoConsulta: turno.consulta.pesoConsulta ?? '',
        diagnosticoDiferencial: turno.consulta.diagnosticoDiferencial || '',
        diagnosticoDefinitivo: turno.consulta.diagnosticoDefinitivo || '',
        planTratamiento: turno.consulta.planTratamiento || '',
        observaciones: turno.consulta.observaciones || '',
        proximoControl: formatFechaInput(turno.consulta.proximoControl),
      });
    } else {
      reset({ motivo: turno.motivo || '' });
    }
  }, [turno, reset]);

  const guardarConsulta = async (data: any) => {
    if (!turno || !usuario) return;
    setGuardando(true);
    try {
      if (consultaId) {
        await consultasApi.actualizar(consultaId, data);
        toast.success('Consulta actualizada');
      } else {
        const consulta = await consultasApi.crear({
          turnoId,
          mascotaId: turno.mascotaId,
          veterinarioId: usuario.id,
          ...data,
        });
        setConsultaId(consulta.id);
        toast.success('Consulta guardada');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al guardar consulta');
    } finally {
      setGuardando(false);
    }
  };

  const completar = async () => {
    if (!consultaId) return toast.error('Primero guardá la consulta');
    try {
      await consultasApi.completar(consultaId);
      toast.success('Consulta completada');
      navigate(-1);
    } catch {
      toast.error('Error al completar consulta');
    }
  };

  if (!turno) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost" aria-label="Volver">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="text-3xl">{especieEmoji[turno.mascota?.especie || 'OTRO']}</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Consulta — {turno.mascota?.nombre}
            </h1>
            <p className="text-sm text-gray-500">
              {turno.cliente?.nombre} {turno.cliente?.apellido} · {turno.cliente?.telefono}
            </p>
          </div>
        </div>
        <button type="button" onClick={completar} className="btn-primary">
          Completar consulta
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-0">
          {[
            { key: 'examen', label: 'Examen clínico', icon: Stethoscope },
            { key: 'recetas', label: 'Recetas', icon: Pill },
            { key: 'estudios', label: 'Estudios', icon: FileText },
            { key: 'vacunas', label: 'Vacunas', icon: Syringe },
          ].map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => setTab(key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Examen clínico */}
      {tab === 'examen' && (
        <form onSubmit={handleSubmit(guardarConsulta)} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label">Motivo de consulta *</label>
                <textarea {...register('motivo', { required: true })} className="input resize-none" rows={2} placeholder="Motivo de la visita..." />
              </div>
              <div>
                <label className="label">Síntomas</label>
                <textarea {...register('sintomas')} className="input resize-none" rows={3} placeholder="Descripción de los síntomas observados..." />
              </div>
              <div>
                <label className="label">Exploración física</label>
                <textarea {...register('exploracionFisica')} className="input resize-none" rows={4} placeholder="Mucosas, linfoganglios, auscultación, abdomen, locomotor..." />
              </div>
            </div>

            <div className="space-y-4">
              <div className="card bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3">Constantes vitales</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Temperatura (°C)</label>
                    <input {...register('temperatura', { valueAsNumber: true })} type="number" step="0.1" className="input" placeholder="38.5" />
                  </div>
                  <div>
                    <label className="label text-xs">FC (lpm)</label>
                    <input {...register('frecuenciaCardiaca', { valueAsNumber: true })} type="number" className="input" placeholder="80" />
                  </div>
                  <div>
                    <label className="label text-xs">FR (rpm)</label>
                    <input {...register('frecuenciaRespiratoria', { valueAsNumber: true })} type="number" className="input" placeholder="20" />
                  </div>
                  <div>
                    <label className="label text-xs">Peso (kg)</label>
                    <input {...register('pesoConsulta', { valueAsNumber: true })} type="number" step="0.1" className="input" placeholder="12.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Diagnóstico diferencial</label>
                <textarea {...register('diagnosticoDiferencial')} className="input resize-none" rows={2} placeholder="Posibles diagnósticos..." />
              </div>
              <div>
                <label className="label">Diagnóstico definitivo</label>
                <input {...register('diagnosticoDefinitivo')} className="input" placeholder="Diagnóstico principal" />
              </div>
              <div>
                <label className="label">Plan de tratamiento</label>
                <textarea {...register('planTratamiento')} className="input resize-none" rows={3} placeholder="Tratamiento indicado..." />
              </div>
              <div>
                <label className="label">Próximo control</label>
                <input {...register('proximoControl')} type="date" className="input" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Observaciones adicionales</label>
            <textarea {...register('observaciones')} className="input resize-none" rows={2} placeholder="Notas adicionales..." />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              {consultaId ? 'Guardar cambios' : 'Guardar consulta'}
            </button>
          </div>
        </form>
      )}

      {/* Recetas */}
      {tab === 'recetas' && (
        <div className="space-y-4">
          {!consultaId && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
              Primero guardá la consulta para poder agregar recetas.
            </div>
          )}
          <RecetaForm consultaId={consultaId} turno={turno} veterinario={usuario} />
        </div>
      )}

      {/* Estudios */}
      {tab === 'estudios' && (
        <div className="space-y-4">
          {!consultaId && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
              Primero guardá la consulta para poder agregar estudios.
            </div>
          )}
          <EstudioForm consultaId={consultaId} turno={turno} veterinario={usuario} />
        </div>
      )}

      {/* Vacunas */}
      {tab === 'vacunas' && turno && (
        <VacunaForm mascotaId={turno.mascotaId} veterinarioId={usuario?.id} />
      )}
    </div>
  );
}

// Sub-componente Receta
function RecetaForm({ consultaId, turno, veterinario }: { consultaId: string | null; turno: any; veterinario: any }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const { data: consulta } = useQuery({
    queryKey: ['consulta', consultaId],
    queryFn: () => consultasApi.obtener(consultaId!),
    enabled: !!consultaId,
  });

  const recetas: any[] = consulta?.recetas || [];

  const invalidar = () => qc.invalidateQueries({ queryKey: ['consulta', consultaId] });

  const imprimirReceta = (receta: any) => {
    const fecha = format(new Date(), 'dd/MM/yyyy', { locale: es });
    const w = window.open('', '_blank', 'width=700,height=900');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receta - ${receta.medicamento}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:600px;margin:0 auto}
        h1{font-size:22px;margin:0 0 4px}.sub{color:#555;font-size:13px;margin-bottom:24px}
        .divider{border-top:2px solid #111;margin:16px 0}
        .label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
        .value{font-size:15px;font-weight:600;margin-bottom:12px}
        .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
        .footer{margin-top:40px;border-top:1px solid #ccc;padding-top:16px;font-size:12px;color:#666}
        @media print{body{padding:20px}}
      </style></head><body>
      <h1>VetClinic — Receta Veterinaria</h1><p class="sub">Fecha: ${fecha}</p>
      <div class="divider"></div>
      <p class="label">Paciente</p><p class="value">${turno?.mascota?.nombre || ''} (${turno?.mascota?.especie || ''})</p>
      <p class="label">Propietario</p><p class="value">${turno?.cliente?.nombre || ''} ${turno?.cliente?.apellido || ''}</p>
      <div class="divider"></div>
      <p class="label">Medicamento</p><p class="value">${receta.medicamento}${receta.principioActivo ? ` — ${receta.principioActivo}` : ''}</p>
      <div class="grid">
        <div><p class="label">Dosis</p><p class="value">${receta.dosis}</p></div>
        <div><p class="label">Frecuencia</p><p class="value">${receta.frecuencia}</p></div>
        <div><p class="label">Duración</p><p class="value">${receta.duracion}</p></div>
      </div>
      ${receta.indicaciones ? `<p class="label">Indicaciones</p><p class="value">${receta.indicaciones}</p>` : ''}
      <div class="footer"><p>Dr/a. ${veterinario?.nombre || ''} ${veterinario?.apellido || ''} — VetClinic</p></div>
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
      </body></html>`);
    w.document.close();
  };

  const compartirWhatsApp = (receta: any) => {
    const texto = [
      `🐾 *VetClinic — Receta Veterinaria*`,
      `📅 ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`,
      ``,
      `*Paciente:* ${turno?.mascota?.nombre || ''} (${turno?.mascota?.especie || ''})`,
      `*Propietario:* ${turno?.cliente?.nombre || ''} ${turno?.cliente?.apellido || ''}`,
      ``,
      `💊 *${receta.medicamento}*${receta.principioActivo ? ` — ${receta.principioActivo}` : ''}`,
      `• Dosis: ${receta.dosis}`,
      `• Frecuencia: ${receta.frecuencia}`,
      `• Duración: ${receta.duracion}`,
      receta.indicaciones ? `• Indicaciones: ${receta.indicaciones}` : '',
      ``,
      `_Dr/a. ${veterinario?.nombre || ''} ${veterinario?.apellido || ''} — VetClinic_`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const onAgregar = async (data: any) => {
    if (!consultaId) return;
    setLoading(true);
    try {
      await consultasApi.agregarReceta(consultaId, data);
      await invalidar();
      toast.success('Receta agregada');
      reset();
    } catch {
      toast.error('Error al agregar receta');
    } finally {
      setLoading(false);
    }
  };

  const onEliminar = async (recetaId: string) => {
    if (!confirm('¿Eliminar esta receta?')) return;
    try {
      await consultasApi.eliminarReceta(recetaId);
      await invalidar();
      toast.success('Receta eliminada');
    } catch {
      toast.error('Error al eliminar receta');
    }
  };

  return (
    <div className="space-y-4">
      {/* Recetas existentes */}
      {recetas.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Recetas de esta consulta</h3>
          {recetas.map((receta: any) => (
            <RecetaCard
              key={receta.id}
              receta={receta}
              editando={editandoId === receta.id}
              onEditar={() => setEditandoId(receta.id)}
              onCancelarEdicion={() => setEditandoId(null)}
              onGuardado={() => { setEditandoId(null); invalidar(); }}
              onEliminar={() => onEliminar(receta.id)}
              onImprimir={() => imprimirReceta(receta)}
              onWhatsApp={() => compartirWhatsApp(receta)}
            />
          ))}
        </div>
      )}

      {/* Formulario agregar */}
      <form onSubmit={handleSubmit(onAgregar)} className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {recetas.length > 0 ? 'Agregar otra receta' : 'Nueva receta'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Medicamento *</label>
            <input {...register('medicamento', { required: true })} className="input" placeholder="Amoxicilina" />
          </div>
          <div>
            <label className="label">Principio activo</label>
            <input {...register('principioActivo')} className="input" placeholder="Amoxicilina trihidrato" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Dosis *</label>
            <input {...register('dosis', { required: true })} className="input" placeholder="10mg/kg" />
          </div>
          <div>
            <label className="label">Frecuencia *</label>
            <input {...register('frecuencia', { required: true })} className="input" placeholder="Cada 12hs" />
          </div>
          <div>
            <label className="label">Duración *</label>
            <input {...register('duracion', { required: true })} className="input" placeholder="7 días" />
          </div>
        </div>
        <div>
          <label className="label">Indicaciones</label>
          <textarea {...register('indicaciones')} className="input resize-none" rows={2} placeholder="Administrar con comida..." />
        </div>
        <button type="submit" disabled={loading || !consultaId} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <Plus className="w-4 h-4" /> Agregar receta
        </button>
      </form>
    </div>
  );
}

// Card de receta con edición inline
function RecetaCard({ receta, editando, onEditar, onCancelarEdicion, onGuardado, onEliminar, onImprimir, onWhatsApp }: any) {
  const { register, handleSubmit } = useForm({ defaultValues: receta });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await consultasApi.editarReceta(receta.id, data);
      toast.success('Receta actualizada');
      onGuardado();
    } catch {
      toast.error('Error al actualizar receta');
    } finally {
      setLoading(false);
    }
  };

  if (editando) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="card border-l-4 border-l-primary-500 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Medicamento *</label>
            <input {...register('medicamento', { required: true })} className="input" />
          </div>
          <div>
            <label className="label">Principio activo</label>
            <input {...register('principioActivo')} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Dosis *</label>
            <input {...register('dosis', { required: true })} className="input" />
          </div>
          <div>
            <label className="label">Frecuencia *</label>
            <input {...register('frecuencia', { required: true })} className="input" />
          </div>
          <div>
            <label className="label">Duración *</label>
            <input {...register('duracion', { required: true })} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Indicaciones</label>
          <textarea {...register('indicaciones')} className="input resize-none" rows={2} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
          <button type="button" onClick={onCancelarEdicion} className="btn-ghost">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="card border-l-4 border-l-primary-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-base">
            💊 {receta.medicamento}
            {receta.principioActivo && <span className="text-sm font-normal text-gray-500 ml-2">({receta.principioActivo})</span>}
          </p>
          <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span>Dosis: <strong>{receta.dosis}</strong></span>
            <span>Frecuencia: <strong>{receta.frecuencia}</strong></span>
            <span>Duración: <strong>{receta.duracion}</strong></span>
          </div>
          {receta.indicaciones && <p className="text-sm text-gray-500 mt-1 italic">{receta.indicaciones}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          <button type="button" onClick={onImprimir} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
          <button type="button" onClick={onWhatsApp} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button type="button" onClick={onEditar} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button type="button" onClick={onEliminar} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

const TIPO_ESTUDIO_LABEL: Record<string, string> = {
  LABORATORIO: 'Laboratorio', RADIOGRAFIA: 'Radiografía',
  ECOGRAFIA: 'Ecografía', ELECTROCARDIOGRAMA: 'Electrocardiograma', OTRO: 'Otro',
};

// Sub-componente Estudio
function EstudioForm({ consultaId, turno, veterinario }: { consultaId: string | null; turno: any; veterinario: any }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm({ defaultValues: { tipo: 'LABORATORIO' } });
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const { data: consulta } = useQuery({
    queryKey: ['consulta', consultaId],
    queryFn: () => consultasApi.obtener(consultaId!),
    enabled: !!consultaId,
  });

  const estudios: any[] = consulta?.estudios || [];
  const invalidar = () => qc.invalidateQueries({ queryKey: ['consulta', consultaId] });

  const imprimirEstudio = (estudio: any) => {
    const fecha = format(new Date(), 'dd/MM/yyyy', { locale: es });
    const w = window.open('', '_blank', 'width=700,height=900');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Estudio - ${TIPO_ESTUDIO_LABEL[estudio.tipo]}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:600px;margin:0 auto}
        h1{font-size:22px;margin:0 0 4px}.sub{color:#555;font-size:13px;margin-bottom:24px}
        .divider{border-top:2px solid #111;margin:16px 0}
        .label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
        .value{font-size:15px;font-weight:600;margin-bottom:12px}
        .resultado{background:#f5f5f5;padding:12px;border-radius:6px;font-size:13px;white-space:pre-wrap}
        .footer{margin-top:40px;border-top:1px solid #ccc;padding-top:16px;font-size:12px;color:#666}
        @media print{body{padding:20px}}
      </style></head><body>
      <h1>VetClinic — Solicitud de Estudio</h1><p class="sub">Fecha: ${fecha}</p>
      <div class="divider"></div>
      <p class="label">Paciente</p><p class="value">${turno?.mascota?.nombre || ''} (${turno?.mascota?.especie || ''})</p>
      <p class="label">Propietario</p><p class="value">${turno?.cliente?.nombre || ''} ${turno?.cliente?.apellido || ''}</p>
      <div class="divider"></div>
      <p class="label">Tipo de estudio</p><p class="value">${TIPO_ESTUDIO_LABEL[estudio.tipo] || estudio.tipo}${estudio.laboratorio ? ` — ${estudio.laboratorio}` : ''}</p>
      <p class="label">Solicitud / Descripción</p><p class="value">${estudio.descripcion}</p>
      ${estudio.resultado ? `<p class="label">Resultado</p><div class="resultado">${estudio.resultado}</div>` : ''}
      <div class="footer"><p>Dr/a. ${veterinario?.nombre || ''} ${veterinario?.apellido || ''} — VetClinic</p></div>
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
      </body></html>`);
    w.document.close();
  };

  const compartirWhatsApp = (estudio: any) => {
    const texto = [
      `🔬 *VetClinic — Solicitud de Estudio*`,
      `📅 ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`,
      ``,
      `*Paciente:* ${turno?.mascota?.nombre || ''} (${turno?.mascota?.especie || ''})`,
      `*Propietario:* ${turno?.cliente?.nombre || ''} ${turno?.cliente?.apellido || ''}`,
      ``,
      `*Tipo:* ${TIPO_ESTUDIO_LABEL[estudio.tipo] || estudio.tipo}${estudio.laboratorio ? ` — ${estudio.laboratorio}` : ''}`,
      `*Solicitud:* ${estudio.descripcion}`,
      estudio.resultado ? `*Resultado:* ${estudio.resultado}` : '',
      ``,
      `_Dr/a. ${veterinario?.nombre || ''} ${veterinario?.apellido || ''} — VetClinic_`,
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const onAgregar = async (data: any) => {
    if (!consultaId) return;
    setLoading(true);
    try {
      await consultasApi.agregarEstudio(consultaId, data);
      await invalidar();
      toast.success('Estudio agregado');
      reset({ tipo: 'LABORATORIO' });
    } catch {
      toast.error('Error al agregar estudio');
    } finally {
      setLoading(false);
    }
  };

  const onEliminar = async (estudioId: string) => {
    if (!confirm('¿Eliminar este estudio?')) return;
    try {
      await consultasApi.eliminarEstudio(estudioId);
      await invalidar();
      toast.success('Estudio eliminado');
    } catch {
      toast.error('Error al eliminar estudio');
    }
  };

  return (
    <div className="space-y-4">
      {/* Estudios existentes */}
      {estudios.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Estudios de esta consulta</h3>
          {estudios.map((estudio: any) => (
            <EstudioCard
              key={estudio.id}
              estudio={estudio}
              editando={editandoId === estudio.id}
              onEditar={() => setEditandoId(estudio.id)}
              onCancelarEdicion={() => setEditandoId(null)}
              onGuardado={() => { setEditandoId(null); invalidar(); }}
              onEliminar={() => onEliminar(estudio.id)}
              onImprimir={() => imprimirEstudio(estudio)}
              onWhatsApp={() => compartirWhatsApp(estudio)}
            />
          ))}
        </div>
      )}

      {/* Formulario agregar */}
      <form onSubmit={handleSubmit(onAgregar)} className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {estudios.length > 0 ? 'Agregar otro estudio' : 'Solicitar / cargar estudio'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo *</label>
            <select {...register('tipo', { required: true })} className="input">
              <option value="LABORATORIO">Laboratorio</option>
              <option value="RADIOGRAFIA">Radiografía</option>
              <option value="ECOGRAFIA">Ecografía</option>
              <option value="ELECTROCARDIOGRAMA">Electrocardiograma</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">Laboratorio / Centro</label>
            <input {...register('laboratorio')} className="input" placeholder="BioLab, VetImage..." />
          </div>
        </div>
        <div>
          <label className="label">Descripción / Solicitud *</label>
          <textarea {...register('descripcion', { required: true })} className="input resize-none" rows={2} placeholder="Hemograma completo, bioquímica..." />
        </div>
        <div>
          <label className="label">Resultado (si ya está disponible)</label>
          <textarea {...register('resultado')} className="input resize-none" rows={3} placeholder="Pegar resultados aquí..." />
        </div>
        <button type="submit" disabled={loading || !consultaId} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <Plus className="w-4 h-4" /> Agregar estudio
        </button>
      </form>
    </div>
  );
}

// Card de estudio con edición inline
function EstudioCard({ estudio, editando, onEditar, onCancelarEdicion, onGuardado, onEliminar, onImprimir, onWhatsApp }: any) {
  const { register, handleSubmit } = useForm({ defaultValues: estudio });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await consultasApi.editarEstudio(estudio.id, data);
      toast.success('Estudio actualizado');
      onGuardado();
    } catch {
      toast.error('Error al actualizar estudio');
    } finally {
      setLoading(false);
    }
  };

  if (editando) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="card border-l-4 border-l-blue-500 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo *</label>
            <select {...register('tipo', { required: true })} className="input">
              <option value="LABORATORIO">Laboratorio</option>
              <option value="RADIOGRAFIA">Radiografía</option>
              <option value="ECOGRAFIA">Ecografía</option>
              <option value="ELECTROCARDIOGRAMA">Electrocardiograma</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">Laboratorio / Centro</label>
            <input {...register('laboratorio')} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Descripción *</label>
          <textarea {...register('descripcion', { required: true })} className="input resize-none" rows={2} />
        </div>
        <div>
          <label className="label">Resultado</label>
          <textarea {...register('resultado')} className="input resize-none" rows={3} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
          <button type="button" onClick={onCancelarEdicion} className="btn-ghost">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="card border-l-4 border-l-blue-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              🔬 {TIPO_ESTUDIO_LABEL[estudio.tipo] || estudio.tipo}
            </span>
            {estudio.laboratorio && (
              <span className="text-xs text-gray-500 dark:text-gray-400">— {estudio.laboratorio}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{estudio.descripcion}</p>
          {estudio.resultado && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Resultado:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{estudio.resultado}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          <button type="button" onClick={onImprimir} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
          <button type="button" onClick={onWhatsApp} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button type="button" onClick={onEditar} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button type="button" onClick={onEliminar} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-componente Vacuna
function VacunaForm({ mascotaId, veterinarioId }: { mascotaId: string; veterinarioId?: string }) {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await consultasApi.registrarVacuna({ ...data, mascotaId, veterinarioId });
      toast.success('Vacuna registrada');
      reset();
    } catch {
      toast.error('Error al registrar vacuna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">Registrar vacuna</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Vacuna *</label>
          <input {...register('nombre', { required: true })} className="input" placeholder="Séxtuple, Antirrábica..." />
        </div>
        <div>
          <label className="label">Laboratorio</label>
          <input {...register('laboratorio')} className="input" placeholder="Nobivac, Canigen..." />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Lote</label>
          <input {...register('lote')} className="input" placeholder="ABC123" />
        </div>
        <div>
          <label className="label">Fecha aplicación</label>
          <input {...register('fechaAplicacion')} type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
        <div>
          <label className="label">Próxima dosis</label>
          <input {...register('proximaDosis')} type="date" className="input" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <Syringe className="w-4 h-4" /> Registrar vacuna
      </button>
    </form>
  );
}
