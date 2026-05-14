import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Minus, NotebookPen, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearOrderNote, getOrderNote, saveOrderNote } from '@/data/storage';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/utils';

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.05)_0%,transparent_70%)]" />
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <ShoppingCart size={32} className="text-white/30" />
          </div>
          <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
          <p className="mt-2 text-sm text-white/40">Your next midnight mission starts from the menu.</p>
          <button onClick={() => navigate('/menu')} className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-black transition-colors hover:bg-orange-600">
            Browse Menu
          </button>
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
          {cart.map((cartItem, index) => {
            const addonsTotal = cartItem.addons.reduce((sum, addon) => sum + addon.price, 0);
            const lineTotal = (cartItem.menuItem.price + addonsTotal) * cartItem.quantity;

            return (
              <GlassCard key={`${cartItem.menuItem.id}-${index}`} delay={index * 0.05}>
                <div className="flex gap-3">
                  <img
                    src={cartItem.menuItem.image}
                    alt={cartItem.menuItem.name}
                    className="h-16 w-16 flex-shrink-0 rounded-xl border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="truncate pr-2 text-sm font-semibold text-white">{cartItem.menuItem.name}</h3>
                      <button onClick={() => remove(index)} className="flex-shrink-0 text-red-400/50 transition-colors hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {cartItem.addons.length > 0 && <p className="mt-0.5 text-xs text-white/40">+ {cartItem.addons.map((addon) => addon.name).join(', ')}</p>}
                    {cartItem.note && <p className="mt-0.5 text-[11px] italic text-white/30">&quot;{cartItem.note}&quot;</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(index, cartItem.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-white">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(index, cartItem.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-orange-400">{formatCurrency(lineTotal)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
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
            <span className="text-lg text-orange-400">{formatCurrency(totals.total)}</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCheckout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(255,122,0,0.3)] transition-all hover:bg-orange-600"
        >
          Proceed to Checkout
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}
