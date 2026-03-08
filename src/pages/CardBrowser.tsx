import { useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useCardSearch } from '@/hooks/useCardSearch';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardFilters } from '@/components/cards/CardFilters';
import type { SearchFilters } from '@/types/pokemon';

export function CardBrowser() {
  const { results, loading, error, filters, updateFilters, loadMore, hasMore, search } = useCardSearch();

  // Initial search on mount
  useEffect(() => {
    search(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    const defaultFilters: SearchFilters = {
      query: '',
      types: [],
      supertypes: [],
      subtypes: [],
      setId: '',
      rarity: '',
      format: 'all',
    };
    updateFilters(defaultFilters);
    search(defaultFilters);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Card Browser</h1>
        <p className="text-gray-400 text-sm">
          {results ? `${results.totalCount.toLocaleString()} cards found` : 'Search the complete Pokémon TCG database'}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => updateFilters({ query: e.target.value })}
          placeholder="Search cards by name..."
          className="w-full bg-card-bg border border-card-border text-white rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-accent text-sm"
        />
        {filters.query && (
          <button
            onClick={() => updateFilters({ query: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters */}
      <CardFilters
        filters={filters}
        onChange={updateFilters}
        onReset={handleReset}
      />

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      <CardGrid
        cards={results?.data ?? []}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
