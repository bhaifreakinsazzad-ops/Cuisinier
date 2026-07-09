import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { addToCart } from '@/data/storage';
import { GlowBadge } from '@/components/ui/GlowBadge';
import { CATEGORY_EMOJI } from '@/types';
import { analytics } from '@/lib/analytics';
import { formatCurrency } from '@/lib/utils';
import type { CartAddon, MenuItem } from '@/types';

interface ItemDetailModalProps {
  item: MenuItem;
  onClose: () => void;
}

const ADDONS: CartAddon[] = [
  { name: 'Extra Cheese', price: 50 },
  { name: 'Extra Sauce', price: 30 },
  { name: 'Extra Spicy', price: 20 },
];

function ModalImage({ item }: { item: MenuItem }) {
  const [failed, setFailed] = useState(false);
  const emoji = item.visualEmoji ?? CATEGORY_EMOJI[item.category] ?? '🍽️';

  if (failed || !item.image) {
    return (
      <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-white/5 to-orange-500/10 text-8xl">
        {emoji}
      </div>
    );
  }

  return (
    <div className="relative h-56">
      <img
        src={item.image}
        alt={item.name}
        onError={() => setFailed(true)}
        className="h-56 w-full object-cover"
      />
      <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl backdrop-blur-sm">
        {emoji}
      </span>
    </div>
  );
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<CartAddon[]>([]);
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  // ViewContent fires once when the modal opens
  useEffect(() => {
    analytics.viewContent({
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      content_type: 'product',
      value: item.price,
      currency: 'BDT',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const toggleAddon = (addon: CartAddon) => {
    setSelectedAddons((current) =>
      current.find((entry) => entry.name === addon.name)
        ? current.filter((entry) => entry.name !== addon.name)
        : [...current, addon],
    );
  };

  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const itemTotal = (item.price + addonsTotal) * quantity;

  const handleAddToCart = () => {
    if (!item.available) return;

    addToCart({
      menuItem: item,
      quantity,
      addons: selectedAddons,
      note: note.trim(),
    });
    analytics.addToCart({
      currency: 'BDT',
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      content_type: 'product',
      value: itemTotal,
      itemId: item.id,
      itemName: item.name,
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      onClose();
    }, 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-3xl border-t border-white/10 bg-[#111]"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
          {/* Hero image / emoji */}
          <div className="relative">
            <ModalImage item={item} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
          </div>

          <div className="relative -mt-8 px-5 pb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{item.name}</h2>
                <p className="mt-1 text-sm text-white/50">{item.description}</p>
              </div>
              <span className="ml-4 text-2xl font-bold text-orange-400">{formatCurrency(item.price)}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <GlowBadge key={tag} variant="orange">{tag}</GlowBadge>
              ))}
              {!item.available && <GlowBadge variant="red">Temporarily unavailable</GlowBadge>}
            </div>

            {/* Add-ons */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-white">Add-ons</p>
              <div className="space-y-2">
                {ADDONS.map((addon) => {
                  const selected = selectedAddons.some((entry) => entry.name === addon.name);
                  return (
                    <button
                      key={addon.name}
                      onClick={() => toggleAddon(addon)}
                      disabled={!item.available}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? 'border-orange-500/40 bg-orange-500/15'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className={`text-sm ${selected ? 'text-orange-400' : 'text-white/80'}`}>{addon.name}</span>
                      <span className={`text-sm font-medium ${selected ? 'text-orange-400' : 'text-white/50'}`}>
                        +{formatCurrency(addon.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedAddons.length > 0 && (
                <p className="mt-2 text-xs text-orange-400/80">
                  Add-ons: +{formatCurrency(addonsTotal)}
                </p>
              )}
            </div>

            {/* Note */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-white">Special Note</p>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Any special requests…"
                rows={2}
                disabled={!item.available}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Quantity */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={!item.available}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-lg font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((current) => current + 1)}
                  disabled={!item.available}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={!item.available}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all ${
                added
                  ? 'bg-green-500 text-black'
                  : 'bg-orange-500 text-black shadow-[0_0_30px_rgba(255,122,0,0.3)] hover:bg-orange-600'
              } disabled:cursor-not-allowed disabled:opacity-45`}
            >
              {added ? (
                '✓ Added to Cart!'
              ) : (
                <>
                  <ShoppingCart size={18} />
                  {item.available
                    ? `Add to Cart — ${formatCurrency(itemTotal)}`
                    : 'Currently unavailable'}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
