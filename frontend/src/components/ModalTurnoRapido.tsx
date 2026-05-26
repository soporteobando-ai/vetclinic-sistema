import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientesApi, mascotasApi, turnosApi, usuariosApi } from '../services/api';
import { useForm } from 'react-hook-form';
import { X, Search, Plus, ChevronRight, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
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

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇',
  HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

interface ClienteResumen {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

interface MascotaResumen {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
}

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  clienteInicial?: ClienteResumen;
  fechaInicial?: Date;
}

export default function ModalTurnoRapido({ onClose, onSuccess, clienteInicial, fechaInicial }: Props) {
  const pasoInicial = clienteInicial ? 1 : 0;
  const [paso, setPaso] = useState(pasoInicial);
  const [cliente, setCliente] = useState<ClienteResumen | null>(clienteInicial || null);
  const [mascota, setMascota] = useState<MascotaResumen | null>(null);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [creandoMascota, setCreandoMascota] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conflictos, setConflictos] = useState<any[] | null>(null);
  const [datosConfirmacion, setDatosConfirmacion] = useState<any>(null);
  const qc = useQueryClient();

  const fechaStr = format(fechaInicial || new Date(), "yyyy-MM-dd'T'HH:mm");

  const { register: regC, handleSubmit: submitC, reset: resetC } = useForm();
  const { register: regM, handleSubmit: submitM, reset: resetM } = useForm();
  const { register: regT, handleSubmit: submitT, setValue: setValT } = useForm({
    defaultValues: { fechaHora: fechaStr, duracionMin: 30, tipo: 'CONSULTA_VETERINARIA', motivo: '', profesionalId: '' },
  });

  const { data: profesionales = [] } = useQuery<any[]>({
    queryKey: ['profesionales-activos'],
    queryFn: () => usuariosApi.listar({ activo: true }),
  });

  // Auto-seleccionar si hay un solo profesional
  useEffect(() => {
    if (profesionales.length === 1) {
      setValT('profesionalId', profesionales[0].id);
    }
  }, [profesionales, setValT]);

  const { data: clientesData } = useQuery({
    queryKey: ['wizard-clientes', buscarCliente],
    queryFn: () => clientesApi.listar({ buscar: buscarCliente }),
    enabled: buscarCliente.length >= 2,
  });

  const { data: mascotas = [] } = useQuery<MascotaResumen[]>({
    queryKey: ['wizard-mascotas', cliente?.id],
    queryFn: () => mascotasApi.listar({ clienteId: cliente!.id }),
    enabled: !!cliente?.id,
  });

  const handleCrearCliente = async (data: any) => {
    setLoading(true);
    try {
      const nuevo = await clientesApi.crear(data);
      setCliente(nuevo);
      resetC();
      setCreandoCliente(false);
      qc.invalidateQueries({ queryKey: ['clientes'] });
      setPaso(1);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al registrar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearMascota = async (data: any) => {
    setLoading(true);
    try {
      const nueva = await mascotasApi.crear({ ...data, clienteId: cliente!.id });
      setMascota(nueva);
      resetM();
      setCreandoMascota(false);
      qc.invalidateQueries({ queryKey: ['wizard-mascotas', cliente?.id] });
      qc.invalidateQueries({ queryKey: ['cliente', cliente?.id] });
      setPaso(2);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al registrar mascota');
    } finally {
      setLoading(false);
    }
  };

  const confirmarTurno = async (data: any) => {
    setLoading(true);
    try {
      await turnosApi.crear({ ...data, clienteId: cliente!.id, mascotaId: mascota!.id });
      qc.invalidateQueries({ queryKey: ['calendario'] });
      qc.invalidateQueries({ queryKey: ['turnos-hoy'] });
      qc.invalidateQueries({ queryKey: ['cliente', cliente?.id] });
      toast.success('Turno confirmado');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al crear turno');
    } finally {
      setLoading(false);
      setConflictos(null);
      setDatosConfirmacion(null);
    }
  };

  const handleCrearTurno = async (data: any) => {
    const payload = { ...data, clienteId: cliente!.id, mascotaId: mascota!.id };
    // Verificar conflicto si hay profesional seleccionado
    if (data.profesionalId) {
      setLoading(true);
      try {
        const resultado = await turnosApi.verificarConflicto({
          profesionalId: data.profesionalId,
          fechaHora: data.fechaHora,
          duracionMin: data.duracionMin,
        });
        if (resultado.conflicto) {
          setConflictos(resultado.turnos);
          setDatosConfirmacion(payload);
          setLoading(false);
          return;
        }
      } catch {
        // Si falla la verificación, continuar igual
      } finally {
        setLoading(false);
      }
    }
    await confirmarTurno(payload);
  };

  const pasoLabels = ['Cliente', 'Mascota', 'Turno'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Barra de progreso */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            {pasoLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < paso
                    ? 'bg-primary-500 text-white'
                    : i === paso
                    ? 'ring-2 ring-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {i < paso ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-sm ${i === paso ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {label}
                </span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />}
              </div>
            ))}
          </div>
          <button type="button" onClick={onClose} title="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-800 mx-6" />

        {/* ── PASO 0: CLIENTE ── */}
        {paso === 0 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Buscar cliente</h3>
              <p className="text-sm text-gray-500 mt-0.5">Ingresá nombre, teléfono o DNI</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={buscarCliente}
                onChange={e => { setBuscarCliente(e.target.value); setCreandoCliente(false); }}
                placeholder="Buscar..."
                className="input pl-9"
                autoFocus
              />
            </div>

            {clientesData?.clientes?.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {clientesData.clientes.slice(0, 5).map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCliente(c); setBuscarCliente(''); setPaso(1); }}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{c.nombre} {c.apellido}</p>
                      <p className="text-xs text-gray-400">
                        {c.telefono}
                        {c.mascotas?.length > 0 && ` · ${c.mascotas.length} mascota${c.mascotas.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {buscarCliente.length >= 2 && clientesData?.clientes?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">Sin resultados para "{buscarCliente}"</p>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setCreandoCliente(v => !v)}
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                <Plus className="w-4 h-4" />
                {creandoCliente ? 'Cancelar' : 'Registrar cliente nuevo'}
              </button>
            </div>

            {creandoCliente && (
              <form onSubmit={submitC(handleCrearCliente)} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre *</label>
                    <input {...regC('nombre', { required: true })} className="input" placeholder="María" />
                  </div>
                  <div>
                    <label className="label">Apellido *</label>
                    <input {...regC('apellido', { required: true })} className="input" placeholder="García" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Teléfono *</label>
                    <input {...regC('telefono', { required: true })} className="input" placeholder="11-1234-5678" />
                  </div>
                  <div>
                    <label className="label">DNI</label>
                    <input {...regC('dni')} className="input" placeholder="12345678" />
                  </div>
                </div>
                <input {...regC('email')} type="email" className="input" placeholder="Email (opcional)" />
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Registrar y continuar
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── PASO 1: MASCOTA ── */}
        {paso === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Seleccionar mascota</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Cliente:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {cliente?.nombre} {cliente?.apellido}
                </span>
                {!clienteInicial && (
                  <button
                    type="button"
                    onClick={() => { setCliente(null); setMascota(null); setPaso(0); }}
                    className="ml-2 text-xs text-primary-500 hover:underline"
                  >
                    cambiar
                  </button>
                )}
              </p>
            </div>

            {mascotas.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {mascotas.map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMascota(m); setPaso(2); }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-colors ${
                      mascota?.id === m.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-2xl leading-none">{especieEmoji[m.especie] || '🐾'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{m.nombre}</p>
                      <p className="text-xs text-gray-400 truncate">{m.raza || m.especie}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {mascotas.length === 0 && !creandoMascota && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">Este cliente no tiene mascotas registradas</p>
                <button
                  type="button"
                  onClick={() => setCreandoMascota(true)}
                  className="mt-2 btn-primary text-sm"
                >
                  <Plus className="w-4 h-4" /> Agregar primera mascota
                </button>
              </div>
            )}

            {mascotas.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setCreandoMascota(v => !v)}
                  className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {creandoMascota ? 'Cancelar' : 'Agregar mascota nueva'}
                </button>
              </div>
            )}

            {creandoMascota && (
              <form onSubmit={submitM(handleCrearMascota)} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre *</label>
                    <input {...regM('nombre', { required: true })} className="input" placeholder="Max" />
                  </div>
                  <div>
                    <label className="label">Especie *</label>
                    <select {...regM('especie', { required: true })} className="input">
                      <option value="">Seleccionar</option>
                      <option value="PERRO">Perro</option>
                      <option value="GATO">Gato</option>
                      <option value="AVE">Ave</option>
                      <option value="CONEJO">Conejo</option>
                      <option value="HAMSTER">Hámster</option>
                      <option value="REPTIL">Reptil</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Raza</label>
                    <input {...regM('raza')} className="input" placeholder="Labrador" />
                  </div>
                  <div>
                    <label className="label">Sexo *</label>
                    <select {...regM('sexo', { required: true })} className="input">
                      <option value="">Seleccionar</option>
                      <option value="MACHO">Macho</option>
                      <option value="HEMBRA">Hembra</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Fecha de nacimiento</label>
                    <input {...regM('fechaNacimiento')} type="date" className="input" />
                  </div>
                  <div>
                    <label className="label">Peso (kg)</label>
                    <input {...regM('peso', { valueAsNumber: true })} type="number" step="0.1" className="input" placeholder="5.0" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Agregar y continuar
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── PASO 2: TURNO ── */}
        {paso === 2 && (
          <form onSubmit={submitT(handleCrearTurno)} className="p-6 space-y-4">
            {/* Resumen cliente/mascota */}
            <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <span className="text-2xl leading-none">{especieEmoji[mascota?.especie || 'OTRO']}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{mascota?.nombre}</p>
                <p className="text-xs text-gray-500 truncate">de {cliente?.nombre} {cliente?.apellido}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0"
              >
                cambiar
              </button>
            </div>

            <div>
              <label className="label">Profesional *</label>
              <select {...regT('profesionalId', { required: true })} className="input">
                <option value="">Seleccionar profesional...</option>
                {profesionales.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} — {p.rol === 'VETERINARIO' ? 'Vet.' : p.rol === 'ESTILISTA' ? 'Estilista' : p.rol}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo de servicio *</label>
              <select {...regT('tipo', { required: true })} className="input">
                {['Clínico', 'Estética', 'Guardería'].map(grupo => (
                  <optgroup key={grupo} label={grupo}>
                    {TIPOS_TURNO.filter(t => t.grupo === grupo).map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha y hora *</label>
                <input {...regT('fechaHora', { required: true })} type="datetime-local" className="input" />
              </div>
              <div>
                <label className="label">Duración</label>
                <select {...regT('duracionMin', { valueAsNumber: true })} className="input">
                  {DURACIONES.map(d => (
                    <option key={d} value={d}>{d >= 60 ? `${d / 60}h` : `${d}min`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Motivo</label>
              <textarea {...regT('motivo')} className="input resize-none" rows={2} placeholder="Motivo de la consulta..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar turno
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── POPUP CONFLICTO ── */}
      {conflictos && conflictos.length > 0 && datosConfirmacion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              {/* Ícono + título */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Solapamiento de horario
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    El profesional ya tiene {conflictos.length === 1 ? 'un turno' : 'turnos'} en ese horario:
                  </p>
                </div>
              </div>

              {/* Turnos en conflicto */}
              <div className="space-y-2 mb-6">
                {conflictos.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <div className="text-xl">{
                      { PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇', HAMSTER: '🐹', REPTIL: '🦎' }[t.mascota?.especie] ?? '🐾'
                    }</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t.mascota?.nombre}
                        <span className="font-normal text-gray-500 ml-1">— {t.cliente?.nombre} {t.cliente?.apellido}</span>
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        {format(new Date(t.fechaHora), "HH:mm")} · {t.duracionMin}min · {t.estado}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                ¿Querés confirmar el turno de todas formas (doble agenda) o modificar los datos?
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setConflictos(null); setDatosConfirmacion(null); }}
                  className="btn-ghost flex-1 justify-center"
                >
                  Modificar datos
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => confirmarTurno(datosConfirmacion)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar igual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
