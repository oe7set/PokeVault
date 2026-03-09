import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { clsx } from 'clsx';
import type { Deck, DeckStats, MissingCardSummary } from '@/types/deck';
import { getTypeColor } from '@/utils/typeColors';
import { getDrawProbabilityByTurn } from '@/utils/deckAnalysis';
import { MissingCardsPanel } from './MissingCardsPanel';
import { useTranslation } from '@/i18n/LanguageContext';

interface DeckStatsPanelProps {
  stats: DeckStats;
  deck?: Deck;
  missingCards?: MissingCardSummary[];
  totalMissingValue?: number;
}

export function DeckStatsPanel({ stats, deck, missingCards, totalMissingValue }: DeckStatsPanelProps) {
  const { t } = useTranslation();
  const [selectedProbCard, setSelectedProbCard] = useState<string>('');

  const typeData = Object.entries(stats.typeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
    color: getTypeColor(type),
  }));

  // Draw probability chart data
  const drawProbData = deck && selectedProbCard
    ? getDrawProbabilityByTurn(deck, selectedProbCard)
    : [];

  const consistencyColor = stats.consistencyScore >= 70 ? 'text-green-400' :
    stats.consistencyScore >= 40 ? 'text-yellow-400' : 'text-red-400';
  const consistencyBg = stats.consistencyScore >= 70 ? 'bg-green-900/20 border-green-700/30' :
    stats.consistencyScore >= 40 ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-red-900/20 border-red-700/30';

  return (
    <div className="space-y-4">
      {/* Summary cards - 2x3 grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-2">
          <p className="text-green-400 font-bold text-xl">{stats.pokemon}</p>
          <p className="text-[10px] text-gray-400">{t('deckStats.pokemon')}</p>
        </div>
        <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-2">
          <p className="text-purple-400 font-bold text-xl">{stats.supporters}</p>
          <p className="text-[10px] text-gray-400">{t('deckStats.supporters')}</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2">
          <p className="text-blue-400 font-bold text-xl">{stats.items}</p>
          <p className="text-[10px] text-gray-400">{t('deckStats.items')}</p>
        </div>
        <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-2">
          <p className="text-cyan-400 font-bold text-xl">{stats.tools}</p>
          <p className="text-[10px] text-gray-400">{t('deckStats.tools')}</p>
        </div>
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg p-2">
          <p className="text-indigo-400 font-bold text-xl">{stats.stadiums}</p>
          <p className="text-[10px] text-gray-400">{t('deckStats.stadiums')}</p>
        </div>
        <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-2">
          <p className="text-orange-400 font-bold text-xl">{stats.energy}</p>
          <p className="text-[10px] text-gray-400">{t('deckStats.energy')}</p>
        </div>
      </div>

      {/* Consistency Score */}
      <div className={clsx('border rounded-lg p-3 flex items-center gap-3', consistencyBg)}>
        <p className={clsx('text-3xl font-bold', consistencyColor)}>{stats.consistencyScore}</p>
        <div>
          <p className="text-xs text-gray-300 font-medium">{t('deckStats.consistencyScore')}</p>
          <p className="text-[10px] text-gray-500">
            {stats.consistencyScore >= 70 ? t('deckStats.solidBuild') : stats.consistencyScore >= 40 ? t('deckStats.needsImprovement') : t('deckStats.inconsistent')}
          </p>
        </div>
      </div>

      {/* Opening Hand Probabilities */}
      {stats.openingHandProbabilities.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">{t('deckStats.openingHandProb')}</p>
          <div className="space-y-1.5">
            {stats.openingHandProbabilities.map((p) => {
              const pct = Math.round(p.probability * 1000) / 10;
              return (
                <div key={p.cardId} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-24 truncate">{p.name} x{p.count}</span>
                  <div className="flex-1 bg-card-border rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white font-medium w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Draw Probability Chart */}
      {deck && stats.openingHandProbabilities.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">{t('deckStats.drawProbByTurn')}</p>
          <select
            value={selectedProbCard}
            onChange={(e) => setSelectedProbCard(e.target.value)}
            className="w-full bg-card-border text-gray-200 text-xs rounded-lg px-2 py-1.5 mb-2 border border-gray-600 focus:outline-none focus:border-accent"
          >
            <option value="">{t('deckStats.selectCard')}</option>
            {deck.cards
              .filter((dc) => dc.count >= 1)
              .map((dc) => {
                const prob = stats.openingHandProbabilities.find((p) => p.cardId === dc.cardId);
                return (
                  <option key={dc.cardId} value={dc.cardId}>
                    {prob?.name ?? dc.cardId} (x{dc.count})
                  </option>
                );
              })}
          </select>
          {drawProbData.length > 0 && (
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={drawProbData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="turn" tick={{ fontSize: 10, fill: '#9ca3af' }} label={{ value: 'Turn', position: 'bottom', fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => [`${value}%`, 'Probability']}
                />
                <Line type="monotone" dataKey="probability" stroke="#e94560" strokeWidth={2} dot={{ fill: '#e94560', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Evolution Lines */}
      {stats.evolutionLines.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">{t('deckStats.evolutionLines')}</p>
          <div className="space-y-1.5">
            {stats.evolutionLines.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  'flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border',
                  line.complete
                    ? 'bg-green-900/10 border-green-700/20'
                    : 'bg-red-900/10 border-red-700/20',
                )}
              >
                {line.stages.map((stage, j) => (
                  <span key={j} className="flex items-center gap-1">
                    {j > 0 && <span className="text-gray-600">→</span>}
                    <span className={clsx(stage.count > 0 ? 'text-white' : 'text-red-400')}>
                      {stage.name} (x{stage.count})
                    </span>
                  </span>
                ))}
                {!line.complete && (
                  <span className="text-red-400 ml-auto">{t('deckStats.incomplete')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Energy Curve */}
      {stats.energyCurve.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">{t('deckStats.energyCurve')}</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={stats.energyCurve} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="cost" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="count" fill="#e94560" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Type Distribution */}
      {typeData.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">{t('deckStats.typeDistribution')}</p>
          <div className="flex items-center gap-3">
            <PieChart width={80} height={80}>
              <Pie data={typeData} cx={35} cy={35} innerRadius={15} outerRadius={35} dataKey="value" strokeWidth={0}>
                {typeData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {typeData.map((t) => (
                <div key={t.name} className="flex items-center gap-1 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  <span className="text-gray-400">{t.name}</span>
                  <span className="text-white font-medium">{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Energy Analysis */}
      <div className="space-y-1">
        {stats.avgAttackCost > 0 && (
          <div className="text-xs text-gray-500">
            {t('deckStats.avgAttackCost')} <span className="text-white">{stats.avgAttackCost} energy</span>
          </div>
        )}
        {stats.energyToAttackerRatio > 0 && (
          <div className="text-xs text-gray-500">
            {t('deckStats.energyAttackerRatio')} <span className={clsx(
              'font-medium',
              stats.energyToAttackerRatio >= 1.0 && stats.energyToAttackerRatio <= 2.0 ? 'text-green-400' : 'text-yellow-400',
            )}>{stats.energyToAttackerRatio}</span>
            {stats.energyToAttackerRatio < 1.0 && <span className="text-yellow-400 ml-1">{t('deckStats.lowEnergy')}</span>}
            {stats.energyToAttackerRatio > 2.5 && <span className="text-yellow-400 ml-1">{t('deckStats.highEnergy')}</span>}
          </div>
        )}
      </div>

      {/* Weaknesses */}
      {stats.weaknesses.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('deckStats.deckWeaknesses')}</p>
          <div className="flex flex-wrap gap-1">
            {stats.weaknesses.map((w) => (
              <span key={w} className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-300">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Deck Value */}
      {stats.estimatedValue > 0 && (
        <div className="bg-card-bg border border-card-border rounded-lg p-3">
          <p className="text-xs text-gray-500">{t('deckStats.estimatedValue')}</p>
          <p className="text-lg font-bold text-white">${stats.estimatedValue.toFixed(2)}</p>
        </div>
      )}

      {/* Missing Cards */}
      {missingCards && missingCards.length > 0 && (
        <MissingCardsPanel missingCards={missingCards} totalMissingValue={totalMissingValue ?? 0} />
      )}
    </div>
  );
}
