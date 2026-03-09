import Dexie, { type Table } from 'dexie';
import type { CollectionEntry } from '@/types/collection';
import type { Deck } from '@/types/deck';
import type { PokemonCard, PokemonSet } from '@/types/pokemon';

interface CachedCard {
  id: string;
  data: PokemonCard;
  cachedAt: number;
}

interface CachedSet {
  id: string;
  data: PokemonSet;
  cachedAt: number;
}

interface RecentSearch {
  id?: number;
  query: string;
  timestamp: number;
}

interface AppSettings {
  key: string;
  value: string;
}

class PokeVaultDB extends Dexie {
  cards_cache!: Table<CachedCard, string>;
  sets_cache!: Table<CachedSet, string>;
  collection!: Table<CollectionEntry, number>;
  decks!: Table<Deck, number>;
  recent_searches!: Table<RecentSearch, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('PokeVaultDB');
    this.version(2).stores({
      cards_cache: 'id, cachedAt',
      sets_cache: 'id, cachedAt',
      collection: '++id, cardId, inWishlist, inTradeList',
      decks: '++id, name, format, createdAt, updatedAt',
      recent_searches: '++id, query, timestamp',
      settings: 'key',
    });
  }
}

export const db = new PokeVaultDB();

export const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedCard(id: string): Promise<PokemonCard | null> {
  const cached = await db.cards_cache.get(id);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > CACHE_TTL) {
    await db.cards_cache.delete(id);
    return null;
  }
  return cached.data;
}

export async function setCachedCard(card: PokemonCard): Promise<void> {
  await db.cards_cache.put({ id: card.id, data: card, cachedAt: Date.now() });
}

export async function getSetting(key: string): Promise<string | null> {
  const setting = await db.settings.get(key);
  return setting?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export async function addRecentSearch(query: string): Promise<void> {
  if (!query.trim()) return;
  // Remove duplicates
  await db.recent_searches.where('query').equals(query).delete();
  await db.recent_searches.add({ query, timestamp: Date.now() });
  // Keep only last 10
  const all = await db.recent_searches.orderBy('timestamp').reverse().toArray();
  if (all.length > 10) {
    const toDelete = all.slice(10).map((s) => s.id!);
    await db.recent_searches.bulkDelete(toDelete);
  }
}

export async function getRecentSearches(): Promise<string[]> {
  const searches = await db.recent_searches.orderBy('timestamp').reverse().limit(10).toArray();
  return searches.map((s) => s.query);
}
