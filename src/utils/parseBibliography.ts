import fs from "fs";
// @ts-ignore - @citation-js/core does not have type declarations
import { Cite } from "@citation-js/core";
// @ts-ignore - @citation-js/plugin-bibtex does not have type declarations
import "@citation-js/plugin-bibtex";

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

/**
 * Parse a BibTeX file and return structured bibliography entries
 */
export async function parseBibliography(
  bibFilePath: string,
): Promise<Map<string, BibliographyEntry>> {
  const entries = new Map<string, BibliographyEntry>();

  try {
    const bibContent = fs.readFileSync(bibFilePath, "utf-8");
    const cite = new Cite(bibContent);
    const data = cite.data as any[];

    for (const entry of data) {
      const key = entry["citation-key"] || entry.id;
      if (!key) continue;

      // Extract author name(s)
      let authorStr: string | undefined;
      if (entry.author && Array.isArray(entry.author)) {
        authorStr = entry.author
          .map((a: any) => {
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
  } catch (error) {
    console.error("Error parsing bibliography:", error);
  }

  return entries;
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
