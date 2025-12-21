import GithubSlugger from "github-slugger";

/**
 * Global slugger instance for consistent slug generation
 */
const globalSlugger = new GithubSlugger();

/**
 * Convert text to a URL-safe slug using GitHub's slugging algorithm
 * Note: This maintains state to handle duplicate slugs (adds -1, -2, etc.)
 * Reset the slugger if you need fresh slug generation for a new context
 */
export function slugify(text: string): string {
  return globalSlugger.slug(text);
}

/**
 * Reset the slugger's internal state
 * Use this when starting a new document/context where slug uniqueness should restart
 */
export function resetSlugger(): void {
  globalSlugger.reset();
}

/**
 * Convert a path with multiple segments to slugified version
 * e.g., "My Folder/My Note" -> "my-folder/my-note"
 */
export function slugifyPath(path: string): string {
  return path
    .split("/")
    .map((part) => new GithubSlugger().slug(part.trim()))
    .join("/");
}
