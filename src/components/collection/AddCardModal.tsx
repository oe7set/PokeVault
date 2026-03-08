import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useCollectionStore } from '@/stores/collectionStore';
import type { CardCondition } from '@/types/collection';
import { CONDITION_LABELS } from '@/types/collection';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { getCard } from '@/api/pokemonTcg';
import { useEffect } from 'react';
import type { PokemonCard } from '@/types/pokemon';

export function AddCardModal() {
  const { addCardModalId, setAddCardModalId, addToast } = useUIStore();
  const { addCard, removeCard, updateEntry } = useCollectionStore();
  const [card, setCard] = useState<PokemonCard | null>(null);
  const [condition, setCondition] = useState<CardCondition>('NM');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const entry = useLiveQuery(
    () => addCardModalId ? db.collection.where('cardId').equals(addCardModalId).first() : undefined,
    [addCardModalId],
  );

  useEffect(() => {
    if (!addCardModalId) { setCard(null); return; }
    void getCard(addCardModalId).then(setCard).catch(() => null);
    setCondition(entry?.condition ?? 'NM');
    setNotes(entry?.notes ?? '');
  }, [addCardModalId, entry?.condition, entry?.notes]);

  const handleSave = async () => {
    if (!addCardModalId) return;
    setSaving(true);
    try {
      if ((entry?.quantity ?? 0) === 0 && (entry?.quantityFoil ?? 0) === 0) {
        await addCard(addCardModalId, 1, false, condition);
      }
      await updateEntry(addCardModalId, { condition, notes });
      addToast('Collection updated', 'success');
      setAddCardModalId(null);
    } catch {
      addToast('Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const normalQty = entry?.quantity ?? 0;
  const foilQty = entry?.quantityFoil ?? 0;

  return (
    <Modal
      isOpen={!!addCardModalId}
      onClose={() => setAddCardModalId(null)}
      title={card?.name ?? 'Add to Collection'}
      size="sm"
    >
      <div className="p-4 space-y-4">
        {card && (
          <div className="flex items-center gap-3">
            <img src={card.images.small} alt={card.name} className="w-16 rounded-lg" />
            <div>
              <p className="text-white font-semibold">{card.name}</p>
              <p className="text-gray-400 text-sm">{card.set.name} #{card.number}</p>
            </div>
          </div>
        )}

        {/* Quantity controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-card-border/30 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-300">Normal</span>
            <div className="flex items-center gap-3">
              <button onClick={() => void removeCard(addCardModalId!, 1, false)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded">-</button>
              <span className="text-white font-bold w-6 text-center">{normalQty}</span>
              <button onClick={() => void addCard(addCardModalId!, 1, false, condition)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded">+</button>
            </div>
          </div>
          <div className="flex items-center justify-between bg-card-border/30 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-300">Foil/Holo</span>
            <div className="flex items-center gap-3">
              <button onClick={() => void removeCard(addCardModalId!, 1, true)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded">-</button>
              <span className="text-white font-bold w-6 text-center">{foilQty}</span>
              <button onClick={() => void addCard(addCardModalId!, 1, true, condition)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded">+</button>
            </div>
          </div>
        </div>

        {/* Condition */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Condition</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CONDITION_LABELS) as CardCondition[]).map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  condition === c ? 'bg-accent text-white' : 'bg-card-border text-gray-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. First edition, signed..."
            className="w-full bg-card-border/50 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-accent resize-none"
            rows={2}
          />
        </div>

        <Button onClick={() => void handleSave()} loading={saving} className="w-full">
          Save to Collection
        </Button>
      </div>
    </Modal>
  );
}
