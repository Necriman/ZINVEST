import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

for (const f of ["Finance_Unit1_English_Zinvest.pdf", "Finance_Unit2_English_Zinvest.pdf"]) {
  const buf = fs.readFileSync(path.join(root, "public/pdfs", f));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const result = await parser.getText();
  console.log(`\n########## ${f} pages=${result.total} ##########\n`);
  console.log(result.text);
  await parser.destroy();
}
