import type { PokemonCard, PokemonSet, SearchFilters } from '@/types/pokemon';
import { db, getCachedCard, setCachedCard, CACHE_TTL } from '@/db/database';
import type { CardApiProvider } from './cardApi';

const BASE_URL = '/pokemon-tcg-api';

function getApiKey(): string {
  return import.meta.env.VITE_POKEMON_TCG_API_KEY ?? '';
}

function buildHeaders(): HeadersInit {
  const key = getApiKey();
  return key ? { 'X-Api-Key': key } : {};
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: buildHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export interface SearchResult {
  data: PokemonCard[];
  totalCount: number;
  page: number;
  pageSize: number;
  count: number;
}

export function buildSearchQuery(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.query.trim()) {
    // Search by name or supertype
    parts.push(`name:"${filters.query.trim()}*"`);
  }

  if (filters.types.length > 0) {
    parts.push(`(${filters.types.map((t) => `types:${t}`).join(' OR ')})`);
  }

  if (filters.supertypes.length > 0) {
    parts.push(`(${filters.supertypes.map((s) => `supertype:${s}`).join(' OR ')})`);
  }

  if (filters.subtypes.length > 0) {
    parts.push(`(${filters.subtypes.map((s) => `subtypes:${s}`).join(' OR ')})`);
  }

  if (filters.setId) {
    parts.push(`set.id:${filters.setId}`);
  }

  if (filters.rarity) {
    parts.push(`rarity:"${filters.rarity}"`);
  }

  if (filters.format === 'standard') {
    parts.push('legalities.standard:legal');
  } else if (filters.format === 'expanded') {
    parts.push('legalities.expanded:legal');
  }

  return parts.join(' ');
}

export async function searchCards(
  filters: SearchFilters,
  page = 1,
  pageSize = 20,
): Promise<SearchResult> {
  const q = buildSearchQuery(filters);
  const queryParam = q ? `q=${encodeURIComponent(q)}&` : '';
  const url = `/cards?${queryParam}page=${page}&pageSize=${pageSize}&orderBy=set.releaseDate`;

  const result = await apiFetch<SearchResult>(url);

  // Cache results
  for (const card of result.data) {
    void setCachedCard(card);
  }

  return result;
}

export async function getCard(id: string): Promise<PokemonCard> {
  const cached = await getCachedCard(id);
  if (cached) return cached;

  const result = await apiFetch<{ data: PokemonCard }>(`/cards/${id}`);
  await setCachedCard(result.data);
  return result.data;
}

export async function getCards(ids: string[]): Promise<PokemonCard[]> {
  const results: PokemonCard[] = [];
  const toFetch: string[] = [];

  for (const id of ids) {
    const cached = await getCachedCard(id);
    if (cached) {
      results.push(cached);
    } else {
      toFetch.push(id);
    }
  }

  if (toFetch.length > 0) {
    // Batch fetch
    const chunks = [];
    for (let i = 0; i < toFetch.length; i += 20) {
      chunks.push(toFetch.slice(i, i + 20));
    }

    for (const chunk of chunks) {
      const q = chunk.map((id) => `id:${id}`).join(' OR ');
      const result = await apiFetch<SearchResult>(`/cards?q=${encodeURIComponent(q)}&pageSize=20`);
      for (const card of result.data) {
        await setCachedCard(card);
        results.push(card);
      }
    }
  }

  return results;
}

let setsCache: PokemonSet[] | null = null;
let setsCachedAt = 0;

export async function getSets(): Promise<PokemonSet[]> {
  if (setsCache && Date.now() - setsCachedAt < CACHE_TTL) {
    return setsCache;
  }

  // Try DB cache
  const dbSets = await db.sets_cache.toArray();
  if (dbSets.length > 0 && Date.now() - dbSets[0].cachedAt < CACHE_TTL) {
    setsCache = dbSets.map((s) => s.data);
    setsCachedAt = dbSets[0].cachedAt;
    return setsCache;
  }

  const result = await apiFetch<{ data: PokemonSet[] }>('/sets?orderBy=-releaseDate&pageSize=500');
  setsCache = result.data;
  setsCachedAt = Date.now();

  // Cache to DB
  await db.sets_cache.clear();
  await db.sets_cache.bulkPut(
    result.data.map((s) => ({ id: s.id, data: s, cachedAt: Date.now() })),
  );

  return setsCache;
}

export async function getSet(id: string): Promise<PokemonSet | null> {
  const sets = await getSets();
  return sets.find((s) => s.id === id) ?? null;
}

export const provider: CardApiProvider = {
  searchCards,
  getCard,
  getCards,
  getSets,
  getSet,
};
