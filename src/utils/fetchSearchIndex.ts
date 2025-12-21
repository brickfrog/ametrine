import type { ContentIndexMap } from "../pages/static/contentIndex.json";

let cachedData: ContentIndexMap | null = null;
let globalFetchPromise: Promise<ContentIndexMap> | null = null;

export async function fetchSearchIndex(): Promise<ContentIndexMap> {
  if (cachedData) {
    return cachedData;
  }

  if (globalFetchPromise) {
    return globalFetchPromise;
  }

  globalFetchPromise = fetch(
    `${import.meta.env.BASE_URL}/static/searchIndex.json`,
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch searchIndex: ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      cachedData = data;
      return data;
    })
    .finally(() => {
      globalFetchPromise = null;
    });

  return globalFetchPromise;
}
