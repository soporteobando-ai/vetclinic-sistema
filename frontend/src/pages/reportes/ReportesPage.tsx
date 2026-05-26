import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, TrendingUp, PawPrint, Download } from 'lucide-react';

const COLORES = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'];

export default function ReportesPage() {
  const { data: ingresos = [] } = useQuery({
    queryKey: ['ingresos-periodo'],
    queryFn: dashboardApi.getIngresosPorPeriodo,
  });

  const serviciosMock = [
    { nombre: 'Consulta veterinaria', cantidad: 48 },
    { nombre: 'Baño y corte', cantidad: 35 },
    { nombre: 'Vacunación', cantidad: 22 },
    { nombre: 'Grooming', cantidad: 19 },
    { nombre: 'Guardería', cantidad: 12 },
    { nombre: 'Cirugía', cantidad: 5 },
  ];

  const especiesMock = [
    { name: 'Perros', value: 65 },
    { name: 'Gatos', value: 28 },
    { name: 'Otros', value: 7 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Reportes y Estadísticas
          </h1>
          <p className="text-gray-500 text-sm">Métricas del sistema</p>
        </div>
        <button className="btn-ghost">
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Ingresos por mes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Ingresos mensuales
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ingresos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString('es-AR')}`, 'Ingresos']} />
              <Bar dataKey="ingresos" fill="#22c55e" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Servicios más solicitados */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Servicios más solicitados
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={serviciosMock} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis dataKey="nombre" type="category" width={140} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por especie */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-purple-500" />
            Pacientes por especie
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={especiesMock}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {especiesMock.map((_, i) => (
                  <Cell key={i} fill={COLORES[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Porcentaje']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumen de métricas */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen del período</h2>
          <div className="space-y-3">
            {[
              { label: 'Consultas veterinarias', valor: '48', color: 'text-green-600' },
              { label: 'Servicios de grooming', valor: '54', color: 'text-purple-600' },
              { label: 'Vacunas aplicadas', valor: '31', color: 'text-blue-600' },
              { label: 'Internaciones', valor: '3', color: 'text-red-600' },
              { label: 'Tasa de ocupación agenda', valor: '87%', color: 'text-primary-600' },
              { label: 'Tasa de cancelación', valor: '8%', color: 'text-orange-600' },
              { label: 'Nuevos clientes', valor: '12', color: 'text-cyan-600' },
            ].map(({ label, valor, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                <span className={`text-lg font-bold ${color}`}>{valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
