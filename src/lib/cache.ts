const dataCache: Record<string, { data: any; fetchedAt: number }> = {};
const CACHE_TTL = 30000; // 30 seconds

export function getCached(key: string) {
  const entry = dataCache[key];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
  return entry.data;
}

export function setCache(key: string, data: any) {
  dataCache[key] = { data, fetchedAt: Date.now() };
}
