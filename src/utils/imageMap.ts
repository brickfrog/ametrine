/**
 * Image mapping utility
 * Maps wikilink image names to their proper import paths
 */

import { config } from "../config";

// Import all images from content directory (recursively scan subdirectories)
const allImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/**/*.{png,jpg,jpeg,webp,gif,svg,avif}",
  { eager: true },
);

// Filter images to only include those from the configured vault
const images: Record<string, { default: ImageMetadata }> = {};
const vaultPath = `/src/content/${config.vaultName}/`;

for (const [path, module] of Object.entries(allImages)) {
  if (path.startsWith(vaultPath)) {
    images[path] = module;
  }
}

// Create a map of filename -> ImageMetadata
export const imageMap = new Map<string, ImageMetadata>();

for (const [path, module] of Object.entries(images)) {
  const fileName = path.split("/").pop();
  if (fileName) {
    imageMap.set(fileName, module.default);
  }
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
