/**
 * Extract all external links from markdown content
 * Returns URLs grouped by domain with metadata
 */

import type { BibliographyEntry } from "./parseBibliography";

export interface ExternalLink {
  url: string;
  domain: string;
  title?: string; // From link text or bibliography title
  source: "markdown" | "bibliography";
  // Bibliography metadata
  author?: string;
  year?: string | number;
  bibKey?: string;
  publisher?: string;
  journal?: string;
}

export interface GroupedLinks {
  domain: string;
  count: number;
  links: ExternalLink[];
}

/**
 * Extract all external HTTP(S) URLs from markdown content
 */
export function extractExternalLinks(
  markdown: string,
  bibliographyEntries: BibliographyEntry[] = [],
): ExternalLink[] {
  const links: ExternalLink[] = [];

  // Regex to match markdown links [text](url) and bare URLs
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const bareUrlRegex = /https?:\/\/[^\s<>"{}|\\^`[\])]+/g;

  // Extract markdown-style links
  let match;
  while ((match = markdownLinkRegex.exec(markdown)) !== null) {
    const [, text, url] = match;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const urlObj = new URL(url);
        links.push({
          url: url,
          domain: urlObj.hostname,
          title: text,
          source: "markdown",
        });
      } catch {
        // Invalid URL, skip
      }
    }
  }

  // Extract bare URLs (but check if they're not already in markdown links)
  const markdownLinkUrls = new Set(links.map((l) => l.url));
  while ((match = bareUrlRegex.exec(markdown)) !== null) {
    const url = match[0];
    if (!markdownLinkUrls.has(url)) {
      try {
        const urlObj = new URL(url);
        links.push({
          url: url,
          domain: urlObj.hostname,
          source: "markdown",
        });
      } catch {
        // Invalid URL, skip
      }
    }
  }

  // Add bibliography entries that have URLs
  for (const entry of bibliographyEntries) {
    if (entry.url) {
      try {
        const urlObj = new URL(entry.url);
        links.push({
          url: entry.url,
          domain: urlObj.hostname,
          title: entry.title,
          source: "bibliography",
          author: entry.author,
          year: entry.year,
          bibKey: entry.key,
          publisher: entry.publisher,
          journal: entry.journal,
        });
      } catch {
        // Invalid URL, skip
      }
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.url)) {
      return false;
    }
    seen.add(link.url);
    return true;
  });
}

/**
 * Group external links by domain
 */
export function groupLinksByDomain(links: ExternalLink[]): GroupedLinks[] {
  const grouped = new Map<string, ExternalLink[]>();

  for (const link of links) {
    const existing = grouped.get(link.domain) || [];
    existing.push(link);
    grouped.set(link.domain, existing);
  }

  return Array.from(grouped.entries())
    .map(([domain, domainLinks]) => ({
      domain,
      count: domainLinks.length,
      links: domainLinks,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
}
