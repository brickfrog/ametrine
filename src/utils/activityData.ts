/**
 * Activity data processing for heatmap visualization
 * Groups notes by creation and update dates
 */

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
  notes: string[]; // note titles for tooltips
}

export interface HeatmapData {
  creationActivity: Map<string, ActivityDay>;
  updateActivity: Map<string, ActivityDay>;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface ContentNote {
  id: string;
  slug: string;
  title: string;
  date?: string; // ISO date string
  updated?: string; // ISO date string
}

/**
 * Format a Date object to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse ISO date string to Date, return null if invalid
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Generate a map of all dates in the range with count: 0
 */
function generateDateRange(
  startDate: Date,
  endDate: Date,
): Map<string, ActivityDay> {
  const dateMap = new Map<string, ActivityDay>();
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    dateMap.set(dateStr, {
      date: dateStr,
      count: 0,
      notes: [],
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateMap;
}

/**
 * Process content index to generate activity data for heatmap
 *
 * @param contentIndex - Array of notes from contentIndex.json
 * @param daysBack - Number of days to include (default: 365)
 * @returns Processed activity data grouped by date
 */
export function processActivityData(
  contentIndex: ContentNote[],
  daysBack: number = 365,
): HeatmapData {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);

  // Initialize date ranges with all dates
  const creationActivity = generateDateRange(startDate, endDate);
  const updateActivity = generateDateRange(startDate, endDate);

  // Process each note
  for (const note of contentIndex) {
    // Process creation date
    const creationDate = parseDate(note.date);
    if (creationDate && creationDate >= startDate && creationDate <= endDate) {
      const dateStr = formatDate(creationDate);
      const existing = creationActivity.get(dateStr);

      if (existing) {
        existing.count++;
        existing.notes.push(note.title);
      }
    }

    // Process update date
    const updateDate = parseDate(note.updated);
    if (updateDate && updateDate >= startDate && updateDate <= endDate) {
      const dateStr = formatDate(updateDate);
      const existing = updateActivity.get(dateStr);

      if (existing) {
        existing.count++;
        existing.notes.push(note.title);
      }
    }
  }

  return {
    creationActivity,
    updateActivity,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * Get color intensity class based on note count
 * GitHub-style intensity: 0 (none), 1-2 (low), 3-5 (medium), 6+ (high)
 */
export function getIntensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * Convert activity map to sorted array for rendering
 */
export function activityToArray(
  activityMap: Map<string, ActivityDay>,
): ActivityDay[] {
  return Array.from(activityMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
