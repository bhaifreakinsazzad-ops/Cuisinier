import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { GlowBadge } from '@/components/ui/GlowBadge';
import { analytics } from '@/lib/analytics';

const DISMISS_KEY = 'cuisinier_install_prompt_dismissed';
// "/home" is included alongside "/" because cuisinier.online now redirects
// fresh visitors to a standalone landing page before they ever reach the
// React app — "/home" is the actual first in-app route they land on.
const ELIGIBLE_ROUTES = new Set(['/', '/home', '/menu', '/craving']);

export function PWAInstallPrompt() {
  const location = useLocation();
  const { canInstall, isStandalone, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const isEligibleRoute = ELIGIBLE_ROUTES.has(location.pathname);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (!isEligibleRoute || dismissed || isStandalone) {
      setShowFallback(false);
      return;
    }

    if (!canInstall) {
      const timer = window.setTimeout(() => setShowFallback(true), 6000);
      return () => window.clearTimeout(timer);
    }

    setShowFallback(false);
    return undefined;
  }, [canInstall, dismissed, isEligibleRoute, isStandalone]);

  const closePrompt = () => {
    setDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleInstall = async () => {
    analytics.installClick({ source: 'install-prompt' });
    if (canInstall) {
      const accepted = await promptInstall();
      if (!accepted) {
        setShowFallback(true);
      }
      return;
    }

    setShowFallback(true);
  };

  if (dismissed || isStandalone || !isEligibleRoute) {
    return null;
  }

  return (
    <AnimatePresence>
      {(canInstall || showFallback) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-md md:bottom-6"
        >
          <div className="relative rounded-2xl border border-orange-500/30 bg-[#111]/95 p-4 shadow-[0_0_40px_rgba(255,122,0,0.2)] backdrop-blur-xl">
            <button
              onClick={closePrompt}
              className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-white/10"
            >
              <X size={16} className="text-white/60" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/20">
                <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Install Cuisinier App</p>
                <p className="mt-0.5 text-xs text-white/60">
                  Faster access for repeat orders. Add it to your home screen and open it like an app.
                </p>
                {showFallback && !canInstall ? (
                  <p className="mt-2 text-xs text-orange-400">
                    <Smartphone size={12} className="mr-1 inline" />
                    Open the browser menu and tap Add to Home Screen or Install App.
                  </p>
                ) : (
                  <button
                    onClick={() => void handleInstall()}
                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-orange-600"
                  >
                    <Download size={14} />
                    Install Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AppModeBadge() {
  const { isStandalone } = usePWAInstall();
  if (!isStandalone) return null;
  return (
    <GlowBadge variant="green" className="text-[10px]">
      App Mode Active
    </GlowBadge>
  );
}

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 'auto' }}
      className="border-b border-red-500/30 bg-red-500/20 px-4 py-2 text-center text-xs text-red-400"
    >
      You are offline. Internet connection is needed to place orders.
    </motion.div>
  );
}
