/**
 * Priority-based date resolution for notes.
 * Resolves dates from multiple sources: frontmatter > git > filesystem
 */

import { stat } from "node:fs/promises";
import { getGitDates } from "./gitDates";
import { logger } from "./logger";

export type DateSource = "frontmatter" | "git" | "filesystem";

export interface FrontmatterDates {
  created?: Date;
  date?: Date; // Alias for created
  updated?: Date;
  modified?: Date; // Alias for updated
  lastmod?: Date; // Another alias for updated
}

export interface ResolvedDates {
  created: Date;
  modified: Date;
}

export interface ResolveDateOptions {
  frontmatter: FrontmatterDates;
  filePath: string;
  priority?: DateSource[];
}

/**
 * Resolve dates from multiple sources using priority order.
 *
 * Default priority: frontmatter > git > filesystem
 *
 * For frontmatter:
 * - created: uses `created` or `date` fields
 * - modified: uses `modified`, `updated`, or `lastmod` fields (falls back to created if none)
 *
 * For git:
 * - created: first commit date
 * - modified: last commit date
 *
 * For filesystem:
 * - created: birthtime (file creation time)
 * - modified: mtime (modification time)
 *
 * @param options - Resolution options
 * @returns Resolved created and modified dates
 */
export async function resolveDates(
  options: ResolveDateOptions,
): Promise<ResolvedDates> {
  const {
    frontmatter,
    filePath,
    priority = ["frontmatter", "git", "filesystem"],
  } = options;

  let created: Date | undefined;
  let modified: Date | undefined;

  for (const source of priority) {
    // Stop if we have both dates
    if (created && modified) break;

    switch (source) {
      case "frontmatter": {
        // For created: prefer `created`, fallback to `date`
        if (!created) {
          const fmCreated = frontmatter.created || frontmatter.date;
          if (fmCreated) {
            created = ensureDate(fmCreated);
          }
        }
        // For modified: prefer `modified`, then `updated`, then `lastmod`
        if (!modified) {
          const fmModified =
            frontmatter.modified || frontmatter.updated || frontmatter.lastmod;
          if (fmModified) {
            modified = ensureDate(fmModified);
          }
        }
        break;
      }

      case "git": {
        try {
          const gitDates = await getGitDates(filePath);
          if (!created && gitDates.created) {
            created = gitDates.created;
          }
          if (!modified && gitDates.modified) {
            modified = gitDates.modified;
          }
        } catch (err) {
          logger.debug(`[resolveDates] Git date extraction failed: ${err}`);
        }
        break;
      }

      case "filesystem": {
        try {
          const stats = await stat(filePath);
          if (!created) {
            // birthtime is file creation time (may not be available on all systems)
            created = stats.birthtime;
          }
          if (!modified) {
            modified = stats.mtime;
          }
        } catch (err) {
          logger.debug(`[resolveDates] Filesystem stat failed: ${err}`);
        }
        break;
      }
    }
  }

  // Final fallback: use current date if nothing found
  const now = new Date();
  if (!created) {
    logger.debug(
      `[resolveDates] No created date found for ${filePath}, using now`,
    );
    created = now;
  }
  if (!modified) {
    // If no modified date, use created date
    modified = created;
  }

  return { created, modified };
}

/**
 * Ensure a value is a Date object
 */
function ensureDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}
