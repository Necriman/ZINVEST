import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { pdfTextToTurboMarkdown } from "@/lib/pdfTextToTurboMarkdown";
import type { Language } from "@/lib/translations";

export const runtime = "nodejs";

const LESSON_CONTENT_API_VERSION = "lesson-content-legacy-only-v5";

type LessonContentQuery = {
  lessonId: number;
  language: Language;
};

type CacheKey = string;
const lessonContentCache = new Map<CacheKey, { markdown: string; title: string | null }>();

const requireFromHere = createRequire(import.meta.url);

/**
 * Parse PDF buffer using pdfjs-dist LEGACY build only.
 * The legacy build does NOT use DOMMatrix or any other browser-only APIs,
 * so it works reliably in Node.js / Vercel serverless environments.
 *
 * NOTE: pdfjs-dist@4.x is required — v5.x removed/restructured the legacy build.
 */
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // Dynamic import of the legacy build — this path exists in pdfjs-dist@4.x
  const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;

  // Disable worker in Node.js to avoid ESM-loader issues in serverless
  // pdfjs "fake worker" setup throws if workerSrc is not specified.
  // Use a local worker file URL from node_modules to avoid https/file scheme issues.
  try {
    const workerPath = requireFromHere.resolve("pdfjs-dist/legacy/build/pdf.worker.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();
  } catch {
    // Fallback: keep default relative workerSrc used by pdfjs legacy.
    pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";
  }

  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib
    .getDocument({
      data,
      // Provide standard fonts path so pdfjs doesn't warn or return empty text
      standardFontDataUrl: (() => {
        try {
          const pdfjsPkgPath = requireFromHere.resolve("pdfjs-dist/package.json");
          const pdfjsDir = path.dirname(pdfjsPkgPath);
          const standardFontsDir = path.join(pdfjsDir, "standard_fonts");
          return pathToFileURL(standardFontsDir).toString().replace(/\/?$/, "/");
        } catch {
          return undefined;
        }
      })(),
    })
    .promise;

  let out = "";
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = (content?.items ?? []) as Array<{ str?: string }>;
      const line = items.map((it) => it.str ?? "").filter(Boolean).join(" ");
      out += `${line}\n`;
    }
  } finally {
    await doc.destroy?.();
  }
  return out;
}

function getLessonPdfFileName(lessonId: number, language: Language) {
  // In this repo we bundle only Finance Unit 1 & 2 PDFs.
  // (RU/UZ versions may be missing; we fall back to English.)
  if (lessonId !== 1 && lessonId !== 2) return null;
  if (lessonId === 1) {
    if (language === "ru") return "Finance_Unit1_Russian_Zinvest.pdf";
    if (language === "uz") return "Finance_Unit1_Uzbek_Zinvest.pdf";
    return "Finance_Unit1_English_Zinvest.pdf";
  }
  if (language === "ru") return "Finance_Unit2_Russian_Zinvest.pdf";
  if (language === "uz") return "Finance_Unit2_Uzbek_Zinvest.pdf";
  return "Finance_Unit2_English_Zinvest.pdf";
}

async function readPdfText(fileName: string) {
  const absPath = path.join(process.cwd(), "public", "pdfs", fileName);
  const buffer = await fs.readFile(absPath);

  return parsePdfBuffer(buffer);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lessonIdRaw = url.searchParams.get("lessonId");
    const languageRaw = url.searchParams.get("language");

    const lessonId = lessonIdRaw ? Number(lessonIdRaw) : 0;
    const language = (languageRaw as Language) || "en";
    if (!Number.isFinite(lessonId) || (lessonId !== 1 && lessonId !== 2)) {
      return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
    }

    const fileName = getLessonPdfFileName(lessonId, language);
    if (!fileName) {
      return NextResponse.json({ error: "No pdf mapping" }, { status: 404 });
    }

    const cacheKey = `${lessonId}:${language}`;
    const cached = lessonContentCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        lessonId,
        title: cached.title,
        markdown: cached.markdown,
      });
    }

    let pdfText = "";
    try {
      pdfText = await readPdfText(fileName);
    } catch {
      // Fallback to English if RU/UZ PDFs are not present.
      const fallback = getLessonPdfFileName(lessonId, "en");
      if (!fallback) throw new Error("Missing fallback pdf filename");
      try {
        pdfText = await readPdfText(fallback);
      } catch {
        // If serverless filesystem doesn't have `public/pdfs` mounted,
        // fetch from the public URL.
          const fetchPdfText = async (fName: string) => {
          // Build a correct origin from the incoming request.
          const baseOrigin = `${url.protocol}//${url.host}`;
          const pdfUrl = new URL(`/pdfs/${fName}`, baseOrigin).toString();
          const res = await fetch(pdfUrl, { method: "GET" });
          if (!res.ok) {
            throw new Error(`Failed to fetch pdf: ${res.status}`);
          }
          const ab = await res.arrayBuffer();
          const buf = Buffer.from(ab);

          return await parsePdfBuffer(buf);
        };

        pdfText = await fetchPdfText(fallback);
      }
    }

    const { markdown, title } = pdfTextToTurboMarkdown(pdfText);

    lessonContentCache.set(cacheKey, { markdown, title: title ?? null });
    return NextResponse.json({
      version: LESSON_CONTENT_API_VERSION,
      lessonId,
      title: title ?? null,
      markdown,
    });
  } catch (e) {
    const err = e as any;
    console.error("Lesson content API error:", err);
    return NextResponse.json(
      {
        version: LESSON_CONTENT_API_VERSION,
        error: err?.message ?? String(err ?? "Internal error"),
        stack: typeof err?.stack === "string" ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
