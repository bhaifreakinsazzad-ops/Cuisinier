import { useState, useCallback, useEffect } from 'react';
import type { CartItem } from '@/types';
import {
  CUISINIER_DATA_EVENT,
  getCart,
  getCartCount,
  getCartTotal,
  addToCart as storageAddToCart,
  updateCartQuantity,
  removeFromCart as storageRemoveFromCart,
  clearCart as storageClearCart,
} from '@/data/storage';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [count, setCount] = useState(getCartCount());

  const refresh = useCallback(() => {
    setCart(getCart());
    setCount(getCartCount());
  }, []);

  const add = useCallback((item: CartItem) => {
    storageAddToCart(item);
    refresh();
  }, [refresh]);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    updateCartQuantity(index, quantity);
    refresh();
  }, [refresh]);

  const remove = useCallback((index: number) => {
    storageRemoveFromCart(index);
    refresh();
  }, [refresh]);

  const clear = useCallback(() => {
    storageClearCart();
    refresh();
  }, [refresh]);

  const totals = getCartTotal();

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    window.addEventListener(CUISINIER_DATA_EVENT, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(CUISINIER_DATA_EVENT, handler);
    };
  }, [refresh]);

  return { cart, count, add, updateQuantity, remove, clear, totals, refresh };
}
