import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { config } from "../../../config";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  pdf: "application/pdf",
};

export const getStaticPaths: GetStaticPaths = async () => {
  if (config.features?.enableImages === false) {
    return [];
  }

  // Import all media files from content directory
  const allMediaFiles = import.meta.glob<{ default: string }>(
    "/src/content/**/*.{png,jpg,jpeg,gif,webp,svg,avif,mp4,webm,mp3,wav,ogg,pdf}",
    { eager: false, query: "?url" },
  );

  // Filter to only include files from the configured vault
  const vaultPath = `/src/content/${config.vaultName}/`;
  const mediaFiles: Record<string, () => Promise<{ default: string }>> = {};

  for (const [path, loader] of Object.entries(allMediaFiles)) {
    if (path.startsWith(vaultPath)) {
      mediaFiles[path] = loader;
    }
  }

  const paths = await Promise.all(
    Object.keys(mediaFiles).map(async (filePath) => {
      // Use just the filename for the route (Obsidian-style resolution)
      const filename = filePath.split("/").pop() || "";
      const extension = filename.split(".").pop()?.toLowerCase() || "";

      return {
        params: { path: filename },
        props: {
          filePath,
          contentType: CONTENT_TYPES[extension] || "application/octet-stream",
        },
      };
    }),
  );

  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const { filePath, contentType } = props;

  // Resolve the actual file path
  const absolutePath = resolve(process.cwd(), filePath.replace(/^\//, ""));

  try {
    const fileBuffer = await readFile(absolutePath);

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
};
