import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { LinkMetadata } from "./fetchMetadata";
import { logger } from "./logger";

const CACHE_DIR = join(process.cwd(), "src", "data");
const CACHE_FILE = join(CACHE_DIR, "link-metadata.json");
const CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export interface MetadataCache {
  [url: string]: LinkMetadata;
}

let memoryCache: MetadataCache | null = null;

/**
 * Load the metadata cache from disk
 */
async function loadCache(): Promise<MetadataCache> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (existsSync(CACHE_FILE)) {
      const data = await readFile(CACHE_FILE, "utf-8");
      memoryCache = JSON.parse(data);
      logger.debug(
        `Loaded ${Object.keys(memoryCache!).length} cached metadata entries`,
      );
      return memoryCache!;
    }
  } catch (error) {
    logger.warn("Failed to load metadata cache:", error);
  }

  memoryCache = {};
  return memoryCache;
}

/**
 * Save the metadata cache to disk
 */
async function saveCache(cache: MetadataCache): Promise<void> {
  try {
    // Ensure cache directory exists
    if (!existsSync(CACHE_DIR)) {
      await mkdir(CACHE_DIR, { recursive: true });
    }

    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    logger.debug(
      `Saved ${Object.keys(cache).length} metadata entries to cache`,
    );
  } catch (error) {
    logger.error("Failed to save metadata cache:", error);
  }
}

/**
 * Get cached metadata for a URL if it exists and is not expired
 */
export async function getCachedMetadata(
  url: string,
): Promise<LinkMetadata | null> {
  const cache = await loadCache();
  const cached = cache[url];

  if (!cached) {
    return null;
  }

  // Check if cache entry is expired
  const age = Date.now() - cached.fetchedAt;
  if (age > CACHE_MAX_AGE_MS) {
    logger.debug(
      `Cache expired for ${url} (${Math.floor(age / 1000 / 60 / 60 / 24)} days old)`,
    );
    return null;
  }

  return cached;
}

/**
 * Store metadata in cache
 */
export async function setCachedMetadata(
  url: string,
  metadata: LinkMetadata,
): Promise<void> {
  const cache = await loadCache();
  cache[url] = metadata;
  memoryCache = cache;
  await saveCache(cache);
}

/**
 * Get metadata from cache or return null
 * Does not save to cache - use setCachedMetadata for that
 */
export async function getOrFetchMetadata(
  url: string,
  fetcher: (url: string) => Promise<LinkMetadata | null>,
): Promise<LinkMetadata | null> {
  // Check cache first
  const cached = await getCachedMetadata(url);
  if (cached) {
    return cached;
  }

  // Fetch if not cached
  const metadata = await fetcher(url);
  if (metadata) {
    await setCachedMetadata(url, metadata);
  }

  return metadata;
}
