/**
 * Simple in-memory cache for page data.
 * Survives client-side navigation (module stays loaded),
 * cleared on full page refresh.
 */

const store = new Map<string, { data: unknown; timestamp: number }>();

const STALE_TIME = 30_000; // 30 seconds

export function getCached<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
    store.set(key, { data, timestamp: Date.now() });
}

export function isStale(key: string): boolean {
    const entry = store.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > STALE_TIME;
}

export function clearCache(key?: string): void {
    if (key) {
        store.delete(key);
    } else {
        store.clear();
    }
}
