import type { APIRoute } from "astro";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { config } from "../../../config";

// MIME types for supported image formats
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".pdf": "application/pdf",
};

/**
 * Recursively search for a file by name in a directory
 */
async function findFileByName(
  dir: string,
  fileName: string,
): Promise<string | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        // Recursively search subdirectories
        const found = await findFileByName(fullPath, fileName);
        if (found) return found;
      } else if (entry.isFile()) {
        // Case-insensitive filename comparison
        if (entry.name.toLowerCase() === fileName.toLowerCase()) {
          return fullPath;
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return null;
}

export const GET: APIRoute = async ({ params }) => {
  const path = params.path;

  if (!path) {
    return new Response("Not found", { status: 404 });
  }

  // Get file extension
  const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
  const mimeType = MIME_TYPES[ext];

  if (!mimeType) {
    return new Response("Unsupported file type", { status: 400 });
  }

  // Construct path to vault file
  const vaultName = config.vaultName || "vault";
  const vaultPath = join(process.cwd(), "src", "content", vaultName);
  let filePath = join(vaultPath, path);

  try {
    // First try the exact path
    await stat(filePath);
  } catch {
    // If exact path doesn't exist, search by filename (Obsidian-style resolution)
    const fileName = basename(path);
    const foundPath = await findFileByName(vaultPath, fileName);

    if (foundPath) {
      filePath = foundPath;
    } else {
      return new Response("File not found", { status: 404 });
    }
  }

  try {
    const fileBuffer = await readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
};

// This needs to be server-rendered, not prerendered
export const prerender = false;
