import type { Note } from "../filterNotes";

/**
 * Base View Types
 */
export type ViewType = "table" | "cards" | "list" | "map";

/**
 * Filter Conjunctions (logical operators)
 */
export type FilterConjunction = "and" | "or" | "not";

/**
 * Filter structure - can be a string expression or nested conjunctions
 */
export type Filter =
  | string // Expression like "status == 'active'"
  | {
      [K in FilterConjunction]?: Filter[];
    };

/**
 * View configuration from .base file
 */
export interface BaseView {
  type: ViewType;
  name: string;
  limit?: number;
  filters?: Filter;
  order?: string[]; // Property names to display
  // Card view specific options
  image?: string; // Property name for card image (e.g., "cover", "note.image")
  imageFit?: "cover" | "contain" | "";
  imageAspectRatio?: number; // e.g., 0.5 for 1:2 ratio
  cardSize?: number; // Card width in pixels
}

/**
 * Complete base configuration
 */
export interface BaseConfig {
  filters?: Filter; // Global filters
  formulas?: Record<string, string>; // Computed properties
  properties?: Record<string, PropertyConfig>; // Display config
  views: BaseView[];
}

/**
 * Property display configuration
 */
export interface PropertyConfig {
  displayName?: string;
  // Future: formatting, icons, etc.
}

/**
 * Evaluated note with all properties for filtering
 */
export interface EvaluatedNote {
  note: Note;
  properties: Record<string, any>; // All properties (file, note, formula)
}

/**
 * File property accessors
 */
export interface FileProperties {
  name: string;
  basename: string; // Filename without extension
  path: string;
  folder: string;
  ext: string;
  size?: number;
  ctime?: Date;
  mtime?: Date;
  tags: string[];
  links: string[];
  embeds: string[]; // List of embedded files
  backlinks?: string[]; // Performance heavy
  properties?: Record<string, any>; // All frontmatter properties
}

/**
 * Note property accessors (from frontmatter)
 */
export type NoteProperties = Record<string, any>;

/**
 * Context for expression evaluation
 */
export interface EvaluationContext {
  file: FileProperties;
  note: NoteProperties;
  formula?: Record<string, any>;
  this?: any; // For embedded bases
}

/**
 * Filter evaluation result
 */
export interface FilterResult {
  notes: Note[];
  filteredCount: number;
  totalCount: number;
}

/**
 * Built-in function signature
 */
export type BaseFunction = (...args: any[]) => any;

/**
 * Function registry
 */
export type FunctionRegistry = Record<string, BaseFunction>;
