/**
 * Probe the post-fix match-score distribution. Pulls a viewer's profile +
 * all opposite-kind profiles directly from Supabase, computes the same
 * bidirectional cosine `matchesFor()` uses, runs it through the new
 * `normalizeMatchScore`, and prints a histogram.
 *
 * Usage: npx tsx scripts/score-distribution.ts <viewer_id>
 */
import { readFileSync } from "node:fs";
function loadEnv(path: string) {
  try {
    for (const raw of readFileSync(path, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {}
}
loadEnv(".env.local");

import { createClient } from "@supabase/supabase-js";

function parseVector(v: unknown): number[] | null {
  if (Array.isArray(v)) return v as number[];
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return null; }
  }
  return null;
}
function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function norm(a: number[]) { return Math.sqrt(dot(a, a)); }
function cosine(a: number[], b: number[]) {
  const na = norm(a); const nb = norm(b);
  return na === 0 || nb === 0 ? 0 : dot(a, b) / (na * nb);
}

const FLOOR = 0.2; const CEIL = 0.7;
const BOOST = 0.18; const DISPLAY_MAX = 0.967;
function normalize(c: number) {
  const base = Math.max(0, Math.min(1, (c - FLOOR) / (CEIL - FLOOR)));
  return Math.min(DISPLAY_MAX, base + BOOST);
}

async function main() {
  const viewerId = process.argv[2] ?? "0b822e53-a8d6-4164-8222-913b29b75af7";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: vRows } = await sb.from("profiles").select("*").eq("id", viewerId);
  if (!vRows || !vRows[0]) { console.error("viewer not found"); process.exit(1); }
  const viewer = vRows[0];
  const vp = parseVector(viewer.embedding); const vw = parseVector(viewer.embedding_wants);
  if (!vp || !vw) { console.error("viewer has no embeddings"); process.exit(1); }

  const opp = viewer.kind === "candidate" ? "business" : "candidate";
  const { data: candRows } = await sb.from("profiles").select("id,name,headline,embedding,embedding_wants").eq("kind", opp);
  if (!candRows) return;

  const scored: Array<{ name: string; raw: number; pct: number; v2c: number; c2v: number }> = [];
  for (const c of candRows) {
    const cp = parseVector(c.embedding); const cw = parseVector(c.embedding_wants);
    if (!cp || !cw) continue;
    const v2c = cosine(vw, cp);
    const c2v = cosine(cw, vp);
    const composite = Math.min(v2c, c2v);
    scored.push({
      name: c.name,
      raw: composite,
      pct: normalize(composite) * 100,
      v2c, c2v,
    });
  }

  scored.sort((a, b) => b.pct - a.pct);
  console.log(`Viewer: ${viewer.name} (${viewer.kind})`);
  console.log(`Compared against ${scored.length} ${opp}s\n`);
  console.log("Top 10:");
  for (const s of scored.slice(0, 10)) {
    console.log(`  ${s.pct.toFixed(1)}%  raw=${s.raw.toFixed(3)}  ${s.name}`);
  }
  console.log("\nBottom 10:");
  for (const s of scored.slice(-10)) {
    console.log(`  ${s.pct.toFixed(1)}%  raw=${s.raw.toFixed(3)}  ${s.name}`);
  }

  // Histogram
  const buckets = new Array(11).fill(0);
  for (const s of scored) buckets[Math.min(10, Math.floor(s.pct / 10))]++;
  console.log("\nDistribution (10pp buckets):");
  for (let i = 0; i < 11; i++) {
    const lo = i * 10;
    const hi = i === 10 ? 100 : (i + 1) * 10 - 1;
    const bar = "█".repeat(Math.round(buckets[i] / Math.max(1, scored.length) * 60));
    console.log(`  ${String(lo).padStart(3)}-${String(hi).padStart(3)}%  ${String(buckets[i]).padStart(4)}  ${bar}`);
  }

  const pcts = scored.map((s) => s.pct);
  const min = Math.min(...pcts); const max = Math.max(...pcts);
  const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  console.log(`\nstats: min=${min.toFixed(1)}% max=${max.toFixed(1)}% mean=${mean.toFixed(1)}% spread=${(max - min).toFixed(1)}pp`);
}

main().catch((e) => { console.error(e); process.exit(1); });
