import { ServiceError } from "@/contracts/services";

const DEFAULT_BASE = "";

export async function http<T>(
  path: string,
  init: RequestInit & { mockFallback?: () => Promise<T> } = {}
): Promise<T> {
  const url = (process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_BASE) + path;
  const { mockFallback, ...rest } = init;
  try {
    const res = await fetch(url, {
      ...rest,
      headers: { "content-type": "application/json", ...(rest.headers ?? {}) },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ServiceError(`HTTP ${res.status}: ${text || res.statusText}`, {
        status: res.status,
        code: "http_error",
      });
    }
    return (await res.json()) as T;
  } catch (err) {
    if (mockFallback) {
      // eslint-disable-next-line no-console
      console.warn(`[service] ${path} failed → falling back to mock`, err);
      return mockFallback();
    }
    throw err;
  }
}
