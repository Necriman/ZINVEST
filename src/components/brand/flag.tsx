import React from "react";
import type { Language } from "@/lib/translations";

type FlagProps = { className?: string };

/** Clean circular SVG flags — premium alternative to keyboard emoji. */

function FlagEN({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="English">
      <mask id="zf-en"><circle cx="12" cy="12" r="12" fill="#fff" /></mask>
      <g mask="url(#zf-en)">
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0L24 24M24 0L0 24" stroke="#fff" strokeWidth="4.6" />
        <path d="M0 0L24 24M24 0L0 24" stroke="#C8102E" strokeWidth="2.2" />
        <path d="M12 0V24M0 12H24" stroke="#fff" strokeWidth="6.4" />
        <path d="M12 0V24M0 12H24" stroke="#C8102E" strokeWidth="3.8" />
      </g>
    </svg>
  );
}

function FlagRU({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Русский">
      <mask id="zf-ru"><circle cx="12" cy="12" r="12" fill="#fff" /></mask>
      <g mask="url(#zf-ru)">
        <rect width="24" height="8" fill="#fff" />
        <rect width="24" height="8" y="8" fill="#0039A6" />
        <rect width="24" height="8" y="16" fill="#D52B1E" />
      </g>
    </svg>
  );
}

function FlagUZ({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="O'zbek">
      <mask id="zf-uz"><circle cx="12" cy="12" r="12" fill="#fff" /></mask>
      <g mask="url(#zf-uz)">
        <rect width="24" height="24" fill="#fff" />
        <rect width="24" height="7.4" fill="#0099B5" />
        <rect width="24" height="7.4" y="16.6" fill="#1EB53A" />
        <rect width="24" height="1" y="7.4" fill="#CE1126" />
        <rect width="24" height="1" y="15.6" fill="#CE1126" />
        <circle cx="4.8" cy="3.7" r="2.2" fill="#fff" />
        <circle cx="5.7" cy="3.7" r="2" fill="#0099B5" />
      </g>
    </svg>
  );
}

const FLAGS: Record<Language, (p: FlagProps) => React.ReactElement> = {
  en: FlagEN,
  ru: FlagRU,
  uz: FlagUZ,
};

export function Flag({ code, className = "h-5 w-5" }: { code: Language; className?: string }) {
  const C = FLAGS[code] ?? FlagEN;
  return <C className={className} />;
}
