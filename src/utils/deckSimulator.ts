import type { DeckCard, HandSimulationResult } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function expandDeck(deckCards: DeckCard[]): string[] {
  const expanded: string[] = [];
  for (const dc of deckCards) {
    for (let i = 0; i < dc.count; i++) {
      expanded.push(dc.cardId);
    }
  }
  return expanded;
}

export function simulateHand(
  deckCards: DeckCard[],
  cards: Map<string, PokemonCard>,
  handSize = 7,
): HandSimulationResult {
  const expanded = expandDeck(deckCards);
  const shuffled = fisherYatesShuffle(expanded);
  const hand = shuffled.slice(0, handSize);
  const isMulligan = !hand.some((id) => {
    const card = cards.get(id);
    return card?.supertype === 'Pokémon' && card.subtypes?.includes('Basic');
  });
  return { hand, isMulligan };
}

export function runMulliganSimulation(
  deckCards: DeckCard[],
  cards: Map<string, PokemonCard>,
  trials = 1000,
): { mulliganRate: number } {
  let mulligans = 0;
  for (let i = 0; i < trials; i++) {
    const { isMulligan } = simulateHand(deckCards, cards);
    if (isMulligan) mulligans++;
  }
  return { mulliganRate: mulligans / trials };
}
