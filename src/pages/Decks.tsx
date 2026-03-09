import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Trash2, Copy, Calendar } from 'lucide-react';
import { db } from '@/db/database';
import { useDeckStore } from '@/stores/deckStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { DeckFormat } from '@/types/deck';
import { formatDate } from '@/utils/cardHelpers';
import { useTranslation } from '@/i18n/LanguageContext';

export function Decks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createDeck, deleteDeck, duplicateDeck } = useDeckStore();
  const { addToast } = useUIStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckFormat, setNewDeckFormat] = useState<DeckFormat>('standard');
  const [creating, setCreating] = useState(false);

  const decks = useLiveQuery(() => db.decks.orderBy('updatedAt').reverse().toArray(), []);

  const handleCreate = async () => {
    if (!newDeckName.trim()) return;
    setCreating(true);
    try {
      const id = await createDeck(newDeckName.trim(), newDeckFormat);
      addToast(t('decks.deckCreated', { name: newDeckName }), 'success');
      setShowCreate(false);
      setNewDeckName('');
      navigate(`/decks/${id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(t('decks.confirmDelete', { name }))) return;
    await deleteDeck(id);
    addToast(t('decks.deckDeleted'), 'info');
  };

  const handleDuplicate = async (id: number) => {
    const newId = await duplicateDeck(id);
    addToast(t('decks.deckDuplicated'), 'success');
    navigate(`/decks/${newId}`);
  };

  const formatBadge = (format: DeckFormat) => {
    const colors: Record<DeckFormat, string> = {
      standard: 'bg-green-900/50 text-green-400',
      expanded: 'bg-blue-900/50 text-blue-400',
      unlimited: 'bg-purple-900/50 text-purple-400',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colors[format]}`}>
        {format}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">{t('decks.title')}</h1>
          <p className="text-gray-400 text-sm">{t('decks.count', { count: decks?.length ?? 0 })}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          {t('decks.newDeck')}
        </Button>
      </div>

      {/* Deck list */}
      {decks?.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🃏</p>
          <p className="text-lg">{t('decks.noDecks')}</p>
          <p className="text-sm mt-1">{t('decks.noDecksHint')}</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            {t('decks.createDeck')}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {decks?.map((deck) => {
          const totalCards = deck.cards.reduce((s, c) => s + c.count, 0);
          return (
            <div
              key={deck.id}
              className="bg-card-bg border border-card-border rounded-xl p-4 hover:border-accent/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/decks/${deck.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold">{deck.name}</h3>
                    {formatBadge(deck.format)}
                  </div>
                  {deck.description && (
                    <p className="text-gray-400 text-sm mt-1 truncate">{deck.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className={totalCards === 60 ? 'text-green-400' : 'text-yellow-400'}>
                      {t('decks.cards', { count: totalCards })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(deck.updatedAt)}
                    </span>
                    {deck.tags.length > 0 && (
                      <div className="flex gap-1">
                        {deck.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="bg-card-border px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/decks/${deck.id}`)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-card-hover transition-colors"
                    title={t('decks.editDeck')}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => void handleDuplicate(deck.id!)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-card-hover transition-colors"
                    title={t('decks.duplicate')}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => void handleDelete(deck.id!, deck.name)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
                    title={t('decks.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('decks.createNewDeck')} size="sm">
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t('decks.deckName')}</label>
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
              placeholder={t('decks.deckNamePlaceholder')}
              autoFocus
              className="w-full bg-card-border/50 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">{t('decks.format')}</label>
            <div className="flex gap-2">
              {(['standard', 'expanded', 'unlimited'] as DeckFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setNewDeckFormat(f)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    newDeckFormat === f ? 'bg-accent text-white' : 'bg-card-border text-gray-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => void handleCreate()} loading={creating} className="w-full" disabled={!newDeckName.trim()}>
            {t('decks.createDeck')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
