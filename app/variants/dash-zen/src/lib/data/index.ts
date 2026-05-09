import { getAppMode } from "@/lib/mode";
import type { IDataStore } from "./store";
import { MockDataStore } from "./MockDataStore";
import { SupabaseDataStore } from "./SupabaseDataStore";

let mockSingleton: MockDataStore | null = null;
let liveSingleton: SupabaseDataStore | null = null;

/**
 * Strategy selector for the data layer. Resolves the mode from the request
 * cookie (with env-var fallback) on every call so a runtime toggle in the
 * header takes effect immediately.
 */
export function getDataStore(): IDataStore {
  const mode = getAppMode();
  if (mode === "live") {
    if (!liveSingleton) liveSingleton = new SupabaseDataStore();
    return liveSingleton;
  }
  if (!mockSingleton) mockSingleton = new MockDataStore();
  return mockSingleton;
}

export type { IDataStore } from "./store";
export type * from "./types";
