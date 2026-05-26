import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function GraficoIngresos() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['ingresos-periodo'],
    queryFn: dashboardApi.getIngresosPorPeriodo,
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ingresos mensuales</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Últimos 6 meses</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
            <XAxis
              dataKey="mes"
              className="text-xs"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Ingresos']}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#colorIngresos)"
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
