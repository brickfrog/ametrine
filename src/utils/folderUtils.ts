/**
 * Browser-safe folder utility functions
 * (No Node.js dependencies)
 */

/**
 * Get the folder path from a slug
 */
export function getFolderPath(slug: string): string {
  const parts = slug.split("/");
  if (parts.length === 1) {
    return "";
  }
  return parts.slice(0, -1).join("/");
}
