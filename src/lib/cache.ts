const dataCache: Record<string, { data: unknown; fetchedAt: number }> = {};
export const CACHE_TTL = 30_000; // 30 seconds

export function getCached<T = unknown>(key: string): T | null {
  const entry = dataCache[key];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  dataCache[key] = { data, fetchedAt: Date.now() };
}

export async function cachedQuery<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const data = await queryFn();
  setCache(key, data);
  return data;
}
