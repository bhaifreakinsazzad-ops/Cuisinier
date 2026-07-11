import type { AddonOption, FlavorOption, MenuItem, Order, OrderStatus, SizeOption, Settings } from '@/types';
import {
  CUISINIER_DATA_EVENT,
  addMenuItem,
  createOrder,
  deleteMenuItem,
  generateOrderId,
  getMenuItems,
  getOrderById,
  getOrders,
  getSettings,
  saveMenuItems,
  saveOrders,
  saveSettings,
  normalizeSettings,
  updateMenuItem,
  updateOrderStatus as updateOrderStatusInStorage,
} from './storage';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type DataMode = 'localStorage' | 'supabase';

type MenuRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  visual_type: string | null;
  image_url: string | null;
  // Nullable — only present once the migration adding it has been run.
  // Absent/null just falls back to the shared category emoji in the UI.
  visual_emoji?: string | null;
  tags: string[] | null;
  is_available: boolean | null;
  is_featured: boolean | null;
  is_midnight_pick: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // Nullable — only present once docs/SUPABASE_SCHEMA.sql's variant-columns
  // migration has been run. Absent/null just means a flat-price item.
  sizes?: SizeOption[] | null;
  flavors?: FlavorOption[] | null;
  addons?: AddonOption[] | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  quantity: number;
  add_ons: Array<{ name: string; price: number }> | null;
  item_note: string | null;
  line_total: number;
  created_at: string | null;
  // Nullable — only present once docs/SUPABASE_SCHEMA.sql's variant-columns
  // migration has been run. The size/flavor is also encoded into `name`
  // regardless, so display never depends on these columns existing.
  selected_size?: string | null;
  selected_flavor?: string | null;
};

type OrderRow = {
  id: string;
  order_code: string;
  customer_name: string;
  phone: string;
  address: string;
  area: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  sender_number: string | null;
  transaction_id: string | null;
  status: string;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_items?: OrderItemRow[];
};

type SettingsRow = {
  id: string;
  delivery_fee: number | null;
  night_start_time: string | null;
  night_end_time: string | null;
  day_service_text: string | null;
  is_accepting_orders: boolean | null;
  bkash_number: string | null;
  nagad_number: string | null;
  whatsapp_number: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OrderDraft = Omit<Order, 'recordId'>;
type Unsubscribe = () => void;

function reportRepositoryError(scope: string, error: unknown) {
  console.error(`[repository] ${scope}`, error);
}

function getDataClient() {
  return getSupabaseClient();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeMenuItemId(value?: string) {
  return value && isUuid(value) ? value : null;
}

function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toTimeString(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function parseHour(value: string | null | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value.split(':')[0] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMenuItem(item: MenuItem): MenuItem {
  const normalizedId = isUuid(item.id) ? item.id : generateUuid();
  return {
    ...item,
    id: normalizedId,
    recordId: item.recordId ?? normalizedId,
  };
}

function normalizeMenuItems(items: MenuItem[]) {
  let needsSave = false;
  const normalized = items.map((item) => {
    const norm = normalizeMenuItem(item);
    // Shallow key check only — avoid expensive full JSON.stringify diff
    if (norm.id !== item.id || norm.recordId !== item.recordId) {
      needsSave = true;
    }
    return norm;
  });
  if (needsSave) saveMenuItems(normalized);
  return normalized;
}

function mapMenuRow(row: MenuRow): MenuItem {
  return {
    id: row.id,
    recordId: row.id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    category: row.category as MenuItem['category'],
    tags: (row.tags ?? []) as MenuItem['tags'],
    image: row.image_url || '/food-burger.jpg',
    visualEmoji: row.visual_emoji ?? undefined,
    available: row.is_available ?? true,
    featured: row.is_featured ?? false,
    midnightPick: row.is_midnight_pick ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
    sizes: row.sizes ?? undefined,
    flavors: row.flavors ?? undefined,
    addons: row.addons ?? undefined,
  };
}

function toMenuRow(item: MenuItem): MenuRow {
  const normalized = normalizeMenuItem(item);
  return {
    id: normalized.recordId ?? normalized.id,
    name: normalized.name,
    category: normalized.category,
    description: normalized.description,
    price: normalized.price,
    visual_type: 'image',
    image_url: normalized.image,
    visual_emoji: normalized.visualEmoji ?? null,
    tags: normalized.tags,
    is_available: normalized.available,
    is_featured: normalized.featured,
    is_midnight_pick: normalized.midnightPick,
    created_at: normalized.createdAt,
    updated_at: new Date().toISOString(),
    sizes: normalized.sizes ?? null,
    flavors: normalized.flavors ?? null,
    addons: normalized.addons ?? null,
  };
}

function mapOrderRow(row: OrderRow): Order {
  const items = [...(row.order_items ?? [])]
    .sort((left, right) => (left.created_at ?? '').localeCompare(right.created_at ?? ''))
    .map((item) => ({
      menuItemId: item.menu_item_id ?? undefined,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price ?? 0),
      addons: item.add_ons ?? [],
      note: item.item_note ?? '',
      lineTotal: Number(item.line_total ?? 0),
      selectedSize: item.selected_size ?? undefined,
      selectedFlavor: item.selected_flavor ?? undefined,
    }));

  return {
    id: row.order_code,
    recordId: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    area: row.area,
    specialNote: row.note ?? '',
    items,
    subtotal: Number(row.subtotal ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    total: Number(row.total ?? 0),
    paymentMethod: row.payment_method as Order['paymentMethod'],
    senderNumber: row.sender_number ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    status: row.status as OrderStatus,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function toOrderInsert(order: OrderDraft) {
  const recordId = generateUuid();
  return {
    orderRow: {
      id: recordId,
      order_code: order.id,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      area: order.area,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      payment_method: order.paymentMethod,
      sender_number: order.senderNumber ?? null,
      transaction_id: order.transactionId ?? null,
      status: order.status,
      note: order.specialNote || null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    },
    orderItemRows: order.items.map((item) => ({
      id: generateUuid(),
      order_id: recordId,
      menu_item_id: normalizeMenuItemId(item.menuItemId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      add_ons: item.addons,
      item_note: item.note || null,
      line_total: item.lineTotal,
      created_at: order.createdAt,
      selected_size: item.selectedSize ?? null,
      selected_flavor: item.selectedFlavor ?? null,
    })),
    statusLogRow: {
      id: generateUuid(),
      order_id: recordId,
      status: order.status,
      updated_by: 'customer',
      created_at: order.createdAt,
    },
    recordId,
  };
}

function mapSettingsRow(row: SettingsRow): Settings {
  const fallback = getSettings();
  return normalizeSettings({
    deliveryFee: Number(row.delivery_fee ?? fallback.deliveryFee),
    nightStartHour: parseHour(row.night_start_time, fallback.nightStartHour),
    nightEndHour: parseHour(row.night_end_time, fallback.nightEndHour),
    daytimeServiceText: row.day_service_text ?? fallback.daytimeServiceText,
    whatsappNumber: row.whatsapp_number ?? fallback.whatsappNumber,
    bkashNumber: row.bkash_number ?? fallback.bkashNumber,
    nagadNumber: row.nagad_number ?? fallback.nagadNumber,
    acceptingOrders: row.is_accepting_orders ?? fallback.acceptingOrders,
  });
}

function toSettingsRow(settings: Settings, id?: string): SettingsRow {
  return {
    id: id ?? generateUuid(),
    delivery_fee: settings.deliveryFee,
    night_start_time: toTimeString(settings.nightStartHour),
    night_end_time: toTimeString(settings.nightEndHour),
    day_service_text: settings.daytimeServiceText,
    is_accepting_orders: settings.acceptingOrders,
    bkash_number: settings.bkashNumber,
    nagad_number: settings.nagadNumber,
    whatsapp_number: settings.whatsappNumber,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function seedMenuIfEmpty() {
  const client = getDataClient();
  if (!client) {
    return normalizeMenuItems(getMenuItems());
  }

  const localItems = normalizeMenuItems(getMenuItems());
  if (!localItems.length) {
    return [];
  }

  const rows = localItems.map(toMenuRow);
  const { error } = await client.from('menu_items').upsert(rows, { onConflict: 'id' });
  if (error) {
    throw error;
  }

  return localItems;
}

async function seedSettingsIfEmpty() {
  const client = getDataClient();
  const localSettings = getSettings();

  if (!client) {
    return localSettings;
  }

  const row = toSettingsRow(localSettings);
  const { error } = await client.from('settings').insert(row);
  if (error) {
    throw error;
  }

  saveSettings(localSettings);
  return localSettings;
}

export function getDataMode(): DataMode {
  return isSupabaseConfigured() ? 'supabase' : 'localStorage';
}

export async function bootstrapData() {
  await Promise.allSettled([menuRepository.list(), settingsRepository.get()]);
}

export const menuRepository = {
  async list(): Promise<MenuItem[]> {
    if (!isSupabaseConfigured()) {
      return normalizeMenuItems(getMenuItems());
    }

    const client = getDataClient();
    if (!client) {
      return normalizeMenuItems(getMenuItems());
    }

    const { data, error } = await client.from('menu_items').select('*').order('created_at', { ascending: true });
    if (error) {
      reportRepositoryError('menu:list', error);
      return normalizeMenuItems(getMenuItems());
    }

    if (!data?.length) {
      return seedMenuIfEmpty();
    }

    const mapped = data.map((row) => mapMenuRow(row as MenuRow));
    saveMenuItems(mapped);
    return mapped;
  },

  async upsert(item: MenuItem) {
    const normalized = normalizeMenuItem(item);

    if (!isSupabaseConfigured()) {
      const current = getMenuItems();
      const exists = current.some((entry) => entry.id === normalized.id);
      const saved = exists ? updateMenuItem(normalized) : addMenuItem(normalized);
      return saved;
    }

    const client = getDataClient();
    if (!client) {
      return updateMenuItem(normalized);
    }

    const { error } = await client.from('menu_items').upsert(toMenuRow(normalized), { onConflict: 'id' });
    if (error) {
      throw error;
    }

    const current = getMenuItems();
    const exists = current.some((entry) => entry.id === normalized.id);
    if (exists) {
      updateMenuItem(normalized);
    } else {
      addMenuItem(normalized);
    }
    return normalized;
  },

  async remove(id: string) {
    if (!isSupabaseConfigured()) {
      deleteMenuItem(id);
      return;
    }

    const client = getDataClient();
    if (!client) {
      deleteMenuItem(id);
      return;
    }

    const { error } = await client.from('menu_items').delete().eq('id', id);
    if (error) {
      throw error;
    }

    deleteMenuItem(id);
  },
};

export const orderRepository = {
  async list(): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return getOrders();
    }

    const client = getDataClient();
    if (!client) {
      return getOrders();
    }

    const { data, error } = await client
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      reportRepositoryError('order:list', error);
      return getOrders();
    }

    const mapped = (data ?? []).map((row) => mapOrderRow(row as OrderRow));
    saveOrders(mapped);
    return mapped;
  },

  async getByCode(orderCode: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return getOrderById(orderCode) ?? null;
    }

    const client = getDataClient();
    if (!client) {
      return getOrderById(orderCode) ?? null;
    }

    const { data, error } = await client
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_code', orderCode)
      .maybeSingle();

    if (error) {
      reportRepositoryError('order:getByCode', error);
      return getOrderById(orderCode) ?? null;
    }

    if (!data) {
      return null;
    }

    const mapped = mapOrderRow(data as OrderRow);
    const nextOrders = [mapped, ...getOrders().filter((order) => order.id !== mapped.id)];
    saveOrders(nextOrders);
    return mapped;
  },

  async generateNextOrderCode(): Promise<string> {
    if (!isSupabaseConfigured()) {
      return generateOrderId();
    }

    const client = getDataClient();
    if (!client) {
      return generateOrderId();
    }

    const { data, error } = await client
      .from('orders')
      .select('order_code')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      reportRepositoryError('order:generateNextOrderCode', error);
      return generateOrderId();
    }

    const maxNumber = (data ?? []).reduce((max, row) => {
      const parsed = Number.parseInt(String(row.order_code ?? '').replace('CUI-', ''), 10);
      return Number.isFinite(parsed) && parsed > max ? parsed : max;
    }, 1000);

    return `CUI-${maxNumber + 1}`;
  },

  async create(order: OrderDraft): Promise<Order> {
    if (!isSupabaseConfigured()) {
      return createOrder(order);
    }

    const client = getDataClient();
    if (!client) {
      return createOrder(order);
    }

    const { orderRow, orderItemRows, statusLogRow, recordId } = toOrderInsert(order);
    const orderWithRecordId: Order = { ...order, recordId };

    // ── Attempt atomic RPC (requires create_order_with_items function in Supabase) ──
    const rpcResult = await client.rpc('create_order_with_items', {
      order_payload: orderRow,
      items_payload: orderItemRows,
      status_log_payload: statusLogRow,
    });

    if (!rpcResult.error) {
      createOrder(orderWithRecordId);
      return orderWithRecordId;
    }

    // PGRST202 = function not found — fall back to sequential inserts
    const notFound = rpcResult.error.code === 'PGRST202' || rpcResult.error.message?.includes('Could not find the function');
    if (!notFound) {
      throw rpcResult.error;
    }

    // ── Sequential fallback (no atomicity guarantee) ──────────────────────────
    const orderInsert = await client.from('orders').insert(orderRow);
    if (orderInsert.error) throw orderInsert.error;

    if (orderItemRows.length > 0) {
      const orderItemsInsert = await client.from('order_items').insert(orderItemRows);
      if (orderItemsInsert.error) throw orderItemsInsert.error;
    }

    const statusInsert = await client.from('order_status_logs').insert(statusLogRow);
    if (statusInsert.error) throw statusInsert.error;

    createOrder(orderWithRecordId);
    return orderWithRecordId;
  },

  async updateStatus(orderCode: string, status: OrderStatus, updatedBy = 'admin'): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return updateOrderStatusInStorage(orderCode, status) ?? null;
    }

    const client = getDataClient();
    if (!client) {
      return updateOrderStatusInStorage(orderCode, status) ?? null;
    }

    const current = await this.getByCode(orderCode);
    if (!current?.recordId) {
      return null;
    }

    const now = new Date().toISOString();
    const updateResult = await client
      .from('orders')
      .update({ status, updated_at: now })
      .eq('order_code', orderCode);

    if (updateResult.error) {
      throw updateResult.error;
    }

    const logResult = await client.from('order_status_logs').insert({
      id: generateUuid(),
      order_id: current.recordId,
      status,
      updated_by: updatedBy,
      created_at: now,
    });

    if (logResult.error) {
      throw logResult.error;
    }

    const refreshed = await this.getByCode(orderCode);
    if (refreshed) {
      return refreshed;
    }

    const nextOrders = getOrders().map((order) =>
      order.id === orderCode ? { ...order, status, updatedAt: now } : order,
    );
    saveOrders(nextOrders);
    return nextOrders.find((order) => order.id === orderCode) ?? null;
  },

  subscribeToOrders(onChange: () => void): Unsubscribe {
    if (!isSupabaseConfigured()) {
      const handler = () => onChange();
      window.addEventListener('storage', handler);
      window.addEventListener(CUISINIER_DATA_EVENT, handler);
      return () => {
        window.removeEventListener('storage', handler);
        window.removeEventListener(CUISINIER_DATA_EVENT, handler);
      };
    }

    const client = getDataClient();
    if (!client) {
      return () => undefined;
    }

    const channel = client
      .channel('cuisinier-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_status_logs' }, onChange)
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },
};

export const settingsRepository = {
  async get(): Promise<Settings> {
    if (!isSupabaseConfigured()) {
      return getSettings();
    }

    const client = getDataClient();
    if (!client) {
      return getSettings();
    }

    const { data, error } = await client
      .from('settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      reportRepositoryError('settings:get', error);
      return getSettings();
    }

    if (!data) {
      return seedSettingsIfEmpty();
    }

    const mapped = mapSettingsRow(data as SettingsRow);
    saveSettings(mapped);
    return mapped;
  },

  async save(settings: Settings): Promise<Settings> {
    if (!isSupabaseConfigured()) {
      saveSettings(settings);
      return settings;
    }

    const client = getDataClient();
    if (!client) {
      saveSettings(settings);
      return settings;
    }

    const existing = await client
      .from('settings')
      .select('id, created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    const row = toSettingsRow(settings, existing.data?.id);
    row.created_at = existing.data?.created_at ?? row.created_at;

    const { error } = await client.from('settings').upsert(row, { onConflict: 'id' });
    if (error) {
      throw error;
    }

    saveSettings(settings);
    return settings;
  },
};
