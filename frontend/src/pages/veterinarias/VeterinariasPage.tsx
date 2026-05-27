import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { veterinariasApi, usuariosApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import {
  Building2, Plus, Pencil, X, Loader2, Power, PowerOff,
  Users, PawPrint, Calendar, MapPin, Phone, Mail, ChevronRight,
  ShieldCheck, UserCheck, UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Veterinaria } from '../../types';

// ─── Modal crear/editar veterinaria ───────────────────────────────────────────

interface ModalVetProps {
  inicial?: Veterinaria;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalVeterinaria({ inicial, onClose, onSuccess }: ModalVetProps) {
  const [loading, setLoading] = useState(false);
  const esEdicion = !!inicial;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: inicial
      ? { nombre: inicial.nombre, direccion: inicial.direccion ?? '', telefono: inicial.telefono ?? '', email: inicial.email ?? '' }
      : {},
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (esEdicion) {
        await veterinariasApi.actualizar(inicial!.id, data);
        toast.success('Veterinaria actualizada');
      } else {
        await veterinariasApi.crear(data);
        toast.success('Veterinaria creada. El administrador puede iniciar sesión con su email y la contraseña asignada.');
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {esEdicion ? 'Editar veterinaria' : 'Nueva veterinaria'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos del negocio</p>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre *</label>
                <input {...register('nombre', { required: true })} className="input" placeholder="Clínica Veterinaria Los Pinos" />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">Requerido</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Teléfono</label>
                  <input {...register('telefono')} className="input" placeholder="11-1234-5678" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input {...register('email')} type="email" className="input" placeholder="info@clinica.com" />
                </div>
              </div>
              <div>
                <label className="label">Dirección</label>
                <input {...register('direccion')} className="input" placeholder="Av. Corrientes 1234, Buenos Aires" />
              </div>
            </div>
          </div>

          {!esEdicion && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Administrador inicial</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre *</label>
                    <input {...register('adminNombre', { required: true })} className="input" placeholder="Juan" />
                    {errors.adminNombre && <p className="text-xs text-red-500 mt-1">Requerido</p>}
                  </div>
                  <div>
                    <label className="label">Apellido *</label>
                    <input {...register('adminApellido', { required: true })} className="input" placeholder="García" />
                    {errors.adminApellido && <p className="text-xs text-red-500 mt-1">Requerido</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Email del administrador *</label>
                  <input {...register('adminEmail', { required: true })} type="email" className="input" placeholder="admin@clinica.com" />
                  {errors.adminEmail && <p className="text-xs text-red-500 mt-1">Requerido</p>}
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input {...register('adminPassword')} type="password" className="input" placeholder="Dejar vacío = Veterinaria123" />
                  <p className="text-xs text-gray-400 mt-1">Si no ingresás contraseña, se usará "Veterinaria123"</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {esEdicion ? 'Guardar cambios' : 'Crear veterinaria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal nuevo usuario (desde panel super-admin) ────────────────────────────

interface ModalNuevoUsuarioProps {
  vetId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalNuevoUsuario({ vetId, onClose, onSuccess }: ModalNuevoUsuarioProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { data: roles = [] } = useQuery<any[]>({
    queryKey: ['roles', vetId],
    queryFn: () => usuariosApi.listarRoles(vetId),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await usuariosApi.crear({ ...data, veterinariaId: vetId, rolId: data.rolId || undefined });
      toast.success('Usuario creado. Contraseña inicial: Veterinaria123');
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Agregar usuario</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre *</label>
              <input {...register('nombre', { required: true })} className="input" placeholder="Juan" />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">Requerido</p>}
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input {...register('apellido', { required: true })} className="input" placeholder="García" />
              {errors.apellido && <p className="text-xs text-red-500 mt-1">Requerido</p>}
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <input {...register('email', { required: true })} type="email" className="input" placeholder="juan@clinica.com" />
            {errors.email && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rol</label>
              <select {...register('rolId')} className="input">
                <option value="">Sin rol</option>
                {roles.filter((r: any) => r.activo).map((r: any) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="11-1234-5678" />
            </div>
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input {...register('password')} type="password" className="input" placeholder="Dejar vacío = Veterinaria123" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panel lateral de usuarios ────────────────────────────────────────────────

function PanelUsuarios({ vetId, vetNombre, onClose }: { vetId: string; vetNombre: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [modalNuevo, setModalNuevo] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['veterinaria-detalle', vetId],
    queryFn: () => veterinariasApi.obtener(vetId),
  });

  const usuarios: any[] = data?.usuarios ?? [];

  const handleNuevoExito = () => {
    setModalNuevo(false);
    refetch();
    qc.invalidateQueries({ queryKey: ['veterinarias'] });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex">
        {/* Overlay */}
        <div className="flex-1 bg-black/40" onClick={onClose} />

        {/* Drawer */}
        <div className="w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Equipo de</p>
              <h3 className="font-bold text-gray-900 dark:text-white mt-0.5">{vetNombre}</h3>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin usuarios registrados</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {usuarios.map((u: any) => {
                  const rolNombre = u.roles?.[0]?.rol?.nombre ?? '—';
                  const esAdmin   = u.roles?.some((r: any) => r.rol?.esAdmin);
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {u.nombre[0]}{u.apellido[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {u.nombre} {u.apellido}
                          </p>
                          {!u.activo && <UserX className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {esAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                            <UserCheck className="w-3 h-3" /> {rolNombre}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
            <button
              type="button"
              onClick={() => setModalNuevo(true)}
              className="btn-primary w-full justify-center"
            >
              <Plus className="w-4 h-4" /> Agregar usuario
            </button>
          </div>
        </div>
      </div>

      {modalNuevo && (
        <ModalNuevoUsuario
          vetId={vetId}
          onClose={() => setModalNuevo(false)}
          onSuccess={handleNuevoExito}
        />
      )}
    </>
  );
}

// ─── Card de veterinaria ───────────────────────────────────────────────────────

function VeterinariaCard({
  vet,
  onEditar,
  onToggle,
  onVerUsuarios,
}: {
  vet: Veterinaria;
  onEditar: () => void;
  onToggle: () => void;
  onVerUsuarios: () => void;
}) {
  const stats = [
    { label: 'Usuarios',  value: vet._count?.usuarios ?? 0 },
    { label: 'Clientes',  value: vet._count?.clientes ?? 0 },
    { label: 'Mascotas',  value: vet._count?.mascotas ?? 0 },
    { label: 'Turnos',    value: vet._count?.turnos ?? 0 },
  ];

  return (
    <div className={`card p-5 flex flex-col gap-4 ${!vet.activo ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            vet.activo ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <Building2 className={`w-5 h-5 ${vet.activo ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{vet.nombre}</p>
            {!vet.activo && <span className="text-xs text-red-500 font-medium">Inactiva</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onEditar}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0"
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        {vet.direccion && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{vet.direccion}</span>
          </div>
        )}
        {vet.telefono && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{vet.telefono}</span>
          </div>
        )}
        {vet.email && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{vet.email}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
        {stats.map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onVerUsuarios}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Ver equipo
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
            vet.activo
              ? 'text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-green-600 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          {vet.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function VeterinariasPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ abierto: boolean; vet?: Veterinaria }>({ abierto: false });
  const [panel, setPanel] = useState<{ vetId: string; vetNombre: string } | null>(null);

  const { data: veterinarias = [], isLoading } = useQuery<Veterinaria[]>({
    queryKey: ['veterinarias'],
    queryFn: veterinariasApi.listar,
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['veterinarias'] });

  const toggleActivo = async (vet: Veterinaria) => {
    if (!confirm(`¿Deseas ${vet.activo ? 'desactivar' : 'activar'} "${vet.nombre}"?`)) return;
    try {
      await veterinariasApi.toggleActivo(vet.id, !vet.activo);
      toast.success(vet.activo ? 'Veterinaria desactivada' : 'Veterinaria activada');
      invalidar();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const activas   = veterinarias.filter(v => v.activo);
  const inactivas = veterinarias.filter(v => !v.activo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            Veterinarias
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {activas.length} activa{activas.length !== 1 ? 's' : ''} · {inactivas.length} inactiva{inactivas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" onClick={() => setModal({ abierto: true })} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva veterinaria
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : veterinarias.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No hay veterinarias registradas</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activas.map(vet => (
              <VeterinariaCard
                key={vet.id}
                vet={vet}
                onEditar={() => setModal({ abierto: true, vet })}
                onToggle={() => toggleActivo(vet)}
                onVerUsuarios={() => setPanel({ vetId: vet.id, vetNombre: vet.nombre })}
              />
            ))}
          </div>

          {inactivas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactivas</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {inactivas.map(vet => (
                  <VeterinariaCard
                    key={vet.id}
                    vet={vet}
                    onEditar={() => setModal({ abierto: true, vet })}
                    onToggle={() => toggleActivo(vet)}
                    onVerUsuarios={() => setPanel({ vetId: vet.id, vetNombre: vet.nombre })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modal.abierto && (
        <ModalVeterinaria
          inicial={modal.vet}
          onClose={() => setModal({ abierto: false })}
          onSuccess={() => { setModal({ abierto: false }); invalidar(); }}
        />
      )}

      {panel && (
        <PanelUsuarios
          vetId={panel.vetId}
          vetNombre={panel.vetNombre}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}
