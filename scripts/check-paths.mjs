// Mac-safety check (case-insensitive file systems). Run: node scripts/check-paths.mjs
// 1. No two tracked files in one folder may differ only by case, or only by extension
//    (compared case-insensitively: "Currency.tsx" vs "currency.css" clashes).
// 2. Every relative / "@/" import in .ts/.tsx/.js/.mjs/.css resolves to a file whose path matches
//    the import letter for letter (a wrong-case import builds on a Mac and breaks on Linux / CI).
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const files = execSync("git ls-files -co --exclude-standard", { encoding: "utf8" }).split("\n").filter(Boolean).filter((f) => existsSync(f));
let bad = 0;

const byDir = new Map();
for (const f of files) {
  const dir = path.dirname(f);
  const base = path.basename(f);
  const stem = base.includes(".") ? base.slice(0, base.lastIndexOf(".")) : base;
  for (const key of [`case:${base.toLowerCase()}`, `ext:${stem.toLowerCase()}`]) {
    const k = `${dir}\0${key}`;
    if (!byDir.has(k)) byDir.set(k, []);
    byDir.get(k).push(f);
  }
}
for (const [k, list] of byDir) if (list.length > 1) { bad++; console.log(`CLASH (${k.split("\0")[1].split(":")[0]}): ${list.join("  ")}`); }

const exts = ["", ".ts", ".tsx", ".js", ".mjs", ".css", ".json", "/index.ts", "/index.tsx", "/index.js"];
/** exact-case existence: every segment must appear in its parent's listing */
const exact = (p) => {
  const parts = path.normalize(p).split(path.sep);
  let cur = parts[0] === "" ? path.sep : ".";
  for (const seg of parts) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { cur = path.join(cur, ".."); continue; }
    let list;
    try { list = readdirSync(cur); } catch { return false; }
    if (!list.includes(seg)) return false;
    cur = path.join(cur, seg);
  }
  return true;
};
const re = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|import\s*|require\(\s*|@import\s+(?:url\()?\s*)['"]([^'"]+)['"]/g;
for (const f of files.filter((f) => /\.(tsx?|m?js|css)$/.test(f) && !f.startsWith("node_modules/"))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(re)) {
    const spec = m[1];
    if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;
    const target = spec.startsWith("@/") ? spec.slice(2) : path.join(path.dirname(f), spec);
    const hit = exts.map((e) => target + e).find((t) => existsSync(t) && !readdirSafe(t));
    if (!hit) { bad++; console.log(`UNRESOLVED ${f}: ${spec}`); continue; }
    if (!exact(hit)) { bad++; console.log(`CASE MISMATCH ${f}: ${spec}`); }
  }
}
function readdirSafe(p) { try { readdirSync(p); return true; } catch { return false; } }
console.log(bad ? `${bad} problem(s)` : `OK: ${files.length} files, no case / extension clashes, every import matches its file exactly`);
process.exit(bad ? 1 : 0);
