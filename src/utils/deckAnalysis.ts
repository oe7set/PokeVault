import type { Deck, DeckStats } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';

export function analyzeDeck(deck: Deck, cards: Map<string, PokemonCard>): DeckStats {
  let pokemon = 0;
  let trainers = 0;
  let energy = 0;
  let totalAttackCost = 0;
  let attackCount = 0;
  const typeDistribution: Record<string, number> = {};
  const energyCurveMap: Record<number, number> = {};
  const weaknesses: Set<string> = new Set();
  const resistances: Set<string> = new Set();

  for (const dc of deck.cards) {
    const card = cards.get(dc.cardId);
    if (!card) continue;

    if (card.supertype === 'Pokémon') {
      pokemon += dc.count;

      // Type distribution
      for (const type of card.types ?? []) {
        typeDistribution[type] = (typeDistribution[type] ?? 0) + dc.count;
      }

      // Energy curve (min attack cost)
      if (card.attacks && card.attacks.length > 0) {
        const minCost = Math.min(...card.attacks.map((a) => a.convertedEnergyCost));
        energyCurveMap[minCost] = (energyCurveMap[minCost] ?? 0) + dc.count;
        totalAttackCost += minCost * dc.count;
        attackCount += dc.count;
      }

      // Weaknesses/resistances
      for (const w of card.weaknesses ?? []) {
        weaknesses.add(w.type);
      }
      for (const r of card.resistances ?? []) {
        resistances.add(r.type);
      }
    } else if (card.supertype === 'Trainer') {
      trainers += dc.count;
    } else if (card.supertype === 'Energy') {
      energy += dc.count;
    }
  }

  // Build energy curve array
  const maxCost = Math.max(0, ...Object.keys(energyCurveMap).map(Number));
  const energyCurve = Array.from({ length: maxCost + 1 }, (_, i) => ({
    cost: i,
    count: energyCurveMap[i] ?? 0,
  }));

  return {
    totalCards: deck.cards.reduce((s, dc) => s + dc.count, 0),
    pokemon,
    trainers,
    energy,
    avgAttackCost: attackCount > 0 ? Math.round((totalAttackCost / attackCount) * 10) / 10 : 0,
    typeDistribution,
    energyCurve,
    weaknesses: Array.from(weaknesses),
    resistances: Array.from(resistances),
  };
}

// Hypergeometric probability: chance of drawing at least k of N cards in hand of n from deck of D
export function hypergeometric(D: number, N: number, n: number, k: number): number {
  function comb(a: number, b: number): number {
    if (b > a || b < 0) return 0;
    if (b === 0 || b === a) return 1;
    b = Math.min(b, a - b);
    let result = 1;
    for (let i = 0; i < b; i++) {
      result = result * (a - i) / (i + 1);
    }
    return result;
  }

  let prob = 0;
  for (let i = k; i <= Math.min(N, n); i++) {
    prob += (comb(N, i) * comb(D - N, n - i)) / comb(D, n);
  }
  return prob;
}

export function getOpeningHandProbability(
  deck: Deck,
  cardId: string,
  handSize = 7,
): number {
  const dc = deck.cards.find((c) => c.cardId === cardId);
  if (!dc) return 0;
  const total = deck.cards.reduce((s, c) => s + c.count, 0);
  return hypergeometric(total, dc.count, handSize, 1);
}
