import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { DeckStats } from '@/types/deck';
import { getTypeColor } from '@/utils/typeColors';

interface DeckStatsPanelProps {
  stats: DeckStats;
}

export function DeckStatsPanel({ stats }: DeckStatsPanelProps) {
  const typeData = Object.entries(stats.typeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
    color: getTypeColor(type),
  }));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-2">
          <p className="text-green-400 font-bold text-xl">{stats.pokemon}</p>
          <p className="text-xs text-gray-400">Pokémon</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2">
          <p className="text-blue-400 font-bold text-xl">{stats.trainers}</p>
          <p className="text-xs text-gray-400">Trainers</p>
        </div>
        <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-2">
          <p className="text-orange-400 font-bold text-xl">{stats.energy}</p>
          <p className="text-xs text-gray-400">Energy</p>
        </div>
      </div>

      {/* Energy Curve */}
      {stats.energyCurve.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Energy Curve</p>
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
          <p className="text-xs text-gray-500 mb-2">Type Distribution</p>
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

      {/* Weaknesses */}
      {stats.weaknesses.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Deck Weaknesses</p>
          <div className="flex flex-wrap gap-1">
            {stats.weaknesses.map((w) => (
              <span key={w} className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-300">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Avg attack cost */}
      {stats.avgAttackCost > 0 && (
        <div className="text-xs text-gray-500">
          Avg. Attack Cost: <span className="text-white">{stats.avgAttackCost} energy</span>
        </div>
      )}
    </div>
  );
}
