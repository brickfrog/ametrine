import { findAndReplace } from "mdast-util-find-and-replace";
import type { Root } from "mdast";
import type { VFile } from "vfile";
import { slugifyPath } from "../utils/slugify";

// Global type augmentation for slug map
declare global {
  var __ametrineSlugMap: Array<{ id: string }> | undefined;
}

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
  enableEmbeds: true,
  markBroken: true,
};

/**
 * Slugify a page name for URL
 * Preserves folder structure by slugifying each path segment separately
 */
function slugify(text: string): string {
  return slugifyPath(text);
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
    // Build local slug map from globalThis (set by vault loader)
    const localSlugMap = new Map<string, string>();
    const slugMapData = globalThis.__ametrineSlugMap;

    if (slugMapData) {
      const seenFilenames = new Map<string, string>();
      for (const entry of slugMapData) {
        const filename = entry.id.split("/").pop() || entry.id;
        if (seenFilenames.has(filename)) {
          // Duplicate - remove from map
          localSlugMap.delete(filename);
        } else {
          seenFilenames.set(filename, entry.id);
          localSlugMap.set(filename, entry.id);
        }
      }
    }

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

          // Build the URL (absolute path for rehype plugin to rewrite)
          const [pageName, pageAnchor] = splitAnchor(`${fp}${anchor}`);

          // Slugify the page name first
          const baseSlug = slugify(pageName);

          // Resolve to full path using slug map (handles folder resolution)
          // If pageName contains "/" it's already a full path, use as-is
          // Otherwise lookup in map to find full directory path
          let fullSlug = baseSlug;
          if (!baseSlug.includes("/")) {
            fullSlug = localSlugMap.get(baseSlug) || baseSlug;
          }

          const url = `/${fullSlug}${pageAnchor}`;

          // Track this link
          if (pageName) {
            outgoingLinks.push(fullSlug);
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
