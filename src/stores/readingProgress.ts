import { atom, map } from "nanostores";

/**
 * Reading progress tracking with sessionStorage
 * Tracks scroll depth per note (0-100%)
 */

export interface ProgressState {
  slug: string;
  percent: number;
  timestamp: number;
}

// Current scroll progress (live)
export const currentProgress = atom<number>(0);

// Saved progress for all notes (from sessionStorage)
export const savedProgress = map<Record<string, number>>({});

// Maximum number of notes to track (LRU cache)
const MAX_TRACKED_NOTES = 50;

/**
 * Load all saved progress from sessionStorage
 */
export function loadSavedProgress(): void {
  try {
    const stored = sessionStorage.getItem("readingProgress");
    if (stored) {
      const states = JSON.parse(stored) as ProgressState[];
      const progressMap: Record<string, number> = {};
      states.forEach(({ slug, percent }) => {
        progressMap[slug] = percent;
      });
      savedProgress.set(progressMap);
    }
  } catch (error) {
    // FIXME(sweep): Use logger.error instead of console.error for consistency
    console.error("Failed to load reading progress:", error);
  }
}

/**
 * Save all progress states to sessionStorage
 */
function saveProgressToStorage(): void {
  try {
    const now = Date.now();
    const states = Object.entries(savedProgress.get()).map(
      ([slug, percent]) => ({
        slug,
        percent,
        timestamp: now,
      }),
    );

    // Keep only the most recent MAX_TRACKED_NOTES
    const sorted = states.sort((a, b) => b.timestamp - a.timestamp);
    const limited = sorted.slice(0, MAX_TRACKED_NOTES);

    sessionStorage.setItem("readingProgress", JSON.stringify(limited));
  } catch (error) {
    // FIXME(sweep): Use logger.error instead of console.error for consistency
    console.error("Failed to save reading progress:", error);
  }
}

/**
 * Get saved progress for a specific note
 */
export function getSavedProgress(slug: string): number {
  const progress = savedProgress.get();
  return progress[slug] ?? 0;
}

/**
 * Save progress for a specific note
 */
export function saveProgress(slug: string, percent: number): void {
  // Clamp between 0 and 100
  const clamped = Math.max(0, Math.min(100, percent));

  savedProgress.setKey(slug, clamped);
  saveProgressToStorage();
}

/**
 * Update current live progress (doesn't save to storage)
 */
export function updateCurrentProgress(percent: number): void {
  const clamped = Math.max(0, Math.min(100, percent));
  currentProgress.set(clamped);
}

/**
 * Clear all saved progress (useful for testing or reset)
 */
export function clearAllProgress(): void {
  savedProgress.set({});
  try {
    sessionStorage.removeItem("readingProgress");
  } catch (error) {
    // FIXME(sweep): Use logger.error instead of console.error for consistency
    console.error("Failed to clear reading progress:", error);
  }
}
