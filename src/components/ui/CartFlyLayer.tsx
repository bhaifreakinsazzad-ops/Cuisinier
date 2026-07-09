import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FLY_TO_CART_EVENT, type FlyToCartDetail } from '@/lib/cartFx';

interface Particle extends FlyToCartDetail {
  id: number;
}

let nextId = 1;

/**
 * Global overlay that renders the flying-emoji particle whenever
 * triggerCartFx() fires. Mount once near the app root.
 */
export function CartFlyLayer() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<FlyToCartDetail>).detail;
      if (!detail) return;
      const id = nextId++;
      setParticles((current) => [...current, { ...detail, id }]);
      window.setTimeout(() => {
        setParticles((current) => current.filter((p) => p.id !== id));
      }, 900);
    };

    window.addEventListener(FLY_TO_CART_EVENT, handler);
    return () => window.removeEventListener(FLY_TO_CART_EVENT, handler);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              left: particle.x,
              top: particle.y,
              opacity: 1,
              scale: 1,
              position: 'fixed',
            }}
            animate={{
              top: particle.y - 140,
              opacity: 0,
              scale: 1.6,
              rotate: 25,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="text-2xl"
            style={{ position: 'fixed', translateX: '-50%', translateY: '-50%' }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
