import type { Deck, DeckStats, EvolutionLine } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';

export function analyzeDeck(deck: Deck, cards: Map<string, PokemonCard>): DeckStats {
  let pokemon = 0;
  let trainers = 0;
  let energy = 0;
  let supporters = 0;
  let items = 0;
  let tools = 0;
  let stadiums = 0;
  let totalAttackCost = 0;
  let attackCount = 0;
  let totalValue = 0;
  const typeDistribution: Record<string, number> = {};
  const energyCurveMap: Record<number, number> = {};
  const weaknesses: Set<string> = new Set();
  const resistances: Set<string> = new Set();
  const cardPrices: DeckStats['cardPrices'] = [];

  for (const dc of deck.cards) {
    const card = cards.get(dc.cardId);
    if (!card) continue;

    // Card prices
    const price = card.cardmarket?.prices?.averageSellPrice ?? 0;
    if (price > 0) {
      cardPrices.push({ cardId: dc.cardId, name: card.name, price, count: dc.count });
      totalValue += price * dc.count;
    }

    if (card.supertype === 'Pokémon') {
      pokemon += dc.count;

      for (const type of card.types ?? []) {
        typeDistribution[type] = (typeDistribution[type] ?? 0) + dc.count;
      }

      if (card.attacks && card.attacks.length > 0) {
        const minCost = Math.min(...card.attacks.map((a) => a.convertedEnergyCost));
        energyCurveMap[minCost] = (energyCurveMap[minCost] ?? 0) + dc.count;
        totalAttackCost += minCost * dc.count;
        attackCount += dc.count;
      }

      for (const w of card.weaknesses ?? []) {
        weaknesses.add(w.type);
      }
      for (const r of card.resistances ?? []) {
        resistances.add(r.type);
      }
    } else if (card.supertype === 'Trainer') {
      trainers += dc.count;
      const subtypes = card.subtypes ?? [];
      if (subtypes.includes('Supporter')) supporters += dc.count;
      else if (subtypes.includes('Item')) items += dc.count;
      else if (subtypes.includes('Pokémon Tool')) tools += dc.count;
      else if (subtypes.includes('Stadium')) stadiums += dc.count;
      else items += dc.count; // default trainers to items
    } else if (card.supertype === 'Energy') {
      energy += dc.count;
    }
  }

  const maxCost = Math.max(0, ...Object.keys(energyCurveMap).map(Number));
  const energyCurve = Array.from({ length: maxCost + 1 }, (_, i) => ({
    cost: i,
    count: energyCurveMap[i] ?? 0,
  }));

  const totalCards = deck.cards.reduce((s, dc) => s + dc.count, 0);

  // Opening hand probabilities for cards with count >= 2
  const openingHandProbabilities = deck.cards
    .filter((dc) => dc.count >= 2)
    .map((dc) => {
      const card = cards.get(dc.cardId);
      return {
        cardId: dc.cardId,
        name: card?.name ?? dc.cardId,
        count: dc.count,
        probability: getOpeningHandProbability(deck, dc.cardId),
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8);

  // Consistency score (0-100)
  const consistencyScore = calculateConsistencyScore(deck, cards, totalCards, supporters);

  // Evolution lines
  const evolutionLines = detectEvolutionLines(deck, cards);

  // Energy to attacker ratio
  const energyToAttackerRatio = pokemon > 0 ? Math.round((energy / pokemon) * 10) / 10 : 0;

  return {
    totalCards,
    pokemon,
    trainers,
    energy,
    supporters,
    items,
    tools,
    stadiums,
    avgAttackCost: attackCount > 0 ? Math.round((totalAttackCost / attackCount) * 10) / 10 : 0,
    typeDistribution,
    energyCurve,
    weaknesses: Array.from(weaknesses),
    resistances: Array.from(resistances),
    openingHandProbabilities,
    consistencyScore,
    evolutionLines,
    energyToAttackerRatio,
    estimatedValue: Math.round(totalValue * 100) / 100,
    cardPrices,
  };
}

function calculateConsistencyScore(
  deck: Deck,
  cards: Map<string, PokemonCard>,
  totalCards: number,
  supporterCount: number,
): number {
  if (totalCards === 0) return 0;

  // Basic Pokemon probability in opening hand
  let basicCount = 0;
  for (const dc of deck.cards) {
    const card = cards.get(dc.cardId);
    if (card?.supertype === 'Pokémon' && card.subtypes?.includes('Basic')) {
      basicCount += dc.count;
    }
  }
  const basicProb = totalCards > 0 ? 1 - hypergeometric(totalCards, basicCount, 7, 0) : 0;
  // Penalize heavily if mulligan risk is high
  const basicScore = Math.min(basicProb * 100, 30); // max 30 points

  // Supporter density (ideal: 10-14 supporters in 60 cards)
  const supporterRatio = supporterCount / Math.max(totalCards, 1);
  const idealSupporterRatio = 12 / 60;
  const supporterScore = Math.max(0, 25 - Math.abs(supporterRatio - idealSupporterRatio) * 200);

  // Draw/search trainers (cards with draw/search in their text)
  let drawSearchCount = 0;
  for (const dc of deck.cards) {
    const card = cards.get(dc.cardId);
    if (!card) continue;
    if (card.supertype === 'Trainer') {
      const text = (card.abilities?.map((a) => a.text).join(' ') ?? '') +
        (card.attacks?.map((a) => a.text).join(' ') ?? '');
      if (/draw|search|look at/i.test(card.name + ' ' + text)) {
        drawSearchCount += dc.count;
      }
    }
  }
  const drawScore = Math.min(drawSearchCount * 2, 20); // max 20 points

  // Evolution completeness
  const evoLines = detectEvolutionLines(deck, cards);
  const evoCompleteRatio = evoLines.length > 0
    ? evoLines.filter((l) => l.complete).length / evoLines.length
    : 1;
  const evoScore = evoCompleteRatio * 25; // max 25 points

  return Math.round(Math.min(100, basicScore + supporterScore + drawScore + evoScore));
}

function detectEvolutionLines(deck: Deck, cards: Map<string, PokemonCard>): EvolutionLine[] {
  // Build evolution chains from evolvesFrom
  const pokemonInDeck: { card: PokemonCard; count: number }[] = [];
  for (const dc of deck.cards) {
    const card = cards.get(dc.cardId);
    if (card?.supertype === 'Pokémon') {
      pokemonInDeck.push({ card, count: dc.count });
    }
  }

  // Group by evolution chain: find Stage 2 or Stage 1 that evolve from something
  const lines: EvolutionLine[] = [];
  const processed = new Set<string>();

  // Find all pokemon that evolve from something
  const evolversMap = new Map<string, { card: PokemonCard; count: number }[]>();
  for (const p of pokemonInDeck) {
    if (p.card.evolvesFrom) {
      const from = p.card.evolvesFrom;
      if (!evolversMap.has(from)) evolversMap.set(from, []);
      evolversMap.get(from)!.push(p);
    }
  }

  // For each basic that has evolutions, build a line
  for (const p of pokemonInDeck) {
    if (processed.has(p.card.name)) continue;
    if (!p.card.subtypes?.includes('Basic')) continue;

    const evolvers = evolversMap.get(p.card.name);
    if (!evolvers || evolvers.length === 0) continue;

    processed.add(p.card.name);
    const stages: EvolutionLine['stages'] = [
      { name: p.card.name, count: p.count, stage: 'Basic' },
    ];

    for (const evo of evolvers) {
      processed.add(evo.card.name);
      const stageLabel = evo.card.subtypes?.includes('Stage 2') ? 'Stage 2' : 'Stage 1';
      stages.push({ name: evo.card.name, count: evo.count, stage: stageLabel });

      // Check for Stage 2 evolving from this Stage 1
      const stage2Evolvers = evolversMap.get(evo.card.name);
      if (stage2Evolvers) {
        for (const s2 of stage2Evolvers) {
          processed.add(s2.card.name);
          stages.push({ name: s2.card.name, count: s2.count, stage: 'Stage 2' });
        }
      }
    }

    // A line is complete if all stages have at least 1 card
    const complete = stages.every((s) => s.count > 0);
    lines.push({ stages, complete });
  }

  return lines;
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

export function getDrawProbabilityByTurn(
  deck: Deck,
  cardId: string,
  maxTurns = 6,
): { turn: number; probability: number }[] {
  const dc = deck.cards.find((c) => c.cardId === cardId);
  if (!dc) return [];
  const total = deck.cards.reduce((s, c) => s + c.count, 0);
  const result: { turn: number; probability: number }[] = [];
  for (let turn = 1; turn <= maxTurns; turn++) {
    const handSize = 7 + turn - 1; // 7 opening + 1 draw per turn
    const prob = hypergeometric(total, dc.count, Math.min(handSize, total), 1);
    result.push({ turn, probability: Math.round(prob * 1000) / 10 });
  }
  return result;
}
