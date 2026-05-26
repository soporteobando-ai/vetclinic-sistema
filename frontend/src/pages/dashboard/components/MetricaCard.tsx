import { LucideIcon } from 'lucide-react';

type Color = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'pink';

const colores: Record<Color, { bg: string; icon: string; text: string }> = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300',   text: 'text-blue-600 dark:text-blue-400' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300', text: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',icon: 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300',text: 'text-purple-600 dark:text-purple-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',icon: 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300',text: 'text-orange-600 dark:text-orange-400' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',     icon: 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300',       text: 'text-red-600 dark:text-red-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20',icon: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300',text: 'text-yellow-600 dark:text-yellow-400' },
  pink:   { bg: 'bg-pink-50 dark:bg-pink-900/20',   icon: 'bg-pink-100 dark:bg-pink-800 text-pink-600 dark:text-pink-300',   text: 'text-pink-600 dark:text-pink-400' },
};

interface Props {
  titulo: string;
  valor: number;
  icono: LucideIcon;
  color: Color;
  loading?: boolean;
  descripcion?: string;
  esDinero?: boolean;
  alerta?: boolean;
}

export default function MetricaCard({ titulo, valor, icono: Icono, color, loading, descripcion, esDinero, alerta }: Props) {
  const c = colores[color];

  const formatearValor = (v: number) => {
    if (esDinero) return `$${v.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
    return v.toLocaleString('es-AR');
  };

  return (
    <div className={`card relative overflow-hidden ${alerta ? 'border-yellow-300 dark:border-yellow-700' : ''}`}>
      {alerta && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-yellow-400" />
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{titulo}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatearValor(valor)}
            </p>
          )}
          {descripcion && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{descripcion}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          <Icono className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
