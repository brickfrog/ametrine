import { getPublishedNotes } from "../../utils/filterNotes";
import type { APIRoute } from "astro";
import GithubSlugger from "github-slugger";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { config } from "../../config";
import { logger } from "../../utils/logger";

export interface CanvasNode {
  id: string;
  type: "text" | "file" | "link" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  text?: string;
  file?: string;
  url?: string;
  label?: string;
  background?: string;
  backgroundStyle?: string;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: string;
  toSide?: string;
  fromEnd?: string;
  toEnd?: string;
  label?: string;
  color?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface ContentDetails {
  slug: string;
  title: string;
  filePath: string;
  links: string[];
  tags: string[];
  content: string;
  description?: string;
  author?: string;
  date?: string;
  updated?: string;
  excerpt: string;
  type?: "note" | "base" | "image" | "canvas" | "tag";
  extension?: string;
  canvasData?: CanvasData;
}

export type ContentIndexMap = Record<string, ContentDetails>;

// Wikilink regex from our plugin
const wikilinkRegex =
  /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;

/**
 * Extract wikilink targets from markdown content and resolve to full slugs
 */
function extractLinks(
  content: string,
  slugLookup: Map<string, string>,
): string[] {
  const links: string[] = [];

  // Handle undefined or null content
  if (!content) return links;

  // Create fresh slugger to avoid state pollution
  const slugger = new GithubSlugger();

  // Find all wikilinks
  const matches = content.matchAll(wikilinkRegex);

  for (const match of matches) {
    const [_full, rawFp] = match;
    if (rawFp) {
      // Split off anchor if present
      const pageName = rawFp.split("#")[0].trim();
      if (pageName) {
        // Slugify the page name with fresh slugger
        const slug = slugger.slug(pageName);

        // Try to resolve to full slug using lookup
        const fullSlug = slugLookup.get(slug) || slug;
        links.push(fullSlug);
      }
    }
  }

  return [...new Set(links)]; // Dedupe
}

/**
 * Create a plain text excerpt from markdown content
 */
function createExcerpt(content: string, maxLength: number = 300): string {
  // Handle undefined or null content
  if (!content) return "";

  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---[\s\S]+?---\n/, "");

  // Remove markdown syntax
  let plain = withoutFrontmatter
    .replace(/#{1,6}\s+/g, "") // Headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
    .replace(/\*(.+?)\*/g, "$1") // Italic
    .replace(/_(.+?)_/g, "$1") // Italic underscore
    .replace(/`(.+?)`/g, "$1") // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(wikilinkRegex, (_, fp) => fp || "") // Wikilinks
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Images
    .replace(/^[-*+]\s+/gm, "") // List markers
    .replace(/^\d+\.\s+/gm, "") // Numbered lists
    .replace(/^>\s+/gm, "") // Blockquotes
    .replace(/```[\s\S]*?```/g, "") // Code blocks
    .replace(/\n{2,}/g, " ") // Multiple newlines
    .trim();

  // Truncate to max length
  if (plain.length > maxLength) {
    plain = plain.substring(0, maxLength).trim() + "...";
  }

  return plain;
}

export const GET: APIRoute = async () => {
  // Get all published notes from content collection
  const notes = await getPublishedNotes();
  const vaultName = config.vaultName || "vault";

  // Build content index (first pass - without links)
  const contentIndex: ContentIndexMap = {};

  for (const note of notes) {
    // Create excerpt
    const excerpt = createExcerpt(note.body || "");

    contentIndex[note.slug] = {
      slug: note.slug,
      title: note.data.title || note.slug,
      filePath: `content/${vaultName}/${note.id}`,
      links: [], // Will populate in second pass
      tags: Array.isArray(note.data.tags) ? note.data.tags : [],
      content: note.body || "",
      description: note.data.description,
      author: Array.isArray(note.data.author)
        ? note.data.author[0]
        : note.data.author || undefined,
      date: (note.data.date || note.data.created)?.toISOString(),
      updated: note.data.updated?.toISOString(),
      excerpt,
      type: "note",
    };
  }

  // Recursively scan vault for base, image, and canvas files
  const vaultPath = join(process.cwd(), `src/content/${vaultName}`);

  async function scanDirectory(
    dir: string,
    basePath: string = "",
  ): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        await scanDirectory(fullPath, relativePath);
      } else if (entry.isFile() && !entry.name.startsWith(".")) {
        // Handle base files
        if (entry.name.endsWith(".base")) {
          const slug = relativePath.replace(/\.base$/, "").toLowerCase();
          const content = await readFile(fullPath, "utf-8");
          const baseData = parseYaml(content);
          const firstView = baseData.views?.[0];
          const firstViewSlug = firstView?.name
            .toLowerCase()
            .replace(/\s+/g, "-");

          contentIndex[slug] = {
            slug,
            title: entry.name.replace(/\.base$/, ""),
            filePath: `content/${vaultName}/${relativePath}`,
            links: [`base/${slug}/${firstViewSlug}`],
            tags: [],
            content,
            excerpt: `Base: ${entry.name.replace(/\.base$/, "")}`,
            type: "base",
          };
        }
        // Handle image files
        else if (
          [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"].some(
            (ext) => entry.name.toLowerCase().endsWith(ext),
          )
        ) {
          const extension = entry.name.split(".").pop()?.toUpperCase() || "";
          const slug = relativePath.replace(/\.[^.]+$/, "").toLowerCase();

          contentIndex[slug] = {
            slug,
            title: entry.name.replace(/\.[^.]+$/, ""),
            filePath: `content/${vaultName}/${relativePath}`,
            links: [`image/${slug}`],
            tags: [],
            content: "",
            excerpt: `Image: ${entry.name}`,
            type: "image",
            extension,
          };
        }
        // Handle canvas files
        else if (entry.name.endsWith(".canvas")) {
          const slug = relativePath.replace(/\.canvas$/, "").toLowerCase();
          const content = await readFile(fullPath, "utf-8");

          try {
            const canvasData: CanvasData = JSON.parse(content);
            const nodeCount = canvasData.nodes?.length || 0;
            const edgeCount = canvasData.edges?.length || 0;

            contentIndex[slug] = {
              slug,
              title: entry.name.replace(/\.canvas$/, ""),
              filePath: `content/${vaultName}/${relativePath}`,
              links: [`canvas/${slug}`],
              tags: [],
              content,
              excerpt: `Canvas: ${nodeCount} nodes, ${edgeCount} edges`,
              type: "canvas",
              canvasData,
            };
          } catch (error) {
            logger.error(
              `Failed to parse canvas file ${relativePath}:`,
              error,
            );
          }
        }
      }
    }
  }

  await scanDirectory(vaultPath);

  // Build slug lookup map: filename -> full slug
  const slugLookup = new Map<string, string>();

  for (const [slug, _entry] of Object.entries(contentIndex)) {
    // Extract filename (last segment of slug)
    const filename = slug.split("/").pop() || slug;

    // If duplicate filename exists, skip (can't resolve unambiguously)
    if (slugLookup.has(filename) && slugLookup.get(filename) !== slug) {
      // Duplicate detected, remove from map to avoid incorrect resolution
      slugLookup.delete(filename);
    } else {
      slugLookup.set(filename, slug);
    }
  }

  // Build set of all unique tags
  const allTags = new Set<string>();

  for (const [_slug, entry] of Object.entries(contentIndex)) {
    if (entry.type === "note" && entry.tags) {
      for (const tag of entry.tags) {
        allTags.add(tag);
      }
    }
  }

  // Add tag nodes to contentIndex
  for (const tag of allTags) {
    const tagSlug = `tags/${tag}`;
    contentIndex[tagSlug] = {
      slug: tagSlug,
      title: tag,
      filePath: "",
      links: [],
      tags: [],
      content: "",
      excerpt: `Tag: ${tag}`,
      type: "tag",
    };
  }

  // Second pass: populate links for notes (wikilinks + connections to tags)
  for (const [slug, entry] of Object.entries(contentIndex)) {
    // Skip non-note entries - they already have their links set
    if (entry.type !== "note") continue;

    const allLinks = new Set<string>();

    // Add wikilink targets
    if (entry.content) {
      const wikilinks = extractLinks(entry.content, slugLookup);
      wikilinks.forEach((link) => allLinks.add(link));
    }

    // Add connections from notes to their tags
    if (entry.tags) {
      for (const tag of entry.tags) {
        const tagSlug = `tags/${tag}`;
        allLinks.add(tagSlug);
      }
    }

    contentIndex[slug].links = Array.from(allLinks);
  }

  return new Response(JSON.stringify(contentIndex, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Make this endpoint static at build time
export const prerender = true;
