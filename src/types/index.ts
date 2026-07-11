// ============================================================
// Cuisinier Type Definitions
// ============================================================

export type Category =
  | 'All'
  | 'Classic Favorites'
  | 'Chicken Fusion'
  | 'Beef Bonanza'
  | 'Drinks'
  | 'Burgers'
  | 'Wraps'
  | 'Set Menu'
  | 'Salads'
  | 'Pasta'
  | 'Fries & Sides'
  | 'Chicken Wings';

export type Tag =
  | 'Popular'
  | 'Cheesy'
  | 'Spicy'
  | 'Midnight Pick'
  | 'Best Value'
  | 'Group Order'
  | 'Heavy Meal'
  | 'Quick Bite'
  | 'Most Popular'
  | 'Midnight Combo'
  | 'Premium'
  | 'Add-on';

export type PaymentMethod = 'cod' | 'bkash' | 'nagad';

export type OrderStatus =
  | 'placed'
  | 'kitchen'
  | 'preparing'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type Mood =
  | 'cheesy'
  | 'spicy'
  | 'quick_bite'
  | 'midnight_combo'
  | 'heavy_meal'
  | 'best_value'
  | 'most_popular';

export type HungerLevel = 'light' | 'medium' | 'monster';

export type PeopleCount = 'solo' | 'two' | 'group';

/** A selectable size variant with its own price (e.g. pizza 8"/10"/12", drinks Small/Large). */
export interface SizeOption {
  label: string;
  price: number;
}

/** A no-cost selectable variant (e.g. wing flavor). Does not affect price. */
export interface FlavorOption {
  label: string;
}

/**
 * An item-specific add-on. Use `price` for a flat add-on price, or
 * `priceBySize` to scale the add-on price by the item's selected size
 * (e.g. "Add More Cheese" costs different amounts on an 8" vs 12" pizza).
 */
export interface AddonOption {
  name: string;
  price?: number;
  priceBySize?: Record<string, number>;
}

export interface MenuItem {
  id: string;
  recordId?: string;
  name: string;
  description: string;
  /** Base price. For items with `sizes`, this is the minimum (starting-from) price. */
  price: number;
  category: Category;
  tags: Tag[];
  image: string;
  visualEmoji?: string;
  available: boolean;
  featured: boolean;
  midnightPick: boolean;
  createdAt: string;
  /** Present only for items sold in multiple sizes (pizzas, drinks). */
  sizes?: SizeOption[];
  /** Present only for items with a no-cost flavor choice (e.g. wings). */
  flavors?: FlavorOption[];
  /** Present only for items with their own optional add-ons (pizzas). */
  addons?: AddonOption[];
}

export interface CartAddon {
  name: string;
  price: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  addons: CartAddon[];
  note: string;
  /** Selected size label, if `menuItem.sizes` is present. */
  selectedSize?: string;
  /** Selected flavor label, if `menuItem.flavors` is present. */
  selectedFlavor?: string;
}

export interface OrderItem {
  menuItemId?: string;
  /** Display name at order time — includes size/flavor suffix, e.g. "Veggies Pizza (10")". */
  name: string;
  quantity: number;
  price: number;
  addons: CartAddon[];
  note: string;
  lineTotal: number;
  selectedSize?: string;
  selectedFlavor?: string;
}

export interface Order {
  id: string;
  recordId?: string;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  specialNote: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  senderNumber?: string;
  transactionId?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  deliveryFee: number;
  nightStartHour: number;
  nightEndHour: number;
  daytimeServiceText: string;
  whatsappNumber: string;
  bkashNumber: string;
  nagadNumber: string;
  acceptingOrders: boolean;
}

export interface AdminSession {
  isAuthenticated: boolean;
  loginTime: string;
  expiresAt?: string;
}

export interface AppSettings {
  cravingMood: Mood | null;
  hungerLevel: HungerLevel | null;
  peopleCount: PeopleCount | null;
}

/** Resolve a menu item's actual unit price given an optional selected size. */
export function resolveUnitPrice(menuItem: MenuItem, selectedSize?: string): number {
  if (selectedSize && menuItem.sizes) {
    const match = menuItem.sizes.find((size) => size.label === selectedSize);
    if (match) return match.price;
  }
  return menuItem.price;
}

/** Resolve an add-on's actual price given an optional selected size. */
export function resolveAddonPrice(addon: AddonOption, selectedSize?: string): number {
  if (selectedSize && addon.priceBySize) {
    return addon.priceBySize[selectedSize] ?? 0;
  }
  return addon.price ?? 0;
}

export const CATEGORY_EMOJI: Record<string, string> = {
  'Classic Favorites': '🍕',
  'Chicken Fusion': '🍗',
  'Beef Bonanza': '🥩',
  Drinks: '🥤',
  Burgers: '🍔',
  Wraps: '🌯',
  'Set Menu': '🍽️',
  Salads: '🥗',
  Pasta: '🍝',
  'Fries & Sides': '🍟',
  'Chicken Wings': '🍗',
};

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; aiCopy: string }> = {
  placed: { label: 'Order Placed', color: '#ff7a00', aiCopy: 'Food mission received.' },
  kitchen: { label: 'Sent to Kitchen', color: '#f59e0b', aiCopy: 'Kitchen signal sent.' },
  preparing: { label: 'Preparing', color: '#3b82f6', aiCopy: 'Your craving is being cooked.' },
  picked_up: { label: 'Picked Up', color: '#8b5cf6', aiCopy: 'Food package secured.' },
  on_the_way: { label: 'On The Way', color: '#06b6d4', aiCopy: 'Midnight delivery in motion.' },
  delivered: { label: 'Delivered', color: '#22c55e', aiCopy: 'Mission complete. Enjoy.' },
  cancelled: { label: 'Cancelled', color: '#ef4444', aiCopy: 'Mission cancelled.' },
};

export const AREA_OPTIONS = [
  'Dhanmondi',
  'Mohammadpur',
  'Lalmatia',
  'Jigatola',
  'Green Road',
  'Kalabagan',
  'Banani',
  'Gulshan',
  'Mirpur',
  'Uttara',
  'Bashundhara',
  'Other Dhaka Area',
];

export const STATUS_FLOW: OrderStatus[] = [
  'placed',
  'kitchen',
  'preparing',
  'picked_up',
  'on_the_way',
  'delivered',
];
