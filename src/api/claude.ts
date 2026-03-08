import type { Deck, DeckCard, AIAdvice } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';

function getApiKey(): string {
  return import.meta.env.VITE_ANTHROPIC_API_KEY ?? '';
}

function formatDeckForPrompt(deck: Deck, cards: Map<string, PokemonCard>): string {
  const lines: string[] = [];

  const pokemon = deck.cards.filter((dc) => {
    const card = cards.get(dc.cardId);
    return card?.supertype === 'Pokémon';
  });
  const trainers = deck.cards.filter((dc) => {
    const card = cards.get(dc.cardId);
    return card?.supertype === 'Trainer';
  });
  const energy = deck.cards.filter((dc) => {
    const card = cards.get(dc.cardId);
    return card?.supertype === 'Energy';
  });

  const formatSection = (title: string, deckCards: DeckCard[]) => {
    if (deckCards.length === 0) return;
    lines.push(`**${title}:**`);
    for (const dc of deckCards) {
      const card = cards.get(dc.cardId);
      const name = card?.name ?? dc.cardId;
      const extra = card?.hp ? ` (HP: ${card.hp}, Types: ${card.types?.join(', ') ?? 'N/A'})` : '';
      lines.push(`  ${dc.count}x ${name}${extra}`);
    }
  };

  formatSection('Pokémon', pokemon);
  formatSection('Trainers', trainers);
  formatSection('Energy', energy);

  return lines.join('\n');
}

export async function getDeckSuggestions(
  deck: Deck,
  cards: Map<string, PokemonCard>,
): Promise<AIAdvice> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Add it in Settings.');
  }

  const deckList = formatDeckForPrompt(deck, cards);
  const totalCards = deck.cards.reduce((sum, dc) => sum + dc.count, 0);

  const prompt = `You are an expert Pokémon TCG deck builder and coach. Analyze this ${deck.format} format deck and provide specific, actionable advice.

**Deck Name:** ${deck.name}
**Format:** ${deck.format}
**Total Cards:** ${totalCards}/60
${deck.description ? `**Description:** ${deck.description}` : ''}

**Current Deck List:**
${deckList}

Provide your analysis in the following JSON format (respond with ONLY valid JSON, no markdown):
{
  "summary": "2-3 sentence overview of the deck's strategy and current state",
  "winCondition": "Brief description of how this deck wins",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": [
    {
      "card": "Card Name",
      "reason": "Specific reason why this card improves the deck",
      "category": "draw|search|energy|tech|pokemon|removal",
      "priority": "high|medium|low"
    }
  ]
}

Focus on:
1. Draw engine consistency (Professor's Research, Iono, Colress's Experiment)
2. Search/tutoring options (Quick Ball, Ultra Ball, Nest Ball)
3. Energy acceleration or consistency
4. Tech cards for the meta
5. Pokémon synergies and evolution lines
6. Missing staples for the format

Provide 5-8 specific card suggestions with clear reasoning.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  const text = data.content[0]?.text ?? '{}';

  try {
    const advice = JSON.parse(text) as AIAdvice;
    return advice;
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AIAdvice;
    }
    throw new Error('Failed to parse AI response');
  }
}
