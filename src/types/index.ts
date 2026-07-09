// ============================================================
// Cuisinier Type Definitions
// ============================================================

export type Category =
  | 'All'
  | 'Shawarma'
  | 'Burger'
  | 'Pizza'
  | 'Pasta'
  | 'Fries & Snacks'
  | 'Combos'
  | 'Drinks';

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

export interface MenuItem {
  id: string;
  recordId?: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  tags: Tag[];
  image: string;
  visualEmoji?: string;
  available: boolean;
  featured: boolean;
  midnightPick: boolean;
  createdAt: string;
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
}

export interface OrderItem {
  menuItemId?: string;
  name: string;
  quantity: number;
  price: number;
  addons: CartAddon[];
  note: string;
  lineTotal: number;
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

export const CATEGORY_EMOJI: Record<string, string> = {
  Shawarma: '🌯',
  Burger: '🍔',
  Pizza: '🍕',
  Pasta: '🍝',
  'Fries & Snacks': '🍟',
  Combos: '🌙',
  Drinks: '🥤',
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
