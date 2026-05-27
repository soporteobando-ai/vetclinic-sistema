import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import {
  UserCog, Plus, Pencil, X, Loader2, Power, PowerOff,
  ShieldCheck, Users, ChevronDown, ChevronUp, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  esAdmin: boolean;
  activo: boolean;
  permisos: { permiso: { id: string; codigo: string; modulo: string; descripcion: string } }[];
  _count?: { usuarios: number };
}

interface Permiso {
  id: string;
  codigo: string;
  modulo: string;
  descripcion: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MODULO_LABEL: Record<string, string> = {
  dashboard:    'Dashboard',
  clientes:     'Clientes',
  mascotas:     'Mascotas',
  agenda:       'Agenda',
  estetica:     'Estética',
  inventario:   'Inventario',
  facturacion:  'Facturación',
  reportes:     'Reportes',
  usuarios:     'Usuarios',
  consultas:    'Consultas',
  internacion:  'Internación',
  guarderia:    'Guardería',
};

function agruparPermisos(permisos: Permiso[]) {
  return permisos.reduce<Record<string, Permiso[]>>((acc, p) => {
    (acc[p.modulo] = acc[p.modulo] || []).push(p);
    return acc;
  }, {});
}

// ─── Modal Usuario ─────────────────────────────────────────────────────────────

interface ModalUsuarioProps {
  inicial?: any;
  roles: Rol[];
  onClose: () => void;
  onSuccess: () => void;
}

function ModalUsuario({ inicial, roles, onClose, onSuccess }: ModalUsuarioProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: inicial
      ? {
          nombre: inicial.nombre,
          apellido: inicial.apellido,
          email: inicial.email,
          rolId: inicial.roles?.[0]?.id ?? '',
          telefono: inicial.telefono || '',
        }
      : { rolId: roles[0]?.id ?? '' },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = { ...data, rolId: data.rolId || undefined };
      if (inicial?.id) {
        await usuariosApi.actualizar(inicial.id, payload);
        toast.success('Usuario actualizado');
      } else {
        await usuariosApi.crear(payload);
        toast.success('Usuario creado. Contraseña inicial: Veterinaria123');
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {inicial ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <input {...register('email', { required: true })} type="email" className="input" placeholder="juan@vetclinic.com" />
            {errors.email && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rol</label>
              <select {...register('rolId')} className="input">
                <option value="">Sin rol</option>
                {roles.filter(r => r.activo).map(r => (
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
            <label className="label">{inicial ? 'Nueva contraseña' : 'Contraseña'}</label>
            <input
              {...register('password')}
              type="password"
              className="input"
              placeholder={inicial ? 'Dejar vacío para no cambiar' : 'Dejar vacío = Veterinaria123'}
            />
            {!inicial && (
              <p className="text-xs text-gray-400 mt-1">Si no ingresás contraseña, se usará "Veterinaria123"</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {inicial ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Rol ─────────────────────────────────────────────────────────────────

interface ModalRolProps {
  inicial?: Rol;
  permisos: Permiso[];
  onClose: () => void;
  onSuccess: () => void;
}

function ModalRol({ inicial, permisos, onClose, onSuccess }: ModalRolProps) {
  const [loading, setLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(
    new Set(inicial?.permisos.map(rp => rp.permiso.codigo) ?? [])
  );
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      esAdmin: inicial?.esAdmin ?? false,
    },
  });

  const agrupados = agruparPermisos(permisos);

  const togglePermiso = (codigo: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(codigo) ? next.delete(codigo) : next.add(codigo);
      return next;
    });
  };

  const toggleModulo = (modulo: string) => {
    const codigos = agrupados[modulo].map(p => p.codigo);
    const todosSeleccionados = codigos.every(c => seleccionados.has(c));
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (todosSeleccionados) {
        codigos.forEach(c => next.delete(c));
      } else {
        codigos.forEach(c => next.add(c));
      }
      return next;
    });
  };

  const toggleExpandido = (modulo: string) => {
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(modulo) ? next.delete(modulo) : next.add(modulo);
      return next;
    });
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        esAdmin: Boolean(data.esAdmin),
        permisoCodigos: Array.from(seleccionados),
      };
      if (inicial?.id) {
        await usuariosApi.actualizarRol(inicial.id, payload);
        toast.success('Rol actualizado');
      } else {
        await usuariosApi.crearRol(payload);
        toast.success('Rol creado');
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {inicial ? 'Editar rol' : 'Nuevo rol'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Nombre del rol *</label>
                <input {...register('nombre', { required: true })} className="input" placeholder="Ej: Recepcionista" />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">Requerido</p>}
              </div>
              <div className="col-span-2">
                <label className="label">Descripción</label>
                <input {...register('descripcion')} className="input" placeholder="Descripción opcional" />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input {...register('esAdmin')} type="checkbox" className="w-4 h-4 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Acceso de administrador</p>
                <p className="text-xs text-gray-500">Omite todos los controles de permiso</p>
              </div>
            </label>

            <div>
              <p className="label mb-2">Permisos <span className="text-gray-400 font-normal">({seleccionados.size} seleccionados)</span></p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
                {Object.entries(agrupados).map(([modulo, ps]) => {
                  const todosSeleccionados = ps.every(p => seleccionados.has(p.codigo));
                  const algunoSeleccionado = ps.some(p => seleccionados.has(p.codigo));
                  const abierto = expandidos.has(modulo);
                  return (
                    <div key={modulo}>
                      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleModulo(modulo)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            todosSeleccionados
                              ? 'bg-primary-600 border-primary-600'
                              : algunoSeleccionado
                              ? 'bg-primary-200 border-primary-400 dark:bg-primary-900/40 dark:border-primary-600'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {(todosSeleccionados || algunoSeleccionado) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                        <span
                          className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200"
                          onClick={() => toggleExpandido(modulo)}
                        >
                          {MODULO_LABEL[modulo] ?? modulo}
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            {ps.filter(p => seleccionados.has(p.codigo)).length}/{ps.length}
                          </span>
                        </span>
                        <button type="button" onClick={() => toggleExpandido(modulo)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                      {abierto && (
                        <div className="px-4 pb-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/30">
                          {ps.map(p => (
                            <label key={p.codigo} className="flex items-center gap-3 cursor-pointer group">
                              <div
                                onClick={() => togglePermiso(p.codigo)}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                                  seleccionados.has(p.codigo)
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'border-gray-300 dark:border-gray-600 group-hover:border-primary-400'
                                }`}
                              >
                                {seleccionados.has(p.codigo) && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div onClick={() => togglePermiso(p.codigo)} className="flex-1">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.descripcion}</p>
                                <p className="text-xs text-gray-400 font-mono">{p.codigo}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {inicial ? 'Guardar cambios' : 'Crear rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab Usuarios ──────────────────────────────────────────────────────────────

function TabUsuarios() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ abierto: boolean; usuario?: any }>({ abierto: false });

  const { data: usuarios = [], isLoading } = useQuery<any[]>({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.listar(),
  });

  const { data: roles = [] } = useQuery<Rol[]>({
    queryKey: ['roles'],
    queryFn: () => usuariosApi.listarRoles(),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['usuarios'] });

  const toggleEstado = async (u: any) => {
    if (!confirm(`¿Deseas ${u.activo ? 'dar de baja' : 'reactivar'} a ${u.nombre} ${u.apellido}?`)) return;
    try {
      await usuariosApi.cambiarEstado(u.id, !u.activo);
      toast.success(u.activo ? 'Usuario dado de baja' : 'Usuario reactivado');
      invalidar();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const activos   = usuarios.filter(u => u.activo);
  const inactivos = usuarios.filter(u => !u.activo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{activos.length} activos · {inactivos.length} inactivos</p>
        <button type="button" onClick={() => setModal({ abierto: true })} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activos</p>
            </div>
            {activos.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Sin usuarios activos</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {activos.map(u => (
                  <UsuarioRow
                    key={u.id}
                    usuario={u}
                    onEditar={() => setModal({ abierto: true, usuario: u })}
                    onToggle={() => toggleEstado(u)}
                  />
                ))}
              </div>
            )}
          </div>

          {inactivos.length > 0 && (
            <div className="card p-0 overflow-hidden opacity-70">
              <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dados de baja</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {inactivos.map(u => (
                  <UsuarioRow
                    key={u.id}
                    usuario={u}
                    onEditar={() => setModal({ abierto: true, usuario: u })}
                    onToggle={() => toggleEstado(u)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modal.abierto && (
        <ModalUsuario
          inicial={modal.usuario}
          roles={roles}
          onClose={() => setModal({ abierto: false })}
          onSuccess={() => { setModal({ abierto: false }); invalidar(); }}
        />
      )}
    </div>
  );
}

function UsuarioRow({ usuario: u, onEditar, onToggle }: { usuario: any; onEditar: () => void; onToggle: () => void }) {
  const rolNombre = u.roles?.[0]?.nombre ?? u.rol ?? '—';
  const esAdmin   = u.esAdmin;

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        {u.nombre[0]}{u.apellido[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-900 dark:text-white">{u.nombre} {u.apellido}</p>
          {esAdmin
            ? <span className="badge badge-red text-xs">Admin</span>
            : <span className="badge badge-blue text-xs">{rolNombre}</span>
          }
          {!u.activo && <span className="badge badge-gray text-xs">Inactivo</span>}
        </div>
        <p className="text-sm text-gray-500 truncate">{u.email}{u.telefono ? ` · ${u.telefono}` : ''}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onEditar}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            u.activo
              ? 'text-red-600 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-green-600 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          {u.activo ? <><PowerOff className="w-3.5 h-3.5" /> Dar de baja</> : <><Power className="w-3.5 h-3.5" /> Reactivar</>}
        </button>
      </div>
    </div>
  );
}

// ─── Tab Roles ─────────────────────────────────────────────────────────────────

function TabRoles() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ abierto: boolean; rol?: Rol }>({ abierto: false });

  const { data: roles = [], isLoading } = useQuery<Rol[]>({
    queryKey: ['roles'],
    queryFn: () => usuariosApi.listarRoles(),
  });

  const { data: permisos = [] } = useQuery<Permiso[]>({
    queryKey: ['permisos'],
    queryFn: () => usuariosApi.listarPermisos(),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['roles'] });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{roles.length} roles configurados</p>
        <button type="button" onClick={() => setModal({ abierto: true })} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo rol
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map(rol => (
            <RolCard
              key={rol.id}
              rol={rol}
              onEditar={() => setModal({ abierto: true, rol })}
            />
          ))}
          {roles.length === 0 && (
            <p className="col-span-2 text-center text-gray-400 py-12 text-sm">No hay roles creados</p>
          )}
        </div>
      )}

      {modal.abierto && (
        <ModalRol
          inicial={modal.rol}
          permisos={permisos}
          onClose={() => setModal({ abierto: false })}
          onSuccess={() => { setModal({ abierto: false }); invalidar(); }}
        />
      )}
    </div>
  );
}

function RolCard({ rol, onEditar }: { rol: Rol; onEditar: () => void }) {
  const cantPermisos = rol.permisos.length;
  const cantUsuarios = rol._count?.usuarios ?? 0;

  const modulosUnicos = [...new Set(rol.permisos.map(rp => rp.permiso.modulo))];

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            rol.esAdmin ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
          }`}>
            <ShieldCheck className={`w-5 h-5 ${rol.esAdmin ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{rol.nombre}</p>
            {rol.esAdmin && <span className="text-xs text-red-500 font-medium">Acceso total</span>}
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

      {rol.descripcion && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{rol.descripcion}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {cantUsuarios} usuario{cantUsuarios !== 1 ? 's' : ''}
        </span>
        <span>{cantPermisos} permiso{cantPermisos !== 1 ? 's' : ''}</span>
      </div>

      {modulosUnicos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {modulosUnicos.map(m => (
            <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {MODULO_LABEL[m] ?? m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'usuarios' | 'roles';

export default function ProfesionalesPage() {
  const [tab, setTab] = useState<Tab>('usuarios');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserCog className="w-6 h-6 text-primary-600" />
          Usuarios y Roles
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Administrá el equipo y los permisos de acceso</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('usuarios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'usuarios'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios
        </button>
        <button
          type="button"
          onClick={() => setTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'roles'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Roles y permisos
        </button>
      </div>

      {tab === 'usuarios' ? <TabUsuarios /> : <TabRoles />}
    </div>
  );
}
