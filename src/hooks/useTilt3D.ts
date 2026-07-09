import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';

const isCoarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

/**
 * Pointer-tracked 3D tilt. Returns a ref + handlers to spread onto the tilt
 * container. No-ops on touch devices (coarse pointer) so mobile stays flat.
 */
export function useTilt3D(maxDeg = 10) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isCoarsePointer() || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * maxDeg * 2;
      const rotateX = -py * maxDeg * 2;
      ref.current.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      ref.current.style.setProperty('--glare-x', `${(px + 0.5) * 100}%`);
      ref.current.style.setProperty('--glare-y', `${(py + 0.5) * 100}%`);
    },
    [maxDeg],
  );

  const handlePointerLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }, []);

  return {
    tiltRef: ref,
    tiltHandlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
    },
  };
}
