"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";

type AnimatedProgressBarProps = {
  percent: number;
  className?: string;
  fillClassName?: string;
  fillStyle?: CSSProperties;
  delay?: number;
};

export function AnimatedProgressBar({
  percent,
  className = "",
  fillClassName = "",
  fillStyle,
  delay = 0,
}: AnimatedProgressBarProps) {
  const reduced = useReducedMotion();
  const bounded = Math.min(100, Math.max(0, percent));
  const scale = bounded / 100;

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <motion.div
        className={`h-full w-full origin-left ${fillClassName}`}
        style={fillStyle}
        initial={{ scaleX: reduced ? scale : 0 }}
        animate={{ scaleX: scale }}
        transition={{
          duration: reduced ? 0 : 1.2,
          delay: reduced ? 0 : delay,
          ease: "easeOut",
        }}
      />
      {!reduced && bounded > 0 && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ width: `${bounded}%` }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: delay + 1.2,
              repeatDelay: 1.5,
              ease: 'linear',
            }}
          />
        </div>
      )}
    </div>
  );
}
