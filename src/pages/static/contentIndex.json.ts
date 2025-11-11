import { getPublishedNotes } from "../../utils/filterNotes";
import type { APIRoute } from "astro";
import { slugify } from "../../utils/slugify";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

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
  type?: "note" | "base" | "image" | "canvas";
  extension?: string;
  canvasData?: CanvasData;
}

export type ContentIndexMap = Record<string, ContentDetails>;

// Wikilink regex from our plugin
const wikilinkRegex =
  /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;

/**
 * Extract wikilink targets from markdown content
 */
function extractLinks(content: string): string[] {
  const links: string[] = [];

  // Find all wikilinks
  const matches = content.matchAll(wikilinkRegex);

  for (const match of matches) {
    const [_full, rawFp] = match;
    if (rawFp) {
      // Split off anchor if present
      const pageName = rawFp.split("#")[0].trim();
      if (pageName) {
        // Slugify the page name
        const slug = slugify(pageName);
        links.push(slug);
      }
    }
  }

  return [...new Set(links)]; // Dedupe
}

/**
 * Create a plain text excerpt from markdown content
 */
function createExcerpt(content: string, maxLength: number = 300): string {
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

  // Build content index
  const contentIndex: ContentIndexMap = {};

  for (const note of notes) {
    // Extract links from the markdown body
    const links = extractLinks(note.body);

    // Create excerpt
    const excerpt = createExcerpt(note.body);

    contentIndex[note.slug] = {
      slug: note.slug,
      title: note.data.title,
      filePath: `content/vault/${note.id}`,
      links,
      tags: note.data.tags || [],
      content: note.body,
      description: note.data.description,
      author: note.data.author,
      date: note.data.date?.toISOString(),
      updated: note.data.updated?.toISOString(),
      excerpt,
      type: "note",
    };
  }

  // Add base files
  const vaultPath = join(process.cwd(), "src/content/vault");
  const files = await readdir(vaultPath);
  const baseFiles = files.filter((f) => f.endsWith(".base"));

  for (const file of baseFiles) {
    const baseName = file.replace(/\.base$/, "");
    const content = await readFile(join(vaultPath, file), "utf-8");
    const baseData = parseYaml(content);
    const firstView = baseData.views?.[0];
    const firstViewSlug = firstView?.name.toLowerCase().replace(/\s+/g, "-");

    contentIndex[baseName] = {
      slug: baseName,
      title: baseName,
      filePath: `content/vault/${file}`,
      links: [`base/${baseName}/${firstViewSlug}`],
      tags: [],
      content,
      excerpt: `Base: ${baseName}`,
      type: "base",
    };
  }

  // Add image files
  const imageExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".svg",
    ".avif",
  ];
  const imageFiles = files.filter((f) =>
    imageExtensions.some((ext) => f.toLowerCase().endsWith(ext)),
  );

  for (const file of imageFiles) {
    const extension = file.split(".").pop()?.toUpperCase() || "";
    const nameWithoutExt = file.replace(/\.[^.]+$/, "");

    contentIndex[nameWithoutExt] = {
      slug: nameWithoutExt,
      title: nameWithoutExt,
      filePath: `content/vault/${file}`,
      links: [`image/${nameWithoutExt}`],
      tags: [],
      content: "",
      excerpt: `Image: ${file}`,
      type: "image",
      extension,
    };
  }

  // Add canvas files
  const canvasFiles = files.filter((f) => f.endsWith(".canvas"));

  for (const file of canvasFiles) {
    const canvasName = file.replace(/\.canvas$/, "");
    const content = await readFile(join(vaultPath, file), "utf-8");

    try {
      const canvasData: CanvasData = JSON.parse(content);
      const nodeCount = canvasData.nodes?.length || 0;
      const edgeCount = canvasData.edges?.length || 0;

      contentIndex[canvasName] = {
        slug: canvasName,
        title: canvasName,
        filePath: `content/vault/${file}`,
        links: [`canvas/${canvasName}`],
        tags: [],
        content,
        excerpt: `Canvas: ${nodeCount} nodes, ${edgeCount} edges`,
        type: "canvas",
        canvasData,
      };
    } catch (error) {
      console.error(`Failed to parse canvas file ${file}:`, error);
    }
  }

  return new Response(JSON.stringify(contentIndex, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Make this endpoint static at build time
export const prerender = true;
