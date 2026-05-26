import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturasApi } from '../../services/api';
import { Factura, EstadoFactura } from '../../types';
import { Receipt, Plus, DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalFactura from './components/ModalFactura';
import ModalPago from './components/ModalPago';

const estadoConfig: Record<EstadoFactura, { label: string; clase: string }> = {
  PENDIENTE: { label: 'Pendiente', clase: 'badge-yellow' },
  PAGADA:    { label: 'Pagada',    clase: 'badge-green' },
  ANULADA:   { label: 'Anulada',   clase: 'badge-red' },
  PARCIAL:   { label: 'Parcial',   clase: 'badge-blue' },
};

export default function FacturasPage() {
  const [modalFactura, setModalFactura] = useState(false);
  const [modalPago, setModalPago] = useState<Factura | null>(null);
  const [estado, setEstado] = useState<EstadoFactura | ''>('');
  const [verCaja, setVerCaja] = useState(false);
  const qc = useQueryClient();

  const { data: facturas = [], isLoading } = useQuery<Factura[]>({
    queryKey: ['facturas', estado],
    queryFn: () => facturasApi.listar({ estado }),
  });

  const { data: caja } = useQuery({
    queryKey: ['caja-diaria'],
    queryFn: facturasApi.cajaDiaria,
    enabled: verCaja,
  });

  const anular = useMutation({
    mutationFn: (id: string) => facturasApi.anular(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['facturas'] }); toast.success('Factura anulada'); },
  });

  const totalPendiente = facturas.filter(f => f.estado === 'PENDIENTE' || f.estado === 'PARCIAL').reduce((a, f) => a + f.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturación</h1>
          <p className="text-gray-500 text-sm">{facturas.length} facturas · ${totalPendiente.toLocaleString('es-AR')} pendiente de cobro</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVerCaja(!verCaja)} className="btn-ghost">
            <DollarSign className="w-4 h-4" /> Caja diaria
          </button>
          <button onClick={() => setModalFactura(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nueva factura
          </button>
        </div>
      </div>

      {/* Caja diaria */}
      {verCaja && caja && (
        <div className="card bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Caja del día
          </h3>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs text-green-600">Total del día</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                ${caja.totalCaja?.toLocaleString('es-AR')}
              </p>
            </div>
            {Object.entries(caja.porMedioPago || {}).map(([medio, monto]: any) => (
              <div key={medio}>
                <p className="text-xs text-gray-500">{medio.replace(/_/g, ' ')}</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">${monto.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros estado */}
      <div className="flex gap-2">
        {[{ v: '', l: 'Todas' }, { v: 'PENDIENTE', l: 'Pendientes' }, { v: 'PAGADA', l: 'Pagadas' }, { v: 'PARCIAL', l: 'Parciales' }].map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setEstado(v as any)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              estado === v ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Lista de facturas */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">N° Factura</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Cliente</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Total</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{[1,2,3,4,5,6].map(j => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : facturas.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No hay facturas</p></td></tr>
              ) : facturas.map(f => (
                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{f.numero}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{f.cliente?.nombre} {f.cliente?.apellido}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">${f.total.toLocaleString('es-AR')}</span>
                    {f.descuento > 0 && <p className="text-xs text-green-600">-${f.descuento.toLocaleString('es-AR')} desc.</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${estadoConfig[f.estado].clase}`}>{estadoConfig[f.estado].label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{new Date(f.fechaEmision).toLocaleDateString('es-AR')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 justify-end">
                      {(f.estado === 'PENDIENTE' || f.estado === 'PARCIAL') && (
                        <button onClick={() => setModalPago(f)} className="btn-ghost px-2 py-1 text-xs">
                          <CreditCard className="w-3 h-3" /> Cobrar
                        </button>
                      )}
                      {f.estado === 'PENDIENTE' && (
                        <button onClick={() => anular.mutate(f.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalFactura && (
        <ModalFactura
          onClose={() => setModalFactura(false)}
          onSuccess={() => { setModalFactura(false); qc.invalidateQueries({ queryKey: ['facturas'] }); toast.success('Factura creada'); }}
        />
      )}
      {modalPago && (
        <ModalPago
          factura={modalPago}
          onClose={() => setModalPago(null)}
          onSuccess={() => { setModalPago(null); qc.invalidateQueries({ queryKey: ['facturas'] }); toast.success('Pago registrado'); }}
        />
      )}
    </div>
  );
}
