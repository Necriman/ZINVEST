/**
 * One-off / CI: extract Finance Unit 1–2 from English PDFs → structured lesson blocks.
 * Run: node scripts/build-finance-lessons-from-pdf.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outFile = path.join(root, "src/lib/lesson-content/finance-fundamentals-en.generated.ts");

function preClean(raw) {
  let t = String(raw)
    .replace(/\r/g, "\n")
    .replace(/\n--\s*\d+\s+of\s+\d+\s*--\n/g, "\n\n")
    .replace(/(?:^|\n)(?:ZINVEST|f Zinvest)\s*(?=\n|$)/gi, "\n")
    .replace(/FINANCE \|[^\n]*/g, "")
    .replace(/Page \d+\s*[┬·]?\s*Unit[^\n]*/gi, "")
    .replace(/\u00a0/g, " ")
    .replace(/тАФ/g, "—")
    .replace(/тАв/g, "•")
    .replace(/┬╖/g, "·")
    .replace(/\n{3,}/g, "\n\n");

  // Fix broken "2.\n1 Section" → "2.1 Section"
  t = t.replace(/(\d+)\.\s*\n+\s*(\d+)\s+([A-Za-z])/g, "$1.$2 $3");
  return t.trim();
}

/**
 * @returns {{ title: string, content: Array<{type:'heading'|'paragraph', text:string}> }}
 */
function pdfToStructuredLesson(raw, fallbackTitle) {
  const text = preClean(raw);
  const titleMatch = text.match(/Unit\s*\d+\s*:\s*(.+?)(?:\s+Comprehensive|\s+Beginner|\s+Guide|\n)/i);
  const title = titleMatch?.[1]?.trim() || fallbackTitle;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  /** @type {Array<{type:'heading'|'paragraph', text:string}>} */
  const blocks = [];
  let para = [];

  const flushPara = () => {
    const t = para.join(" ").replace(/\s+/g, " ").trim();
    if (t.length) blocks.push({ type: "paragraph", text: t });
    para = [];
  };

  const pushHeading = (h) => {
    flushPara();
    const t = h.replace(/\s+/g, " ").trim();
    if (t.length) blocks.push({ type: "heading", text: t });
  };

  const looksLikeSubsection = (l) => /^\d+\.\d+\s+\S/.test(l);
  const looksNoise = (l) =>
    /^Sections Covered:/i.test(l) ||
    /^Includes diagrams/i.test(l) ||
    /^Table of Contents$/i.test(l) ||
    /^Practice Quiz$/i.test(l) ||
    /^Key Terms Glossary$/i.test(l) ||
    /^Figure \d/i.test(l) ||
    /^Symb$/i.test(l) ||
    /^ol Name/i.test(l) ||
    /^Step Who Does It/i.test(l);

  for (const line of lines) {
    if (/^Zinvest$/i.test(line)) continue;
    if (looksNoise(line)) {
      pushHeading(line.replace(/^n\s+/i, "").trim());
      continue;
    }
    if (/^n\s+[A-Z]/.test(line)) {
      pushHeading(line.replace(/^n\s+/, "").trim());
      continue;
    }
    if (looksLikeSubsection(line)) {
      pushHeading(line);
      continue;
    }
    if (/^Unit \d+ — Complete Study Guide$/i.test(line)) continue;
    if (/^FINANCE\s*·\s*UNIT \d+$/i.test(line)) continue;
    if (/^What Is Finance\?$/i.test(line) && line.length < 40) {
      pushHeading(line);
      continue;
    }
    if (/^Valuation &$/i.test(line)) {
      para.push(line);
      continue;
    }
    if (/^Time Value$/i.test(line) && para.length && /Valuation/i.test(para[para.length - 1])) {
      para[para.length - 1] = `${para[para.length - 1]} ${line}`;
      continue;
    }
    if (/^of Money$/i.test(line) && para.length) {
      para[para.length - 1] = `${para[para.length - 1]} ${line}`;
      continue;
    }

    para.push(line);
  }
  flushPara();

  // Merge very short orphan paragraphs into previous
  const merged = [];
  for (const b of blocks) {
    if (b.type === "paragraph" && b.text.length < 40 && merged.length) {
      const prev = merged[merged.length - 1];
      if (prev.type === "paragraph") {
        prev.text = `${prev.text} ${b.text}`.trim();
        continue;
      }
    }
    merged.push({ ...b });
  }

  let out = merged.filter((b) => b.text.length > 0);
  out = trimTableOfContentsPrefix(out, fallbackTitle);
  return { title, content: out };
}

/** Drop cover + TOC; start at first real subsection body (matches Unit 1 & 2 PDFs). */
function trimTableOfContentsPrefix(content, unitKey) {
  const u1 = /medieval Latin word finis/i;
  const u2 = /Time Value of Money \(TVM\)/i;
  const needle = unitKey.includes("Valuation") || unitKey.includes("Time Value") ? u2 : u1;
  let cut = -1;
  for (let i = 0; i < content.length; i++) {
    if (content[i].type === "paragraph" && needle.test(content[i].text)) {
      cut = i;
      break;
    }
  }
  if (cut < 0) return content;
  for (let i = cut - 1; i >= 0; i--) {
    if (content[i].type === "heading" && /^\d+\.\d+\s/.test(content[i].text)) {
      return content.slice(i);
    }
  }
  return content.slice(cut);
}

async function readPdf(name) {
  const buf = fs.readFileSync(path.join(root, "public/pdfs", name));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const { text } = await parser.getText();
  await parser.destroy();
  return text;
}

const u1 = pdfToStructuredLesson(await readPdf("Finance_Unit1_English_Zinvest.pdf"), "What Is Finance?");
const u2 = pdfToStructuredLesson(
  await readPdf("Finance_Unit2_English_Zinvest.pdf"),
  "Valuation & Time Value of Money",
);

const fileBody = `/* eslint-disable max-len */
/**
 * Auto-generated from public/pdfs/Finance_Unit{1,2}_English_Zinvest.pdf
 * Regenerate: \`node scripts/build-finance-lessons-from-pdf.mjs\`
 */
import type { StructuredLesson } from "@/lib/lesson-blocks";

export const FINANCE_EN_LESSON_1: StructuredLesson = ${JSON.stringify(u1, null, 2)};

export const FINANCE_EN_LESSON_2: StructuredLesson = ${JSON.stringify(u2, null, 2)};
`;

fs.writeFileSync(outFile, fileBody, "utf8");
console.log("Wrote", outFile);
console.log("Unit 1 blocks:", u1.content.length, "title:", u1.title);
console.log("Unit 2 blocks:", u2.content.length, "title:", u2.title);
