import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SplashScreen } from '@/components/customer/SplashScreen';
import { HomeHero } from '@/components/customer/HomeHero';
import { BottomNav } from '@/components/customer/BottomNav';
import { ElevenLabsAgentWidget } from '@/components/customer/ElevenLabsAgentWidget';
import { PWAInstallPrompt, OfflineBanner } from '@/components/pwa/PWAInstallPrompt';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CartFlyLayer } from '@/components/ui/CartFlyLayer';
import { bootstrapData } from '@/data/repository';
import { verifyAdminSession } from '@/lib/adminAuth';
import { initAnalytics, trackPageView } from '@/lib/analytics';

const CravingSelector = lazy(() =>
  import('@/components/customer/CravingSelector').then((m) => ({ default: m.CravingSelector })),
);
const MenuGrid = lazy(() =>
  import('@/components/customer/MenuGrid').then((m) => ({ default: m.MenuGrid })),
);
const CartPage = lazy(() =>
  import('@/components/customer/CartPage').then((m) => ({ default: m.CartPage })),
);
const CheckoutPage = lazy(() =>
  import('@/components/customer/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const TrackingPage = lazy(() =>
  import('@/components/customer/TrackingPage').then((m) => ({ default: m.TrackingPage })),
);
const TrackPage = lazy(() =>
  import('@/components/customer/TrackPage').then((m) => ({ default: m.TrackPage })),
);
const SupportPage = lazy(() =>
  import('@/components/customer/SupportPage').then((m) => ({ default: m.SupportPage })),
);
const AdminLogin = lazy(() =>
  import('@/components/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })),
);
const AdminDashboard = lazy(() =>
  import('@/components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);

function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[#080808]">
      <HomeHero />
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808] px-5">
      <p className="text-sm text-white/45">Loading Cuisinier…</p>
    </div>
  );
}

function InstallHelp() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808] px-5">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-center text-2xl font-bold text-white">Install Cuisinier</h1>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-1 text-sm font-semibold text-orange-400">Android (Chrome)</p>
            <p className="text-xs text-white/60">1. Tap the menu (3 dots) in Chrome</p>
            <p className="text-xs text-white/60">2. Tap Add to Home Screen or Install App</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-1 text-sm font-semibold text-orange-400">iPhone (Safari)</p>
            <p className="text-xs text-white/60">1. Tap the Share button</p>
            <p className="text-xs text-white/60">2. Scroll down and tap Add to Home Screen</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-1 text-sm font-semibold text-orange-400">Desktop (Chrome/Edge)</p>
            <p className="text-xs text-white/60">1. Look for the install icon in the address bar</p>
            <p className="text-xs text-white/60">2. Click Install Cuisinier</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full rounded-xl bg-orange-500 py-3 font-bold text-black"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const checkAdmin = useCallback(async () => {
    const valid = await verifyAdminSession();
    setIsAdmin(valid);
  }, []);

  // On every route change: verify admin state + fire analytics PageView
  useEffect(() => {
    void checkAdmin();
    trackPageView(location.pathname);
  }, [checkAdmin, location.pathname]);

  // On mount: init analytics + bootstrap data
  useEffect(() => {
    initAnalytics();
    void bootstrapData();
  }, []);

  if (isAdminRoute) {
    return (
      <ErrorBoundary section="admin">
        <Suspense fallback={<RouteFallback />}>
          {isAdmin ? (
            <AdminDashboard
              onLogout={() => {
                setIsAdmin(false);
                navigate('/');
              }}
            />
          ) : (
            <AdminLogin onLogin={() => void checkAdmin()} />
          )}
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <>
      <OfflineBanner />

      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      <main className="min-h-[100dvh] bg-[#080808]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorBoundary section="routes">
              <Suspense fallback={<RouteFallback />}>
                <Routes location={location}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/craving" element={<CravingSelector />} />
                  <Route path="/menu" element={<MenuGrid />} />
                  <Route
                    path="/cart"
                    element={
                      <ErrorBoundary section="cart">
                        <CartPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ErrorBoundary section="checkout">
                        <CheckoutPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route path="/order/:orderId" element={<TrackingPage />} />
                  <Route path="/track" element={<TrackPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/install" element={<InstallHelp />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {!isAdminRoute && !showSplash && <BottomNav />}
      {!isAdminRoute && <ElevenLabsAgentWidget enabled={!showSplash} />}
      <PWAInstallPrompt />
      <CartFlyLayer />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary section="root">
      <AppContent />
    </ErrorBoundary>
  );
}
