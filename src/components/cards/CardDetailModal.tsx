import { useState, useEffect } from 'react';
import { Heart, Plus, Minus, Star, Zap, Shield, Maximize2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';
import { useCollectionStore } from '@/stores/collectionStore';
import { getCard } from '@/api/cardApi';
import type { PokemonCard } from '@/types/pokemon';
import { formatAttackCost } from '@/utils/cardHelpers';
import { db } from '@/db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from '@/i18n/LanguageContext';

export function CardDetailModal() {
  const { t } = useTranslation();
  const { cardDetailId, setCardDetailId, addToast } = useUIStore();
  const { addCard, removeCard, toggleWishlist } = useCollectionStore();
  const [card, setCard] = useState<PokemonCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const collectionEntry = useLiveQuery(
    () => cardDetailId ? db.collection.where('cardId').equals(cardDetailId).first() : undefined,
    [cardDetailId],
  );

  useEffect(() => {
    if (!cardDetailId) {
      setCard(null);
      return;
    }
    setLoading(true);
    void getCard(cardDetailId)
      .then((c) => setCard(c))
      .catch(() => addToast(t('cardDetail.failedToLoad'), 'error'))
      .finally(() => setLoading(false));
  }, [cardDetailId, addToast, t]);

  const ownedCount = (collectionEntry?.quantity ?? 0) + (collectionEntry?.quantityFoil ?? 0);

  return (
    <Modal
      isOpen={!!cardDetailId}
      onClose={() => setCardDetailId(null)}
      size="xl"
    >
      {loading && (
        <div className="flex items-center justify-center p-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && card && (
        <div className="flex flex-col md:flex-row gap-6 p-6 relative">
          {/* Close button */}
          <button
            onClick={() => setCardDetailId(null)}
            className="absolute top-2 right-2 z-10 text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-card-border/50"
          >
            <X size={20} />
          </button>
          {/* Card Image */}
          <div className="flex flex-col items-center gap-3 md:w-64 shrink-0">
            <div className="relative group cursor-pointer" onClick={() => setShowFullImage(true)}>
              <img
                src={card.images.large || card.images.small}
                alt={card.name}
                className="w-full max-w-[250px] rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl">
                <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>

            {/* Fullscreen image overlay */}
            {showFullImage && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 cursor-pointer"
                onClick={() => setShowFullImage(false)}
              >
                <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                  <X size={28} />
                </button>
                <img
                  src={card.images.large || card.images.small}
                  alt={card.name}
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
                />
              </div>
            )}

            {/* Collection controls */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between bg-card-border/50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-300">{t('cardDetail.inCollection')}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void removeCard(card.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-white font-bold w-6 text-center">{ownedCount}</span>
                  <button
                    onClick={async () => {
                      await addCard(card.id);
                      addToast(t('cardDetail.added', { name: card.name }), 'success');
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    await toggleWishlist(card.id);
                    addToast(collectionEntry?.inWishlist ? t('cardDetail.removedFromWishlist') : t('cardDetail.addedToWishlist'), 'info');
                  }}
                >
                  <Heart size={14} className={collectionEntry?.inWishlist ? 'fill-pink-400 text-pink-400' : ''} />
                  {t('cardDetail.wishlist')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={async () => {
                    await addCard(card.id);
                    addToast(t('cardDetail.added', { name: card.name }), 'success');
                  }}
                >
                  <Plus size={14} />
                  {t('cardDetail.add')}
                </Button>
              </div>
            </div>
          </div>

          {/* Card Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-2xl font-bold text-white font-display">{card.name}</h2>
                {card.hp && (
                  <span className="text-accent font-bold text-lg shrink-0">{card.hp} HP</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{card.supertype}</Badge>
                {card.subtypes?.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                {card.types?.map((t) => <Badge key={t} variant="type" type={t}>{t}</Badge>)}
                {card.rarity && <Badge variant="outline">{card.rarity}</Badge>}
              </div>
            </div>

            {/* Set info */}
            <div className="bg-card-border/30 rounded-lg p-3 text-sm">
              <p className="text-gray-300">
                <span className="text-gray-500">{t('cardDetail.set')} </span>
                <span>{card.set.name}</span>
                <span className="text-gray-500 ml-2">#{card.number}/{card.set.printedTotal}</span>
              </p>
              <p className="text-gray-300 mt-1">
                <span className="text-gray-500">{t('cardDetail.series')} </span>{card.set.series}
                {card.artist && (
                  <span className="text-gray-500 ml-3">{t('cardDetail.artist')} <span className="text-gray-300">{card.artist}</span></span>
                )}
              </p>
              <div className="flex gap-3 mt-2">
                {(['standard', 'expanded', 'unlimited'] as const).map((format) => {
                  const legal = card.legalities[format];
                  return (
                    <span key={format} className={`text-xs px-2 py-0.5 rounded-full ${legal === 'Legal' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {format}: {legal ?? 'Unknown'}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Abilities */}
            {card.abilities && card.abilities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1">
                  <Zap size={14} /> {t('cardDetail.abilities')}
                </h3>
                {card.abilities.map((ability) => (
                  <div key={ability.name} className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-3 mb-2">
                    <p className="text-purple-300 font-semibold">{ability.type}: {ability.name}</p>
                    <p className="text-gray-300 text-sm mt-1">{ability.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1">
                  <Star size={14} /> {t('cardDetail.attacks')}
                </h3>
                {card.attacks.map((attack) => (
                  <div key={attack.name} className="bg-red-900/10 border border-red-700/20 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{formatAttackCost(attack.cost)}</span>
                        <span className="text-white font-semibold">{attack.name}</span>
                      </div>
                      {attack.damage && (
                        <span className="text-accent font-bold">{attack.damage}</span>
                      )}
                    </div>
                    {attack.text && (
                      <p className="text-gray-400 text-sm mt-1">{attack.text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Weakness/Resistance/Retreat */}
            <div className="flex flex-wrap gap-4 text-sm">
              {card.weaknesses && card.weaknesses.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1 flex items-center gap-1"><Shield size={12} /> {t('cardDetail.weakness')}</p>
                  {card.weaknesses.map((w) => (
                    <Badge key={w.type} variant="type" type={w.type}>{w.type} {w.value}</Badge>
                  ))}
                </div>
              )}
              {card.resistances && card.resistances.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">{t('cardDetail.resistance')}</p>
                  {card.resistances.map((r) => (
                    <Badge key={r.type} variant="type" type={r.type}>{r.type} {r.value}</Badge>
                  ))}
                </div>
              )}
              {card.retreatCost && card.retreatCost.length > 0 && (
                <div>
                  <p className="text-gray-500 mb-1">{t('cardDetail.retreat')}</p>
                  <span className="text-white">{card.retreatCost.map(() => '⭐').join('')}</span>
                </div>
              )}
            </div>

            {card.flavorText && (
              <p className="text-gray-400 text-sm italic border-l-2 border-gray-600 pl-3">
                "{card.flavorText}"
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
