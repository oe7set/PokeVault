import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { SearchFilters } from '@/types/pokemon';
import { POKEMON_TYPES } from '@/types/pokemon';
import { getSets } from '@/api/pokemonTcg';
import type { PokemonSet } from '@/types/pokemon';
import { Button } from '@/components/ui/Button';
import { getTypeClass } from '@/utils/typeColors';

interface CardFiltersProps {
  filters: SearchFilters;
  onChange: (filters: Partial<SearchFilters>) => void;
  onReset: () => void;
}

export function CardFilters({ filters, onChange, onReset }: CardFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [sets, setSets] = useState<PokemonSet[]>([]);

  useEffect(() => {
    void getSets().then(setSets);
  }, []);

  const activeFilterCount = [
    filters.types.length > 0,
    filters.supertypes.length > 0,
    filters.setId !== '',
    filters.rarity !== '',
    filters.format !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2 text-gray-300">
          <Filter size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={clsx('text-gray-400 transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-card-border">
          {/* Format */}
          <div>
            <p className="text-xs text-gray-500 mb-2 mt-3">Format</p>
            <div className="flex gap-2">
              {(['all', 'standard', 'expanded'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => onChange({ format: f })}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                    filters.format === f
                      ? 'bg-accent text-white'
                      : 'bg-card-border text-gray-400 hover:text-white',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Supertype */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Card Type</p>
            <div className="flex gap-2 flex-wrap">
              {(['Pokémon', 'Trainer', 'Energy'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const current = filters.supertypes;
                    onChange({
                      supertypes: current.includes(s)
                        ? current.filter((x) => x !== s)
                        : [...current, s],
                    });
                  }}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    filters.supertypes.includes(s)
                      ? 'bg-blue-600 text-white'
                      : 'bg-card-border text-gray-400 hover:text-white',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Types */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Pokémon Type</p>
            <div className="flex flex-wrap gap-1.5">
              {POKEMON_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const current = filters.types;
                    onChange({
                      types: current.includes(type)
                        ? current.filter((t) => t !== type)
                        : [...current, type],
                    });
                  }}
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium transition-opacity text-white',
                    getTypeClass(type),
                    !filters.types.includes(type) && 'opacity-50',
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Set */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Set</p>
            <select
              value={filters.setId}
              onChange={(e) => onChange({ setId: e.target.value })}
              className="w-full bg-card-border text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent"
            >
              <option value="">All Sets</option>
              {sets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name} ({set.series})
                </option>
              ))}
            </select>
          </div>

          <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
            <X size={14} /> Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
