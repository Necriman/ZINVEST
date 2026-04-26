export function pdfTextToTurboMarkdown(rawText: string): { markdown: string; title?: string } {
  const text = String(rawText ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Try to extract a human title from common PDF header patterns.
  // Example: "FINANCE | Unit 1: What Is Finance? Comprehensive Beginner Guide"
  const titleMatch = text.match(/Unit\s*\d+\s*:\s*(.+?)(?:\s+Comprehensive|\s+Beginner|\s+Guide|\n)/i);
  const title = titleMatch?.[1]?.trim();

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  type Block = { kind: "h" | "p" | "list"; lines: string[] };
  const blocks: Block[] = [];

  let cur: Block | null = null;
  const flush = () => {
    if (!cur) return;
    const normalizedLines = cur.lines.map((x) => x.trim()).filter(Boolean);
    if (!normalizedLines.length) {
      cur = null;
      return;
    }
    blocks.push({ ...cur, lines: normalizedLines });
    cur = null;
  };

  const pushHeading = (h: string) => {
    flush();
    blocks.push({ kind: "h", lines: [h.trim()] });
  };

  const pushListItem = (item: string) => {
    if (!cur || cur.kind !== "list") {
      flush();
      cur = { kind: "list", lines: [] };
    }
    cur.lines.push(item.trim());
  };

  const pushParagraphLine = (line: string) => {
    if (!cur || cur.kind !== "p") {
      flush();
      cur = { kind: "p", lines: [] };
    }
    cur.lines.push(line);
  };

  const looksLikeSubsectionHeading = (l: string) => /^\d+(\.\d+)+\s+/.test(l);
  const looksLikeMainTitle = (l: string) => /What is|Valuation|Time Value|Finance/i.test(l) && l.length < 80;
  const looksLikeBullet = (l: string) => /^[-•]\s+/.test(l) || /^\d+\.\s+/.test(l);

  for (const line of lines) {
    if (!line) continue;
    if (/^Zinvest$/i.test(line)) continue;
    if (/^Table of Contents$/i.test(line)) {
      pushHeading("Table of Contents");
      continue;
    }
    if (/^Practice Quiz$/i.test(line)) {
      pushHeading("Practice Quiz");
      continue;
    }

    if (looksLikeSubsectionHeading(line)) {
      pushHeading(line);
      continue;
    }

    if (looksLikeMainTitle(line) && line.length > 10 && line.length < 60) {
      // Avoid over-triggering; titles appear in the header area.
      pushHeading(line);
      continue;
    }

    if (looksLikeBullet(line)) {
      const item = line.replace(/^[-•]\s+/, "").replace(/^\d+\.\s+/, "").trim();
      if (item) pushListItem(item);
      continue;
    }

    // Heuristic: "n X" lines are often noise in PDF extraction.
    if (/^n\s+/.test(line)) continue;

    pushParagraphLine(line);
  }

  flush();

  const markdown = blocks
    .map((b) => {
      if (b.kind === "h") return `## ${b.lines.join(" ")}`;
      if (b.kind === "list") return b.lines.map((x) => `- ${x}`).join("\n");
      // paragraphs: join with spaces
      return b.lines.join(" ");
    })
    .join("\n\n");

  return { markdown, title };
}

