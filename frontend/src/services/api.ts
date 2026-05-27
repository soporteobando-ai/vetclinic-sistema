import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Endpoints reutilizables
export const dashboardApi = {
  getMetricas: () => api.get('/dashboard/metricas').then(r => r.data),
  getTurnosHoy: () => api.get('/dashboard/turnos-hoy').then(r => r.data),
  getActividadReciente: () => api.get('/dashboard/actividad-reciente').then(r => r.data),
  getAlertasStock: () => api.get('/dashboard/alertas-stock').then(r => r.data),
  getVacunasProximas: () => api.get('/dashboard/vacunas-proximas').then(r => r.data),
  getIngresosPorPeriodo: () => api.get('/dashboard/ingresos-periodo').then(r => r.data),
};

export const clientesApi = {
  listar: (params?: any) => api.get('/clientes', { params }).then(r => r.data),
  obtener: (id: string) => api.get(`/clientes/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/clientes', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/clientes/${id}`, data).then(r => r.data),
  eliminar: (id: string) => api.delete(`/clientes/${id}`).then(r => r.data),
};

export const mascotasApi = {
  listar: (params?: any) => api.get('/mascotas', { params }).then(r => r.data),
  obtener: (id: string) => api.get(`/mascotas/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/mascotas', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/mascotas/${id}`, data).then(r => r.data),
  historial: (id: string) => api.get(`/mascotas/${id}/historial`).then(r => r.data),
};

export const turnosApi = {
  listar: (params?: any) => api.get('/turnos', { params }).then(r => r.data),
  calendario: (inicio: string, fin: string) => api.get('/turnos/calendario', { params: { inicio, fin } }).then(r => r.data),
  obtener: (id: string) => api.get(`/turnos/${id}`).then(r => r.data),
  verificarConflicto: (data: any) => api.post('/turnos/verificar-conflicto', data).then(r => r.data),
  crear: (data: any) => api.post('/turnos', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/turnos/${id}`, data).then(r => r.data),
  actualizarEstado: (id: string, estado: string, notas?: string) => api.patch(`/turnos/${id}/estado`, { estado, notas }).then(r => r.data),
  cancelar: (id: string, motivo?: string) => api.patch(`/turnos/${id}/cancelar`, { motivo }).then(r => r.data),
};

export const consultasApi = {
  crear: (data: any) => api.post('/consultas', data).then(r => r.data),
  obtener: (id: string) => api.get(`/consultas/${id}`).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/consultas/${id}`, data).then(r => r.data),
  completar: (id: string) => api.patch(`/consultas/${id}/completar`).then(r => r.data),
  agregarReceta: (consultaId: string, data: any) => api.post(`/consultas/${consultaId}/recetas`, data).then(r => r.data),
  editarReceta: (recetaId: string, data: any) => api.put(`/consultas/recetas/${recetaId}`, data).then(r => r.data),
  eliminarReceta: (recetaId: string) => api.delete(`/consultas/recetas/${recetaId}`).then(r => r.data),
  agregarEstudio: (consultaId: string, data: any) => api.post(`/consultas/${consultaId}/estudios`, data).then(r => r.data),
  editarEstudio: (estudioId: string, data: any) => api.put(`/consultas/estudios/${estudioId}`, data).then(r => r.data),
  eliminarEstudio: (estudioId: string) => api.delete(`/consultas/estudios/${estudioId}`).then(r => r.data),
  registrarVacuna: (data: any) => api.post('/consultas/vacunas', data).then(r => r.data),
  registrarDesparasitacion: (data: any) => api.post('/consultas/desparasitaciones', data).then(r => r.data),
};

export const inventarioApi = {
  listar: (params?: any) => api.get('/inventario', { params }).then(r => r.data),
  crear: (data: any) => api.post('/inventario', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/inventario/${id}`, data).then(r => r.data),
  registrarMovimiento: (data: any) => api.post('/inventario/movimiento', data).then(r => r.data),
  vencimientos: () => api.get('/inventario/vencimientos').then(r => r.data),
};

export const facturasApi = {
  listar: (params?: any) => api.get('/facturas', { params }).then(r => r.data),
  obtener: (id: string) => api.get(`/facturas/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/facturas', data).then(r => r.data),
  registrarPago: (facturaId: string, data: any) => api.post(`/facturas/${facturaId}/pago`, data).then(r => r.data),
  anular: (id: string) => api.patch(`/facturas/${id}/anular`).then(r => r.data),
  cajaDiaria: () => api.get('/facturas/caja-diaria').then(r => r.data),
};

export const usuariosApi = {
  listar: (params?: any) => api.get('/usuarios', { params }).then(r => r.data),
  obtener: (id: string) => api.get(`/usuarios/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/usuarios', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/usuarios/${id}`, data).then(r => r.data),
  cambiarEstado: (id: string, activo: boolean) => api.patch(`/usuarios/${id}/estado`, { activo }).then(r => r.data),
  listarRoles: () => api.get('/usuarios/roles/list').then(r => r.data),
  crearRol: (data: any) => api.post('/usuarios/roles', data).then(r => r.data),
  actualizarRol: (id: string, data: any) => api.put(`/usuarios/roles/${id}`, data).then(r => r.data),
  listarPermisos: () => api.get('/usuarios/permisos/list').then(r => r.data),
};

export const veterinariasApi = {
  listar: () => api.get('/veterinarias').then(r => r.data),
  obtener: (id: string) => api.get(`/veterinarias/${id}`).then(r => r.data),
  crear: (data: any) => api.post('/veterinarias', data).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/veterinarias/${id}`, data).then(r => r.data),
  toggleActivo: (id: string, activo: boolean) => api.patch(`/veterinarias/${id}/estado`, { activo }).then(r => r.data),
};

export const esteticaApi = {
  listar: (params?: any) => api.get('/estetica', { params }).then(r => r.data),
  crear: (data: any) => api.post('/estetica', data).then(r => r.data),
  obtener: (id: string) => api.get(`/estetica/${id}`).then(r => r.data),
  actualizar: (id: string, data: any) => api.put(`/estetica/${id}`, data).then(r => r.data),
  actualizarEstado: (id: string, estadoGrooming: string) => api.patch(`/estetica/${id}/estado`, { estadoGrooming }).then(r => r.data),
};
