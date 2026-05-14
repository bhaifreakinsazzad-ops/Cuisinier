import { cn } from '@/lib/utils';

interface GlowBadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'green' | 'red' | 'blue' | 'purple' | 'default';
  className?: string;
  pulse?: boolean;
}

const variantStyles = {
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  default: 'bg-white/10 text-white/70 border-white/10',
};

export function GlowBadge({ children, variant = 'default', className, pulse = false }: GlowBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  );
}
