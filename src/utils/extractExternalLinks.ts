/**
 * Extract all external links from markdown content
 * Returns URLs grouped by domain with metadata
 */

import type { BibliographyEntry } from "./parseBibliography";
import { fetchMetadata } from "./fetchMetadata";
import { getOrFetchMetadata } from "./metadataCache";
import { logger } from "./logger";

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
 * @param markdown - The markdown content to extract links from
 * @param bibliographyEntries - Bibliography entries with URLs
 * @param shouldFetchMetadata - Whether to fetch metadata for links (slower builds)
 */
export async function extractExternalLinks(
  markdown: string,
  bibliographyEntries: BibliographyEntry[] = [],
  shouldFetchMetadata: boolean = false,
): Promise<ExternalLink[]> {
  const links: ExternalLink[] = [];

  if (!markdown) return links;

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
  const dedupedLinks = links.filter((link) => {
    if (seen.has(link.url)) {
      return false;
    }
    seen.add(link.url);
    return true;
  });

  // Fetch metadata if enabled
  if (shouldFetchMetadata) {
    await enrichLinksWithMetadata(dedupedLinks);
  }

  return dedupedLinks;
}

/**
 * Detect if link text is unhelpful (e.g., "links", "here", "click here")
 */
function isUnhelpfulLinkText(text: string | undefined): boolean {
  if (!text) return true;

  const normalized = text.toLowerCase().trim();
  const unhelpfulPatterns = [
    "link",
    "links",
    "here",
    "click",
    "click here",
    "this",
    "source",
    "article",
    "read more",
    "more",
  ];

  return unhelpfulPatterns.includes(normalized) || normalized.length < 3;
}

/**
 * Fetch and enrich links with metadata from their target pages
 * Uses parallel fetching with concurrency limit
 */
async function enrichLinksWithMetadata(
  links: ExternalLink[],
  _maxConcurrent: number = 5,
): Promise<void> {
  // Filter links that need metadata (unhelpful title or no title, and not from bibliography)
  const linksToEnrich = links.filter(
    (link) => link.source !== "bibliography" && isUnhelpfulLinkText(link.title),
  );

  if (linksToEnrich.length === 0) {
    return;
  }

  logger.info(
    `Fetching metadata for ${linksToEnrich.length} external links...`,
  );

  // Batch requests with concurrency limit
  const results = await Promise.allSettled(
    linksToEnrich.map((link) =>
      getOrFetchMetadata(link.url, fetchMetadata).then((metadata) => ({
        link,
        metadata,
      })),
    ),
  );

  // Apply fetched metadata to links
  let successCount = 0;
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.metadata) {
      const { link, metadata } = result.value;
      if (metadata.title) {
        link.title = metadata.title;
        successCount++;
      }
      if (metadata.author) {
        link.author = metadata.author;
      }
    }
  }

  logger.info(
    `Successfully fetched metadata for ${successCount}/${linksToEnrich.length} links`,
  );
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
