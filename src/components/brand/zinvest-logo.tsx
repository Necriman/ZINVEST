import React from "react";
import { cn } from "@/lib/utils";

export const BRAND = "#2345FF";
export const BRAND_HOVER = "#1a37d6";
export const BRAND_TINT = "#eef1ff";

/** The Zinvest mark — a dot above a slanted bar (the original brand symbol). */
export function ZinvestMark({
  className,
  color = BRAND,
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="20 38 100 70" className={className} fill="none" aria-hidden="true">
      <circle cx="38" cy="54" r="10" fill={color} />
      <rect
        x="56"
        y="78"
        width="58"
        height="24"
        rx="12"
        transform="rotate(-58 56 78)"
        fill={color}
      />
    </svg>
  );
}

/** Full lockup: mark + "Zinvest" wordmark. */
export function ZinvestLogo({
  className,
  markClassName,
  textClassName,
  color = BRAND,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  color?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ZinvestMark className={cn("h-6 w-6", markClassName)} color={color} />
      <span
        className={cn(
          "text-[18px] font-bold tracking-tight text-[#0f172a]",
          textClassName
        )}
      >
        Zinvest
      </span>
    </span>
  );
}
