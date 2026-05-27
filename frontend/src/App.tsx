import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientesPage from './pages/pacientes/ClientesPage';
import ClienteDetallePage from './pages/pacientes/ClienteDetallePage';
import MascotasPage from './pages/pacientes/MascotasPage';
import MascotaDetallePage from './pages/pacientes/MascotaDetallePage';
import AgendaPage from './pages/agenda/AgendaPage';
import ConsultaPage from './pages/clinico/ConsultaPage';
import EsteticaPage from './pages/estetica/EsteticaPage';
import InventarioPage from './pages/inventario/InventarioPage';
import FacturasPage from './pages/facturacion/FacturasPage';
import ReportesPage from './pages/reportes/ReportesPage';
import ProfesionalesPage from './pages/profesionales/ProfesionalesPage';
import VeterinariasPage from './pages/veterinarias/VeterinariasPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const { modoOscuro } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modoOscuro);
  }, [modoOscuro]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="clientes/:id" element={<ClienteDetallePage />} />
        <Route path="mascotas" element={<MascotasPage />} />
        <Route path="mascotas/:id" element={<MascotaDetallePage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="consultas/:turnoId" element={<ConsultaPage />} />
        <Route path="estetica" element={<EsteticaPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="facturacion" element={<FacturasPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="profesionales" element={<ProfesionalesPage />} />
        <Route path="veterinarias" element={<VeterinariasPage />} />
      </Route>
    </Routes>
  );
}
