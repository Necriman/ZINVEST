"use client";

import { useEffect, useState } from "react";
import type { Transition, Variants } from "framer-motion";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

export const easeOut = [0.22, 1, 0.36, 1] as const;

export function slideUpTransition(
  delay = 0,
  duration = 0.6,
  reduced = false,
): Transition {
  if (reduced) return { duration: 0 };
  return { duration, delay, ease: easeOut };
}

export const slideUpVariants = (delay = 0, duration = 0.6): Variants => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: slideUpTransition(delay, duration),
  },
});

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const staggerContainer = (staggerSeconds: number, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerSeconds,
      delayChildren,
    },
  },
});

export const viewportOnce = {
  once: true,
  amount: 0.15,
} as const;
