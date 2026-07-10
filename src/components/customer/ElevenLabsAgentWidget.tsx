import { createElement, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

const WIDGET_SCRIPT_ID = 'elevenlabs-convai-widget-script';
const WIDGET_SCRIPT_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
const WIDGET_AGENT_ID = 'agent_6801krp4gs21fm49n6jdxv19s0qb';

const CUSTOMER_PATHS = new Set([
  '/',
  // "/home" is the actual first in-app route for fresh visitors now that
  // cuisinier.online redirects "/" to a standalone landing page first.
  '/home',
  '/menu',
  '/cart',
  '/checkout',
  '/track',
  '/support',
  '/install',
]);

function isCustomerRoute(pathname: string) {
  if (pathname.startsWith('/admin')) {
    return false;
  }

  if (pathname.startsWith('/order/')) {
    return true;
  }

  return CUSTOMER_PATHS.has(pathname);
}

export function ElevenLabsAgentWidget({ enabled = true }: { enabled?: boolean }) {
  const location = useLocation();
  const [scriptState, setScriptState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');

  const shouldShow = useMemo(() => enabled && isCustomerRoute(location.pathname), [enabled, location.pathname]);

  useEffect(() => {
    if (!shouldShow || typeof document === 'undefined') {
      return;
    }

    const existingElement = window.customElements.get('elevenlabs-convai');
    if (existingElement) {
      setScriptState('ready');
      return;
    }

    const existingScript = document.getElementById(WIDGET_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        setScriptState('ready');
        return;
      }

      setScriptState('loading');
      const handleLoad = () => {
        existingScript.dataset.loaded = 'true';
        setScriptState('ready');
        analytics.elevenLabsAgentLoaded({ source: 'script-existing' });
      };
      const handleError = () => {
        setScriptState('failed');
        analytics.elevenLabsAgentLoadFailed({ source: 'script-existing' });
      };

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });

      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    setScriptState('loading');
    const script = document.createElement('script');
    script.id = WIDGET_SCRIPT_ID;
    script.async = true;
    script.type = 'text/javascript';
    script.src = WIDGET_SCRIPT_SRC;

    const handleLoad = () => {
      script.dataset.loaded = 'true';
      setScriptState('ready');
      analytics.elevenLabsAgentLoaded({ source: 'script-new' });
    };
    const handleError = () => {
      setScriptState('failed');
      analytics.elevenLabsAgentLoadFailed({ source: 'script-new' });
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [shouldShow]);

  if (!shouldShow || scriptState === 'failed') {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-4 z-40 max-w-[calc(100vw-2rem)] sm:bottom-6"
      aria-live="polite"
    >
      <div className="pointer-events-auto">
        {createElement('elevenlabs-convai' as any, { 'agent-id': WIDGET_AGENT_ID })}
      </div>
    </div>
  );
}
