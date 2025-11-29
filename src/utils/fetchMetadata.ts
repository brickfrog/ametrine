import { logger } from "./logger";

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  fetchedAt: number;
  failed?: boolean; // True if fetch failed, used for shorter cache TTL
}

/**
 * Fetch metadata from a URL by parsing OpenGraph tags and HTML
 * @param url - The URL to fetch metadata from
 * @param timeoutMs - Request timeout in milliseconds (default 5000)
 * @returns LinkMetadata object or null if fetch fails
 */
export async function fetchMetadata(
  url: string,
  timeoutMs: number = 5000,
): Promise<LinkMetadata | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Ametrine/1.0; +https://github.com/brickfrog/ametrine)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract metadata
    const metadata: LinkMetadata = {
      fetchedAt: Date.now(),
    };

    // Try OpenGraph title first
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i,
    );
    if (ogTitleMatch) {
      metadata.title = decodeHtmlEntities(ogTitleMatch[1]);
    } else {
      // Fallback to <title> tag
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = decodeHtmlEntities(titleMatch[1].trim());
      }
    }

    // Try OpenGraph description
    const ogDescMatch = html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
    );
    if (ogDescMatch) {
      metadata.description = decodeHtmlEntities(ogDescMatch[1]);
    }

    // Try OpenGraph image
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i,
    );
    if (ogImageMatch) {
      metadata.image = ogImageMatch[1];
    }

    // Try author meta tag
    const authorMatch = html.match(
      /<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i,
    );
    if (authorMatch) {
      metadata.author = decodeHtmlEntities(authorMatch[1]);
    }

    return metadata;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      logger.warn(`Timeout fetching metadata for ${url}`);
    } else {
      logger.warn(`Error fetching metadata for ${url}:`, error);
    }
    return null;
  }
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}
