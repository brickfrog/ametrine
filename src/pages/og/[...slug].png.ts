import type { APIRoute, GetStaticPaths } from "astro";
import { getPublishedNotes } from "../../utils/filterNotes";
import satori from "satori";
import sharp from "sharp";
import { config } from "../../config";
import { getSatoriFonts, calculateReadingTime } from "../../utils/ogImage";
import { OgImageTemplate } from "../../templates/ogImageTemplate";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export const getStaticPaths: GetStaticPaths = async () => {
  // Skip if OG images are disabled
  if (!config.ogImage?.enable) {
    return [];
  }

  const notes = await getPublishedNotes();

  // Filter notes based on path configuration
  const filteredNotes = notes.filter((note) => {
    const notePath = note.id;

    // If includePaths is specified, only include notes that match
    if (
      config.ogImage?.includePaths &&
      config.ogImage.includePaths.length > 0
    ) {
      const isIncluded = config.ogImage.includePaths.some((path) =>
        notePath.startsWith(path),
      );
      if (!isIncluded) return false;
    }

    // Apply excludePaths filter
    if (
      config.ogImage?.excludePaths &&
      config.ogImage.excludePaths.length > 0
    ) {
      const isExcluded = config.ogImage.excludePaths.some((path) =>
        notePath.startsWith(path),
      );
      if (isExcluded) return false;
    }

    return true;
  });

  return filteredNotes.map((note) => ({
    params: { slug: note.slug },
    props: { note },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { note } = props;

  // Skip if OG images are disabled
  if (!config.ogImage?.enable) {
    return new Response("OG images are disabled", { status: 404 });
  }

  const { title, description, author, date } = note.data;
  const readingTime = note.body ? calculateReadingTime(note.body) : undefined;

  // Load logo if it exists
  let logoDataUrl: string | undefined;
  if (config.logo) {
    try {
      // Logo path is relative to public directory
      const publicDir = join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../public",
      );
      const logoPath = join(publicDir, config.logo);
      const logoBuffer = await fs.readFile(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      const logoExt = config.logo.split(".").pop();
      logoDataUrl = `data:image/${logoExt};base64,${logoBase64}`;
    } catch (error) {
      // FIXME(sweep): Use logger.warn instead of console.warn for consistency
      console.warn("Could not load logo for OG image:", error);
    }
  }

  // Fetch fonts
  const fonts = await getSatoriFonts(
    config.theme.typography.header,
    config.theme.typography.body,
  );

  // Render the template to SVG
  const svg = await satori(
    OgImageTemplate({
      title,
      description,
      date: date
        ? new Date(date).toLocaleDateString(config.locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : undefined,
      author,
      readingTime,
      config,
      logo: logoDataUrl,
    }),
    {
      width: config.ogImage.width,
      height: config.ogImage.height,
      fonts,
    },
  );

  // Convert SVG to PNG
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
