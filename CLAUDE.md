# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite)
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint` (ESLint)
- **Preview production build:** `npm run preview`

No test framework is configured.

## Architecture

PokeVault is a Pokemon TCG card collection manager and deck builder. It's a React 19 + TypeScript SPA using Vite, with Tailwind CSS for styling and a dark theme.

### Path alias
`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### Data layer
- **Dexie (IndexedDB)** for all local persistence — `src/db/database.ts` defines the schema (cards cache, sets cache, collection, decks, recent searches, settings)
- **Zustand** stores (`src/stores/`) provide actions that read/write Dexie directly. Stores are stateless action containers — the actual data lives in IndexedDB and is queried via `dexie-react-hooks` (`useLiveQuery`)
- **React Query** (`@tanstack/react-query`) handles API data fetching and caching in `src/hooks/`

### External APIs
- **Pokemon TCG API** (`src/api/pokemonTcg.ts`) — card/set search and lookup. Optional API key via `VITE_POKEMON_TCG_API_KEY`
- **Anthropic Claude API** (`src/api/claude.ts`) — AI deck advisor feature, called directly from browser with `anthropic-dangerous-direct-browser-calls` header. Requires `VITE_ANTHROPIC_API_KEY`

### Routing
React Router v7 with flat route structure in `src/App.tsx`. Pages: `/` (Home), `/cards` (CardBrowser), `/collection`, `/decks`, `/decks/:id` (DeckBuilder), `/scanner`, `/settings`.

### Key component groups
- `src/components/cards/` — card browsing, filtering, detail modal
- `src/components/collection/` — add card modal, collection stats
- `src/components/deck/` — deck builder panels (AI advisor, stats, validation, import/export with PTCGL format)
- `src/components/scanner/` — camera-based card scanning using `tesseract.js` OCR
- `src/components/ui/` — shared primitives (Button, Modal, Badge, Spinner, Toast, Skeleton)

### Deck validation
`src/utils/deckValidation.ts` enforces Pokemon TCG rules (60-card deck, 4-copy limit, basic energy exceptions). `src/utils/ptcglFormat.ts` handles PTCGL import/export format.

### Tailwind theme
Custom Pokemon type colors (fire, water, grass, etc.) and dark surface/accent colors defined in `tailwind.config.js`. Uses `clsx` + `tailwind-merge` for class composition.
