import { buildContentIndex } from "../pages/static/contentIndex.json";
import type { ContentIndexMap } from "../pages/static/contentIndex.json";

// Singleton cache to ensure all components receive the same contentIndex reference
let cachedContentIndex: ContentIndexMap | null = null;

/**
 * Get the cached content index, building it only once across all calls.
 * This ensures all Explorer instances receive the same object reference,
 * preventing unnecessary React re-renders during View Transitions.
 */
export async function getContentIndex(): Promise<ContentIndexMap> {
  if (!cachedContentIndex) {
    cachedContentIndex = await buildContentIndex();
  }
  return cachedContentIndex;
}
