"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useReducedMotion } from "@/lib/motion";

type PulseRingLinkProps = ComponentProps<typeof Link> & {
  innerClassName?: string;
};

export function PulseRingLink({
  children,
  className = "",
  innerClassName = "",
  ...props
}: PulseRingLinkProps) {
  const reduced = useReducedMotion();

  return (
    <Link className={`group relative inline-block ${className}`.trim()} {...props}>
      <span
        className={`pointer-events-none absolute -inset-1 rounded-full ${
          reduced ? "" : "btn-pulse-ring"
        }`}
        aria-hidden
      />
      <span className={`relative block ${innerClassName}`}>{children}</span>
    </Link>
  );
}
