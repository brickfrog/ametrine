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

  const vaultName = config.vaultName || "vault";

  // Import all media files from content directory
  const allMediaFiles = import.meta.glob<{ default: string }>(
    "/src/content/**/*.{png,jpg,jpeg,gif,webp,svg,avif,mp4,webm,mp3,wav,ogg,pdf}",
    { eager: false, query: "?url" },
  );

  // Filter to only include files from the configured vault
  const vaultPath = `/src/content/${vaultName}/`;
  const mediaFiles: Record<string, () => Promise<{ default: string }>> = {};

  for (const [path, loader] of Object.entries(allMediaFiles)) {
    if (path.startsWith(vaultPath)) {
      mediaFiles[path] = loader;
    }
  }

  const entries = Object.keys(mediaFiles).map((filePath) => {
    const relativePath = filePath.slice(vaultPath.length);
    const filename = relativePath.split("/").pop() || "";
    const extension = filename.split(".").pop()?.toLowerCase() || "";

    return {
      filePath,
      relativePath,
      filename,
      contentType: CONTENT_TYPES[extension] || "application/octet-stream",
    };
  });

  const filenameCounts = new Map<string, number>();
  for (const entry of entries) {
    filenameCounts.set(
      entry.filename,
      (filenameCounts.get(entry.filename) || 0) + 1,
    );
  }

  const paths = entries.flatMap((entry) => {
    const pathEntries = [
      {
        params: { path: entry.relativePath },
        props: {
          filePath: entry.filePath,
          contentType: entry.contentType,
        },
      },
    ];

    if (
      entry.relativePath !== entry.filename &&
      filenameCounts.get(entry.filename) === 1
    ) {
      pathEntries.push({
        params: { path: entry.filename },
        props: {
          filePath: entry.filePath,
          contentType: entry.contentType,
        },
      });
    }

    return pathEntries;
  });

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
