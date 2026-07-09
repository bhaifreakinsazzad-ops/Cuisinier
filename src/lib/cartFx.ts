export const FLY_TO_CART_EVENT = 'cuisinier:fly-to-cart';
export const CART_BUMP_EVENT = 'cuisinier:cart-bump';

export interface FlyToCartDetail {
  x: number;
  y: number;
  emoji: string;
}

/**
 * Fires a flying-emoji particle from the given origin element toward the
 * cart, plus a bump pulse on the bottom-nav cart badge. Pure visual feedback
 * — never touches cart state, which is already updated by the caller.
 */
export function triggerCartFx(originEl: HTMLElement | null, emoji: string) {
  if (typeof window === 'undefined') return;

  const rect = originEl?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  window.dispatchEvent(
    new CustomEvent<FlyToCartDetail>(FLY_TO_CART_EVENT, { detail: { x, y, emoji } }),
  );
  window.dispatchEvent(new CustomEvent(CART_BUMP_EVENT));
}
