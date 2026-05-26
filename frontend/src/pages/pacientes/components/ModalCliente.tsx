import { useForm } from 'react-hook-form';
import { clientesApi } from '../../../services/api';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  clienteInicial?: any;
}

export default function ModalCliente({ onClose, onSuccess, clienteInicial }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: clienteInicial || {},
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (clienteInicial?.id) {
        await clientesApi.actualizar(clienteInicial.id, data);
        toast.success('Cliente actualizado correctamente');
      } else {
        await clientesApi.crear(data);
        toast.success('Cliente registrado correctamente');
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {clienteInicial ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input {...register('nombre', { required: true })} className="input" placeholder="María" />
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input {...register('apellido', { required: true })} className="input" placeholder="García" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">DNI</label>
              <input {...register('dni')} className="input" placeholder="12345678" />
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input {...register('telefono', { required: true })} className="input" placeholder="11-1234-5678" />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" placeholder="maria@email.com" />
          </div>

          <div>
            <label className="label">Dirección</label>
            <input {...register('direccion')} className="input" placeholder="Av. Corrientes 1234" />
          </div>

          <div>
            <label className="label">Ciudad</label>
            <input {...register('ciudad')} className="input" placeholder="Buenos Aires" />
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea {...register('notas')} className="input resize-none" rows={3} placeholder="Observaciones adicionales..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {clienteInicial ? 'Guardar cambios' : 'Registrar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
