import { slugifyPath } from "./slugify";

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, "");
}

export function tagToSlug(tag: string): string {
  return slugifyPath(normalizeTag(tag));
}
