import { findAndReplace } from "mdast-util-find-and-replace";
import type { Root } from "mdast";
import type { VFile } from "vfile";
import { slugifyPath } from "../utils/slugify";
import { resolveWikilinkTarget } from "../utils/wikilinks";
import { marked } from "marked";

// Global type augmentation for slug map and content map
declare global {
  var __ametrineSlugMap: Array<{ id: string }> | undefined;
  var __ametrineContentMap:
    | Map<string, { title: string; body: string }>
    | undefined;
}

// File extension helpers for embed type detection
const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
  ".bmp",
];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogv", ".mov", ".mkv"];
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".flac"];
const PDF_EXTENSIONS = [".pdf"];

function getExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  return lastDot !== -1 ? path.slice(lastDot).toLowerCase() : "";
}

function isImage(ext: string): boolean {
  return IMAGE_EXTENSIONS.includes(ext);
}

function isVideo(ext: string): boolean {
  return VIDEO_EXTENSIONS.includes(ext);
}

function isAudio(ext: string): boolean {
  return AUDIO_EXTENSIONS.includes(ext);
}

function isPdf(ext: string): boolean {
  return PDF_EXTENSIONS.includes(ext);
}

/**
 * Escape HTML special characters to prevent XSS in data attributes
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convert a file path to a URL-safe format for media files
 * Unlike slugify, this preserves the file extension
 */
function mediaPathToUrl(path: string): string {
  // Encode the path for URL safety, preserving slashes and extension
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Pre-process wikilinks in content for use with marked
 * Converts embeds to HTML and links to markdown links
 */
function preprocessWikilinks(
  content: string,
  slugLookup: Map<string, string>,
): string {
  // Use a fresh regex to avoid global state issues
  const regex = /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;

  // Process embeds and links
  return content.replace(regex, (match, rawFp, rawHeader, rawAlias) => {
    const isEmbed = match.startsWith("!");
    const fp = rawFp?.trim() ?? "";
    const anchor = rawHeader?.trim() ?? "";
    const alias = rawAlias?.replace(/^\|/, "").trim();

    if (!fp && !anchor) return match; // Empty wikilink

    const ext = getExtension(fp);
    const displayText = alias || fp || anchor;

    if (isEmbed) {
      // Media embeds
      if (isImage(ext)) {
        const url = `/api/image/${mediaPathToUrl(fp)}`;
        return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alias || fp)}" class="embed-image" />`;
      }
      if (isVideo(ext)) {
        const url = `/api/image/${mediaPathToUrl(fp)}`;
        return `<video src="${escapeHtml(url)}" controls class="embed-video"></video>`;
      }
      if (isAudio(ext)) {
        const url = `/api/image/${mediaPathToUrl(fp)}`;
        return `<audio src="${escapeHtml(url)}" controls class="embed-audio"></audio>`;
      }
      if (isPdf(ext)) {
        const url = `/api/image/${mediaPathToUrl(fp)}`;
        return `<iframe src="${escapeHtml(url)}" class="embed-pdf"></iframe>`;
      }
      // Note embeds in transcluded content - just show as link to avoid infinite recursion
      const resolved = resolveWikilinkTarget(fp, slugLookup) || slugify(fp);
      return `<a href="/${escapeHtml(resolved)}${escapeHtml(anchor)}" class="internal-link">${escapeHtml(displayText)}</a>`;
    }

    // Regular links
    const resolved = resolveWikilinkTarget(fp, slugLookup) || slugify(fp);
    return `[${displayText}](/${resolved}${anchor})`;
  });
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

          // Skip embeds if disabled
          if (isEmbed && !opts.enableEmbeds) {
            return value; // Leave as-is
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

          // Track this link (non-embeds only to avoid duplicate tracking)
          if (pageName && !isEmbed) {
            outgoingLinks.push(fullSlug);
          }

          // Handle embed syntax
          if (isEmbed) {
            const ext = getExtension(fp);

            // For media files, use the API endpoint with URL-encoded path
            const mediaUrl = `/api/image/${mediaPathToUrl(fp)}`;

            // Image embed
            if (isImage(ext)) {
              return {
                type: "image",
                url: mediaUrl,
                alt: alias || pageName,
                data: {
                  hProperties: {
                    class: "embed-image",
                  },
                },
              };
            }

            // Video embed
            if (isVideo(ext)) {
              return {
                type: "html",
                value: `<video src="${escapeHtml(mediaUrl)}" controls class="embed-video"><a href="${escapeHtml(mediaUrl)}">${escapeHtml(alias || pageName)}</a></video>`,
              };
            }

            // Audio embed
            if (isAudio(ext)) {
              return {
                type: "html",
                value: `<audio src="${escapeHtml(mediaUrl)}" controls class="embed-audio"><a href="${escapeHtml(mediaUrl)}">${escapeHtml(alias || pageName)}</a></audio>`,
              };
            }

            // PDF embed
            if (isPdf(ext)) {
              return {
                type: "html",
                value: `<iframe src="${escapeHtml(mediaUrl)}" class="embed-pdf" title="${escapeHtml(alias || pageName)}"></iframe>`,
              };
            }

            // Markdown note embed - fetch content from content map
            const contentMap = globalThis.__ametrineContentMap;
            if (contentMap) {
              const noteData = contentMap.get(fullSlug);
              if (noteData) {
                let contentToEmbed = noteData.body;
                const headingTarget = pageAnchor
                  ? pageAnchor.replace(/^#/, "")
                  : "";

                // If heading specified, extract from that heading onwards
                if (headingTarget) {
                  // Find all headings in the content
                  const headingLineRegex = /^(#{1,6})\s+(.+?)\s*$/gm;
                  let headingMatch: RegExpExecArray | null = null;
                  let match: RegExpExecArray | null;

                  // Normalize the target for comparison (handle slugified headings)
                  const normalizedTarget = headingTarget
                    .toLowerCase()
                    .replace(/-/g, " ");

                  while ((match = headingLineRegex.exec(contentToEmbed))) {
                    const headingText = match[2];
                    const normalizedHeading = headingText
                      .toLowerCase()
                      .replace(/-/g, " ");

                    // Match if: exact match, or normalized match (slugified)
                    if (
                      headingText.toLowerCase() ===
                        headingTarget.toLowerCase() ||
                      normalizedHeading === normalizedTarget
                    ) {
                      headingMatch = match;
                      break;
                    }
                  }

                  if (headingMatch?.index !== undefined) {
                    contentToEmbed = contentToEmbed.slice(headingMatch.index);
                    // Find the next heading of same or higher level
                    const level = headingMatch[1].length;
                    const nextHeadingRegex = new RegExp(
                      `^#{1,${level}}\\s+`,
                      "m",
                    );
                    const restContent = contentToEmbed.slice(
                      headingMatch[0].length,
                    );
                    const nextMatch = restContent.match(nextHeadingRegex);
                    if (nextMatch?.index !== undefined) {
                      contentToEmbed =
                        headingMatch[0] + restContent.slice(0, nextMatch.index);
                    }
                  }
                }

                // Pre-process wikilinks in the content before marked
                const processedContent = preprocessWikilinks(
                  contentToEmbed,
                  localSlugMap,
                );

                // Convert markdown to HTML using marked
                const renderedHtml = marked.parse(processedContent, {
                  async: false,
                }) as string;

                return {
                  type: "html",
                  value: `<blockquote class="transclude" data-slug="${escapeHtml(fullSlug)}" data-heading="${escapeHtml(headingTarget)}">
                    <div class="transclude-content">${renderedHtml}</div>
                    <cite class="transclude-source"><a href="${escapeHtml(url)}">From: ${escapeHtml(noteData.title)}</a></cite>
                  </blockquote>`,
                };
              }
            }

            // Fallback for missing note - show broken embed indicator
            return {
              type: "html",
              value: `<blockquote class="transclude transclude-broken" data-slug="${escapeHtml(fullSlug)}">
                <div class="transclude-content"><em>Note not found: ${escapeHtml(pageName)}</em></div>
              </blockquote>`,
            };
          }

          // Determine display text for regular links
          const displayText = alias || pageName || url;

          // Check if target note exists
          const noteExists = slugMapData?.some(
            (entry) => entry.id === fullSlug,
          );

          if (!noteExists && opts.markBroken) {
            // Ghost link - note doesn't exist yet
            return {
              type: "html",
              value: `<span class="ghost-link" data-target="${escapeHtml(fullSlug)}">${escapeHtml(displayText)}</span>`,
            };
          }

          // Return a link node for existing notes
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
