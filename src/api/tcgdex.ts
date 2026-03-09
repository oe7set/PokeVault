import type { PokemonCard, PokemonSet, SearchFilters } from '@/types/pokemon';
import { getCachedCard, setCachedCard } from '@/db/database';
import type { CardApiProvider, SearchResult } from './cardApi';

const BASE_URL = '/tcgdex-api';

interface TcgdexCardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

interface TcgdexAttack {
  cost?: string[];
  name: string;
  damage?: number | string;
  effect?: string;
}

interface TcgdexWeakness {
  type: string;
  value: string;
}

interface TcgdexCardFull {
  id: string;
  localId: string;
  name: string;
  image?: string;
  category?: string;
  hp?: number;
  types?: string[];
  evolveFrom?: string;
  stage?: string;
  attacks?: TcgdexAttack[];
  weaknesses?: TcgdexWeakness[];
  resistances?: TcgdexWeakness[];
  retreat?: number;
  rarity?: string;
  illustrator?: string;
  description?: string;
  legal?: { standard?: boolean; expanded?: boolean };
  set?: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount?: { official?: number; total?: number };
  };
  dexId?: number[];
  regulationMark?: string;
  pricing?: {
    cardmarket?: { avg?: number; low?: number; trend?: number };
  };
}

interface TcgdexSetBrief {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: { total?: number; official?: number };
}

interface TcgdexSetFull extends TcgdexSetBrief {
  releaseDate?: string;
  serie?: { id: string; name: string };
  legal?: { standard?: boolean; expanded?: boolean };
  cards?: TcgdexCardBrief[];
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`TCGdex API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function mapSupertype(category?: string): 'Pokémon' | 'Trainer' | 'Energy' {
  if (!category) return 'Pokémon';
  if (category.toLowerCase() === 'trainer') return 'Trainer';
  if (category.toLowerCase() === 'energy') return 'Energy';
  return 'Pokémon';
}

function mapLegalities(legal?: { standard?: boolean; expanded?: boolean }) {
  return {
    standard: legal?.standard ? 'Legal' as const : undefined,
    expanded: legal?.expanded ? 'Legal' as const : undefined,
  };
}

function mapCard(raw: TcgdexCardFull): PokemonCard {
  const imageBase = raw.image ?? '';
  return {
    id: raw.id,
    name: raw.name,
    supertype: mapSupertype(raw.category),
    subtypes: raw.stage ? [raw.stage] : [],
    hp: raw.hp != null ? String(raw.hp) : undefined,
    types: raw.types,
    evolvesFrom: raw.evolveFrom,
    attacks: raw.attacks?.map((a) => ({
      name: a.name,
      cost: a.cost ?? [],
      convertedEnergyCost: a.cost?.length ?? 0,
      damage: a.damage != null ? String(a.damage) : '',
      text: a.effect ?? '',
    })),
    weaknesses: raw.weaknesses,
    resistances: raw.resistances,
    retreatCost: raw.retreat != null ? Array(raw.retreat).fill('Colorless') as string[] : undefined,
    convertedRetreatCost: raw.retreat ?? undefined,
    set: {
      id: raw.set?.id ?? '',
      name: raw.set?.name ?? '',
      series: '',
      printedTotal: raw.set?.cardCount?.official ?? 0,
      total: raw.set?.cardCount?.total ?? 0,
      legalities: mapLegalities(raw.legal),
      releaseDate: '',
      images: {
        symbol: raw.set?.symbol ?? '',
        logo: raw.set?.logo ?? '',
      },
    },
    number: raw.localId,
    rarity: raw.rarity,
    flavorText: raw.description,
    nationalPokedexNumbers: raw.dexId,
    legalities: mapLegalities(raw.legal),
    images: {
      small: imageBase ? `${imageBase}/low.webp` : '',
      large: imageBase ? `${imageBase}/high.webp` : '',
    },
    artist: raw.illustrator,
    cardmarket: raw.pricing?.cardmarket
      ? {
          prices: {
            averageSellPrice: raw.pricing.cardmarket.avg,
            lowPrice: raw.pricing.cardmarket.low,
            trendPrice: raw.pricing.cardmarket.trend,
          },
        }
      : undefined,
  };
}

function mapSetBrief(raw: TcgdexSetBrief): PokemonSet {
  return {
    id: raw.id,
    name: raw.name,
    series: '',
    printedTotal: raw.cardCount?.official ?? 0,
    total: raw.cardCount?.total ?? 0,
    legalities: {},
    releaseDate: '',
    images: {
      symbol: raw.symbol ?? '',
      logo: raw.logo ?? '',
    },
  };
}

function mapSetFull(raw: TcgdexSetFull): PokemonSet {
  return {
    id: raw.id,
    name: raw.name,
    series: raw.serie?.name ?? '',
    printedTotal: raw.cardCount?.official ?? 0,
    total: raw.cardCount?.total ?? 0,
    legalities: mapLegalities(raw.legal),
    releaseDate: raw.releaseDate ?? '',
    images: {
      symbol: raw.symbol ?? '',
      logo: raw.logo ?? '',
    },
  };
}

function buildQueryParams(filters: SearchFilters): string {
  const params = new URLSearchParams();

  if (filters.query.trim()) {
    params.set('name', filters.query.trim());
  }

  if (filters.types.length > 0) {
    params.set('type', filters.types[0]);
  }

  if (filters.supertypes.length > 0) {
    const categoryMap: Record<string, string> = {
      'Pokémon': 'Pokemon',
      'Trainer': 'Trainer',
      'Energy': 'Energy',
    };
    params.set('category', categoryMap[filters.supertypes[0]] ?? filters.supertypes[0]);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function fetchFullCard(id: string): Promise<PokemonCard> {
  const cached = await getCachedCard(id);
  if (cached) return cached;

  const raw = await apiFetch<TcgdexCardFull>(`/cards/${id}`);
  const card = mapCard(raw);
  void setCachedCard(card);
  return card;
}

export const provider: CardApiProvider = {
  async searchCards(filters, page = 1, pageSize = 20): Promise<SearchResult> {
    let cardIds: TcgdexCardBrief[];

    if (filters.setId) {
      // Use set endpoint to get cards in a specific set
      const setData = await apiFetch<TcgdexSetFull>(`/sets/${filters.setId}`);
      cardIds = setData.cards ?? [];
      // Filter by name if query is provided
      if (filters.query.trim()) {
        const q = filters.query.trim().toLowerCase();
        cardIds = cardIds.filter((c) => c.name.toLowerCase().includes(q));
      }
    } else {
      const queryParams = buildQueryParams(filters);
      if (!queryParams && !filters.query.trim()) {
        // No filters at all — return empty to avoid fetching ALL cards
        return { data: [], totalCount: 0, page, pageSize, count: 0 };
      }
      cardIds = await apiFetch<TcgdexCardBrief[]>(`/cards${queryParams}`);
    }

    const totalCount = cardIds.length;
    const start = (page - 1) * pageSize;
    const pageSlice = cardIds.slice(start, start + pageSize);

    // Fetch full details for this page
    const cards = await Promise.all(pageSlice.map((c) => fetchFullCard(c.id)));

    return {
      data: cards,
      totalCount,
      page,
      pageSize,
      count: cards.length,
    };
  },

  async getCard(id): Promise<PokemonCard> {
    return fetchFullCard(id);
  },

  async getCards(ids): Promise<PokemonCard[]> {
    return Promise.all(ids.map((id) => fetchFullCard(id)));
  },

  async getSets(): Promise<PokemonSet[]> {
    const raw = await apiFetch<TcgdexSetBrief[]>('/sets');
    return raw.map(mapSetBrief);
  },

  async getSet(id): Promise<PokemonSet | null> {
    try {
      const raw = await apiFetch<TcgdexSetFull>(`/sets/${id}`);
      return mapSetFull(raw);
    } catch {
      return null;
    }
  },
};
