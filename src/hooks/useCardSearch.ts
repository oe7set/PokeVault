import { useState, useCallback, useRef } from 'react';
import { searchCards, type SearchResult } from '@/api/pokemonTcg';
import type { SearchFilters } from '@/types/pokemon';
import { addRecentSearch } from '@/db/database';

const defaultFilters: SearchFilters = {
  query: '',
  types: [],
  supertypes: [],
  subtypes: [],
  setId: '',
  rarity: '',
  format: 'all',
};

export function useCardSearch() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (f: SearchFilters, p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchCards(f, p, 20);
      if (p === 1) {
        setResults(result);
      } else {
        setResults((prev) =>
          prev
            ? { ...result, data: [...prev.data, ...result.data] }
            : result,
        );
      }
      if (f.query.trim()) {
        void addRecentSearch(f.query.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = useCallback(
    (update: Partial<SearchFilters>) => {
      const newFilters = { ...filters, ...update };
      setFilters(newFilters);
      setPage(1);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void search(newFilters, 1);
      }, 400);
    },
    [filters, search],
  );

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    void search(filters, nextPage);
  }, [filters, page, search]);

  const hasMore = results
    ? results.data.length < results.totalCount
    : false;

  return {
    results,
    loading,
    error,
    filters,
    updateFilters,
    loadMore,
    hasMore,
    search: (f: SearchFilters) => { void search(f, 1); },
  };
}
