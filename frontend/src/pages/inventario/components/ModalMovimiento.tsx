import { useForm } from 'react-hook-form';
import { inventarioApi } from '../../../services/api';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Producto } from '../../../types';

export default function ModalMovimiento({ producto, onClose, onSuccess }: { producto: Producto; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { tipo: 'ENTRADA', cantidad: 1 } });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await inventarioApi.registrarMovimiento({ ...data, productoId: producto.id, cantidad: Number(data.cantidad) });
      onSuccess();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Movimiento de stock</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{producto.nombre}</p>
          <p className="text-sm text-gray-500">Stock actual: <span className="font-bold">{producto.stockActual} {producto.unidad}</span></p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Tipo de movimiento</label>
            <select {...register('tipo')} className="input">
              <option value="ENTRADA">Entrada (compra / reposición)</option>
              <option value="SALIDA">Salida (venta / consumo)</option>
              <option value="AJUSTE">Ajuste de inventario</option>
              <option value="VENCIMIENTO">Baja por vencimiento</option>
            </select>
          </div>
          <div>
            <label className="label">Cantidad *</label>
            <input {...register('cantidad', { required: true, min: 1 })} type="number" className="input" placeholder="1" />
          </div>
          <div>
            <label className="label">Motivo / referencia</label>
            <input {...register('motivo')} className="input" placeholder="Factura #1234, servicio grooming..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
