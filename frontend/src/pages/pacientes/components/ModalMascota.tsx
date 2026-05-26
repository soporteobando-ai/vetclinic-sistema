import { useForm } from 'react-hook-form';
import { mascotasApi } from '../../../services/api';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  clienteId: string;
  onClose: () => void;
  onSuccess: () => void;
  mascotaInicial?: any;
}

const formatearFechaInput = (iso?: string | null): string => {
  if (!iso) return '';
  // El input type="date" requiere YYYY-MM-DD exacto
  return iso.split('T')[0];
};

export default function ModalMascota({ clienteId, onClose, onSuccess, mascotaInicial }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: mascotaInicial
      ? { ...mascotaInicial, fechaNacimiento: formatearFechaInput(mascotaInicial.fechaNacimiento) }
      : { clienteId },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (mascotaInicial?.id) {
        await mascotasApi.actualizar(mascotaInicial.id, data);
        toast.success('Mascota actualizada correctamente');
      } else {
        await mascotasApi.crear({ ...data, clienteId });
        toast.success('Mascota registrada correctamente');
      }
      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al guardar mascota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mascotaInicial ? 'Editar mascota' : 'Nueva mascota'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input {...register('nombre', { required: true })} className="input" placeholder="Max" />
            </div>
            <div>
              <label className="label">Especie *</label>
              <select {...register('especie', { required: true })} className="input">
                <option value="">Seleccionar...</option>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Raza</label>
              <input {...register('raza')} className="input" placeholder="Labrador" />
            </div>
            <div>
              <label className="label">Sexo *</label>
              <select {...register('sexo', { required: true })} className="input">
                <option value="">Seleccionar...</option>
                <option value="MACHO">Macho</option>
                <option value="HEMBRA">Hembra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de nacimiento</label>
              <input {...register('fechaNacimiento')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Peso (kg)</label>
              <input {...register('peso', { valueAsNumber: true })} type="number" step="0.1" className="input" placeholder="5.2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Color</label>
              <input {...register('color')} className="input" placeholder="Marrón y blanco" />
            </div>
            <div>
              <label className="label">Microchip</label>
              <input {...register('microchip')} className="input" placeholder="985112345678901" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input {...register('esterilizado')} type="checkbox" id="esterilizado" className="w-4 h-4 text-primary-600 rounded" />
            <label htmlFor="esterilizado" className="text-sm text-gray-700 dark:text-gray-300">Esterilizado/a</label>
          </div>

          <div>
            <label className="label">Alergias conocidas</label>
            <input {...register('alergias')} className="input" placeholder="Polvo, ácaros..." />
          </div>

          <div>
            <label className="label">Condiciones crónicas</label>
            <textarea {...register('condicionesCronicas')} className="input resize-none" rows={2} placeholder="Diabetes, displasia de cadera..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mascotaInicial ? 'Guardar cambios' : 'Registrar mascota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
