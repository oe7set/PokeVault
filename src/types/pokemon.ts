export interface Attack {
  name: string;
  cost: string[];
  convertedEnergyCost: number;
  damage: string;
  text: string;
}

export interface Ability {
  name: string;
  text: string;
  type: string;
}

export interface WeaknessResistance {
  type: string;
  value: string;
}

export interface CardLegalities {
  standard?: 'Legal' | 'Banned' | 'Not Legal';
  expanded?: 'Legal' | 'Banned' | 'Not Legal';
  unlimited?: 'Legal' | 'Banned' | 'Not Legal';
}

export interface CardImages {
  small: string;
  large: string;
}

export interface SetImages {
  symbol: string;
  logo: string;
}

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities: CardLegalities;
  releaseDate: string;
  images: SetImages;
}

export interface PokemonCard {
  id: string;
  name: string;
  supertype: 'Pokémon' | 'Trainer' | 'Energy';
  subtypes: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  attacks?: Attack[];
  abilities?: Ability[];
  weaknesses?: WeaknessResistance[];
  resistances?: WeaknessResistance[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: PokemonSet;
  number: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities: CardLegalities;
  images: CardImages;
  artist?: string;
  cardmarket?: {
    prices?: {
      averageSellPrice?: number;
      lowPrice?: number;
      trendPrice?: number;
    };
  };
}

export interface SearchFilters {
  query: string;
  types: string[];
  supertypes: string[];
  subtypes: string[];
  setId: string;
  rarity: string;
  format: 'all' | 'standard' | 'expanded';
}

export const POKEMON_TYPES = [
  'Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Ice',
  'Dragon', 'Darkness', 'Fairy', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Bug', 'Rock', 'Ghost', 'Steel',
  'Colorless', 'Metal',
];

export const RARITIES = [
  'Common', 'Uncommon', 'Rare', 'Rare Holo',
  'Rare Holo EX', 'Rare Holo GX', 'Rare Holo V',
  'Rare Ultra', 'Rare Secret', 'Amazing Rare',
  'Promo', 'Rare BREAK', 'Rare Prime',
];
