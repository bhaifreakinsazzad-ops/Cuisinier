import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, NotebookPen, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearOrderNote, getOrderNote, saveOrderNote } from '@/data/storage';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';
import { resolveUnitPrice } from '@/types';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, remove, totals, clear } = useCart();
  const [orderNote, setOrderNote] = useState('');

  useEffect(() => {
    setOrderNote(getOrderNote());
  }, []);

  const handleCheckout = () => {
    if (orderNote.trim()) {
      saveOrderNote(orderNote);
    } else {
      clearOrderNote();
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#080808] px-5">
        <div className="absolute inset-0 holo-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.05)_0%,transparent_70%)]" />
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center">
          <motion.div
            className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShoppingCart size={32} className="text-white/30" />
            <motion.div
              className="absolute inset-0 rounded-full border border-orange-500/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          </motion.div>
          <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
          <p className="mt-2 text-sm text-white/40">Your next midnight mission starts from the menu.</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/menu')}
            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-black transition-colors hover:bg-orange-600"
          >
            Browse Menu
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,122,0,0.05)_0%,transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-xl px-5 py-6 pb-40">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Cart</h1>
            <p className="text-sm text-white/50">{cart.reduce((sum, item) => sum + item.quantity, 0)} items ready to order</p>
          </div>
          <button onClick={clear} className="flex items-center gap-1 text-xs text-red-400/70 transition-colors hover:text-red-400">
            <Trash2 size={14} />
            Clear
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {cart.map((cartItem, index) => {
              const unitPrice = resolveUnitPrice(cartItem.menuItem, cartItem.selectedSize);
              const addonsTotal = cartItem.addons.reduce((sum, addon) => sum + addon.price, 0);
              const lineTotal = (unitPrice + addonsTotal) * cartItem.quantity;
              // Stable identity matching storage.ts's addToCart merge rule (id + size +
              // flavor + addons + note), not array index — so removing one item doesn't
              // shift every other item's key and misdirect the exit animation.
              const stableKey = `${cartItem.menuItem.id}::${cartItem.selectedSize ?? ''}::${cartItem.selectedFlavor ?? ''}::${cartItem.addons.map((a) => a.name).sort().join(',')}::${cartItem.note}`;

              return (
                <motion.div
                  key={stableKey}
                  layout
                  exit={{ opacity: 0, x: -80, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <GlassCard delay={index * 0.05} hover tilt>
                    <div className="flex gap-3">
                      <img
                        src={cartItem.menuItem.image}
                        alt={cartItem.menuItem.name}
                        className="h-16 w-16 flex-shrink-0 rounded-xl border border-white/10 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="truncate pr-2 text-sm font-semibold text-white">{cartItem.menuItem.name}</h3>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => remove(index)}
                            className="flex-shrink-0 text-red-400/50 transition-colors hover:text-red-400"
                            aria-label={`Remove ${cartItem.menuItem.name}`}
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                        {(cartItem.selectedSize || cartItem.selectedFlavor) && (
                          <p className="mt-0.5 text-xs text-orange-400/80">
                            {[cartItem.selectedSize, cartItem.selectedFlavor].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {cartItem.addons.length > 0 && <p className="mt-0.5 text-xs text-white/40">+ {cartItem.addons.map((addon) => addon.name).join(', ')}</p>}
                        {cartItem.note && <p className="mt-0.5 text-[11px] italic text-white/30">&quot;{cartItem.note}&quot;</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(index, cartItem.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                            >
                              <Minus size={14} />
                            </motion.button>
                            <AnimatePresence mode="popLayout">
                              <motion.span
                                key={cartItem.quantity}
                                initial={{ y: 8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="inline-block w-6 text-center text-sm font-semibold text-white"
                              >
                                {cartItem.quantity}
                              </motion.span>
                            </AnimatePresence>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(index, cartItem.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                            >
                              <Plus size={14} />
                            </motion.button>
                          </div>
                          <span className="text-sm font-bold text-orange-400">{formatCurrency(lineTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <NotebookPen size={14} className="text-white/50" />
            <span className="text-sm font-medium text-white/70">Order Note</span>
          </div>
          <textarea
            value={orderNote}
            onChange={(event) => setOrderNote(event.target.value)}
            placeholder="Any special instructions for your order..."
            rows={2}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 focus:border-orange-500/50 focus:outline-none"
          />
        </div>

        <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span className="text-white">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Delivery Fee</span>
            <span className="text-white">{formatCurrency(totals.deliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold">
            <span className="text-white">Total</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={totals.total}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block text-lg text-orange-400"
              >
                {formatCurrency(totals.total)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          whileHover={{ boxShadow: '0 0 45px rgba(255,122,0,0.5)' }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCheckout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(255,122,0,0.3)] transition-colors hover:bg-orange-600"
        >
          Proceed to Checkout
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}
