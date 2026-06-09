"use client";

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

export function useCountUp(target: number, duration = 1.2, delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = (now - start) / (duration * 1000);
        if (elapsed < 1) {
          setCount(Math.floor(target * easeOut(elapsed)));
          requestAnimationFrame(tick);
        } else {
          setCount(target);
        }
      };
      requestAnimationFrame(tick);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, target, duration, delay]);

  function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
  return { ref, count };
}
