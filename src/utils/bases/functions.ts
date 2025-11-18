import type { FileProperties, FunctionRegistry } from "./types";

/**
 * Built-in functions for filter expressions
 * MVP: Basic file property functions
 */

/**
 * Check if file has a specific tag
 * Includes nested tags (e.g., hasTag("parent") matches "parent/child")
 */
export function fileHasTag(file: FileProperties, tag: string): boolean {
  if (!file.tags || file.tags.length === 0) return false;

  // Normalize tag (remove # if present)
  const normalizedTag = tag.startsWith("#") ? tag.slice(1) : tag;

  return file.tags.some((t) => {
    const normalizedFileTag = t.startsWith("#") ? t.slice(1) : t;
    // Exact match or nested tag match
    return (
      normalizedFileTag === normalizedTag ||
      normalizedFileTag.startsWith(normalizedTag + "/")
    );
  });
}

/**
 * Check if file is in a specific folder
 * Folder path should be relative (e.g., "guides", "concepts/pkm")
 */
export function fileInFolder(file: FileProperties, folder: string): boolean {
  // Normalize folder path (remove leading/trailing slashes)
  const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
  const normalizedFilePath = file.folder.replace(/^\/+|\/+$/g, "");

  // Exact match or starts with folder path
  return (
    normalizedFilePath === normalizedFolder ||
    normalizedFilePath.startsWith(normalizedFolder + "/")
  );
}

/**
 * Check if file has a specific property
 */
// TODO(sweep): Replace 'any' with proper type (unknown or specific value type)
export function fileHasProperty(
  note: Record<string, any>,
  propertyName: string,
): boolean {
  return (
    propertyName in note &&
    note[propertyName] !== undefined &&
    note[propertyName] !== null
  );
}

/**
 * Check if file links to another file
 * linkPath can be a slug or file path
 */
export function fileHasLink(file: FileProperties, linkPath: string): boolean {
  if (!file.links || file.links.length === 0) return false;

  // Normalize link path (remove .md extension if present)
  const normalizedLink = linkPath.replace(/\.md$/, "");

  return file.links.some((link) => {
    const normalizedFileLink = link.replace(/\.md$/, "");
    return (
      normalizedFileLink === normalizedLink ||
      normalizedFileLink.endsWith("/" + normalizedLink)
    );
  });
}

/**
 * Check if string contains substring (case-insensitive by default)
 */
export function stringContains(
  str: string,
  substring: string,
  caseSensitive = false,
): boolean {
  if (!str || !substring) return false;

  if (caseSensitive) {
    return str.includes(substring);
  }

  return str.toLowerCase().includes(substring.toLowerCase());
}

/**
 * Check if string starts with prefix
 */
export function stringStartsWith(
  str: string,
  prefix: string,
  caseSensitive = false,
): boolean {
  if (!str || !prefix) return false;

  if (caseSensitive) {
    return str.startsWith(prefix);
  }

  return str.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * Check if string ends with suffix
 */
export function stringEndsWith(
  str: string,
  suffix: string,
  caseSensitive = false,
): boolean {
  if (!str || !suffix) return false;

  if (caseSensitive) {
    return str.endsWith(suffix);
  }

  return str.toLowerCase().endsWith(suffix.toLowerCase());
}

/**
 * Parse date string (ISO format)
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Get current date/time
 */
export function now(): Date {
  return new Date();
}

/**
 * Get current date (time set to 00:00:00)
 */
export function today(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Registry of all built-in functions
 * Used by the filter evaluator
 */
export const builtinFunctions: FunctionRegistry = {
  // File functions (called as file.hasTag(), file.inFolder(), etc.)
  "file.hasTag": fileHasTag,
  "file.inFolder": fileInFolder,
  "file.hasProperty": fileHasProperty,
  "file.hasLink": fileHasLink,

  // String functions
  contains: stringContains,
  startsWith: stringStartsWith,
  endsWith: stringEndsWith,

  // Date functions
  date: parseDate,
  now: now,
  today: today,
};

/**
 * Helper to check if a value is truthy (for filter expressions)
 */
export function isTruthy(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}
