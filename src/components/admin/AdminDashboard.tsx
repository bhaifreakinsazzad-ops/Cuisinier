import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Settings,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { BUSINESS_INFO } from '@/config/business';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowBadge } from '@/components/ui/GlowBadge';
import { menuRepository, orderRepository, settingsRepository } from '@/data/repository';
import { STATUS_CONFIG, STATUS_FLOW } from '@/types';
import type { MenuItem, Order, OrderStatus, Settings as StoreSettings } from '@/types';
import { logoutAdmin } from '@/lib/adminAuth';
import { analytics } from '@/lib/analytics';
import { buildWhatsAppLink, formatCurrency, formatPaymentMethod } from '@/lib/utils';
import { MenuManager } from './MenuManager';
import { SettingsPanel } from './SettingsPanel';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'overview' | 'orders' | 'kanban' | 'menu' | 'settings';

const STATUS_COLUMNS: OrderStatus[] = ['placed', 'kitchen', 'preparing', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];

const STAT_STYLES = {
  orange: 'bg-orange-500/15 text-orange-400',
  green: 'bg-green-500/15 text-green-400',
  yellow: 'bg-yellow-500/15 text-yellow-400',
  blue: 'bg-blue-500/15 text-blue-400',
} as const;

function getWhatsappMessage(order: Order) {
  const itemsText = order.items
    .map((item) => {
      const addons = item.addons.length > 0 ? ` (${item.addons.map((addon) => addon.name).join(', ')})` : '';
      const note = item.note ? ` [Note: ${item.note}]` : '';
      return `- ${item.name} x ${item.quantity}${addons} ? ${formatCurrency(item.lineTotal)}${note}`;
    })
    .join('\n');

  return `New Cuisinier Order

Order ID: ${order.id}
Name: ${order.customerName}
Phone: ${order.phone}
Address: ${order.address}
Area: ${order.area}

Items:
${itemsText}

Subtotal: ${formatCurrency(order.subtotal)}
Delivery: ${formatCurrency(order.deliveryFee)}
Total: ${formatCurrency(order.total)}

Payment: ${formatPaymentMethod(order.paymentMethod)}${order.senderNumber ? `\nSender Number: ${order.senderNumber}` : ''}${order.transactionId ? `\nTransaction ID: ${order.transactionId}` : ''}${order.specialNote ? `\n\nNote: ${order.specialNote}` : ''}`;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const refreshData = async () => {
    setActionError('');

    const [ordersResult, menuResult, settingsResult] = await Promise.allSettled([
      orderRepository.list(),
      menuRepository.list(),
      settingsRepository.get(),
    ]);

    if (ordersResult.status === 'fulfilled') {
      setOrders(ordersResult.value);
    } else {
      setActionError('Unable to load the latest orders.');
    }

    if (menuResult.status === 'fulfilled') {
      setMenuItems(menuResult.value);
    }

    if (settingsResult.status === 'fulfilled') {
      setSettings(settingsResult.value);
    }

    setLoading(false);
  };

  useEffect(() => {
    void refreshData();
    const unsubscribe = orderRepository.subscribeToOrders(() => {
      void refreshData();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    const nextSelectedOrder = orders.find((order) => order.id === selectedOrder.id) ?? null;
    setSelectedOrder(nextSelectedOrder);
  }, [orders, selectedOrder]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setActionError('');
    try {
      const updatedOrder = await orderRepository.updateStatus(orderId, status);
      if (!updatedOrder) {
        setActionError('Order not found.');
        return;
      }

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order)),
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error(error);
      setActionError('Unable to update order status.');
    }
  };

  const forwardToWhatsApp = (order: Order) => {
    analytics.whatsappClick({ source: 'admin-forward', orderId: order.id });
    window.open(buildWhatsAppLink(settings?.whatsappNumber || BUSINESS_INFO.whatsappNumber, getWhatsappMessage(order)), '_blank', 'noopener,noreferrer');
  };

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const todayOrders = orders.filter((order) => new Date(order.createdAt) >= today);
  const pendingOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status));
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const grossProfit = Math.round(todayOrders.reduce((sum, order) => sum + order.subtotal, 0) * 0.4);

  const bestSelling = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      for (const item of order.items) {
        counts[item.name] = (counts[item.name] ?? 0) + item.quantity;
      }
    }
    return Object.entries(counts).sort((left, right) => right[1] - left[1])[0];
  }, [orders]);

  const tabs: { value: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { value: 'overview', label: 'Overview', icon: LayoutDashboard },
    { value: 'orders', label: 'Orders', icon: ClipboardList },
    { value: 'kanban', label: 'Kanban', icon: TrendingUp },
    { value: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  const statCards = [
    { label: "Today's Orders", value: todayOrders.length, icon: ClipboardList, color: 'orange' as const },
    { label: 'Total Sales', value: formatCurrency(totalSales), icon: DollarSign, color: 'green' as const },
    { label: 'Pending', value: pendingOrders.length, icon: Clock, color: 'yellow' as const },
    { label: 'Delivered', value: deliveredOrders.length, icon: CheckCircle, color: 'blue' as const },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#080808]">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#080808]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
            <div>
              <h1 className="text-sm font-bold text-white">Cuisinier</h1>
              <p className="text-[10px] text-white/40">Admin Dashboard</p>
            </div>
          </div>

          <button
            onClick={() => {
              void logoutAdmin().then(() => onLogout());
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        <div className="scrollbar-hide mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? 'border-b-2 border-orange-400 bg-orange-500/5 text-orange-400'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {actionError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={16} />
            {actionError}
          </div>
        )}

        {loading ? (
          <GlassCard>
            <p className="text-sm text-white/50">Loading dashboard data...</p>
          </GlassCard>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {statCards.map((stat, index) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <GlassCard>
                        <div className="mb-2 flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${STAT_STYLES[stat.color]}`}>
                            <stat.icon size={16} />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="mt-0.5 text-xs text-white/40">{stat.label}</p>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <GlassCard>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                        <DollarSign size={16} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(grossProfit)}</p>
                    <p className="mt-0.5 text-xs text-white/40">Estimated Gross Profit (40% of subtotal)</p>
                  </GlassCard>

                  <GlassCard>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                        <Award size={16} />
                      </div>
                    </div>
                    <p className="truncate text-lg font-bold text-white">{bestSelling?.[0] ?? 'N/A'}</p>
                    <p className="mt-0.5 text-xs text-white/40">Best-Selling Item ({bestSelling?.[1] ?? 0} sold)</p>
                  </GlassCard>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
                    <p className="text-xs text-white/35">Live order flow with manual status control and WhatsApp forwarding.</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {orders.slice(0, 5).map((order, index) => (
                    <motion.button
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedOrder(order);
                        setActiveTab('orders');
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{order.id}</span>
                            <GlowBadge variant={order.status === 'cancelled' ? 'red' : order.status === 'delivered' ? 'green' : 'orange'} className="text-[10px]">
                              {STATUS_CONFIG[order.status].label}
                            </GlowBadge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-white/40">{order.customerName} ? {order.area}</p>
                        </div>
                        <span className="ml-2 text-sm font-bold text-orange-400">{formatCurrency(order.total)}</span>
                      </div>
                    </motion.button>
                  ))}
                  {orders.length === 0 && <p className="py-8 text-center text-sm text-white/30">No orders yet.</p>}
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="mb-4 text-lg font-bold text-white">All Orders ({orders.length})</h2>
                <div className="space-y-2">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedOrder(order)}
                      className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                        selectedOrder?.id === order.id
                          ? 'border-orange-500/40 bg-orange-500/5'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white">{order.id}</span>
                            <GlowBadge variant={order.status === 'cancelled' ? 'red' : order.status === 'delivered' ? 'green' : 'orange'} className="text-[10px]">
                              {STATUS_CONFIG[order.status].label}
                            </GlowBadge>
                          </div>
                          <p className="mt-1 text-sm text-white/60">{order.customerName} ? {order.phone}</p>
                          <p className="mt-0.5 text-xs text-white/40">{order.address}, {order.area}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {order.items.map((item, itemIndex) => (
                              <span key={`${item.name}-${itemIndex}`} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                                {item.name} x{item.quantity}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="ml-3 flex-shrink-0 text-right">
                          <p className="font-bold text-orange-400">{formatCurrency(order.total)}</p>
                          <p className="mt-0.5 text-[10px] text-white/30">{formatPaymentMethod(order.paymentMethod)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {STATUS_FLOW.includes(order.status) && order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <>
                            {(() => {
                              const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
                              return nextStatus ? (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void updateStatus(order.id, nextStatus);
                                  }}
                                  className="rounded-lg bg-orange-500/20 px-2.5 py-1 text-[11px] text-orange-400 transition-colors hover:bg-orange-500/30"
                                >
                                  Move to {STATUS_CONFIG[nextStatus].label}
                                </button>
                              ) : null;
                            })()}
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void updateStatus(order.id, 'cancelled');
                              }}
                              className="rounded-lg bg-red-500/20 px-2.5 py-1 text-[11px] text-red-400 transition-colors hover:bg-red-500/30"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            forwardToWhatsApp(order);
                          }}
                          className="rounded-lg bg-green-500/20 px-2.5 py-1 text-[11px] text-green-400 transition-colors hover:bg-green-500/30"
                        >
                          Forward to WhatsApp
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {orders.length === 0 && <p className="py-8 text-center text-sm text-white/30">No orders yet.</p>}

                <AnimatePresence>
                  {selectedOrder && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex justify-end" onClick={() => setSelectedOrder(null)}>
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        onClick={(event) => event.stopPropagation()}
                        className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#111]"
                      >
                        <div className="p-5">
                          <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Order {selectedOrder.id}</h2>
                            <button onClick={() => setSelectedOrder(null)} className="text-white/50 transition-colors hover:text-white">
                              Close
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="mb-1 text-xs text-white/40">Status</p>
                              <GlowBadge variant={selectedOrder.status === 'cancelled' ? 'red' : selectedOrder.status === 'delivered' ? 'green' : 'orange'}>
                                {STATUS_CONFIG[selectedOrder.status].label}
                              </GlowBadge>
                              <p className="mt-1 text-xs italic text-white/40">&quot;{STATUS_CONFIG[selectedOrder.status].aiCopy}&quot;</p>
                            </div>

                            <div className="border-t border-white/10 pt-3">
                              <p className="mb-2 text-xs text-white/40">Customer</p>
                              <p className="text-sm text-white">{selectedOrder.customerName}</p>
                              <p className="text-sm text-white/60">{selectedOrder.phone}</p>
                              <p className="text-sm text-white/60">{selectedOrder.address}</p>
                              <p className="text-sm text-white/60">{selectedOrder.area}</p>
                            </div>

                            <div className="border-t border-white/10 pt-3">
                              <p className="mb-2 text-xs text-white/40">Items</p>
                              {selectedOrder.items.map((item, index) => (
                                <div key={`${item.name}-${index}`} className="mb-2 flex justify-between gap-3 text-sm">
                                  <div>
                                    <p className="text-white/70">{item.name} x{item.quantity}</p>
                                    {item.addons.length > 0 && <p className="text-[11px] text-white/35">Add-ons: {item.addons.map((addon) => addon.name).join(', ')}</p>}
                                    {item.note && <p className="text-[11px] italic text-white/30">Note: {item.note}</p>}
                                  </div>
                                  <span className="text-white/70">{formatCurrency(item.lineTotal)}</span>
                                </div>
                              ))}
                              {selectedOrder.specialNote && <p className="mt-2 text-xs italic text-white/30">Order note: {selectedOrder.specialNote}</p>}
                            </div>

                            <div className="space-y-1 border-t border-white/10 pt-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-white/50">Subtotal</span>
                                <span className="text-white/70">{formatCurrency(selectedOrder.subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-white/50">Delivery</span>
                                <span className="text-white/70">{formatCurrency(selectedOrder.deliveryFee)}</span>
                              </div>
                              <div className="flex justify-between font-bold">
                                <span className="text-white">Total</span>
                                <span className="text-orange-400">{formatCurrency(selectedOrder.total)}</span>
                              </div>
                            </div>

                            <div className="border-t border-white/10 pt-3">
                              <p className="mb-1 text-xs text-white/40">Payment</p>
                              <p className="text-sm text-white">{formatPaymentMethod(selectedOrder.paymentMethod)}</p>
                              {selectedOrder.senderNumber && <p className="text-sm text-white/60">Sender: {selectedOrder.senderNumber}</p>}
                              {selectedOrder.transactionId && <p className="text-sm text-white/60">Transaction ID: {selectedOrder.transactionId}</p>}
                            </div>

                            <div className="border-t border-white/10 pt-4">
                              <p className="mb-2 text-xs text-white/40">Update Status</p>
                              <div className="flex flex-wrap gap-2">
                                {STATUS_COLUMNS.map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => void updateStatus(selectedOrder.id, status)}
                                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${
                                      selectedOrder.status === status
                                        ? 'border-orange-500/50 bg-orange-500/30 text-orange-400'
                                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}
                                  >
                                    {STATUS_CONFIG[status].label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => forwardToWhatsApp(selectedOrder)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-600/20 py-3 font-semibold text-green-400 transition-colors hover:bg-green-600/30"
                            >
                              Forward to WhatsApp
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'kanban' && (
              <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {STATUS_COLUMNS.map((status) => {
                    const statusOrders = orders.filter((order) => order.status === status);
                    const config = STATUS_CONFIG[status];
                    return (
                      <div key={status} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
                          <h3 className="text-sm font-semibold text-white">{config.label}</h3>
                          <span className="ml-auto text-xs text-white/30">{statusOrders.length}</span>
                        </div>
                        <div className="space-y-2">
                          {statusOrders.map((order) => {
                            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(status) + 1];
                            return (
                              <motion.div
                                key={order.id}
                                layout
                                className="cursor-pointer rounded-lg border border-white/5 bg-white/[0.04] p-2.5 transition-colors hover:bg-white/[0.08]"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setActiveTab('orders');
                                }}
                              >
                                <p className="text-xs font-semibold text-white">{order.id}</p>
                                <p className="mt-0.5 text-[11px] text-white/50">{order.customerName}</p>
                                <p className="mt-1 text-[11px] font-medium text-orange-400">{formatCurrency(order.total)}</p>
                                {nextStatus && status !== 'delivered' && status !== 'cancelled' && (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void updateStatus(order.id, nextStatus);
                                    }}
                                    className="mt-1.5 rounded bg-orange-500/20 px-2 py-1 text-[9px] text-orange-400 transition-colors hover:bg-orange-500/30"
                                  >
                                    Move next
                                  </button>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <MenuManager items={menuItems} onUpdate={() => void refreshData()} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <SettingsPanel onSaved={(nextSettings) => {
                  setSettings(nextSettings);
                  void refreshData();
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}



