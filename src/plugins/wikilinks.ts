import { findAndReplace } from "mdast-util-find-and-replace";
import type { Root } from "mdast";
import type { VFile } from "vfile";
import GithubSlugger from "github-slugger";

// Wikilink regex from Quartz
// Matches: [[Page Name]], [[Page#heading]], [[Page|Alias]], [[Page#heading|Alias]]
export const wikilinkRegex =
  /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;

export interface WikilinkOptions {
  /** Whether to parse embeds (![[image]]) - MVP: false */
  enableEmbeds?: boolean;
  /** Whether to mark broken links - MVP: false */
  markBroken?: boolean;
}

const defaultOptions: WikilinkOptions = {
  enableEmbeds: false,
  markBroken: false,
};

/**
 * Slugify a page name for URL
 * Preserves folder structure by slugifying each path segment separately
 */
function slugify(text: string): string {
  const slugger = new GithubSlugger();
  const trimmed = text.trim();

  // Handle folder paths: split on '/', slugify each part, rejoin
  if (trimmed.includes("/")) {
    return trimmed
      .split("/")
      .map((part) => slugger.slug(part.trim()))
      .join("/");
  }

  return slugger.slug(trimmed);
}

/**
 * Split anchor from file path
 */
function splitAnchor(raw: string): [string, string] {
  const hashIndex = raw.indexOf("#");
  if (hashIndex === -1) {
    return [raw, ""];
  }
  return [raw.slice(0, hashIndex), raw.slice(hashIndex)];
}

/**
 * Remark plugin to transform wikilinks to regular markdown links
 */
export function wikilinks(options: WikilinkOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return function transformer(tree: Root, file: VFile) {
    // Track outgoing links for this file (used by link crawler later)
    const outgoingLinks: string[] = [];

    findAndReplace(tree, [
      [
        wikilinkRegex,
        (value: string, ...capture: (string | undefined)[]) => {
          const [rawFp, rawHeader, rawAlias] = capture;

          // Parse the wikilink components
          const fp = rawFp?.trim() ?? "";
          const anchor = rawHeader?.trim() ?? "";
          const alias = rawAlias?.replace(/^\|/, "").trim();

          // Check for embed syntax (starts with !)
          const isEmbed = value.startsWith("!");

          // For MVP, skip embeds
          if (isEmbed && !opts.enableEmbeds) {
            return value; // Leave as-is for now
          }

          // Build the URL (absolute path for Astro base URL)
          const [pageName, pageAnchor] = splitAnchor(`${fp}${anchor}`);
          const slug = slugify(pageName);
          const url = `/${slug}${pageAnchor}`;

          // Track this link
          if (pageName) {
            outgoingLinks.push(slug);
          }

          // Determine display text
          const displayText = alias || pageName || url;

          // Return a link node
          return {
            type: "link",
            url,
            data: {
              hProperties: {
                class: "internal-link",
              },
            },
            children: [
              {
                type: "text",
                value: displayText,
              },
            ],
          };
        },
      ],
    ]);

    // Store outgoing links in file data for use by other plugins
    file.data.links = outgoingLinks;

    return tree;
  };
}

export default wikilinks;
