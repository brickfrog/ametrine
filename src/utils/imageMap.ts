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
const vaultName = config.vaultName || "vault";
const vaultPath = `/src/content/${vaultName}/`;

for (const [path, module] of Object.entries(allImages)) {
  if (path.startsWith(vaultPath)) {
    images[path] = module;
  }
}

// Create a map of relative path -> ImageMetadata (and unique filename fallback)
export const imageMap = new Map<string, ImageMetadata>();
const filenameCounts = new Map<string, number>();
const entries: Array<{
  relativePath: string;
  fileName: string;
  metadata: ImageMetadata;
}> = [];

for (const [path, module] of Object.entries(images)) {
  const relativePath = path.slice(vaultPath.length);
  const fileName = relativePath.split("/").pop();
  if (!fileName) continue;

  entries.push({ relativePath, fileName, metadata: module.default });
  filenameCounts.set(fileName, (filenameCounts.get(fileName) || 0) + 1);
}

for (const entry of entries) {
  imageMap.set(entry.relativePath, entry.metadata);
  if (filenameCounts.get(entry.fileName) === 1) {
    imageMap.set(entry.fileName, entry.metadata);
  }
}

function normalizePath(path: string): string {
  let normalized = path
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/^\/+/, "");
  const vaultPrefix = `src/content/${vaultName}/`;
  if (normalized.startsWith(vaultPrefix)) {
    normalized = normalized.slice(vaultPrefix.length);
  }
  return normalized;
}

export function getImageFromPath(filePath: string): ImageMetadata | null {
  const normalized = normalizePath(filePath);
  return imageMap.get(normalized) || null;
}

/**
 * Get image metadata for a wikilink reference
 * @param wikilink - Wikilink syntax like [[filename.png]] or just filename.png
 * @returns ImageMetadata or null if not found
 */
export function getImageFromWikilink(wikilink: string): ImageMetadata | null {
  const match = wikilink.match(/^\[\[(.+?)\]\]$/);
  const rawValue = match ? match[1] : wikilink;
  const rawPath = rawValue.split("|")[0]?.split("#")[0]?.trim();
  if (!rawPath) return null;

  return getImageFromPath(rawPath);
}
