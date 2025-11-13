/**
 * Image mapping utility
 * Maps wikilink image names to their proper import paths
 */

// Import all images from vault (recursively scan subdirectories)
const images = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/vault/**/*.{png,jpg,jpeg,webp,gif,svg,avif}",
  { eager: true },
);

// Create a map of filename -> ImageMetadata
export const imageMap = new Map<string, ImageMetadata>();

for (const [path, module] of Object.entries(images)) {
  const fileName = path.split("/").pop()!;
  imageMap.set(fileName, module.default);
}

/**
 * Get image metadata for a wikilink reference
 * @param wikilink - Wikilink syntax like [[filename.png]] or just filename.png
 * @returns ImageMetadata or null if not found
 */
export function getImageFromWikilink(wikilink: string): ImageMetadata | null {
  // Extract filename from wikilink syntax
  const match = wikilink.match(/^\[\[(.+?)\]\]$/);
  const fileName = match ? match[1] : wikilink;

  return imageMap.get(fileName) || null;
}
