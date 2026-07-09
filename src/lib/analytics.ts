declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _cuisinierGaLoaded?: boolean;
    _cuisinierPixelLoaded?: boolean;
  }
}

// Pixel ID: validated at init, not injected from raw env string
const RAW_GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() ?? '';
const RAW_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim() ?? '';

// Validate: GA4 measurement IDs look like G-XXXXXXXXXX
const GA_ID_VALID = /^G-[A-Z0-9]+$/.test(RAW_GA_ID) ? RAW_GA_ID : '';
// Validate: Meta Pixel IDs are pure digits, 13–17 chars
const PIXEL_ID_VALID = /^\d{13,17}$/.test(RAW_PIXEL_ID) ? RAW_PIXEL_ID : '';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function injectExternalScript(src: string, id: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function initGa() {
  if (!isBrowser() || !GA_ID_VALID || window._cuisinierGaLoaded) return;

  injectExternalScript(
    `https://www.googletagmanager.com/gtag/js?id=${GA_ID_VALID}`,
    'cuisinier-ga-script',
  );

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID_VALID, { send_page_view: false });
  window._cuisinierGaLoaded = true;
}

function initMetaPixel() {
  if (!isBrowser() || !PIXEL_ID_VALID || window._cuisinierPixelLoaded) return;

  // Use external script only — never inject an inline script template with env variables
  injectExternalScript('https://connect.facebook.net/en_US/fbevents.js', 'cuisinier-meta-pixel-script');

  // fbq bootstrap stub so calls queued before the script loads are not dropped
  if (!window.fbq) {
    const noop = Object.assign(
      function fbq(...args: unknown[]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if ((fbq as any).callMethod) (fbq as any).callMethod.apply(fbq, args);
        else (fbq as any).queue.push(args);
      },
      {
        callMethod: null,
        queue: [] as unknown[],
        loaded: true,
        version: '2.0',
        push: (...a: unknown[]) => noop(...a),
      },
    );
    window.fbq = noop as unknown as typeof window.fbq;
    // @ts-expect-error
    window._fbq = noop;
  }

  try {
    window.fbq?.('init', PIXEL_ID_VALID);
    window.fbq?.('track', 'PageView');
  } catch {
    // pixel blocked or failed — never crash the app
  }
  window._cuisinierPixelLoaded = true;
}

export function initAnalytics() {
  if (!isBrowser()) return;
  initGa();
  initMetaPixel();
}

// ── SPA route tracking ───────────────────────────────────────────────────────

export function trackPageView(path: string) {
  if (!isBrowser()) return;
  try {
    if (GA_ID_VALID) {
      window.gtag?.('event', 'page_view', { page_path: path });
    }
    if (PIXEL_ID_VALID) {
      window.fbq?.('track', 'PageView');
    }
  } catch {
    // never crash
  }
}

// ── Generic event helpers ────────────────────────────────────────────────────

function trackGa(eventName: string, params?: Record<string, unknown>) {
  if (!GA_ID_VALID) return;
  try {
    window.gtag?.('event', eventName, params ?? {});
  } catch {
    // blocked
  }
}

function trackMeta(eventName: string, params?: Record<string, unknown>) {
  if (!PIXEL_ID_VALID) return;
  try {
    window.fbq?.('trackCustom', eventName, params ?? {});
  } catch {
    // blocked
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!isBrowser()) return;
  trackGa(eventName, params);
  trackMeta(eventName, params);
}

// ── Named events ─────────────────────────────────────────────────────────────

export const analytics = {
  viewContent(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackGa('view_item', payload);
    try { window.fbq?.('track', 'ViewContent', payload); } catch { /* blocked */ }
  },

  addToCart(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackGa('add_to_cart', payload);
    try { window.fbq?.('track', 'AddToCart', payload); } catch { /* blocked */ }
  },

  initiateCheckout(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackGa('begin_checkout', payload);
    try { window.fbq?.('track', 'InitiateCheckout', payload); } catch { /* blocked */ }
  },

  orderPlaced(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackGa('purchase', payload);
    try {
      window.fbq?.('track', 'Purchase', {
        currency: 'BDT',
        value: payload.value,
        content_ids: payload.content_ids,
        num_items: payload.num_items,
        order_id: payload.orderId,
        ...payload,
      });
    } catch { /* blocked */ }
  },

  whatsappClick(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackGa('contact', payload);
    try { window.fbq?.('track', 'Contact', payload); } catch { /* blocked */ }
  },

  installClick(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackEvent('InstallCTAclick', payload);
  },

  elevenLabsAgentLoaded(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackEvent('ElevenLabsAgentLoaded', payload);
  },

  elevenLabsAgentLoadFailed(payload: Record<string, unknown>) {
    if (!isBrowser()) return;
    trackEvent('ElevenLabsAgentLoadFailed', payload);
  },
};
