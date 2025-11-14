/**
 * Shared slug lookup map for resolving wikilinks to full paths
 *
 * This map is populated during the vault loading process and used by
 * the wikilinks plugin to resolve bare page names to full directory paths.
 *
 * Example:
 *   "wikilinks-and-graph" → "documentation/wikilinks-and-graph"
 *   "test-note" → "test-note" (root-level file)
 */
export const slugMap = new Map<string, string>();

/**
 * Duplicate filename warnings
 * Tracks filenames that appear in multiple locations
 */
export const duplicateFilenames = new Set<string>();

/**
 * Build the slug lookup map from file IDs
 * @param entries Array of {id: string} objects representing file paths
 */
export function buildSlugMap(entries: Array<{ id: string }>, logger?: any) {
  slugMap.clear();
  duplicateFilenames.clear();

  const seenFilenames = new Map<string, string>(); // filename → first occurrence path

  logger?.info(`[slug-map] Building map from ${entries.length} entries`);

  for (const entry of entries) {
    // Extract base filename (last segment of path)
    const filename = entry.id.split("/").pop() || entry.id;

    if (seenFilenames.has(filename)) {
      // Duplicate detected
      const firstPath = seenFilenames.get(filename)!;

      // Only warn once per filename
      if (!duplicateFilenames.has(filename)) {
        duplicateFilenames.add(filename);
        const msg = `Duplicate filename: "${filename}" in "${firstPath}" and "${entry.id}" - use full paths`;
        logger?.warn(`[slug-map] ${msg}`);
      }

      // Remove from map - require explicit paths for disambiguation
      slugMap.delete(filename);
    } else {
      // First occurrence
      seenFilenames.set(filename, entry.id);
      slugMap.set(filename, entry.id);
    }
  }
  logger?.info(`[slug-map] Built map with ${slugMap.size} entries`);
}

/**
 * Resolve a page name to its full slug path
 * @param pageName The page name from a wikilink (may include folder path)
 * @returns The full slug path, or the original if not found
 */
export function resolveSlug(pageName: string): string {
  // If it already contains a path separator, use it as-is
  if (pageName.includes("/")) {
    console.log(`[resolveSlug] "${pageName}" already has /, returning as-is`);
    return pageName;
  }

  // Look up in the slug map
  const fullSlug = slugMap.get(pageName);
  console.log(
    `[resolveSlug] Map lookup: "${pageName}" → "${fullSlug || "NOT FOUND"}" (map size: ${slugMap.size})`,
  );

  // Return the full slug if found, otherwise use the bare name (root-level files)
  return fullSlug || pageName;
}
