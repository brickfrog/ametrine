import { slugifyPath } from "./slugify";

const WIKILINK_REGEX =
  /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;

export function buildSlugLookup(slugs: string[]): Map<string, string> {
  const lookup = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const slug of slugs) {
    const filename = slug.split("/").pop() || slug;
    if (duplicates.has(filename)) {
      continue;
    }

    if (lookup.has(filename) && lookup.get(filename) !== slug) {
      lookup.delete(filename);
      duplicates.add(filename);
    } else {
      lookup.set(filename, slug);
    }
  }

  return lookup;
}

export function resolveWikilinkTarget(
  rawTarget: string,
  slugLookup: Map<string, string>,
): string | null {
  const pageName = rawTarget.split("#")[0]?.trim();
  if (!pageName) return null;

  const baseSlug = slugifyPath(pageName);
  if (baseSlug.includes("/")) {
    return baseSlug;
  }

  return slugLookup.get(baseSlug) || baseSlug;
}

export function extractWikilinkTargets(
  markdown: string,
  slugLookup: Map<string, string>,
): string[] {
  if (!markdown) return [];

  const links = new Set<string>();
  const matches = markdown.matchAll(new RegExp(WIKILINK_REGEX.source, "g"));

  for (const match of matches) {
    const rawTarget = match[1];
    if (!rawTarget) continue;

    const resolved = resolveWikilinkTarget(rawTarget, slugLookup);
    if (resolved) {
      links.add(resolved);
    }
  }

  return Array.from(links);
}
