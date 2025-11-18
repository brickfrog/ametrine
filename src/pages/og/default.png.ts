import type { APIRoute } from "astro";
import satori from "satori";
import sharp from "sharp";
import { config } from "../../config";
import { getSatoriFonts } from "../../utils/ogImage";
import { OgImageTemplate } from "../../templates/ogImageTemplate";
import { logger } from "../../utils/logger";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export const GET: APIRoute = async () => {
  // Skip if OG images are disabled
  if (!config.ogImage?.enable) {
    return new Response("OG images are disabled", { status: 404 });
  }

  // Use site-level config values for the default OG image
  const title = config.pageTitle;
  const description = config.defaultDescription;

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
      logger.warn("Could not load logo for OG image:", error);
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
      date: undefined,
      author: undefined,
      readingTime: undefined,
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
