import { useForm, useFieldArray } from 'react-hook-form';
import { facturasApi, clientesApi } from '../../../services/api';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function ModalFactura({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clienteId, setClienteId] = useState('');
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: { detalles: [{ descripcion: '', cantidad: 1, precioUnit: 0, subtotal: 0 }], descuento: 0 },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'detalles' });

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-factura', buscarCliente],
    queryFn: () => clientesApi.listar({ buscar: buscarCliente }),
    enabled: buscarCliente.length >= 2,
  });

  const detalles = watch('detalles') || [];
  const descuento = watch('descuento') || 0;
  const subtotal = detalles.reduce((acc: number, d: any) => acc + (Number(d.cantidad) * Number(d.precioUnit)), 0);
  const total = subtotal - Number(descuento);

  const onSubmit = async (data: any) => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const detallesConSubtotal = data.detalles.map((d: any) => ({
        ...d,
        cantidad: Number(d.cantidad),
        precioUnit: Number(d.precioUnit),
        subtotal: Number(d.cantidad) * Number(d.precioUnit),
      }));
      await facturasApi.crear({ ...data, clienteId, detalles: detallesConSubtotal, subtotal, total: total > 0 ? total : 0 });
      onSuccess();
    } finally { setLoading(false); }
  };

  const clienteSeleccionado = clientesData?.clientes?.find((c: any) => c.id === clienteId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nueva factura</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Cliente */}
          <div>
            <label className="label">Cliente *</label>
            {clienteSeleccionado ? (
              <div className="flex items-center justify-between p-2.5 border border-primary-300 dark:border-primary-700 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <span className="text-sm font-medium">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</span>
                <button type="button" onClick={() => { setClienteId(''); setBuscarCliente(''); }} className="text-xs text-red-500">Cambiar</button>
              </div>
            ) : (
              <>
                <input value={buscarCliente} onChange={e => setBuscarCliente(e.target.value)} placeholder="Buscar cliente..." className="input" />
                {clientesData?.clientes?.length > 0 && !clienteId && (
                  <div className="mt-1 border rounded-lg overflow-hidden">
                    {clientesData.clientes.slice(0, 4).map((c: any) => (
                      <button key={c.id} type="button" onClick={() => { setClienteId(c.id); setBuscarCliente(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border-b last:border-0">
                        {c.nombre} {c.apellido} · {c.telefono}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detalles */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Detalle de servicios/productos *</label>
              <button type="button" onClick={() => append({ descripcion: '', cantidad: 1, precioUnit: 0, subtotal: 0 })} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Agregar línea
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <input {...register(`detalles.${idx}.descripcion`, { required: true })} placeholder="Descripción del servicio" className="input col-span-6 text-sm" />
                  <input {...register(`detalles.${idx}.cantidad`, { valueAsNumber: true })} type="number" min="1" className="input col-span-2 text-sm text-center" />
                  <input {...register(`detalles.${idx}.precioUnit`, { valueAsNumber: true })} type="number" step="0.01" placeholder="Precio" className="input col-span-3 text-sm text-right" />
                  <button type="button" onClick={() => remove(idx)} className="col-span-1 w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Descuento ($)</span>
              <input {...register('descuento', { valueAsNumber: true })} type="number" step="0.01" className="input w-28 text-right text-sm py-1" />
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary-600">${(total > 0 ? total : 0).toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div>
            <label className="label">Medio de pago (opcional)</label>
            <select {...register('medioPago')} className="input">
              <option value="">Sin pago inmediato</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA_DEBITO">Tarjeta débito</option>
              <option value="TARJETA_CREDITO">Tarjeta crédito</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="BILLETERA_DIGITAL">Billetera digital</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading || !clienteId} className="btn-primary flex-1 justify-center">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Emitir factura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
