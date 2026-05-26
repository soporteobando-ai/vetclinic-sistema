import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api';
import MetricaCard from './components/MetricaCard';
import TurnosHoy from './components/TurnosHoy';
import GraficoIngresos from './components/GraficoIngresos';
import AlertasStock from './components/AlertasStock';
import VacunasProximas from './components/VacunasProximas';
import {
  Calendar, Users, PawPrint, Stethoscope,
  TrendingUp, Package, Syringe, BedDouble, Scissors
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const { data: metricas, isLoading } = useQuery({
    queryKey: ['metricas'],
    queryFn: dashboardApi.getMetricas,
    refetchInterval: 30000,
  });

  const hoy = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 capitalize mt-0.5">{hoy}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sistema en línea
          </span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricaCard
          titulo="Turnos hoy"
          valor={metricas?.turnosHoy ?? 0}
          icono={Calendar}
          color="blue"
          loading={isLoading}
          descripcion="agendados para hoy"
        />
        <MetricaCard
          titulo="Consultas hoy"
          valor={metricas?.consultasHoy ?? 0}
          icono={Stethoscope}
          color="green"
          loading={isLoading}
          descripcion="atendidas"
        />
        <MetricaCard
          titulo="Pacientes"
          valor={metricas?.pacientesTotal ?? 0}
          icono={PawPrint}
          color="purple"
          loading={isLoading}
          descripcion="registrados"
        />
        <MetricaCard
          titulo="Clientes"
          valor={metricas?.clientesTotal ?? 0}
          icono={Users}
          color="orange"
          loading={isLoading}
          descripcion="activos"
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricaCard
          titulo="Ingresos del mes"
          valor={metricas?.ingresosMes ?? 0}
          icono={TrendingUp}
          color="green"
          loading={isLoading}
          esDinero
          descripcion="facturado este mes"
        />
        <MetricaCard
          titulo="Grooming activo"
          valor={metricas?.groomingActivo ?? 0}
          icono={Scissors}
          color="pink"
          loading={isLoading}
          descripcion="mascotas en proceso"
        />
        <MetricaCard
          titulo="Internaciones"
          valor={metricas?.internacionesActivas ?? 0}
          icono={BedDouble}
          color="red"
          loading={isLoading}
          descripcion="activas"
        />
        <MetricaCard
          titulo="Stock crítico"
          valor={metricas?.stockCritico ?? 0}
          icono={Package}
          color="yellow"
          loading={isLoading}
          descripcion="productos con stock bajo"
          alerta={metricas?.stockCritico > 0}
        />
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Turnos de hoy - ocupa 2 columnas */}
        <div className="xl:col-span-2">
          <TurnosHoy />
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Alerta vacunas */}
          <VacunasProximas cantidad={metricas?.vacunasProximas ?? 0} />

          {/* Stock crítico */}
          <AlertasStock />
        </div>
      </div>

      {/* Gráfico de ingresos */}
      <GraficoIngresos />
    </div>
  );
}
