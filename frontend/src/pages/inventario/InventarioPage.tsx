import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '../../services/api';
import { Producto, CategoriaProducto } from '../../types';
import { Package, Plus, AlertTriangle, Search, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalProducto from './components/ModalProducto';
import ModalMovimiento from './components/ModalMovimiento';

const CATEGORIAS: { value: CategoriaProducto | ''; label: string }[] = [
  { value: '',                label: 'Todas' },
  { value: 'MEDICAMENTO',     label: 'Medicamentos' },
  { value: 'PRODUCTO_ESTETICA', label: 'Estética' },
  { value: 'ACCESORIO',       label: 'Accesorios' },
  { value: 'ALIMENTO',        label: 'Alimentos' },
  { value: 'INSUMO',          label: 'Insumos' },
];

const catColors: Record<CategoriaProducto, string> = {
  MEDICAMENTO:      'badge-blue',
  PRODUCTO_ESTETICA:'badge-purple',
  ACCESORIO:        'badge-gray',
  ALIMENTO:         'badge-green',
  INSUMO:           'badge-yellow',
};

export default function InventarioPage() {
  const [buscar, setBuscar] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto | ''>('');
  const [soloCritico, setSoloCritico] = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState<Producto | null>(null);
  const qc = useQueryClient();

  const { data: productos = [], isLoading } = useQuery<Producto[]>({
    queryKey: ['inventario', buscar, categoria, soloCritico],
    queryFn: () => inventarioApi.listar({ buscar, categoria, stockCritico: soloCritico }),
  });

  const criticos = productos.filter(p => p.stockActual <= p.stockMinimo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-gray-500 text-sm mt-0.5">{productos.length} productos · {criticos.length} con stock bajo</p>
        </div>
        <button onClick={() => setModalProducto(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      {/* Alerta stock crítico */}
      {criticos.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
              {criticos.length} producto{criticos.length > 1 ? 's' : ''} con stock bajo
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              {criticos.map(p => p.nombre).join(', ')}
            </p>
          </div>
          <button onClick={() => setSoloCritico(!soloCritico)} className="text-xs text-yellow-700 dark:text-yellow-400 underline hover:no-underline">
            {soloCritico ? 'Ver todos' : 'Ver solo críticos'}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por nombre, marca..." className="input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIAS.map(c => (
            <button
              key={c.value}
              onClick={() => setCategoria(c.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoria === c.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Producto</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Categoría</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Stock</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Precio</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">Vencimiento</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : productos.map(p => {
                const esCritico = p.stockActual <= p.stockMinimo;
                const vencido = p.vencimiento && new Date(p.vencimiento) < new Date();
                const venceProx = p.vencimiento && !vencido &&
                  (new Date(p.vencimiento).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;

                return (
                  <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${esCritico ? 'bg-yellow-50/50 dark:bg-yellow-900/5' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.nombre}</p>
                      <p className="text-xs text-gray-400">{p.marca} {p.principioActivo && `· ${p.principioActivo}`}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${catColors[p.categoria]}`}>
                        {p.categoria.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${esCritico ? 'text-yellow-600' : 'text-gray-900 dark:text-white'}`}>
                          {esCritico && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                          {p.stockActual} {p.unidad}
                        </span>
                        <span className="text-xs text-gray-400">mín: {p.stockMinimo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ${p.precio.toLocaleString('es-AR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.vencimiento ? (
                        <span className={`text-xs font-medium ${vencido ? 'text-red-600' : venceProx ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {vencido ? '⛔ Vencido: ' : venceProx ? '⚠️ ' : ''}
                          {new Date(p.vencimiento).toLocaleDateString('es-AR')}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setModalMovimiento(p)}
                          className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-600 flex items-center justify-center"
                          title="Registrar movimiento"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && productos.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {modalProducto && (
        <ModalProducto
          onClose={() => setModalProducto(false)}
          onSuccess={() => { setModalProducto(false); qc.invalidateQueries({ queryKey: ['inventario'] }); toast.success('Producto creado'); }}
        />
      )}
      {modalMovimiento && (
        <ModalMovimiento
          producto={modalMovimiento}
          onClose={() => setModalMovimiento(null)}
          onSuccess={() => { setModalMovimiento(null); qc.invalidateQueries({ queryKey: ['inventario'] }); toast.success('Movimiento registrado'); }}
        />
      )}
    </div>
  );
}
