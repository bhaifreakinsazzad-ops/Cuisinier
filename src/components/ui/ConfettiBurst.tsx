import { motion } from 'framer-motion';

const COLORS = ['#ff7a00', '#ffb347', '#22c55e', '#3b82f6', '#ffffff'];
const PIECES = 28;

/**
 * One-shot celebratory confetti burst. Purely decorative — renders a fixed
 * number of deterministic pieces (no Math.random dependency on live state)
 * and unmounts itself via the parent after ~2s.
 */
export function ConfettiBurst() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[95] overflow-hidden">
      {Array.from({ length: PIECES }).map((_, index) => {
        const angle = (index / PIECES) * 360;
        const distance = 140 + (index % 5) * 40;
        const radians = (angle * Math.PI) / 180;
        const x = Math.cos(radians) * distance;
        const y = Math.sin(radians) * distance;
        const color = COLORS[index % COLORS.length];
        const isCircle = index % 3 === 0;

        return (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/3"
            style={{
              width: isCircle ? 8 : 6,
              height: isCircle ? 8 : 10,
              borderRadius: isCircle ? '50%' : '2px',
              backgroundColor: color,
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{
              x,
              y: y + 220,
              opacity: 0,
              rotate: angle * 3,
              scale: 1,
            }}
            transition={{ duration: 1.4 + (index % 4) * 0.15, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
