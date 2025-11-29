import type { ContentIndexMap } from "../pages/static/contentIndex.json";

// Global cache to prevent duplicate fetches
let cachedData: ContentIndexMap | null = null;
let globalFetchPromise: Promise<ContentIndexMap> | null = null;

/**
 * Fetch contentIndex.json with global promise coordination
 * Multiple simultaneous calls will share the same fetch
 * Cached after first successful fetch for the session
 */
export async function fetchContentIndex(): Promise<ContentIndexMap> {
  // Return cached data if available
  if (cachedData) {
    return cachedData;
  }

  // If a fetch is already in progress, return the same promise
  if (globalFetchPromise) {
    return globalFetchPromise;
  }

  // Start new fetch and store the promise globally
  globalFetchPromise = fetch(
    `${import.meta.env.BASE_URL}/static/contentIndex.json`,
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch contentIndex: ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      // Cache the data for subsequent calls
      cachedData = data;
      return data;
    })
    .finally(() => {
      // Clear the promise after completion
      globalFetchPromise = null;
    });

  return globalFetchPromise;
}
