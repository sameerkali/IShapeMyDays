// In-memory stale-while-revalidate cache layer for client-side fetches

export const CACHE_TTL_MS = 60000; // 1 minute window (configurable)

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cacheStore = new Map<string, CacheItem<unknown>>();

/**
 * Fetch with stale-while-revalidate in-memory cache.
 * If data exists in cache and timestamp is within CACHE_TTL_MS, returns cached data immediately.
 * Otherwise, executes the fetcher function, stores the fresh data with updated timestamp, and returns it.
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CACHE_TTL_MS
): Promise<T> {
  const now = Date.now();
  const cached = cacheStore.get(key) as CacheItem<T> | undefined;

  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const freshData = await fetcher();
  cacheStore.set(key, { data: freshData, timestamp: now });
  return freshData;
}

/**
 * Invalidate specific cache key or all cached data after a mutation.
 */
export function invalidateCache(key?: string): void {
  if (key) {
    cacheStore.delete(key);
  } else {
    cacheStore.clear();
  }
}
