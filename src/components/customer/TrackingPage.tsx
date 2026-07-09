import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Home, MessageCircle } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BUSINESS_INFO } from '@/config/business';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowBadge } from '@/components/ui/GlowBadge';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { orderRepository, settingsRepository } from '@/data/repository';
import { STATUS_CONFIG, STATUS_FLOW } from '@/types';
import type { Order, Settings } from '@/types';
import { analytics } from '@/lib/analytics';
import { buildWhatsAppLink, formatCurrency, formatPaymentMethod } from '@/lib/utils';

const POLL_INTERVAL_MS = 12000;

export function TrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const justPlaced = Boolean((location.state as { justPlaced?: boolean } | null)?.justPlaced);
  const [showConfetti, setShowConfetti] = useState(justPlaced);

  useEffect(() => {
    if (!justPlaced) return;
    const timeout = window.setTimeout(() => setShowConfetti(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [justPlaced]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!orderId) {
        setOrder(null);
        setLoading(false);
        return;
      }

      const [orderResult, settingsResult] = await Promise.allSettled([
        orderRepository.getByCode(orderId),
        settingsRepository.get(),
      ]);

      if (!active) {
        return;
      }

      if (orderResult.status === 'fulfilled') {
        setOrder(orderResult.value);
      }

      if (settingsResult.status === 'fulfilled') {
        setSettings(settingsResult.value);
      }

      setLoading(false);
    };

    void load();
    const unsubscribe = orderRepository.subscribeToOrders(() => {
      void load();
    });
    const intervalId = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [orderId]);

  const whatsappLink = useMemo(() => {
    const supportNumber = settings?.whatsappNumber || BUSINESS_INFO.whatsappNumber;
    if (!settings) {
      return buildWhatsAppLink(supportNumber, 'Hi Cuisinier! I need help with my order.');
    }
    if (!order) {
      return buildWhatsAppLink(supportNumber, 'Hi Cuisinier! I need help with my order.');
    }
    return buildWhatsAppLink(supportNumber, `Hi Cuisinier! I need help with order ${order.id}.`);
  }, [order, settings]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808] px-5">
        <p className="text-sm text-white/50">Loading tracking status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808] px-5">
        <div className="text-center">
          <p className="text-sm text-white/50">Order not found.</p>
          <button onClick={() => navigate('/track')} className="mt-4 text-sm text-orange-400">
            Track another order
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
  const isCompleted = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <div className="relative min-h-[100dvh] bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,122,0,0.05)_0%,transparent_60%)]" />

      {showConfetti && <ConfettiBurst />}

      <div className="relative z-10 mx-auto max-w-xl px-5 py-6 pb-32">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">
            {justPlaced ? 'Food mission started.' : isCompleted ? 'Mission complete.' : isCancelled ? 'Mission cancelled.' : 'Tracking order'}
          </h1>
          <p className="mt-1 text-sm text-white/50">Order #{order.id}</p>
        </motion.div>

        {justPlaced && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <GlassCard className="mt-4 border border-green-500/20 bg-green-500/10">
              <p className="text-sm font-semibold text-green-300">Food mission started.</p>
              <p className="mt-1 text-xs text-white/65">
                Your food mission is confirmed immediately. Save this order ID and use the timeline below for updates.
              </p>
            </GlassCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <GlassCard className="mt-4" glow={!isCompleted && !isCancelled}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${statusConfig.color}20` }}>
                {isCompleted ? <CheckCircle size={24} style={{ color: statusConfig.color }} /> : <Clock size={24} style={{ color: statusConfig.color }} />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{statusConfig.label}</p>
                <p className="text-sm" style={{ color: statusConfig.color }}>
                  {statusConfig.aiCopy}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {!isCancelled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">Order Timeline</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/45">
                Refreshing every 12s
              </span>
            </div>
            <div className="space-y-0">
              {STATUS_FLOW.map((status, index) => {
                const config = STATUS_CONFIG[status];
                const isActive = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-3 w-3 rounded-full border-2 transition-colors ${
                          isActive ? 'border-orange-500 bg-orange-500' : 'border-white/20 bg-transparent'
                        } ${isCurrent ? 'shadow-[0_0_10px_rgba(255,122,0,0.5)]' : ''}`}
                      />
                      {index < STATUS_FLOW.length - 1 && (
                        <div className={`h-8 w-0.5 ${isActive && index < currentStatusIndex ? 'bg-orange-500/50' : 'bg-white/10'}`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/30'}`}>{config.label}</p>
                      {isCurrent && <p className="mt-0.5 text-xs" style={{ color: config.color }}>{config.aiCopy}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <h3 className="mb-3 mt-4 text-sm font-semibold text-white">Order Details</h3>
          <GlassCard>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-white/50">Customer</span>
                <span className="text-right text-white">{order.customerName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/50">Phone</span>
                <span className="text-right text-white">{order.phone}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/50">Address</span>
                <span className="max-w-[60%] text-right text-white">{order.address}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/50">Area</span>
                <span className="text-right text-white">{order.area}</span>
              </div>

              <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                {order.items.map((item, index) => (
                  <div key={`${item.name}-${index}`}>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/70">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-white/70">{formatCurrency(item.lineTotal)}</span>
                    </div>
                    {item.addons.length > 0 && <p className="text-xs text-white/35">Add-ons: {item.addons.map((addon) => addon.name).join(', ')}</p>}
                    {item.note && <p className="text-xs italic text-white/30">Note: {item.note}</p>}
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                <div className="flex justify-between">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white/70">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Delivery</span>
                  <span className="text-white/70">{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-orange-400">{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-2">
                <div className="flex justify-between gap-3">
                  <span className="text-white/50">Payment</span>
                  <GlowBadge variant="orange" className="text-[10px]">
                    {formatPaymentMethod(order.paymentMethod)}
                  </GlowBadge>
                </div>
                {order.senderNumber && (
                  <div className="mt-1 flex justify-between gap-3">
                    <span className="text-white/50">Sender</span>
                    <span className="text-right text-white/70">{order.senderNumber}</span>
                  </div>
                )}
                {order.transactionId && (
                  <div className="mt-1 flex justify-between gap-3">
                    <span className="text-white/50">Transaction ID</span>
                    <span className="text-right text-white/70">{order.transactionId}</span>
                  </div>
                )}
                {order.specialNote && <p className="mt-2 text-xs italic text-white/30">Order note: {order.specialNote}</p>}
              </div>

              <div className="flex justify-between pt-1 text-[11px] text-white/30">
                <span>Placed: {formatDate(order.createdAt)}</span>
                <span>Updated: {formatDate(order.updatedAt)}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate('/')} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-medium text-white transition-all hover:bg-white/15">
            <Home size={16} />
            Back to Home
          </button>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.whatsappClick({ source: 'tracking-page', orderId: order.id })}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-green-500/30 bg-green-600/20 py-3 text-sm font-medium text-green-400 transition-all hover:bg-green-600/30"
          >
            <MessageCircle size={16} />
            WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}
