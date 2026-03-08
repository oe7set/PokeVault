import type { Deck, DeckCard } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';

// Parse PTCGL/PTCGO deck format
// Format: "4 Charizard ex OBF 125\n2 Boss's Orders PAL 172\n..."
export interface ParsedDeckCard {
  count: number;
  name: string;
  setCode: string;
  number: string;
}

export function parsePTCGLFormat(text: string): ParsedDeckCard[] {
  const cards: ParsedDeckCard[] = [];
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && !l.startsWith('*'));

  for (const line of lines) {
    // Match: count name setCode number
    // e.g. "4 Charizard ex OBF 125" or "2 Basic {F} Energy SVE 2"
    const match = line.match(/^(\d+)\s+(.+?)\s+([A-Z0-9-]+)\s+(\d+[a-zA-Z]*)$/);
    if (match) {
      cards.push({
        count: parseInt(match[1], 10),
        name: match[2].trim(),
        setCode: match[3],
        number: match[4],
      });
    }
  }

  return cards;
}

export function exportToPTCGLFormat(
  deck: Deck,
  cards: Map<string, PokemonCard>,
): string {
  const sections: string[] = [];

  const pokemon = deck.cards.filter((dc) => cards.get(dc.cardId)?.supertype === 'Pokémon');
  const trainers = deck.cards.filter((dc) => cards.get(dc.cardId)?.supertype === 'Trainer');
  const energy = deck.cards.filter((dc) => cards.get(dc.cardId)?.supertype === 'Energy');

  const formatSection = (title: string, deckCards: DeckCard[]) => {
    if (deckCards.length === 0) return;
    sections.push(`****** ${title} ******`);
    for (const dc of deckCards) {
      const card = cards.get(dc.cardId);
      if (!card) continue;
      sections.push(`${dc.count} ${card.name} ${card.set.id.toUpperCase()} ${card.number}`);
    }
    sections.push('');
  };

  sections.push(`##${deck.name}`);
  sections.push('');
  formatSection('Pokémon', pokemon);
  formatSection('Trainer', trainers);
  formatSection('Energy', energy);

  const totalCards = deck.cards.reduce((s, dc) => s + dc.count, 0);
  sections.push(`Total Cards: ${totalCards}`);

  return sections.join('\n');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
