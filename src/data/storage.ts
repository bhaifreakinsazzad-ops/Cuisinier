import type { MenuItem, CartItem, Order, Settings, AdminSession } from '@/types';
import { SEED_MENU_ITEMS, MENU_VERSION } from './seedMenu';
import { BUSINESS_INFO } from '@/config/business';

// ============================================================
// Cuisinier localStorage Data Layer
// ============================================================

export const CUISINIER_DATA_EVENT = 'cuisinier:data';

const KEYS = {
  MENU: 'cuisinier_menu_items',
  MENU_VERSION: 'cuisinier_menu_version',
  ORDERS: 'cuisinier_orders',
  CART: 'cuisinier_cart',
  SETTINGS: 'cuisinier_settings',
  ADMIN_SESSION: 'cuisinier_admin_session',
  SPLASH_SEEN: 'cuisinier_splash_seen',
  ORDER_NOTE: 'cuisinier_order_note',
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function emitDataChange(key: string) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(CUISINIER_DATA_EVENT, { detail: { key } }));
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  emitDataChange(key);
}

function removeKey(key: string) {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
  emitDataChange(key);
}

// --- Menu ---

const VALID_CATEGORIES = new Set(['Shawarma', 'Burger', 'Pizza', 'Pasta', 'Fries & Snacks', 'Combos', 'Drinks']);
const VALID_TAGS = new Set(['Popular', 'Cheesy', 'Spicy', 'Midnight Pick', 'Best Value', 'Group Order', 'Heavy Meal', 'Quick Bite', 'Most Popular', 'Midnight Combo', 'Premium', 'Add-on']);

function repairMenuItem(item: Partial<MenuItem>): MenuItem | null {
  if (!item.id || !item.name || typeof item.price !== 'number' || item.price <= 0) return null;
  const category = VALID_CATEGORIES.has(item.category ?? '') ? (item.category as MenuItem['category']) : 'Burger';
  const tags = (item.tags ?? []).filter((t) => VALID_TAGS.has(t)) as MenuItem['tags'];
  return {
    id: item.id,
    recordId: item.recordId,
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    category,
    tags,
    image: item.image || '/food-burger.jpg',
    visualEmoji: item.visualEmoji,
    available: item.available ?? true,
    featured: item.featured ?? false,
    midnightPick: item.midnightPick ?? false,
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
}

function normalizeMenuData(data: unknown[]): MenuItem[] {
  const seen = new Set<string>();
  const repaired: MenuItem[] = [];
  for (const raw of data) {
    const item = repairMenuItem(raw as Partial<MenuItem>);
    if (!item) continue;
    const key = item.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      repaired.push(item);
    }
  }
  return repaired;
}

export function getMenuItems(): MenuItem[] {
  const storedVersion = isBrowser() ? localStorage.getItem(KEYS.MENU_VERSION) : null;
  const data = readJSON<MenuItem[] | null>(KEYS.MENU, null);

  // No data at all → seed fresh
  if (!data?.length) {
    writeJSON(KEYS.MENU, SEED_MENU_ITEMS);
    if (isBrowser()) localStorage.setItem(KEYS.MENU_VERSION, MENU_VERSION);
    return SEED_MENU_ITEMS;
  }

  // Version matches → trust stored data (admin may have edited it)
  if (storedVersion === MENU_VERSION) {
    return data;
  }

  // Stale or missing version → repair/normalize in place (preserves admin edits)
  const repaired = normalizeMenuData(data);

  // If repair produced < 5 items the data is clearly corrupt → reset to seed
  if (repaired.length < 5) {
    writeJSON(KEYS.MENU, SEED_MENU_ITEMS);
    if (isBrowser()) localStorage.setItem(KEYS.MENU_VERSION, MENU_VERSION);
    return SEED_MENU_ITEMS;
  }

  // Merge: add any seed items that are missing from stored (new menu additions)
  const storedNames = new Set(repaired.map((i) => i.name.toLowerCase().trim()));
  const merged = [...repaired];
  for (const seedItem of SEED_MENU_ITEMS) {
    if (!storedNames.has(seedItem.name.toLowerCase().trim())) {
      merged.push(seedItem);
    }
  }

  writeJSON(KEYS.MENU, merged);
  if (isBrowser()) localStorage.setItem(KEYS.MENU_VERSION, MENU_VERSION);
  return merged;
}

export function saveMenuItems(items: MenuItem[]) {
  writeJSON(KEYS.MENU, items);
}

export function addMenuItem(item: MenuItem) {
  const items = getMenuItems();
  items.push(item);
  saveMenuItems(items);
  return item;
}

export function updateMenuItem(updated: MenuItem) {
  const items = getMenuItems();
  const idx = items.findIndex((i) => i.id === updated.id);
  if (idx >= 0) {
    items[idx] = updated;
    saveMenuItems(items);
  }
  return updated;
}

export function deleteMenuItem(id: string) {
  const items = getMenuItems().filter((i) => i.id !== id);
  saveMenuItems(items);
}

// --- Cart ---
export function getCart(): CartItem[] {
  return readJSON<CartItem[]>(KEYS.CART, []);
}

export function saveCart(cart: CartItem[]) {
  writeJSON(KEYS.CART, cart);
}

export function addToCart(cartItem: CartItem) {
  const cart = getCart();
  const existingIdx = cart.findIndex(
    (c) =>
      c.menuItem.id === cartItem.menuItem.id &&
      JSON.stringify(c.addons.map((a) => a.name).sort()) ===
        JSON.stringify(cartItem.addons.map((a) => a.name).sort()) &&
      c.note === cartItem.note
  );
  if (existingIdx >= 0) {
    cart[existingIdx].quantity += cartItem.quantity;
  } else {
    cart.push(cartItem);
  }
  saveCart(cart);
}

export function updateCartQuantity(index: number, quantity: number) {
  const cart = getCart();
  if (quantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(index: number) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  removeKey(KEYS.CART);
}

// --- Orders ---
export function getOrders(): Order[] {
  return readJSON<Order[]>(KEYS.ORDERS, []);
}

export function saveOrders(orders: Order[]) {
  writeJSON(KEYS.ORDERS, orders);
}

export function createOrder(order: Order) {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}

export function updateOrderStatus(id: string, status: Order['status']) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx >= 0) {
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    saveOrders(orders);
  }
  return orders[idx];
}

// --- Settings ---
export function getSettings(): Settings {
  const stored = readJSON<Partial<Settings>>(KEYS.SETTINGS, {});
  return normalizeSettings(stored);
}

export function getDefaultSettings(): Settings {
  return {
    deliveryFee: BUSINESS_INFO.deliveryFee,
    nightStartHour: 23,
    nightEndHour: 4,
    daytimeServiceText: BUSINESS_INFO.daytimeServiceText,
    whatsappNumber: BUSINESS_INFO.whatsappNumber,
    bkashNumber: BUSINESS_INFO.bkashNumber,
    nagadNumber: BUSINESS_INFO.nagadNumber,
    acceptingOrders: true,
  };
}

function normalizeLaunchNumber(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  if (!normalized || /x/i.test(normalized) || normalized.length < 10) {
    return fallback;
  }
  return normalized;
}

export function normalizeSettings(settings: Partial<Settings>): Settings {
  const defaults = getDefaultSettings();
  const deliveryFee = Number(settings.deliveryFee);
  const nightStartHour = Number(settings.nightStartHour);
  const nightEndHour = Number(settings.nightEndHour);

  return {
    ...defaults,
    ...settings,
    deliveryFee: Number.isFinite(deliveryFee) && deliveryFee > 0 ? deliveryFee : defaults.deliveryFee,
    nightStartHour: Number.isFinite(nightStartHour) && nightStartHour >= 0 && nightStartHour <= 23
      ? nightStartHour
      : defaults.nightStartHour,
    nightEndHour: Number.isFinite(nightEndHour) && nightEndHour >= 0 && nightEndHour <= 23
      ? nightEndHour
      : defaults.nightEndHour,
    daytimeServiceText: settings.daytimeServiceText?.trim() || defaults.daytimeServiceText,
    whatsappNumber: normalizeLaunchNumber(settings.whatsappNumber, defaults.whatsappNumber),
    bkashNumber: normalizeLaunchNumber(settings.bkashNumber, defaults.bkashNumber),
    nagadNumber: normalizeLaunchNumber(settings.nagadNumber, defaults.nagadNumber),
    acceptingOrders: settings.acceptingOrders ?? defaults.acceptingOrders,
  };
}

export function saveSettings(settings: Settings) {
  writeJSON(KEYS.SETTINGS, normalizeSettings(settings));
}

// --- Admin Session ---
export function getAdminSession(): AdminSession | null {
  return readJSON<AdminSession | null>(KEYS.ADMIN_SESSION, null);
}

export function setAdminSession(session: AdminSession) {
  writeJSON(KEYS.ADMIN_SESSION, session);
}

export function clearAdminSession() {
  removeKey(KEYS.ADMIN_SESSION);
}

// --- Splash ---
export function hasSeenSplash(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(KEYS.SPLASH_SEEN) === 'true';
}

export function markSplashSeen() {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.SPLASH_SEEN, 'true');
}

export function getOrderNote() {
  if (!isBrowser()) return '';
  return localStorage.getItem(KEYS.ORDER_NOTE) ?? '';
}

export function saveOrderNote(note: string) {
  if (!note.trim()) {
    clearOrderNote();
    return;
  }
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.ORDER_NOTE, note);
  emitDataChange(KEYS.ORDER_NOTE);
}

export function clearOrderNote() {
  removeKey(KEYS.ORDER_NOTE);
}

// --- Helpers ---
export function generateOrderId(): string {
  const orders = getOrders();
  const maxNum = orders.reduce((max, o) => {
    const num = parseInt(o.id.replace('CUI-', ''));
    return num > max ? num : max;
  }, 1000);
  return `CUI-${maxNum + 1}`;
}

export function getCartTotal(): { subtotal: number; deliveryFee: number; total: number } {
  const cart = getCart();
  const settings = getSettings();
  const subtotal = cart.reduce((sum, c) => {
    const addonsTotal = c.addons.reduce((a, addon) => a + addon.price, 0);
    return sum + (c.menuItem.price + addonsTotal) * c.quantity;
  }, 0);
  return {
    subtotal,
    deliveryFee: settings.deliveryFee,
    total: subtotal + settings.deliveryFee,
  };
}

export function getCartCount(): number {
  return getCart().reduce((sum, c) => sum + c.quantity, 0);
}
