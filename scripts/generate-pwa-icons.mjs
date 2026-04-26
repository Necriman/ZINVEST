/**
 * Regenerate public/icon-192.png and public/icon-512.png from public/zinvest-mark.svg
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svg = path.join(root, "public", "zinvest-mark.svg");

await sharp(svg).resize(192, 192).png().toFile(path.join(root, "public", "icon-192.png"));
await sharp(svg).resize(512, 512).png().toFile(path.join(root, "public", "icon-512.png"));
console.log("Wrote public/icon-192.png and public/icon-512.png");
