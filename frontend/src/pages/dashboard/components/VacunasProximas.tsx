import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../services/api';
import { Syringe } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function VacunasProximas({ cantidad }: { cantidad: number }) {
  const { data: vacunas = [], isLoading } = useQuery({
    queryKey: ['vacunas-proximas'],
    queryFn: dashboardApi.getVacunasProximas,
    enabled: cantidad > 0,
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Syringe className="w-4 h-4 text-blue-500" />
          Vacunas próximas
        </h2>
        {cantidad > 0 && <span className="badge badge-blue">{cantidad}</span>}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}
        </div>
      ) : vacunas.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <Syringe className="w-8 h-8 mx-auto mb-1 opacity-30" />
          <p className="text-sm">Sin vacunas próximas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vacunas.slice(0, 5).map((v: any) => {
            const dias = differenceInDays(new Date(v.proximaDosis), new Date());
            return (
              <div key={v.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {v.mascota?.nombre} — {v.nombre}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {v.mascota?.cliente?.nombre} {v.mascota?.cliente?.apellido}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`badge ${dias <= 3 ? 'badge-red' : 'badge-blue'}`}>
                    {dias === 0 ? 'Hoy' : `${dias}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
