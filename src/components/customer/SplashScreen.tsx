import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { markSplashSeen, hasSeenSplash } from '@/data/storage';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'scan' | 'detect' | 'done'>('scan');
  const [skipVisible, setSkipVisible] = useState(false);

  useEffect(() => {
    if (hasSeenSplash()) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setPhase('detect'), 1200);
    const t2 = setTimeout(() => {
      setPhase('done');
      markSplashSeen();
      setTimeout(onComplete, 500);
    }, 2200);
    const t3 = setTimeout(() => setSkipVisible(true), 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const handleSkip = () => {
    markSplashSeen();
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[100] bg-[#080808] flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-orange-500/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Holographic HUD backdrop grid */}
        <div className="absolute inset-0 holo-grid opacity-25 [mask-image:radial-gradient(circle_at_center,black_0%,transparent_60%)]" />

        {/* Scanner ring */}
        <motion.div
          className="absolute w-64 h-64 border border-orange-500/20 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,122,0,0.25) 15%, transparent 30%, transparent 100%)',
          }}
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity } }}
        />
        <motion.div
          className="absolute w-48 h-48 border border-orange-500/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />

        {/* Central content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="w-24 h-24 mb-6 relative"
          >
            <img
              src="/icons/icon-192.png"
              alt="Cuisinier"
              className="w-full h-full rounded-3xl shadow-[0_0_60px_rgba(255,122,0,0.4)]"
            />
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-orange-500/50"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            Cuisinier
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-orange-400 text-sm mt-1 font-medium"
          >
            AI-Powered Cloud Kitchen
          </motion.p>

          {/* AI Scanner line */}
          <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
              animate={{ left: ['-30%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Status text */}
          <AnimatePresence mode="wait">
            {phase === 'scan' && (
              <motion.p
                key="scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white/50 text-xs mt-4"
              >
                Detecting your craving...
              </motion.p>
            )}
            {phase === 'detect' && (
              <motion.p
                key="detect"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-orange-400 text-xs mt-4 font-medium"
              >
                AI craving scanner active...
              </motion.p>
            )}
            {phase === 'done' && (
              <motion.p
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 text-xs mt-4 font-medium"
              >
                AI decoded your hunger. Let&apos;s go.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Skip button */}
        <AnimatePresence>
          {skipVisible && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSkip}
              className="absolute bottom-12 text-white/40 text-xs hover:text-white/70 transition-colors px-4 py-2"
            >
              Skip Intro
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-orange-500/10 rounded-full blur-3xl" />
      </motion.div>
    </AnimatePresence>
  );
}
