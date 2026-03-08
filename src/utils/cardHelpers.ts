import type { PokemonCard } from '@/types/pokemon';

export function formatAttackCost(cost: string[]): string {
  const symbols: Record<string, string> = {
    Fire: '🔥',
    Water: '💧',
    Grass: '🌿',
    Lightning: '⚡',
    Psychic: '🔮',
    Fighting: '👊',
    Darkness: '🌑',
    Metal: '⚙️',
    Dragon: '🐉',
    Fairy: '✨',
    Colorless: '⭐',
  };
  return cost.map((c) => symbols[c] ?? c).join('');
}

export function getCardFullName(card: PokemonCard): string {
  return `${card.name} (${card.set.name} ${card.number})`;
}

export function getRarityBadgeColor(rarity?: string): string {
  if (!rarity) return 'bg-gray-600';
  const r = rarity.toLowerCase();
  if (r.includes('secret')) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
  if (r.includes('ultra') || r.includes('rainbow')) return 'bg-gradient-to-r from-purple-400 to-pink-500';
  if (r.includes('rare holo')) return 'bg-blue-600';
  if (r.includes('rare')) return 'bg-blue-500';
  if (r.includes('uncommon')) return 'bg-green-600';
  if (r.includes('promo')) return 'bg-yellow-600';
  return 'bg-gray-600';
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getSetReleaseYear(releaseDate: string): number {
  return new Date(releaseDate).getFullYear();
}

export function isCardLegalInFormat(card: PokemonCard, format: string): boolean {
  if (format === 'unlimited') return true;
  const legality = format === 'standard' ? card.legalities?.standard : card.legalities?.expanded;
  return legality === 'Legal';
}
