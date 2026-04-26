"use client";

import React from "react";

function parseBoldParts(s: string, keyBase: number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const segs = s.split("**");
  segs.forEach((seg, idx) => {
    if (!seg) return;
    if (idx % 2 === 1) {
      out.push(
        <strong key={`${keyBase}-b-${idx}`} className="font-semibold text-slate-900 dark:text-white">
          {seg}
        </strong>,
      );
    } else {
      out.push(<span key={`${keyBase}-t-${idx}`}>{seg}</span>);
    }
  });
  return out;
}

function parseInline(text: string): React.ReactNode {
  if (!text.includes("`")) {
    return <>{parseBoldParts(text, 0)}</>;
  }
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  while (rest.length) {
    const a = rest.indexOf("`");
    if (a === -1) {
      nodes.push(...parseBoldParts(rest, k++));
      break;
    }
    if (a > 0) nodes.push(...parseBoldParts(rest.slice(0, a), k++));
    const b = rest.indexOf("`", a + 1);
    if (b === -1) {
      nodes.push(<span key={`${k++}-tail`}>{rest.slice(a)}</span>);
      break;
    }
    nodes.push(
      <code
        key={`${k++}-c`}
        className="rounded-md bg-slate-200 px-1.5 py-0.5 font-mono text-[13px] text-slate-800 dark:bg-white/10 dark:text-blue-100"
      >
        {rest.slice(a + 1, b)}
      </code>,
    );
    rest = rest.slice(b + 1);
  }
  return <>{nodes}</>;
}

/** Lightweight Notion-style: ## headings, paragraphs, **bold**, `code`, - / * lists */
export function LessonRichText({ source, className = "" }: { source: string; className?: string }) {
  const blocks = source.trim().split(/\n\n+/);

  return (
    <div className={`space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-200 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const first = lines[0]?.trim() ?? "";

        if (first.startsWith("## ")) {
          return (
            <h3 key={bi} className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {parseInline(first.slice(3).trim())}
            </h3>
          );
        }

        if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
          return (
            <ul key={bi} className="list-disc space-y-2 pl-5 marker:text-blue-400">
              {lines.map((line, li) => (
                <li key={li}>{parseInline(line.replace(/^[-*]\s+/, "").trim())}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="whitespace-pre-wrap">
            {parseInline(block.trim())}
          </p>
        );
      })}
    </div>
  );
}
