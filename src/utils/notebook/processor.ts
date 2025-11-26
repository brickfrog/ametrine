/**
 * Notebook parsing and metadata extraction utilities
 */

import { load as yamlLoad } from "js-yaml";
import { slugifyPath } from "../slugify";
import type {
  Notebook,
  NotebookCell,
  AmetrineMetadata,
  MarkdownCell,
} from "./types";

/**
 * Parse a raw notebook JSON string into a typed Notebook object
 */
export function parseNotebook(json: string): Notebook {
  const notebook = JSON.parse(json) as Notebook;

  // Basic validation
  if (typeof notebook.nbformat !== "number") {
    throw new Error("Invalid notebook: missing nbformat");
  }
  if (!Array.isArray(notebook.cells)) {
    throw new Error("Invalid notebook: missing cells array");
  }

  return notebook;
}

/**
 * Normalize cell source to a single string
 * (cells can have source as string or array of strings)
 */
export function cellSourceToString(source: string | string[]): string {
  return Array.isArray(source) ? source.join("") : source;
}

/**
 * Get the programming language from notebook metadata
 */
export function getNotebookLanguage(notebook: Notebook): string {
  return (
    notebook.metadata?.language_info?.name ||
    notebook.metadata?.kernelspec?.language ||
    "python" // default fallback
  );
}

/**
 * Check if a cell is a markdown cell
 */
export function isMarkdownCell(cell: NotebookCell): cell is MarkdownCell {
  return cell.cell_type === "markdown";
}

/**
 * Extract frontmatter from notebook metadata or first YAML cell
 *
 * Priority:
 * 1. metadata.ametrine object
 * 2. First markdown cell starting with ---\n...\n---
 */
export function extractFrontmatter(
  notebook: Notebook,
  filename: string,
): AmetrineMetadata & { title: string } {
  // Start with ametrine metadata if present
  const ametrineMeta = notebook.metadata?.ametrine || {};

  // Check first cell for YAML frontmatter if no ametrine metadata
  if (!notebook.metadata?.ametrine && notebook.cells.length > 0) {
    const firstCell = notebook.cells[0];
    if (isMarkdownCell(firstCell)) {
      const source = cellSourceToString(firstCell.source);
      const yamlMatch = source.match(/^---\n([\s\S]*?)\n---/);
      if (yamlMatch) {
        try {
          const yamlData = yamlLoad(yamlMatch[1]) as AmetrineMetadata;
          Object.assign(ametrineMeta, yamlData);
        } catch {
          // Ignore YAML parse errors, fall through to defaults
        }
      }
    }
  }

  // Generate title from filename if not provided
  const title =
    ametrineMeta.title ||
    filename.replace(/\.ipynb$/, "").replace(/[-_]/g, " ");

  return {
    ...ametrineMeta,
    title,
    tags: ametrineMeta.tags || [],
    draft: ametrineMeta.draft ?? false,
    aliases: ametrineMeta.aliases || [],
  };
}

/**
 * Extract wikilinks from all markdown cells in a notebook
 * Returns slugified link targets
 */
export function extractNotebookLinks(notebook: Notebook): string[] {
  const links: string[] = [];
  const wikilinkRegex =
    /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;

  for (const cell of notebook.cells) {
    if (!isMarkdownCell(cell)) continue;

    const source = cellSourceToString(cell.source);
    let match;

    while ((match = wikilinkRegex.exec(source)) !== null) {
      const rawFp = match[1];
      if (rawFp) {
        const pageName = rawFp.split("#")[0].trim();
        if (pageName) {
          links.push(slugifyPath(pageName));
        }
      }
    }
  }

  return [...new Set(links)]; // Deduplicate
}

/**
 * Get markdown cells content for processing
 * (excludes first cell if it contains only YAML frontmatter)
 */
export function getMarkdownCellsContent(notebook: Notebook): string[] {
  const contents: string[] = [];

  for (let i = 0; i < notebook.cells.length; i++) {
    const cell = notebook.cells[i];
    if (!isMarkdownCell(cell)) continue;

    let source = cellSourceToString(cell.source);

    // Skip first cell's YAML frontmatter if present
    if (i === 0) {
      const yamlMatch = source.match(/^---\n[\s\S]*?\n---\n*/);
      if (yamlMatch) {
        source = source.slice(yamlMatch[0].length);
        if (!source.trim()) continue; // Skip if cell was only frontmatter
      }
    }

    if (source.trim()) {
      contents.push(source);
    }
  }

  return contents;
}
