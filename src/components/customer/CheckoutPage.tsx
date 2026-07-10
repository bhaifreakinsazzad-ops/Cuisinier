import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { BUSINESS_INFO } from '@/config/business';
import { clearOrderNote, getOrderNote } from '@/data/storage';
import { orderRepository } from '@/data/repository';
import { useCart } from '@/hooks/useCart';
import { useOnlineStatus } from '@/hooks/usePWAInstall';
import { useSettings } from '@/hooks/useSettings';
import { analytics } from '@/lib/analytics';
import { AREA_OPTIONS } from '@/types';
import type { PaymentMethod } from '@/types';
import { formatCurrency, isLikelyBangladeshMobile, sanitizeText, sanitizeTransactionId } from '@/lib/utils';

const DRAFT_KEY = 'cuisinier_checkout_draft';

type DraftFields = {
  name: string;
  phone: string;
  address: string;
  area: string;
  specialNote: string;
  paymentMethod: PaymentMethod;
};

function loadDraft(): Partial<DraftFields> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<DraftFields>) : {};
  } catch {
    return {};
  }
}

function saveDraft(fields: DraftFields) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(fields));
  } catch {
    // localStorage full — ignore
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, totals, clear } = useCart();
  const { settings } = useSettings();
  const isOnline = useOnlineStatus();

  const draft = useRef(loadDraft());
  // clear() dispatches a synchronous cart-change event that can commit its own
  // render before navigate() takes effect, hitting the cart.length===0 guard
  // below and showing "cart is empty" instead of the order confirmation.
  // Once an order is actually placed, never show that fallback again.
  const hasSubmittedRef = useRef(false);

  const [name, setName] = useState(draft.current.name ?? '');
  const [phone, setPhone] = useState(draft.current.phone ?? '');
  const [address, setAddress] = useState(draft.current.address ?? '');
  const [area, setArea] = useState(draft.current.area ?? '');
  const [specialNote, setSpecialNote] = useState(draft.current.specialNote ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(draft.current.paymentMethod ?? 'cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const manualPaymentSelected = paymentMethod === 'bkash' || paymentMethod === 'nagad';
  const paymentDestination = paymentMethod === 'bkash' ? settings.bkashNumber : settings.nagadNumber;

  // Load order note and fire InitiateCheckout once on mount
  useEffect(() => {
    const orderNote = getOrderNote();
    if (orderNote && !specialNote) setSpecialNote(orderNote);
    analytics.initiateCheckout({
      currency: 'BDT',
      itemCount: cart.length,
      value: totals.total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft on form field changes
  useEffect(() => {
    saveDraft({ name, phone, address, area, specialNote, paymentMethod });
  }, [name, phone, address, area, specialNote, paymentMethod]);

  // Clear manual payment fields when switching to COD
  useEffect(() => {
    if (paymentMethod === 'cod') {
      setSenderNumber('');
      setTransactionId('');
    }
  }, [paymentMethod]);

  if (cart.length === 0 && !hasSubmittedRef.current) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808] px-5">
        <div className="text-center">
          <p className="text-sm text-white/50">Your cart is empty.</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-4 rounded-xl bg-orange-500 px-6 py-3 font-bold text-black"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && hasSubmittedRef.current) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808] px-5">
        <p className="text-sm text-white/50">Order placed — redirecting…</p>
      </div>
    );
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    const trimmedName = sanitizeText(name);
    if (!trimmedName) {
      nextErrors.name = 'Customer name is required.';
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'Please enter your full name.';
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!isLikelyBangladeshMobile(trimmedPhone)) {
      nextErrors.phone = 'Use a valid Bangladesh mobile number (01XXXXXXXXX).';
    }

    const trimmedAddress = sanitizeText(address);
    if (!trimmedAddress) {
      nextErrors.address = 'Delivery address is required.';
    } else if (trimmedAddress.length < 8) {
      nextErrors.address = 'Please enter a complete delivery address.';
    }

    if (!area) {
      nextErrors.area = 'Please select a delivery area.';
    }

    if (manualPaymentSelected) {
      if (!isLikelyBangladeshMobile(paymentDestination)) {
        nextErrors.paymentMethod =
          'Manual payment is temporarily unavailable. Please use Cash on Delivery.';
      }

      const trimmedSender = senderNumber.trim();
      if (!trimmedSender) {
        nextErrors.senderNumber = 'Sender number is required for manual payment.';
      } else if (!isLikelyBangladeshMobile(trimmedSender)) {
        nextErrors.senderNumber = 'Use the valid Bangladesh mobile number used for payment.';
      }

      const trimmedTxn = sanitizeTransactionId(transactionId);
      if (!trimmedTxn) {
        nextErrors.transactionId = 'Transaction ID is required for manual payment.';
      } else if (trimmedTxn.length < 6) {
        nextErrors.transactionId = 'Transaction ID looks too short.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return; // Guard against double-submit

    if (!isOnline) {
      setErrors({ submit: 'Internet connection is required to place your order.' });
      return;
    }

    if (!settings.acceptingOrders) {
      setErrors({ submit: 'Currently not accepting orders.' });
      return;
    }

    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const orderId = await orderRepository.generateNextOrderCode();
      const now = new Date().toISOString();

      const orderItems = cart.map((entry) => {
        const addonsTotal = entry.addons.reduce((sum, addon) => sum + addon.price, 0);
        return {
          menuItemId: entry.menuItem.id,
          name: entry.menuItem.name,
          quantity: entry.quantity,
          price: entry.menuItem.price,
          addons: entry.addons,
          note: sanitizeText(entry.note),
          lineTotal: (entry.menuItem.price + addonsTotal) * entry.quantity,
        };
      });

      const order = await orderRepository.create({
        id: orderId,
        customerName: sanitizeText(name),
        phone: phone.trim(),
        address: sanitizeText(address),
        area,
        specialNote: sanitizeText(specialNote),
        items: orderItems,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        paymentMethod,
        senderNumber: paymentMethod === 'cod' ? undefined : senderNumber.trim(),
        transactionId:
          paymentMethod === 'cod' ? undefined : sanitizeTransactionId(transactionId),
        status: 'placed',
        createdAt: now,
        updatedAt: now,
      });

      analytics.orderPlaced({
        currency: 'BDT',
        orderId: order.id,
        paymentMethod: order.paymentMethod,
        value: order.total,
        num_items: order.items.reduce((s, i) => s + i.quantity, 0),
        content_ids: order.items.map((i) => i.menuItemId ?? i.name),
      });

      hasSubmittedRef.current = true;
      clear();
      clearOrderNote();
      clearDraft();
      navigate(`/order/${order.id}`, { state: { justPlaced: true } });
    } catch (submitError) {
      console.error('[checkout]', submitError);
      setErrors({ submit: 'Unable to place order right now. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-4 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors ${
      errors[field]
        ? 'border-red-500/50'
        : 'border-white/10 focus:border-orange-500/50'
    } bg-white/5`;

  return (
    <div className="relative min-h-[100dvh] bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,122,0,0.05)_0%,transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-xl px-5 py-6 pb-40">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate('/cart')}
            className="mb-4 text-sm text-white/50 transition-colors hover:text-white/80"
          >
            ← Back to Cart
          </button>
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
          <p className="text-sm text-white/50">Guest checkout stays primary. No login required.</p>
        </motion.div>

        {!isOnline && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 p-3 text-xs text-red-400">
            <AlertTriangle size={16} />
            Internet connection is required to place your order.
          </div>
        )}

        {!settings.acceptingOrders && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/15 p-3 text-xs text-yellow-400">
            <AlertTriangle size={16} />
            Currently not accepting orders. You can still browse the menu.
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="mt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Order Summary</h3>
                <p className="text-xs text-white/35">Delivery fee is fixed before confirmation.</p>
              </div>
              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-300">
                Delivery {formatCurrency(totals.deliveryFee)}
              </span>
            </div>

            <div className="space-y-2">
              {cart.map((entry, index) => {
                const addonsTotal = entry.addons.reduce((sum, addon) => sum + addon.price, 0);
                const lineTotal = (entry.menuItem.price + addonsTotal) * entry.quantity;
                return (
                  <div key={`${entry.menuItem.id}-${index}`} className="text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-white/75">
                        {entry.menuItem.name} x{entry.quantity}
                      </span>
                      <span className="text-white/85">{formatCurrency(lineTotal)}</span>
                    </div>
                    {entry.addons.length > 0 && (
                      <p className="text-xs text-white/35">
                        Add-ons: {entry.addons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    {entry.note && (
                      <p className="text-xs italic text-white/30">Note: {entry.note}</p>
                    )}
                  </div>
                );
              })}

              <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white/70">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Delivery</span>
                  <span className="text-white/70">{formatCurrency(totals.deliveryFee)}</span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="mb-3 mt-6 text-sm font-semibold text-white">Delivery Details</h3>
          <div className="space-y-3">
            <div>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((c) => ({ ...c, name: '' }));
                }}
                placeholder="Customer Name *"
                autoComplete="name"
                className={`${inputClass('name')} h-12`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>
            <div>
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((c) => ({ ...c, phone: '' }));
                }}
                placeholder="Phone Number * (01XXXXXXXXX)"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                className={`${inputClass('phone')} h-12`}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>
            <div>
              <textarea
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrors((c) => ({ ...c, address: '' }));
                }}
                rows={3}
                placeholder="Delivery Address *"
                autoComplete="street-address"
                className={`${inputClass('address')} resize-none py-3`}
              />
              {errors.address && <p className="mt-1 text-xs text-red-400">{errors.address}</p>}
            </div>
            <div>
              <select
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setErrors((c) => ({ ...c, area: '' }));
                }}
                className={`${inputClass('area')} h-12 appearance-none`}
              >
                <option value="" disabled>
                  Select Area *
                </option>
                {AREA_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.area && <p className="mt-1 text-xs text-red-400">{errors.area}</p>}
            </div>
            <div>
              <textarea
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                rows={2}
                placeholder="Special note (optional)"
                className={`${inputClass('specialNote')} resize-none py-3`}
              />
            </div>
            <p className="text-[11px] text-white/35">
              Night: Dhaka service. Daytime: Dhanmondi and nearby areas.
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="mb-3 mt-6 text-sm font-semibold text-white">Payment Method</h3>
          <div className="space-y-2">
            {[
              { value: 'cod', label: 'Cash on Delivery', icon: Banknote, caption: 'Fastest option at the door' },
              {
                value: 'bkash',
                label: 'bKash Manual',
                icon: Smartphone,
                caption: isLikelyBangladeshMobile(settings.bkashNumber)
                  ? `Send payment manually to ${BUSINESS_INFO.bkashLabel}: ${settings.bkashNumber}`
                  : 'Number not configured yet',
              },
              {
                value: 'nagad',
                label: 'Nagad Manual',
                icon: CreditCard,
                caption: isLikelyBangladeshMobile(settings.nagadNumber)
                  ? `Send payment manually to ${BUSINESS_INFO.nagadLabel}: ${settings.nagadNumber}`
                  : 'Number not configured yet',
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setPaymentMethod(option.value as PaymentMethod);
                  setErrors((c) => ({ ...c, paymentMethod: '' }));
                }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  paymentMethod === option.value
                    ? 'border-orange-500/40 bg-orange-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <option.icon
                  size={20}
                  className={paymentMethod === option.value ? 'text-orange-400' : 'text-white/50'}
                />
                <div className="flex-1">
                  <span
                    className={`block text-sm font-medium ${
                      paymentMethod === option.value ? 'text-orange-400' : 'text-white/80'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-white/35">{option.caption}</span>
                </div>
                {paymentMethod === option.value && (
                  <span className="ml-auto h-5 w-5 rounded-full bg-orange-500" />
                )}
              </button>
            ))}
          </div>
          {errors.paymentMethod && (
            <p className="mt-2 text-xs text-red-400">{errors.paymentMethod}</p>
          )}
        </motion.div>

        {manualPaymentSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <GlassCard>
              <p className="mb-2 text-sm text-white/70">
                {paymentMethod === 'bkash'
                  ? `Send payment manually to ${BUSINESS_INFO.bkashLabel}: ${paymentDestination}. Then enter Sender Number and Transaction ID.`
                  : `Send payment manually to ${BUSINESS_INFO.nagadLabel}: ${paymentDestination}. Then enter Sender Number and Transaction ID.`}
              </p>
              <p className="mb-3 text-xs font-medium text-orange-400">
                Destination number: {paymentDestination || 'Not configured yet'}
              </p>
              {!isLikelyBangladeshMobile(paymentDestination) && (
                <p className="mb-3 text-xs text-red-400">
                  Manual payment number is not configured correctly yet. Use Cash on Delivery for now.
                </p>
              )}
              <div>
                <input
                  value={senderNumber}
                  onChange={(e) => {
                    setSenderNumber(e.target.value);
                    setErrors((c) => ({ ...c, senderNumber: '' }));
                  }}
                  placeholder={`Sender Number (${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}) *`}
                  type="tel"
                  inputMode="numeric"
                  className={`${inputClass('senderNumber')} h-12`}
                />
                {errors.senderNumber && (
                  <p className="mt-1 text-xs text-red-400">{errors.senderNumber}</p>
                )}
              </div>
              <div className="mt-3">
                <input
                  value={transactionId}
                  onChange={(e) => {
                    setTransactionId(e.target.value);
                    setErrors((c) => ({ ...c, transactionId: '' }));
                  }}
                  placeholder="Transaction ID *"
                  className={`${inputClass('transactionId')} h-12`}
                />
                {errors.transactionId && (
                  <p className="mt-1 text-xs text-red-400">{errors.transactionId}</p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {errors.submit && (
          <p className="mt-4 text-center text-xs text-red-400">{errors.submit}</p>
        )}

        <motion.button
          whileTap={{ scale: submitting ? 1 : 0.97 }}
          onClick={() => void handleSubmit()}
          disabled={submitting || !isOnline || !settings.acceptingOrders}
          aria-busy={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-base font-bold text-black shadow-[0_0_30px_rgba(255,122,0,0.3)] transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            'Placing Order…'
          ) : (
            <>
              Place Order – {formatCurrency(totals.total)} <ArrowRight size={18} />
            </>
          )}
        </motion.button>

        <p className="mt-3 text-center text-[11px] text-white/20">
          Orders are confirmed immediately after submission.
        </p>
      </div>
    </div>
  );
}
