import { useState, useCallback } from 'react';
import { RefreshCw, Play, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import type { DeckCard } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';
import { simulateHand, runMulliganSimulation } from '@/utils/deckSimulator';
import { Button } from '@/components/ui/Button';

interface HandSimulatorProps {
  deckCards: DeckCard[];
  cards: Map<string, PokemonCard>;
}

export function HandSimulator({ deckCards, cards }: HandSimulatorProps) {
  const [hand, setHand] = useState<string[]>([]);
  const [isMulligan, setIsMulligan] = useState(false);
  const [totalDraws, setTotalDraws] = useState(0);
  const [mulliganCount, setMulliganCount] = useState(0);
  const [simResult, setSimResult] = useState<number | null>(null);
  const [simRunning, setSimRunning] = useState(false);

  const drawHand = useCallback(() => {
    const result = simulateHand(deckCards, cards);
    setHand(result.hand);
    setIsMulligan(result.isMulligan);
    setTotalDraws((d) => d + 1);
    if (result.isMulligan) setMulliganCount((m) => m + 1);
  }, [deckCards, cards]);

  const resetStats = () => {
    setTotalDraws(0);
    setMulliganCount(0);
    setSimResult(null);
    setHand([]);
    setIsMulligan(false);
  };

  const runSimulation = useCallback(() => {
    setSimRunning(true);
    // Use setTimeout to not block UI
    setTimeout(() => {
      const result = runMulliganSimulation(deckCards, cards, 1000);
      setSimResult(Math.round(result.mulliganRate * 1000) / 10);
      setSimRunning(false);
    }, 10);
  }, [deckCards, cards]);

  const mulliganRate = totalDraws > 0 ? Math.round((mulliganCount / totalDraws) * 1000) / 10 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={drawHand} size="sm">
          <RefreshCw size={14} />
          {hand.length > 0 ? 'Redraw' : 'Draw Hand'}
        </Button>
        <Button onClick={runSimulation} variant="secondary" size="sm" disabled={simRunning}>
          <Play size={14} />
          {simRunning ? 'Running...' : 'Run 1000 Sims'}
        </Button>
        {totalDraws > 0 && (
          <Button onClick={resetStats} variant="ghost" size="sm">
            <RotateCcw size={14} />
            Reset
          </Button>
        )}
      </div>

      {/* Hand display */}
      {hand.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-gray-400">Opening Hand</p>
            {isMulligan && (
              <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                MULLIGAN
              </span>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {hand.map((cardId, i) => {
              const card = cards.get(cardId);
              return (
                <div key={i} className="relative group">
                  {card?.images.small ? (
                    <img
                      src={card.images.small}
                      alt={card.name}
                      className={clsx(
                        'w-full rounded-lg border-2 transition-transform hover:scale-110 hover:z-10',
                        isMulligan ? 'border-red-500/50' : 'border-card-border',
                      )}
                    />
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-card-bg rounded-lg border border-card-border flex items-center justify-center">
                      <span className="text-[8px] text-gray-500 text-center px-1">{card?.name ?? cardId}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5">
                    <p className="text-[8px] text-white truncate text-center">{card?.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card-bg border border-card-border rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{totalDraws}</p>
          <p className="text-[10px] text-gray-400">Total Draws</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-red-400">{mulliganCount}</p>
          <p className="text-[10px] text-gray-400">Mulligans</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-lg p-3 text-center">
          <p className={clsx('text-lg font-bold', mulliganRate > 20 ? 'text-red-400' : mulliganRate > 10 ? 'text-yellow-400' : 'text-green-400')}>
            {mulliganRate}%
          </p>
          <p className="text-[10px] text-gray-400">Rate</p>
        </div>
      </div>

      {/* Simulation result */}
      {simResult !== null && (
        <div className="bg-card-bg border border-card-border rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">1000 Simulation Result</p>
          <p className={clsx('text-xl font-bold', simResult > 20 ? 'text-red-400' : simResult > 10 ? 'text-yellow-400' : 'text-green-400')}>
            {simResult}% Mulligan Rate
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {simResult < 10 ? 'Great consistency!' : simResult < 20 ? 'Acceptable, but consider more Basics.' : 'High mulligan risk. Add more Basic Pokemon.'}
          </p>
        </div>
      )}
    </div>
  );
}
