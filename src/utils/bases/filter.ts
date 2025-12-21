import type { Note } from "../filterNotes";
import jexlModule from "jexl";
import type {
  Filter,
  FileProperties,
  EvaluationContext,
  FilterResult,
} from "./types";
import { builtinFunctions, isTruthy } from "./functions";
import { wrapString, wrapList, wrapDate } from "./propertyWrappers";
import { getFolderPath } from "../folderUtils";
import { logger } from "../logger";

// Create a single jexl instance with custom functions registered
const jexl = new jexlModule.Jexl();

// Register custom functions
jexl.addFunction("contains", builtinFunctions["contains"]);
jexl.addFunction("startsWith", builtinFunctions["startsWith"]);
jexl.addFunction("endsWith", builtinFunctions["endsWith"]);
jexl.addFunction("now", builtinFunctions["now"]);
jexl.addFunction("today", builtinFunctions["today"]);
jexl.addFunction("date", builtinFunctions["date"]);
jexl.addFunction("hasTag", builtinFunctions["file.hasTag"]);
jexl.addFunction("inFolder", builtinFunctions["file.inFolder"]);
jexl.addFunction("hasProperty", builtinFunctions["file.hasProperty"]);
jexl.addFunction("hasLink", builtinFunctions["file.hasLink"]);

function normalizeExpression(expression: string): string {
  return expression
    .replace(/\bfile\.hasTag\s*\(/g, "hasTag(_file, ")
    .replace(/\bfile\.inFolder\s*\(/g, "inFolder(_file, ")
    .replace(/\bfile\.hasProperty\s*\(/g, "hasProperty(_note, ")
    .replace(/\bfile\.hasLink\s*\(/g, "hasLink(_file, ");
}

/**
 * Extract embedded files from note body
 */
function extractEmbeds(body: string | undefined): string[] {
  const embedRegex = /!\[\[([^\]]+)\]\]/g;
  const embeds: string[] = [];

  if (!body) return embeds;

  let match;

  while ((match = embedRegex.exec(body)) !== null) {
    embeds.push(match[1]);
  }

  return embeds;
}

/**
 * Create file properties object from a note entry
 */
function createFileProperties(note: Note): FileProperties {
  const slug = note.slug;
  const parts = slug.split("/");
  const fileName = parts[parts.length - 1];
  const folder = getFolderPath(slug);
  const basename = fileName.replace(/\.[^.]+$/, "");

  return {
    name: note.data.title || fileName,
    basename: basename,
    path: slug,
    folder: folder,
    ext: "md",
    ctime: note.data.created || note.data.date,
    mtime: note.data.modified || note.data.updated || note.data.date,
    tags: Array.isArray(note.data.tags) ? note.data.tags : [],
    links: Array.isArray(note.data.links) ? note.data.links : [],
    embeds: extractEmbeds(note.body),
    properties: { ...note.data },
  };
}

/**
 * Create evaluation context for a note
 */
function createContext(note: Note): EvaluationContext {
  const fileProps = createFileProperties(note);

  return {
    file: fileProps,
    note: note.data,
  };
}

/**
 * Evaluate a single filter expression string
 */
function evaluateExpression(
  expression: string,
  context: EvaluationContext,
): boolean {
  try {
    // Create a file proxy object that returns wrapped properties
    const fileProxy = {
      name: wrapString(context.file.name),
      basename: wrapString(context.file.basename),
      path: wrapString(context.file.path),
      folder: wrapString(context.file.folder),
      ext: wrapString(context.file.ext),
      size: context.file.size,
      ctime: wrapDate(context.file.ctime),
      mtime: wrapDate(context.file.mtime),
      tags: wrapList(context.file.tags),
      links: wrapList(context.file.links),
      embeds: wrapList(context.file.embeds),
      properties: context.file.properties,
      // Helper methods bound to this context
      hasTag: (tag: string) =>
        builtinFunctions["file.hasTag"](context.file, tag),
      inFolder: (folder: string) =>
        builtinFunctions["file.inFolder"](context.file, folder),
      hasProperty: (prop: string) =>
        builtinFunctions["file.hasProperty"](context.note, prop),
      hasLink: (link: string) =>
        builtinFunctions["file.hasLink"](context.file, link),
    };

    // Create variables object with all context
    const variables: Record<string, unknown> = {
      // File object with wrapped properties (supports file.name syntax)
      file: fileProxy,
      _file: context.file,
      _note: context.note,

      // Note properties (flat access)
      ...context.note,
    };

    // Evaluate expression synchronously
    const normalized = normalizeExpression(expression);
    const result = jexl.evalSync(normalized, variables);

    // Convert result to boolean
    return isTruthy(result);
  } catch (error) {
    logger.error(`Error evaluating expression "${expression}":`, error);
    // Return false for invalid expressions (fail safe)
    return false;
  }
}

/**
 * Recursively evaluate a filter against a note
 */
function evaluateFilter(filter: Filter, context: EvaluationContext): boolean {
  // String expression
  if (typeof filter === "string") {
    return evaluateExpression(filter, context);
  }

  // Object with conjunctions
  if (typeof filter === "object") {
    // AND conjunction - all must be true
    if ("and" in filter && Array.isArray(filter.and)) {
      return filter.and.every((subFilter) =>
        evaluateFilter(subFilter, context),
      );
    }

    // OR conjunction - at least one must be true
    if ("or" in filter && Array.isArray(filter.or)) {
      return filter.or.some((subFilter) => evaluateFilter(subFilter, context));
    }

    // NOT conjunction - all must be false
    if ("not" in filter && Array.isArray(filter.not)) {
      return !filter.not.some((subFilter) =>
        evaluateFilter(subFilter, context),
      );
    }
  }

  // Invalid filter - return true (no filtering)
  return true;
}

/**
 * Filter a collection of notes based on a filter specification
 */
export function filterNotes(
  notes: Note[],
  filter?: Filter,
  limit?: number,
): FilterResult {
  const totalCount = notes.length;

  // No filter - return all notes
  if (!filter) {
    const result = limit ? notes.slice(0, limit) : notes;
    return {
      notes: result,
      filteredCount: result.length,
      totalCount,
    };
  }

  // Apply filter
  const filtered = notes.filter((note) => {
    const context = createContext(note);
    return evaluateFilter(filter, context);
  });

  // Apply limit if specified
  const result = limit ? filtered.slice(0, limit) : filtered;

  return {
    notes: result,
    filteredCount: result.length,
    totalCount,
  };
}

/**
 * Get a property value from a note for display
 */
export function getPropertyValue(note: Note, propertyName: string): unknown {
  // Handle file properties
  if (propertyName.startsWith("file.")) {
    const fileProps = createFileProperties(note);
    const prop = propertyName.substring(5); // Remove 'file.' prefix

    if (prop in fileProps) {
      return fileProps[prop as keyof FileProperties];
    }
    return undefined;
  }

  // Handle note properties (frontmatter)
  if (propertyName in note.data) {
    return (note.data as Record<string, unknown>)[propertyName];
  }

  // Handle formula properties
  // Formula evaluation requires access to the base config formulas,
  // which would need to be passed as an additional parameter.
  // For now, return undefined for formula properties.
  if (propertyName.startsWith("formula.")) {
    return undefined;
  }

  return undefined;
}

/**
 * Format a property value for display
 */
export function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  // Date formatting
  if (value instanceof Date) {
    return value.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Array formatting
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  // Object formatting
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  // Default: convert to string
  return String(value);
}
