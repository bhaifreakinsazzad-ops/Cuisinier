import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTilt3D } from '@/hooks/useTilt3D';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  /** Adds pointer-tracked 3D tilt (desktop only, no-op on touch). */
  tilt?: boolean;
  /** Adds a rotating holographic conic-gradient ring on hover. */
  holo?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  glow = false,
  hover = false,
  tilt = false,
  holo = false,
  onClick,
  delay = 0,
}: GlassCardProps) {
  const { tiltRef, tiltHandlers } = useTilt3D(8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileTap={hover ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn('perspective-1200', hover && 'group/holo')}
    >
      <div
        ref={tilt ? tiltRef : undefined}
        {...(tilt ? tiltHandlers : {})}
        className={cn(
          'relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl',
          'p-4 md:p-5 overflow-hidden transition-transform duration-300 ease-out',
          glow && 'shadow-[0_0_30px_rgba(255,122,0,0.15)] border-orange-500/30',
          hover && 'cursor-pointer will-change-transform hover:shadow-[0_0_40px_rgba(255,122,0,0.2)]',
          // The CSS hover-lift only applies when tilt is off — when tilt is on, the
          // JS-driven inline transform (pointer-tracked rotate/scale) always wins via
          // specificity, so this class would otherwise be dead code that never renders.
          hover && !tilt && 'hover:-translate-y-1',
          className,
        )}
        style={tilt ? { transformStyle: 'preserve-3d' } : undefined}
      >
        {/* Inner gradient glow */}
        {glow && (
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />
        )}

        {/* Holographic rotating ring (opt-in) */}
        {holo && <div className="holo-ring" />}

        {/* Diagonal sheen sweep — auto-enabled on any hoverable card */}
        {hover && <div className="holo-sheen" />}

        {/* Pointer-tracked glare, follows tilt */}
        {tilt && <div className="tilt-glare" />}

        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}
