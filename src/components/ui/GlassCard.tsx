import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function GlassCard({ children, className, glow = false, hover = false, onClick, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl',
        'p-4 md:p-5 overflow-hidden',
        glow && 'shadow-[0_0_30px_rgba(255,122,0,0.15)] border-orange-500/30',
        hover && 'cursor-pointer transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(255,122,0,0.2)]',
        className
      )}
    >
      {/* Inner gradient glow */}
      {glow && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
