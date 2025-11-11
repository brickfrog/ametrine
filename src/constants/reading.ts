/**
 * Reading time constants for calculating estimated reading time
 */

/**
 * Average reading speed in words per minute
 * Based on typical adult reading speed for technical content
 */
export const WORDS_PER_MINUTE = 200;

/**
 * Calculate estimated reading time in minutes
 * @param wordCount - Total number of words
 * @returns Estimated reading time in minutes (rounded up)
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}
