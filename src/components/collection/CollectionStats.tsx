import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { BookOpen, Layers, Star, Heart } from 'lucide-react';
export function CollectionStats() {
  const entries = useLiveQuery(() => db.collection.toArray(), []);

  if (!entries) return null;

  const totalNormal = entries.reduce((s, e) => s + e.quantity, 0);
  const totalFoil = entries.reduce((s, e) => s + e.quantityFoil, 0);
  const totalCards = totalNormal + totalFoil;
  const uniqueCards = entries.filter((e) => e.quantity > 0 || e.quantityFoil > 0).length;
  const wishlistCount = entries.filter((e) => e.inWishlist).length;

  const stats = [
    { icon: BookOpen, label: 'Total Cards', value: totalCards, color: 'text-blue-400' },
    { icon: Star, label: 'Unique Cards', value: uniqueCards, color: 'text-yellow-400' },
    { icon: Layers, label: 'Foil/Holo', value: totalFoil, color: 'text-purple-400' },
    { icon: Heart, label: 'Wishlist', value: wishlistCount, color: 'text-pink-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="bg-card-bg border border-card-border rounded-xl p-4">
          <Icon size={20} className={color} />
          <p className="text-2xl font-bold text-white mt-2">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
