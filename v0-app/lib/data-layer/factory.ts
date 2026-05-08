// ─────────────────────────────────────────────────────────────────────────────
// The ONLY file that imports both mock/* and real/*. API routes import only
// from this module so swapping DATA_MODE flips behavior without touching them.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  IProfileStore,
  IEmbeddingClient,
  ILLMClient,
  IMatchEngine,
  IAffinityClient,
  IInterestStore,
  INotificationStore,
} from "@/contracts/data-layer";

import { getMockProfileStore } from "./mock/MockProfileStore";
import { MockEmbeddingClient } from "./mock/MockEmbeddingClient";
import { MockLLMClient } from "./mock/MockLLMClient";
import { MockMatchEngine } from "./mock/MockMatchEngine";
import { getMockAffinityClient } from "./mock/MockAffinityClient";
import { getMockInterestStore } from "./mock/MockInterestStore";
import { getMockNotificationStore } from "./mock/MockNotificationStore";
import { getMockMatchCache } from "./mock/MockMatchCache";
import { CachedMatchEngine } from "./CachedMatchEngine";

import { SupabaseProfileStore } from "./real/SupabaseProfileStore";
import { OpenAIEmbeddingClient } from "./real/OpenAIEmbeddingClient";
import { OpenAILLMClient } from "./real/OpenAILLMClient";
import { PgvectorMatchEngine } from "./real/PgvectorMatchEngine";
import { AffinityClient } from "./real/AffinityClient";

const dataMode = (process.env.DATA_MODE ?? "mock").toLowerCase();
const affinityLive = (process.env.AFFINITY_LIVE ?? "false").toLowerCase() === "true";

export const profileStore: IProfileStore =
  dataMode === "real" ? new SupabaseProfileStore() : getMockProfileStore();

export const embeddingClient: IEmbeddingClient =
  dataMode === "real" ? new OpenAIEmbeddingClient() : new MockEmbeddingClient();

export const llmClient: ILLMClient =
  dataMode === "real" ? new OpenAILLMClient() : new MockLLMClient();

// The bare engine — pgvector or mock — is wrapped in a cache decorator. The
// decorator is mode-agnostic; swapping inner engines flips behavior with no
// change to the cache layer.
const innerMatchEngine: IMatchEngine =
  dataMode === "real"
    ? new PgvectorMatchEngine(profileStore, embeddingClient, llmClient)
    : new MockMatchEngine(profileStore, embeddingClient, llmClient);

export const matchEngine: IMatchEngine = new CachedMatchEngine(
  innerMatchEngine,
  profileStore,
  getMockMatchCache()
);

export const affinityClient: IAffinityClient = affinityLive
  ? new AffinityClient()
  : getMockAffinityClient();

export const interestStore: IInterestStore = getMockInterestStore();

export const notificationStore: INotificationStore = getMockNotificationStore();

export const dataLayerInfo = {
  dataMode,
  affinityLive,
};
