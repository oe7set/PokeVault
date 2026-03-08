import type { Deck, DeckValidationResult } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';

const BASIC_ENERGY_NAMES = [
  'Fire Energy', 'Water Energy', 'Grass Energy', 'Lightning Energy',
  'Psychic Energy', 'Fighting Energy', 'Darkness Energy', 'Metal Energy',
  'Fairy Energy', 'Dragon Energy', 'Colorless Energy',
];

function isBasicEnergy(card: PokemonCard): boolean {
  return card.supertype === 'Energy' &&
    (card.subtypes?.includes('Basic') ?? false) ||
    BASIC_ENERGY_NAMES.some((n) => card.name.toLowerCase().includes(n.toLowerCase()));
}

function isPrismStar(card: PokemonCard): boolean {
  return card.name.endsWith('◇') || card.subtypes?.includes('Prism Star') === true;
}

function isBasicPokemon(card: PokemonCard): boolean {
  return card.supertype === 'Pokémon' &&
    (card.subtypes?.includes('Basic') ?? false);
}

export function validateDeck(
  deck: Deck,
  cards: Map<string, PokemonCard>,
): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalCards = deck.cards.reduce((sum, dc) => sum + dc.count, 0);

  // Check total count
  if (totalCards < 60) {
    errors.push(`Deck has ${totalCards}/60 cards (needs ${60 - totalCards} more)`);
  } else if (totalCards > 60) {
    errors.push(`Deck has ${totalCards}/60 cards (${totalCards - 60} too many)`);
  }

  // Check 4-copy rule
  for (const dc of deck.cards) {
    const card = cards.get(dc.cardId);
    if (!card) continue;

    if (!isBasicEnergy(card) && !isPrismStar(card) && dc.count > 4) {
      errors.push(`${card.name}: max 4 copies allowed (have ${dc.count})`);
    }

    if (isPrismStar(card) && dc.count > 1) {
      errors.push(`${card.name} (Prism Star): only 1 copy allowed`);
    }
  }

  // Check for at least 1 Basic Pokémon
  const hasBasic = deck.cards.some((dc) => {
    const card = cards.get(dc.cardId);
    return card ? isBasicPokemon(card) : false;
  });

  if (!hasBasic) {
    errors.push('Deck must contain at least 1 Basic Pokémon');
  }

  // Format legality checks
  if (deck.format !== 'unlimited') {
    const illegalCards: string[] = [];
    for (const dc of deck.cards) {
      const card = cards.get(dc.cardId);
      if (!card) continue;

      const legality = deck.format === 'standard'
        ? card.legalities?.standard
        : card.legalities?.expanded;

      if (legality && legality !== 'Legal') {
        illegalCards.push(card.name);
      }
    }
    if (illegalCards.length > 0) {
      errors.push(`Not legal in ${deck.format}: ${illegalCards.slice(0, 3).join(', ')}${illegalCards.length > 3 ? ` +${illegalCards.length - 3} more` : ''}`);
    }
  }

  // Warnings
  const pokemon = deck.cards.filter((dc) => cards.get(dc.cardId)?.supertype === 'Pokémon');
  const trainers = deck.cards.filter((dc) => cards.get(dc.cardId)?.supertype === 'Trainer');
  const energy = deck.cards.filter((dc) => cards.get(dc.cardId)?.supertype === 'Energy');

  const pokemonCount = pokemon.reduce((s, dc) => s + dc.count, 0);
  const trainerCount = trainers.reduce((s, dc) => s + dc.count, 0);
  const energyCount = energy.reduce((s, dc) => s + dc.count, 0);

  if (trainerCount < 10 && totalCards === 60) {
    warnings.push('Low trainer count — consider adding more draw/search cards');
  }
  if (energyCount > 20) {
    warnings.push('High energy count — consider reducing energy and adding trainers');
  }
  if (pokemonCount > 25) {
    warnings.push('Many Pokémon — ensure your evolution lines are consistent');
  }

  // Check for draw support
  const drawSupportNames = ['professor', 'research', 'iono', 'marnie', 'cynthia', 'judge'];
  const hasDrawSupport = deck.cards.some((dc) => {
    const card = cards.get(dc.cardId);
    return card && drawSupportNames.some((n) => card.name.toLowerCase().includes(n));
  });
  if (!hasDrawSupport && totalCards > 30) {
    warnings.push('No draw support detected — add Professor\'s Research, Iono, or similar');
  }

  return {
    valid: errors.length === 0,
    totalCards,
    errors,
    warnings,
  };
}
