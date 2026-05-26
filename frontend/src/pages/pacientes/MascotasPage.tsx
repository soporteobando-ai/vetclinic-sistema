import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mascotasApi } from '../../services/api';
import { Mascota } from '../../types';
import { Search, PawPrint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const especieEmoji: Record<string, string> = {
  PERRO: '🐕', GATO: '🐈', AVE: '🦜', CONEJO: '🐇',
  HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

export default function MascotasPage() {
  const [buscar, setBuscar] = useState('');
  const [especie, setEspecie] = useState('');
  const navigate = useNavigate();

  const { data: mascotas = [], isLoading } = useQuery<Mascota[]>({
    queryKey: ['mascotas', buscar, especie],
    queryFn: () => mascotasApi.listar({ buscar, especie }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mascotas</h1>
        <p className="text-gray-500 text-sm mt-0.5">{mascotas.length} pacientes registrados</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por nombre, raza o microchip..."
            className="input pl-9"
          />
        </div>
        <select value={especie} onChange={e => setEspecie(e.target.value)} className="input w-44">
          <option value="">Todas las especies</option>
          <option value="PERRO">Perros</option>
          <option value="GATO">Gatos</option>
          <option value="AVE">Aves</option>
          <option value="CONEJO">Conejos</option>
          <option value="HAMSTER">Hámsters</option>
          <option value="REPTIL">Reptiles</option>
          <option value="OTRO">Otros</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-36 animate-pulse bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : mascotas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <PawPrint className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p>No se encontraron mascotas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mascotas.map(m => (
            <div
              key={m.id}
              className="card cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all"
              onClick={() => navigate(`/mascotas/${m.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{especieEmoji[m.especie]}</div>
                <span className={`badge ${m.sexo === 'MACHO' ? 'badge-blue' : 'badge-purple'}`}>
                  {m.sexo === 'MACHO' ? '♂ Macho' : '♀ Hembra'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{m.nombre}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{m.raza || m.especie}</p>
              {m.cliente && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Dueño: {m.cliente.nombre} {m.cliente.apellido}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-3">
                {m.peso && <span className="badge badge-gray">{m.peso}kg</span>}
                {m.esterilizado && <span className="badge badge-green">Esterilizado</span>}
                {m.alergias && <span className="badge badge-red">Alergias</span>}
                {m.microchip && <span className="badge badge-blue">Microchip</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
