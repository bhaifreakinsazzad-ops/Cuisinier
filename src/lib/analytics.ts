declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _cuisinierGaLoaded?: boolean;
    _cuisinierPixelLoaded?: boolean;
  }
}

const gaMeasurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
const metaPixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function injectScript(src: string, id: string) {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function initGa() {
  if (!isBrowser() || !gaMeasurementId || window._cuisinierGaLoaded) {
    return;
  }

  injectScript(`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`, 'cuisinier-ga-script');

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', gaMeasurementId);
  window._cuisinierGaLoaded = true;
}

function initMetaPixel() {
  if (!isBrowser() || !metaPixelId || window._cuisinierPixelLoaded) {
    return;
  }

  if (!window.fbq) {
    const pixelScript = document.createElement('script');
    pixelScript.id = 'cuisinier-meta-pixel-inline';
    pixelScript.text = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
    `;
    document.head.appendChild(pixelScript);
  }

  window.fbq?.('init', metaPixelId);
  window.fbq?.('track', 'PageView');
  window._cuisinierPixelLoaded = true;
}

export function initAnalytics() {
  if (!isBrowser()) {
    return;
  }

  initGa();
  initMetaPixel();
}

function trackGa(eventName: string, params?: Record<string, unknown>) {
  if (gaMeasurementId) {
    window.gtag?.('event', eventName, params ?? {});
  }
}

function trackMeta(eventName: string, params?: Record<string, unknown>) {
  if (metaPixelId) {
    window.fbq?.('trackCustom', eventName, params ?? {});
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!isBrowser()) {
    return;
  }

  trackGa(eventName, params);
  trackMeta(eventName, params);
}

export const analytics = {
  viewContent(payload: Record<string, unknown>) {
    trackEvent('ViewContent', payload);
  },
  addToCart(payload: Record<string, unknown>) {
    trackEvent('AddToCart', payload);
  },
  initiateCheckout(payload: Record<string, unknown>) {
    trackEvent('InitiateCheckout', payload);
  },
  orderPlaced(payload: Record<string, unknown>) {
    trackEvent('OrderPlaced', payload);
    trackEvent('Purchase', payload);
  },
  whatsappClick(payload: Record<string, unknown>) {
    trackEvent('WhatsAppClick', payload);
    trackEvent('Contact', payload);
  },
  installClick(payload: Record<string, unknown>) {
    trackEvent('InstallCTAclick', payload);
  },
};
