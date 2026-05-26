import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../services/api';
import { Package, AlertTriangle } from 'lucide-react';
import { Producto } from '../../../types';

export default function AlertasStock() {
  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ['alertas-stock'],
    queryFn: dashboardApi.getAlertasStock,
  });

  const criticos = productos.slice(0, 6);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          Stock crítico
        </h2>
        {criticos.length > 0 && (
          <span className="badge badge-yellow">{criticos.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
        </div>
      ) : criticos.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-1 opacity-30" />
          <p className="text-sm">Todo el stock está OK</p>
        </div>
      ) : (
        <div className="space-y-2">
          {criticos.map(p => (
            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.nombre}</p>
                <p className="text-xs text-gray-500 capitalize">{p.categoria.toLowerCase().replace('_', ' ')}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{p.stockActual}</p>
                <p className="text-xs text-gray-400">mín: {p.stockMinimo}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
