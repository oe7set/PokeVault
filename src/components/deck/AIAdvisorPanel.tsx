import { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getDeckSuggestions } from '@/api/claude';
import type { Deck, AIAdvice, AISuggestion } from '@/types/deck';
import type { PokemonCard } from '@/types/pokemon';
import { clsx } from 'clsx';
import { useUIStore } from '@/stores/uiStore';
import { useTranslation } from '@/i18n/LanguageContext';

interface AIAdvisorPanelProps {
  deck: Deck;
  cardsMap: Map<string, PokemonCard>;
}

const CATEGORY_COLORS: Record<AISuggestion['category'], string> = {
  draw: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  search: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
  energy: 'bg-orange-900/40 text-orange-300 border-orange-700/40',
  tech: 'bg-gray-700/60 text-gray-300 border-gray-600/40',
  pokemon: 'bg-green-900/40 text-green-300 border-green-700/40',
  removal: 'bg-red-900/40 text-red-300 border-red-700/40',
};

const PRIORITY_ICONS: Record<AISuggestion['priority'], string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

export function AIAdvisorPanel({ deck, cardsMap }: AIAdvisorPanelProps) {
  const { t } = useTranslation();
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const { addToast } = useUIStore();

  const COOLDOWN = 30000; // 30s

  const canFetch = Date.now() - lastFetch > COOLDOWN;
  const cooldownSeconds = Math.ceil((COOLDOWN - (Date.now() - lastFetch)) / 1000);

  const handleGetAdvice = async () => {
    if (!canFetch) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getDeckSuggestions(deck, cardsMap);
      setAdvice(result);
      setLastFetch(Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get AI advice';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const totalCards = deck.cards.reduce((s, dc) => s + dc.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-400" />
          <span className="text-sm font-medium text-gray-200">{t('ai.title')}</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          loading={loading}
          disabled={!canFetch || totalCards < 10}
          onClick={() => void handleGetAdvice()}
          title={!canFetch ? `Wait ${cooldownSeconds}s` : totalCards < 10 ? 'Add more cards first' : 'Get AI advice'}
        >
          <RefreshCw size={13} />
          {advice ? t('ai.refresh') : t('ai.analyze')}
          {!canFetch && ` (${cooldownSeconds}s)`}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-300 bg-red-900/20 rounded-lg p-3 border border-red-700/30">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">{t('ai.analysisFailed')}</p>
            <p>{error}</p>
            {error.includes('API key') && (
              <p className="mt-1 text-red-200">{t('ai.addApiKey')}</p>
            )}
          </div>
        </div>
      )}

      {!advice && !loading && !error && (
        <div className="text-center py-6 text-gray-500">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('ai.emptyState')}</p>
          <p className="text-xs mt-1">{t('ai.poweredBy')}</p>
          {totalCards < 10 && (
            <p className="text-xs mt-2 text-yellow-500">{t('ai.addMoreCards')}</p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner size="md" />
          <p className="text-sm text-gray-400">{t('ai.analyzing')}</p>
        </div>
      )}

      {advice && !loading && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="bg-yellow-900/10 border border-yellow-700/20 rounded-lg p-3">
            <p className="text-yellow-300 text-sm font-medium mb-1">{t('ai.overview')}</p>
            <p className="text-gray-300 text-xs leading-relaxed">{advice.summary}</p>
          </div>

          {/* Win condition */}
          {advice.winCondition && (
            <div className="bg-green-900/10 border border-green-700/20 rounded-lg p-3">
              <p className="text-green-300 text-xs font-medium mb-1">🎯 Win Condition</p>
              <p className="text-gray-300 text-xs">{advice.winCondition}</p>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          {(advice.strengths || advice.weaknesses) && (
            <div className="grid grid-cols-2 gap-2">
              {advice.strengths && advice.strengths.length > 0 && (
                <div className="bg-green-900/10 border border-green-700/20 rounded-lg p-2">
                  <p className="text-green-400 text-xs font-medium mb-1">{t('ai.strengths')}</p>
                  {advice.strengths.map((s, i) => (
                    <p key={i} className="text-gray-400 text-xs">• {s}</p>
                  ))}
                </div>
              )}
              {advice.weaknesses && advice.weaknesses.length > 0 && (
                <div className="bg-red-900/10 border border-red-700/20 rounded-lg p-2">
                  <p className="text-red-400 text-xs font-medium mb-1">{t('ai.weaknesses')}</p>
                  {advice.weaknesses.map((w, i) => (
                    <p key={i} className="text-gray-400 text-xs">• {w}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{t('ai.cardSuggestions')}</p>
            <div className="space-y-2">
              {advice.suggestions.map((s, i) => (
                <div
                  key={i}
                  className={clsx(
                    'rounded-lg border p-2 cursor-pointer transition-colors',
                    CATEGORY_COLORS[s.category],
                  )}
                  onClick={() => toggleExpanded(i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{PRIORITY_ICONS[s.priority]}</span>
                      <span className="text-sm font-medium">{s.card}</span>
                      <span className="text-xs opacity-70 capitalize">[{s.category}]</span>
                    </div>
                    {expanded.has(i) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </div>
                  {expanded.has(i) && (
                    <p className="text-xs mt-2 leading-relaxed opacity-80">{s.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
