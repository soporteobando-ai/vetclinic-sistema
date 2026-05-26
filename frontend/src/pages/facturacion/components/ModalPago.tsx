import { useForm } from 'react-hook-form';
import { facturasApi } from '../../../services/api';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Factura } from '../../../types';

export default function ModalPago({ factura, onClose, onSuccess }: { factura: Factura; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { monto: factura.total, medioPago: 'EFECTIVO' } });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await facturasApi.registrarPago(factura.id, { ...data, monto: Number(data.monto) });
      onSuccess();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registrar pago</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <p className="font-mono font-bold text-gray-900 dark:text-white">{factura.numero}</p>
          <p className="text-sm text-gray-500">Total: <span className="font-bold text-gray-900 dark:text-white">${factura.total.toLocaleString('es-AR')}</span></p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="label">Monto a cobrar ($)</label>
            <input {...register('monto', { required: true, valueAsNumber: true })} type="number" step="0.01" className="input" />
          </div>
          <div>
            <label className="label">Medio de pago</label>
            <select {...register('medioPago')} className="input">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA_DEBITO">Tarjeta débito</option>
              <option value="TARJETA_CREDITO">Tarjeta crédito</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="BILLETERA_DIGITAL">Billetera digital</option>
              <option value="CUOTAS">Cuotas</option>
              <option value="SEGURO">Seguro</option>
            </select>
          </div>
          <div>
            <label className="label">Referencia / comprobante</label>
            <input {...register('referencia')} className="input" placeholder="N° transferencia, recibo..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Registrar pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
