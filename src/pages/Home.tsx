import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Layers, BookOpen, Camera, Search, Zap, Trophy } from 'lucide-react';
import { db } from '@/db/database';
import { formatDate } from '@/utils/cardHelpers';
import type { DeckFormat } from '@/types/deck';
import { useTranslation } from '@/i18n/LanguageContext';

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const decks = useLiveQuery(() => db.decks.orderBy('updatedAt').reverse().limit(3).toArray(), []);
  const collectionEntries = useLiveQuery(() => db.collection.count(), []);
  const totalCards = useLiveQuery(
    async () => {
      const entries = await db.collection.toArray();
      return entries.reduce((s, e) => s + e.quantity + e.quantityFoil, 0);
    },
    [],
  );
  const deckCount = useLiveQuery(() => db.decks.count(), []);

  const formatBadge = (format: DeckFormat) => {
    const colors: Record<DeckFormat, string> = {
      standard: 'text-green-400',
      expanded: 'text-blue-400',
      unlimited: 'text-purple-400',
    };
    return <span className={`text-xs capitalize ${colors[format]}`}>{format}</span>;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-surface-200 to-surface-50 border border-card-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">PokeVault</h1>
            <p className="text-gray-400 text-sm">{t('home.subtitle')}</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mt-3 leading-relaxed">
          {t('home.description')}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card-bg border border-card-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{(totalCards ?? 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{t('home.cardsOwned')}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{(collectionEntries ?? 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{t('home.uniqueCards')}</p>
        </div>
        <div className="bg-card-bg border border-card-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{deckCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">{t('home.decks')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">{t('home.quickActions')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Search, label: t('home.browseCards'), desc: t('home.browseCardsDesc'), to: '/cards', color: 'from-blue-900/40 to-blue-800/20 border-blue-700/30' },
            { icon: Layers, label: t('home.buildDeck'), desc: t('home.buildDeckDesc'), to: '/decks', color: 'from-red-900/40 to-red-800/20 border-red-700/30' },
            { icon: BookOpen, label: t('home.myCollection'), desc: t('home.myCollectionDesc'), to: '/collection', color: 'from-green-900/40 to-green-800/20 border-green-700/30' },
            { icon: Camera, label: t('home.scanCard'), desc: t('home.scanCardDesc'), to: '/scanner', color: 'from-purple-900/40 to-purple-800/20 border-purple-700/30' },
          ].map(({ icon: Icon, label, desc, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`bg-gradient-to-br ${color} border rounded-xl p-4 text-left hover:scale-[1.02] transition-all`}
            >
              <Icon size={22} className="text-white mb-2" />
              <p className="text-white font-medium text-sm">{label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Decks */}
      {decks && decks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400">{t('home.recentDecks')}</h2>
            <button
              onClick={() => navigate('/decks')}
              className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
            >
              {t('home.viewAll')} <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {decks.map((deck) => {
              const totalDeckCards = deck.cards.reduce((s, c) => s + c.count, 0);
              return (
                <div
                  key={deck.id}
                  onClick={() => navigate(`/decks/${deck.id}`)}
                  className="bg-card-bg border border-card-border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-accent/40 transition-colors"
                >
                  <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
                    <Trophy size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{deck.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {formatBadge(deck.format)}
                      <span className={`text-xs ${totalDeckCards === 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {totalDeckCards}/60
                      </span>
                      <span className="text-gray-600 text-xs">{formatDate(deck.updatedAt)}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-500 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {(collectionEntries ?? 0) === 0 && (deckCount ?? 0) === 0 && (
        <div className="bg-card-bg border border-dashed border-card-border rounded-2xl p-6 text-center">
          <p className="text-4xl mb-3">🎴</p>
          <h3 className="text-white font-semibold mb-2">{t('home.gettingStarted')}</h3>
          <div className="text-gray-400 text-sm space-y-2 text-left max-w-xs mx-auto">
            <p>{t('home.step1')}</p>
            <p>{t('home.step2')}</p>
            <p>{t('home.step3')}</p>
            <p>{t('home.step4')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
