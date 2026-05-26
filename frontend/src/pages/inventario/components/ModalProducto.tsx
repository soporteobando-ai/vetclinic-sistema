import { useForm } from 'react-hook-form';
import { inventarioApi } from '../../../services/api';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function ModalProducto({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { stockMinimo: 5, stockActual: 0, precio: 0, unidad: 'unidad' } });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try { await inventarioApi.crear(data); onSuccess(); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo producto</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input {...register('nombre', { required: true })} className="input" placeholder="Amoxicilina 250mg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoría *</label>
              <select {...register('categoria', { required: true })} className="input">
                <option value="MEDICAMENTO">Medicamento</option>
                <option value="PRODUCTO_ESTETICA">Estética</option>
                <option value="ACCESORIO">Accesorio</option>
                <option value="ALIMENTO">Alimento</option>
                <option value="INSUMO">Insumo</option>
              </select>
            </div>
            <div>
              <label className="label">Unidad</label>
              <select {...register('unidad')} className="input">
                <option value="unidad">Unidad</option>
                <option value="caja">Caja</option>
                <option value="blister">Blíster</option>
                <option value="litro">Litro</option>
                <option value="kg">Kilogramo</option>
                <option value="ml">Mililitro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Marca / Laboratorio</label>
              <input {...register('marca')} className="input" placeholder="Calier" />
            </div>
            <div>
              <label className="label">Proveedor</label>
              <input {...register('proveedor')} className="input" placeholder="DistribuVet" />
            </div>
          </div>
          <div>
            <label className="label">Principio activo</label>
            <input {...register('principioActivo')} className="input" placeholder="Amoxicilina trihidrato" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Stock actual</label>
              <input {...register('stockActual', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div>
              <label className="label">Stock mínimo</label>
              <input {...register('stockMinimo', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div>
              <label className="label">Precio ($)</label>
              <input {...register('precio', { valueAsNumber: true })} type="number" step="0.01" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Vencimiento</label>
            <input {...register('vencimiento')} type="date" className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Crear producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
