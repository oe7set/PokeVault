export const TYPE_COLORS: Record<string, string> = {
  Fire: '#FF6B35',
  Water: '#4D9DE0',
  Grass: '#56B04C',
  Electric: '#F7D842',
  Psychic: '#E8649A',
  Ice: '#74CCD3',
  Dragon: '#6F35FC',
  Darkness: '#5A4F72',
  Fairy: '#F7B5DB',
  Fighting: '#C22E28',
  Poison: '#A33EA1',
  Ground: '#E2BF65',
  Flying: '#A98FF3',
  Bug: '#A6B91A',
  Rock: '#B6A136',
  Ghost: '#735797',
  Steel: '#B7B7CE',
  Metal: '#B7B7CE',
  Colorless: '#A8A878',
  Normal: '#A8A878',
};

export const TYPE_BG_CLASSES: Record<string, string> = {
  Fire: 'type-fire',
  Water: 'type-water',
  Grass: 'type-grass',
  Electric: 'type-electric',
  Psychic: 'type-psychic',
  Ice: 'type-ice',
  Dragon: 'type-dragon',
  Darkness: 'type-darkness',
  Fairy: 'type-fairy',
  Fighting: 'type-fighting',
  Poison: 'type-poison',
  Ground: 'type-ground',
  Flying: 'type-flying',
  Bug: 'type-bug',
  Rock: 'type-rock',
  Ghost: 'type-ghost',
  Steel: 'type-steel',
  Metal: 'type-metal',
  Colorless: 'type-colorless',
};

export const CARD_GLOW_CLASSES: Record<string, string> = {
  Fire: 'card-glow-fire',
  Water: 'card-glow-water',
  Grass: 'card-glow-grass',
  Electric: 'card-glow-electric',
  Psychic: 'card-glow-psychic',
  Dragon: 'card-glow-dragon',
};

export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#6b7280';
}

export function getTypeClass(type: string): string {
  return TYPE_BG_CLASSES[type] ?? 'type-colorless';
}

export function getCardGlowClass(types?: string[]): string {
  if (!types || types.length === 0) return 'card-glow-default';
  return CARD_GLOW_CLASSES[types[0]] ?? 'card-glow-default';
}

export function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    Fire: '🔥',
    Water: '💧',
    Grass: '🌿',
    Electric: '⚡',
    Psychic: '🔮',
    Ice: '❄️',
    Dragon: '🐉',
    Darkness: '🌑',
    Fairy: '✨',
    Fighting: '👊',
    Poison: '☠️',
    Ground: '🌍',
    Flying: '🦅',
    Bug: '🐛',
    Rock: '🪨',
    Ghost: '👻',
    Steel: '⚙️',
    Colorless: '⭐',
  };
  return emojis[type] ?? '•';
}
