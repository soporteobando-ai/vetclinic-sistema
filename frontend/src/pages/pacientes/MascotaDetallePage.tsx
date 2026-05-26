import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mascotasApi, turnosApi } from '../../services/api';
import { ArrowLeft, Syringe, Scissors, Stethoscope, Edit, PlusCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import ModalMascota from './components/ModalMascota';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇',
  HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

export default function MascotaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'clinico' | 'vacunas' | 'estetica'>('clinico');
  const [modalEditar, setModalEditar] = useState(false);
  const [creandoConsulta, setCreandoConsulta] = useState(false);

  const registrarConsulta = async () => {
    if (!mascota) return;
    setCreandoConsulta(true);
    try {
      const turno = await turnosApi.crear({
        tipo: 'CONSULTA_VETERINARIA',
        estado: 'EN_CURSO',
        fechaHora: new Date().toISOString(),
        mascotaId: mascota.id,
        clienteId: mascota.clienteId,
        duracionMin: 30,
      });
      navigate(`/consultas/${turno.id}`);
    } catch {
      toast.error('No se pudo iniciar la consulta');
      setCreandoConsulta(false);
    }
  };

  const { data: mascota } = useQuery({
    queryKey: ['mascota', id],
    queryFn: () => mascotasApi.obtener(id!),
  });

  const { data: historial } = useQuery({
    queryKey: ['historial', id],
    queryFn: () => mascotasApi.historial(id!),
    enabled: !!id,
  });

  if (!mascota) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  const edad = mascota.fechaNacimiento
    ? Math.floor((Date.now() - new Date(mascota.fechaNacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1 flex items-center gap-4">
          <div className="text-5xl">{especieEmoji[mascota.especie]}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{mascota.nombre}</h1>
            <p className="text-gray-500">{mascota.raza || mascota.especie} · {mascota.sexo === 'MACHO' ? '♂ Macho' : '♀ Hembra'} {edad ? `· ${edad} años` : ''}</p>
          </div>
        </div>
        <button onClick={() => setModalEditar(true)} className="btn-ghost"><Edit className="w-4 h-4" /> Editar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel lateral */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos físicos</h3>
            <div className="space-y-2 text-sm">
              {mascota.peso && <div className="flex justify-between"><span className="text-gray-500">Peso</span><span className="font-medium">{mascota.peso}kg</span></div>}
              {mascota.color && <div className="flex justify-between"><span className="text-gray-500">Color</span><span className="font-medium">{mascota.color}</span></div>}
              {mascota.microchip && <div className="flex justify-between"><span className="text-gray-500">Microchip</span><span className="font-medium text-xs">{mascota.microchip}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Esterilizado</span><span className={`font-medium ${mascota.esterilizado ? 'text-green-600' : 'text-gray-400'}`}>{mascota.esterilizado ? 'Sí' : 'No'}</span></div>
            </div>
          </div>

          {mascota.alergias && (
            <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <h3 className="text-sm font-semibold text-red-600 mb-1">⚠️ Alergias</h3>
              <p className="text-sm text-red-700 dark:text-red-400">{mascota.alergias}</p>
            </div>
          )}
          {mascota.condicionesCronicas && (
            <div className="card border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
              <h3 className="text-sm font-semibold text-orange-600 mb-1">📋 Condiciones crónicas</h3>
              <p className="text-sm text-orange-700 dark:text-orange-400">{mascota.condicionesCronicas}</p>
            </div>
          )}

          {mascota.cliente && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Propietario</h3>
              <p className="font-medium text-gray-900 dark:text-white">{mascota.cliente.nombre} {mascota.cliente.apellido}</p>
              <p className="text-sm text-gray-500">{mascota.cliente.telefono}</p>
              <button onClick={() => navigate(`/clientes/${mascota.cliente.id}`)} className="text-xs text-primary-600 dark:text-primary-400 mt-1 hover:underline">Ver perfil completo</button>
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-1">
                {[
                  { key: 'clinico', label: 'Historial clínico', icon: Stethoscope },
                  { key: 'vacunas', label: 'Vacunas', icon: Syringe },
                  { key: 'estetica', label: 'Estética', icon: Scissors },
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
              {tab === 'clinico' && (
                <button
                  type="button"
                  onClick={registrarConsulta}
                  disabled={creandoConsulta}
                  className="flex items-center gap-1.5 px-3 py-1.5 mr-3 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50"
                >
                  {creandoConsulta ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                  Nueva consulta
                </button>
              )}
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
              {tab === 'clinico' && (historial?.consultas || []).map((c: any) => (
                <div key={c.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-gray-900 dark:text-white">{c.motivo}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{format(new Date(c.fecha), 'dd/MM/yyyy', { locale: es })}</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/consultas/${c.turnoId}`)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Abrir →
                      </button>
                    </div>
                  </div>
                  {c.diagnosticoDefinitivo && <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Dx:</span> {c.diagnosticoDefinitivo}</p>}
                  {c.planTratamiento && <p className="text-sm text-gray-600 dark:text-gray-400"><span className="font-medium">Tratamiento:</span> {c.planTratamiento}</p>}
                  {c.recetas?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 mb-1">Recetas:</p>
                      <div className="flex flex-wrap gap-1">
                        {c.recetas.map((r: any) => (
                          <span key={r.id} className="badge badge-blue text-xs">
                            💊 {r.medicamento} — {r.dosis} · {r.frecuencia} · {r.duracion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">Dr/a. {c.veterinario?.nombre} {c.veterinario?.apellido}</p>
                </div>
              ))}

              {tab === 'vacunas' && (historial?.vacunas || []).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{v.nombre}</p>
                    <p className="text-xs text-gray-500">{v.laboratorio} · Lote: {v.lote}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{format(new Date(v.fechaAplicacion), 'dd/MM/yyyy')}</p>
                    {v.proximaDosis && (
                      <p className="text-xs text-blue-500">Próx: {format(new Date(v.proximaDosis), 'dd/MM/yyyy')}</p>
                    )}
                  </div>
                </div>
              ))}

              {tab === 'estetica' && (historial?.serviciosEstetica || []).map((s: any) => {
                const servicios: string[] = Array.isArray(s.servicios)
                  ? s.servicios
                  : (() => { try { return JSON.parse(s.servicios || '[]'); } catch { return []; } })();
                const fechaMostrar = s.turno?.fechaHora ?? s.createdAt;
                const profesional = s.estilista ?? s.turno?.profesional;
                return (
                  <div key={s.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {servicios.length > 0
                          ? servicios.map((sv: string) => (
                              <span key={sv} className="badge badge-purple text-xs">✂️ {sv.replace(/_/g, ' ')}</span>
                            ))
                          : <span className="text-xs text-gray-400">Servicio sin detalle</span>
                        }
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {format(new Date(fechaMostrar), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                    {s.estadoGrooming && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium
                        ${s.estadoGrooming === 'LISTO_RETIRAR' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : s.estadoGrooming === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {s.estadoGrooming.replace(/_/g, ' ')}
                      </span>
                    )}
                    {s.observaciones && <p className="text-sm text-gray-500">{s.observaciones}</p>}
                    {profesional && (
                      <p className="text-xs text-gray-400">{profesional.nombre} {profesional.apellido}</p>
                    )}
                  </div>
                );
              })}

              {tab === 'clinico' && !historial?.consultas?.length && (
                <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
                  <Stethoscope className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Sin consultas registradas</p>
                  <button
                    type="button"
                    onClick={registrarConsulta}
                    disabled={creandoConsulta}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50"
                  >
                    {creandoConsulta ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    Registrar primera consulta
                  </button>
                </div>
              )}
              {tab === 'vacunas' && !historial?.vacunas?.length && (
                <p className="text-center text-gray-400 py-8 text-sm">Sin vacunas registradas</p>
              )}
              {tab === 'estetica' && !historial?.serviciosEstetica?.length && (
                <p className="text-center text-gray-400 py-8 text-sm">Sin servicios de estética registrados</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalEditar && mascota && (
        <ModalMascota
          clienteId={mascota.clienteId}
          mascotaInicial={mascota}
          onClose={() => setModalEditar(false)}
          onSuccess={() => {
            setModalEditar(false);
            qc.invalidateQueries({ queryKey: ['mascota', id] });
            toast.success('Mascota actualizada');
          }}
        />
      )}
    </div>
  );
}
