/**
 * API Client with localStorage caching
 *
 * A general-purpose fetch wrapper for client-side API requests with:
 * - Configurable TTL-based caching
 * - ETag support for cache validation
 * - TypeScript generics for type-safe responses
 * - Works with REST and GraphQL APIs
 *
 * @example
 * ```typescript
 * // Simple GET request with 1-hour cache
 * const data = await cachedFetch<MyDataType>('https://your-api-url/data', {
 *   ttl: 3600000,
 *   cacheKey: 'my-api-data'
 * });
 *
 * // GraphQL query
 * const result = await cachedFetch<GraphQLResponse>('https://graphql.anilist.co', {
 *   method: 'POST',
 *   body: JSON.stringify({ query: '{ ... }' }),
 *   ttl: 1800000,
 *   cacheKey: 'graphql-query'
 * });
 * ```
 */

export interface CachedFetchOptions extends RequestInit {
  /**
   * Time-to-live in milliseconds. Cache expires after this duration.
   * Set to 0 to disable caching.
   * @default 3600000 (1 hour)
   */
  ttl?: number;

  /**
   * Unique key for localStorage cache. Required for caching.
   * If not provided, caching is disabled.
   */
  cacheKey?: string;

  /**
   * Whether to use ETag headers for cache validation.
   * When enabled, sends If-None-Match header with cached ETag.
   * @default true
   */
  useETag?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

/**
 * Fetch with localStorage caching and ETag support
 *
 * @param url - The URL to fetch
 * @param options - Fetch options plus caching configuration
 * @returns Promise resolving to the parsed response data
 */
export async function cachedFetch<T = any>(
  url: string,
  options: CachedFetchOptions = {},
): Promise<T> {
  const {
    ttl = 3600000, // 1 hour default
    cacheKey,
    useETag = true,
    ...fetchOptions
  } = options;

  // If no cache key provided or TTL is 0, skip caching
  if (!cacheKey || ttl === 0) {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Check cache
  const cached = getFromCache<T>(cacheKey);

  // If cache is valid and not expired, return it
  if (cached && !isCacheExpired(cached, ttl)) {
    return cached.data;
  }

  // Prepare headers with ETag if available
  const headers = new Headers(fetchOptions.headers);
  if (useETag && cached?.etag) {
    headers.set("If-None-Match", cached.etag);
  }

  // Fetch fresh data
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // If 304 Not Modified, return cached data
  if (response.status === 304 && cached) {
    // Update timestamp to extend cache lifetime
    saveToCache(cacheKey, {
      ...cached,
      timestamp: Date.now(),
    });
    return cached.data;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const etag = response.headers.get("ETag");

  // Save to cache
  saveToCache(cacheKey, {
    data,
    timestamp: Date.now(),
    etag: etag || undefined,
  });

  return data;
}

/**
 * Clear a specific cache entry
 */
export function clearCache(cacheKey: string): void {
  try {
    localStorage.removeItem(`api-cache:${cacheKey}`);
  } catch (e) {
    console.warn("Failed to clear cache:", e);
  }
}

/**
 * Clear all API cache entries
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("api-cache:")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn("Failed to clear all cache:", e);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { keys: string[]; totalSize: number } {
  const keys: string[] = [];
  let totalSize = 0;

  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (key.startsWith("api-cache:")) {
        keys.push(key.replace("api-cache:", ""));
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    });
  } catch (e) {
    console.warn("Failed to get cache stats:", e);
  }

  return { keys, totalSize };
}

// Private helper functions

function getFromCache<T>(cacheKey: string): CacheEntry<T> | null {
  try {
    const item = localStorage.getItem(`api-cache:${cacheKey}`);
    if (!item) return null;
    return JSON.parse(item);
  } catch (e) {
    console.warn("Failed to read from cache:", e);
    return null;
  }
}

function saveToCache<T>(cacheKey: string, entry: CacheEntry<T>): void {
  try {
    localStorage.setItem(`api-cache:${cacheKey}`, JSON.stringify(entry));
  } catch (e) {
    console.warn("Failed to save to cache (localStorage full?):", e);
  }
}

function isCacheExpired<T>(entry: CacheEntry<T>, ttl: number): boolean {
  return Date.now() - entry.timestamp > ttl;
}
