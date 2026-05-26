import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usuariosApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import { UserCog, Plus, Pencil, X, Check, Loader2, Power, PowerOff } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'VETERINARIO',     label: 'Veterinario/a' },
  { value: 'ADMIN',           label: 'Administrador/a' },
  { value: 'RECEPCIONISTA',   label: 'Recepcionista' },
  { value: 'ESTILISTA',       label: 'Estilista / Groomer' },
];

const rolColor: Record<string, string> = {
  VETERINARIO:   'badge-blue',
  ADMIN:         'badge-red',
  RECEPCIONISTA: 'badge-yellow',
  ESTILISTA:     'badge-purple',
};

interface ModalProps {
  inicial?: any;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalProfesional({ inicial, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: inicial
      ? { nombre: inicial.nombre, apellido: inicial.apellido, email: inicial.email, rol: inicial.rol, telefono: inicial.telefono || '' }
      : { rol: 'VETERINARIO' },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (inicial?.id) {
        await usuariosApi.actualizar(inicial.id, data);
        toast.success('Profesional actualizado');
      } else {
        await usuariosApi.crear(data);
        toast.success('Profesional registrado. Contraseña inicial: Veterinaria123');
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
            {inicial ? 'Editar profesional' : 'Nuevo profesional'}
          </h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
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
              <label className="label">Rol *</label>
              <select {...register('rol', { required: true })} className="input">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="11-1234-5678" />
            </div>
          </div>

          {!inicial && (
            <div>
              <label className="label">Contraseña</label>
              <input {...register('password')} type="password" className="input" placeholder="Dejar vacío = Veterinaria123" />
              <p className="text-xs text-gray-400 mt-1">Si no ingresás contraseña, se usará "Veterinaria123"</p>
            </div>
          )}

          {inicial && (
            <div>
              <label className="label">Nueva contraseña</label>
              <input {...register('password')} type="password" className="input" placeholder="Dejar vacío para no cambiar" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {inicial ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfesionalesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ abierto: boolean; profesional?: any }>({ abierto: false });

  const { data: profesionales = [], isLoading } = useQuery<any[]>({
    queryKey: ['profesionales'],
    queryFn: () => usuariosApi.listar(),
  });

  const invalidar = () => qc.invalidateQueries({ queryKey: ['profesionales'] });

  const toggleEstado = async (prof: any) => {
    const accion = prof.activo ? 'dar de baja' : 'reactivar';
    if (!confirm(`¿Deseas ${accion} a ${prof.nombre} ${prof.apellido}?`)) return;
    try {
      await usuariosApi.cambiarEstado(prof.id, !prof.activo);
      toast.success(prof.activo ? 'Profesional dado de baja' : 'Profesional reactivado');
      invalidar();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const activos   = profesionales.filter(p => p.activo);
  const inactivos = profesionales.filter(p => !p.activo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary-600" />
            Profesionales
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{activos.length} activos · {inactivos.length} inactivos</p>
        </div>
        <button onClick={() => setModal({ abierto: true })} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo profesional
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Activos */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Profesionales activos</h2>
            </div>
            {activos.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Sin profesionales activos</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {activos.map(prof => (
                  <ProfesionalRow
                    key={prof.id}
                    prof={prof}
                    onEditar={() => setModal({ abierto: true, profesional: prof })}
                    onToggleEstado={() => toggleEstado(prof)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Inactivos */}
          {inactivos.length > 0 && (
            <div className="card p-0 overflow-hidden opacity-70">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-500">Dados de baja</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {inactivos.map(prof => (
                  <ProfesionalRow
                    key={prof.id}
                    prof={prof}
                    onEditar={() => setModal({ abierto: true, profesional: prof })}
                    onToggleEstado={() => toggleEstado(prof)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modal.abierto && (
        <ModalProfesional
          inicial={modal.profesional}
          onClose={() => setModal({ abierto: false })}
          onSuccess={() => { setModal({ abierto: false }); invalidar(); }}
        />
      )}
    </div>
  );
}

function ProfesionalRow({ prof, onEditar, onToggleEstado }: { prof: any; onEditar: () => void; onToggleEstado: () => void }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
        {prof.nombre[0]}{prof.apellido[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white">
            {prof.nombre} {prof.apellido}
          </p>
          <span className={`badge ${rolColor[prof.rol] || 'badge-gray'} text-xs`}>
            {ROLES.find(r => r.value === prof.rol)?.label || prof.rol}
          </span>
          {!prof.activo && <span className="badge badge-gray text-xs">Inactivo</span>}
        </div>
        <p className="text-sm text-gray-500 truncate">{prof.email}{prof.telefono ? ` · ${prof.telefono}` : ''}</p>
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
          onClick={onToggleEstado}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            prof.activo
              ? 'text-red-600 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-green-600 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
        >
          {prof.activo ? <><PowerOff className="w-3.5 h-3.5" /> Dar de baja</> : <><Power className="w-3.5 h-3.5" /> Reactivar</>}
        </button>
      </div>
    </div>
  );
}
