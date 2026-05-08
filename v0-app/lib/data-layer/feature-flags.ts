// ─────────────────────────────────────────────────────────────────────────────
// Feature flags — runtime-mutable. Each real adapter starts with its flag set
// to whatever the env says, but if a real call fails the adapter flips the
// flag to "mock" and writes a blocker note. Subsequent calls go to the mock.
// ─────────────────────────────────────────────────────────────────────────────

export type Mode = "real" | "mock";

const flags: Record<string, Mode> = {
  profileStore: pickInitial("DATA_MODE"),
  embedding: pickInitial("DATA_MODE"),
  llm: pickInitial("DATA_MODE"),
  matchEngine: pickInitial("DATA_MODE"),
  affinity: pickInitial("AFFINITY_LIVE", { trueValue: "real", falseValue: "mock" }),
  interestStore: pickInitial("DATA_MODE"),
};

function pickInitial(
  envKey: string,
  opts: { trueValue?: Mode; falseValue?: Mode } = {}
): Mode {
  const v = (process.env[envKey] ?? "").trim().toLowerCase();
  if (opts.trueValue || opts.falseValue) {
    return v === "true" ? (opts.trueValue ?? "real") : (opts.falseValue ?? "mock");
  }
  return v === "real" ? "real" : "mock";
}

export function getFlag(name: keyof typeof flags): Mode {
  return flags[name];
}

export function setFlag(name: keyof typeof flags, mode: Mode): void {
  flags[name] = mode;
}

/**
 * Wrap a "real" call so that if it throws we fall back to a mock implementation
 * AND flip the flag for this adapter so all subsequent calls go to mock.
 * Logs a structured blocker line for the dev console.
 */
export async function withFallback<T>(
  flagName: keyof typeof flags,
  realFn: () => Promise<T>,
  mockFn: () => Promise<T>,
  ctx: { adapter: string; op: string }
): Promise<T> {
  if (getFlag(flagName) === "mock") return mockFn();
  try {
    return await realFn();
  } catch (err) {
    setFlag(flagName, "mock");
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn(
      `[data-layer] ${ctx.adapter}.${ctx.op} failed → flipping ${flagName} to mock. Cause: ${msg}`
    );
    return mockFn();
  }
}
