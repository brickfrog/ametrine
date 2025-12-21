import { readFile, stat } from "node:fs/promises";
// @ts-ignore - @citation-js/core does not have type declarations
import { Cite } from "@citation-js/core";
// @ts-ignore - @citation-js/plugin-bibtex does not have type declarations
import "@citation-js/plugin-bibtex";
import { logger } from "./logger";

// Citation-JS author type
interface CitationAuthor {
  literal?: string;
  family?: string;
  given?: string;
}

// Citation-JS data entry type
interface CitationEntry {
  "citation-key"?: string;
  id?: string;
  author?: CitationAuthor[];
  issued?: {
    "date-parts"?: number[][];
  };
  year?: string | number;
  title?: string;
  URL?: string;
  url?: string;
  type?: string;
  publisher?: string;
  "container-title"?: string;
  journal?: string;
}

export interface BibliographyEntry {
  key: string;
  author?: string;
  year?: string | number;
  title?: string;
  url?: string;
  type?: string;
  publisher?: string;
  journal?: string;
}

const bibliographyCache = new Map<
  string,
  { mtimeMs: number; entries: Map<string, BibliographyEntry> }
>();
const bibliographyLoads = new Map<
  string,
  Promise<Map<string, BibliographyEntry>>
>();

/**
 * Parse a BibTeX file and return structured bibliography entries
 */
export async function parseBibliography(
  bibFilePath: string,
): Promise<Map<string, BibliographyEntry>> {
  try {
    const stats = await stat(bibFilePath);
    const cached = bibliographyCache.get(bibFilePath);
    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.entries;
    }

    const inFlight = bibliographyLoads.get(bibFilePath);
    if (inFlight) {
      return inFlight;
    }

    const loadPromise = (async () => {
      const entries = new Map<string, BibliographyEntry>();

      try {
        const bibContent = await readFile(bibFilePath, "utf-8");
        const cite = new Cite(bibContent);
        const data = cite.data as CitationEntry[];

        for (const entry of data) {
          const key = entry["citation-key"] || entry.id;
          if (!key) continue;

          // Extract author name(s)
          let authorStr: string | undefined;
          if (entry.author && Array.isArray(entry.author)) {
            authorStr = entry.author
              .map((a: CitationAuthor) => {
                if (a.literal) return a.literal;
                if (a.family && a.given) return `${a.given} ${a.family}`;
                if (a.family) return a.family;
                return "";
              })
              .filter(Boolean)
              .join(", ");
          }

          entries.set(key, {
            key,
            author: authorStr,
            year: entry.issued?.["date-parts"]?.[0]?.[0] || entry.year,
            title: entry.title,
            url: entry.URL || entry.url,
            type: entry.type,
            publisher: entry.publisher,
            journal: entry["container-title"] || entry.journal,
          });
        }

        bibliographyCache.set(bibFilePath, {
          mtimeMs: stats.mtimeMs,
          entries,
        });
      } catch (error) {
        logger.error("Error parsing bibliography:", error);
      }

      return entries;
    })().finally(() => {
      bibliographyLoads.delete(bibFilePath);
    });

    bibliographyLoads.set(bibFilePath, loadPromise);
    return await loadPromise;
  } catch (error) {
    logger.error("Error reading bibliography:", error);
  }

  return new Map();
}

/**
 * Extract citation keys from markdown content ([@key] pattern)
 */
export function extractCitationKeys(markdown: string): string[] {
  const citationRegex = /\[@([^\]]+)\]/g;
  const keys: Set<string> = new Set();

  let match;
  while ((match = citationRegex.exec(markdown)) !== null) {
    // Citation might be [@key1; @key2], so split by semicolon and extract each key
    const citation = match[1];
    const parts = citation.split(";");

    for (const part of parts) {
      const trimmed = part.trim();
      // Remove any @ prefix if it exists (for multiple citations)
      const key = trimmed.startsWith("@") ? trimmed.substring(1) : trimmed;
      if (key) {
        keys.add(key);
      }
    }
  }

  return Array.from(keys);
}

/**
 * Get cited bibliography entries from a note
 */
export async function getCitedBibliography(
  markdown: string,
  bibFilePath: string,
): Promise<BibliographyEntry[]> {
  const allEntries = await parseBibliography(bibFilePath);
  const citedKeys = extractCitationKeys(markdown);

  return citedKeys
    .map((key) => allEntries.get(key))
    .filter((entry): entry is BibliographyEntry => entry !== undefined);
}
