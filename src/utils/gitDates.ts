/**
 * Git-based date extraction for reliable file history tracking.
 * Uses git commit history which survives file moves/copies unlike filesystem dates.
 */

import simpleGit, { type SimpleGit, type LogResult } from "simple-git";
import { relative } from "node:path";
import { logger } from "./logger";

export interface GitDates {
  created?: Date; // First commit date for file
  modified?: Date; // Last commit date for file
}

// Cache git instance and dates per build
let gitInstance: SimpleGit | null = null;
let gitRoot: string | null = null;
const dateCache = new Map<string, GitDates>();

/**
 * Initialize git instance lazily
 */
async function getGit(): Promise<SimpleGit | null> {
  if (gitInstance !== null) return gitInstance;

  try {
    const git = simpleGit();
    // Check if we're in a git repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      logger.warn("[gitDates] Not a git repository, git dates unavailable");
      gitInstance = null;
      return null;
    }
    gitRoot = await git.revparse(["--show-toplevel"]);
    gitInstance = git;
    return git;
  } catch {
    logger.warn("[gitDates] Failed to initialize git, dates unavailable");
    gitInstance = null;
    return null;
  }
}

/**
 * Get git commit dates for a file.
 * Returns created (first commit) and modified (last commit) dates.
 *
 * @param filePath - Absolute path to the file
 * @returns GitDates with created and modified dates, or empty object if not tracked
 */
export async function getGitDates(filePath: string): Promise<GitDates> {
  // Check cache first
  if (dateCache.has(filePath)) {
    return dateCache.get(filePath)!;
  }

  const git = await getGit();
  if (!git || !gitRoot) {
    return {};
  }

  try {
    // Get relative path from git root
    const relativePath = relative(gitRoot, filePath);

    // Get commit history for file (oldest first for created date)
    const log: LogResult = await git.log({
      file: relativePath,
      // Get all commits to find both first and last
      maxCount: undefined,
    });

    if (log.total === 0) {
      // File not tracked by git
      logger.debug(`[gitDates] ${relativePath} not tracked by git`);
      dateCache.set(filePath, {});
      return {};
    }

    const commits = log.all;
    const result: GitDates = {
      // Last commit (most recent) for modified date
      modified: new Date(commits[0].date),
      // First commit (oldest) for created date
      created: new Date(commits[commits.length - 1].date),
    };

    dateCache.set(filePath, result);
    return result;
  } catch (err) {
    logger.debug(`[gitDates] Failed to get dates for ${filePath}: ${err}`);
    dateCache.set(filePath, {});
    return {};
  }
}

/**
 * Clear the date cache (useful for testing or long-running processes)
 */
export function clearGitDateCache(): void {
  dateCache.clear();
}
