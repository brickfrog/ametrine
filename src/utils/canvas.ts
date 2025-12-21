import type {
  CanvasNode,
  ContentDetails,
  ContentIndexMap,
} from "../pages/static/contentIndex.json";
import type { Note } from "./filterNotes";
import { slugifyPath } from "./slugify";

/**
 * Build a map of node IDs to node data for quick lookups
 */
export function buildNodeMap(nodes: CanvasNode[]): Record<string, CanvasNode> {
  const map: Record<string, CanvasNode> = {};
  for (const node of nodes) {
    map[node.id] = node;
  }
  return map;
}

/**
 * Resolve a canvas file reference to a ContentDetails entry
 * Canvas files use paths like "notes/my-note.md" or "Attachments/image.png"
 */
export function resolveCanvasFile(
  filePath: string,
  contentIndex: ContentIndexMap,
): ContentDetails | null {
  // Remove leading slash if present
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

  // Try direct slug match (without extension)
  const nameWithoutExt = cleanPath.replace(/\.[^.]+$/, "");
  const slugCandidate = slugifyPath(nameWithoutExt);
  if (contentIndex[slugCandidate]) {
    return contentIndex[slugCandidate];
  }

  // Try searching by filePath
  for (const [_slug, details] of Object.entries(contentIndex)) {
    if (
      details.filePath.endsWith(cleanPath) ||
      details.filePath.endsWith(nameWithoutExt)
    ) {
      return details;
    }
  }

  return null;
}

/**
 * Get the connection point coordinates for an edge
 */
export function getConnectionPoint(
  node: CanvasNode,
  side: "top" | "right" | "bottom" | "left" = "right",
): { x: number; y: number } {
  const { x, y, width, height } = node;

  switch (side) {
    case "top":
      return { x: x + width / 2, y };
    case "right":
      return { x: x + width, y: y + height / 2 };
    case "bottom":
      return { x: x + width / 2, y: y + height };
    case "left":
      return { x, y: y + height / 2 };
    default:
      return { x: x + width, y: y + height / 2 };
  }
}

/**
 * Calculate the bounding box of all nodes in a canvas
 */
export function getCanvasBounds(nodes: CanvasNode[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 800, minY: 0, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + node.width);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Map Obsidian canvas colors to CSS colors
 * Obsidian uses color IDs "1" through "6" for preset colors
 */
export function getCanvasColor(colorId?: string): string {
  if (!colorId) return "var(--color-lightgray)";

  // If it's a hex color, return it
  if (colorId.startsWith("#")) return colorId;

  // Map color IDs to theme colors
  const colorMap: Record<string, string> = {
    "1": "#e53935", // red
    "2": "#fb8c00", // orange
    "3": "#fdd835", // yellow
    "4": "#43a047", // green
    "5": "#1e88e5", // blue
    "6": "#8e24aa", // purple
  };

  return colorMap[colorId] || "var(--color-lightgray)";
}

/**
 * Group nodes by type for layered rendering
 */
export function groupNodesByType(nodes: CanvasNode[]): {
  groups: CanvasNode[];
  files: CanvasNode[];
  text: CanvasNode[];
  links: CanvasNode[];
} {
  const groups: CanvasNode[] = [];
  const files: CanvasNode[] = [];
  const text: CanvasNode[] = [];
  const links: CanvasNode[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case "group":
        groups.push(node);
        break;
      case "file":
        files.push(node);
        break;
      case "text":
        text.push(node);
        break;
      case "link":
        links.push(node);
        break;
    }
  }

  return { groups, files, text, links };
}

/**
 * Find a note by canvas file path
 * Handles paths like "Tech/Tips/RAG-tips.md" or just "note-name.md"
 */
export function findNoteByPath(
  canvasPath: string,
  allNotes: Note[],
): Note | null {
  if (!canvasPath) return null;

  // Remove .md extension
  const pathWithoutExt = canvasPath.replace(/\.md$/, "");
  const slugCandidate = slugifyPath(pathWithoutExt);

  // Try direct slug match
  let note = allNotes.find((n) => n.slug === slugCandidate);
  if (note) return note;

  // Try filename match (last part of path)
  const filename = canvasPath.split("/").pop()?.replace(/\.md$/, "");
  if (filename) {
    const filenameSlug = slugifyPath(filename);
    note = allNotes.find(
      (n) => n.slug === filenameSlug || n.slug.endsWith(`/${filenameSlug}`),
    );
    if (note) return note;
  }

  // Try fuzzy match on path
  note = allNotes.find((n) => {
    const notePath = n.slug.replace(/\.md$/, "");
    return notePath.endsWith(slugCandidate) || slugCandidate.endsWith(notePath);
  });

  return note || null;
}

/**
 * Check if a file extension is an image
 */
export function isImageExtension(filePath: string): boolean {
  const imageExts = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"];
  return imageExts.some((ext) => filePath.toLowerCase().endsWith(ext));
}

/**
 * Create a plain text excerpt from markdown content
 */
export function createExcerpt(
  markdown: string,
  maxLength: number = 200,
): string {
  // Remove frontmatter
  let text = markdown.replace(/^---[\s\S]+?---\n/, "");

  // Remove markdown syntax
  text = text
    .replace(/#{1,6}\s+/g, "") // Headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
    .replace(/\*(.+?)\*/g, "$1") // Italic
    .replace(/_(.+?)_/g, "$1") // Italic underscore
    .replace(/`(.+?)`/g, "$1") // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/!\[([^\]]*)]\([^)]+\)/g, "") // Images
    .replace(/^[-*+]\s+/gm, "") // List markers
    .replace(/^\d+\.\s+/gm, "") // Numbered lists
    .replace(/^>\s+/gm, "") // Blockquotes
    .replace(/```[\s\S]*?```/g, "") // Code blocks
    .replace(/\n{2,}/g, " ") // Multiple newlines
    .trim();

  // Truncate to max length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + "...";
  }

  return text;
}
