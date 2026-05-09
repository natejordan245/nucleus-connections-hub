/**
 * One-off reseed script. Loads .env.local, then walks LIVE_TALENT +
 * EXTRA_LIVE_TALENT and re-upserts each profile (which refreshes the
 * embedding text + vectors). Runs N candidates in parallel for speed.
 *
 * Usage: npx tsx scripts/reseed-candidates.ts
 */
import { readFileSync } from "node:fs";

// Tiny .env.local loader — avoids adding dotenv as a dep just for one script.
function loadEnv(path: string) {
  try {
    const text = readFileSync(path, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    console.warn(`warn: could not read ${path}:`, err);
  }
}
loadEnv(".env.local");

import { LIVE_STARTUPS, LIVE_TALENT } from "../src/lib/data/live-seed";
import { EXTRA_LIVE_STARTUPS, EXTRA_LIVE_TALENT } from "../src/lib/data/live-seed-extra";
import { SupabaseDataStore } from "../src/lib/data/SupabaseDataStore";

const CONCURRENCY = 8;

async function main() {
  const store = new SupabaseDataStore();

  type Job = { kind: "candidate" | "business"; label: string; run: () => Promise<unknown> };
  const jobs: Job[] = [
    ...[...LIVE_TALENT, ...EXTRA_LIVE_TALENT].map<Job>((t) => ({
      kind: "candidate",
      label: t.name,
      run: () => store.putCandidate(t),
    })),
    ...[...LIVE_STARTUPS, ...EXTRA_LIVE_STARTUPS].map<Job>((b) => ({
      kind: "business",
      label: b.name,
      run: () => store.putBusiness(b),
    })),
  ];
  console.log(`Reseeding ${jobs.length} profiles with concurrency ${CONCURRENCY}…`);

  let done = 0;
  let failed = 0;
  const start = Date.now();

  // Simple concurrent-pool: fixed number of workers pulling from a shared
  // index. Avoids Promise.all of 300 simultaneous OpenAI calls.
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      const job = jobs[idx];
      try {
        await job.run();
        done++;
        if (done % 50 === 0) {
          const elapsed = ((Date.now() - start) / 1000).toFixed(1);
          console.log(`  ${done}/${jobs.length} (${elapsed}s)`);
        }
      } catch (err) {
        failed++;
        console.error(
          `  fail [${job.kind}] ${job.label}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done. ${done} ok, ${failed} failed, ${elapsed}s total.`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
