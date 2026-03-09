import type { PokemonCard, PokemonSet, SearchFilters } from '@/types/pokemon';
import { getSetting, db } from '@/db/database';

export interface SearchResult {
  data: PokemonCard[];
  totalCount: number;
  page: number;
  pageSize: number;
  count: number;
}

export interface CardApiProvider {
  searchCards(filters: SearchFilters, page?: number, pageSize?: number): Promise<SearchResult>;
  getCard(id: string): Promise<PokemonCard>;
  getCards(ids: string[]): Promise<PokemonCard[]>;
  getSets(): Promise<PokemonSet[]>;
  getSet(id: string): Promise<PokemonSet | null>;
}

let cachedProvider: { name: string; instance: CardApiProvider } | null = null;

async function getProvider(): Promise<CardApiProvider> {
  const providerName = (await getSetting('api_provider')) ?? 'tcgdex';

  if (cachedProvider && cachedProvider.name === providerName) {
    return cachedProvider.instance;
  }

  let instance: CardApiProvider;
  if (providerName === 'pokemontcg') {
    const mod = await import('./pokemonTcg');
    instance = mod.provider;
  } else {
    const mod = await import('./tcgdex');
    instance = mod.provider;
  }

  cachedProvider = { name: providerName, instance };
  return instance;
}

export function clearProviderCache(): void {
  cachedProvider = null;
}

export async function clearCardCache(): Promise<void> {
  await db.cards_cache.clear();
  await db.sets_cache.clear();
  clearProviderCache();
}

export async function searchCards(
  filters: SearchFilters,
  page = 1,
  pageSize = 20,
): Promise<SearchResult> {
  const p = await getProvider();
  return p.searchCards(filters, page, pageSize);
}

export async function getCard(id: string): Promise<PokemonCard> {
  const p = await getProvider();
  return p.getCard(id);
}

export async function getCards(ids: string[]): Promise<PokemonCard[]> {
  const p = await getProvider();
  return p.getCards(ids);
}

export async function getSets(): Promise<PokemonSet[]> {
  const p = await getProvider();
  return p.getSets();
}

export async function getSet(id: string): Promise<PokemonSet | null> {
  const p = await getProvider();
  return p.getSet(id);
}
