import type { SatoriOptions } from "satori";
import { WORDS_PER_MINUTE } from "../constants/reading";
import { logger } from "./logger";

/**
 * Fetch a Google Font's TTF file
 */
export async function fetchGoogleFont(
  fontName: string,
  weight: number = 400,
): Promise<Buffer | undefined> {
  try {
    const normalizedFont = fontName.replaceAll(" ", "+");

    // Get CSS from Google Fonts API
    const cssUrl = `https://fonts.googleapis.com/css2?family=${normalizedFont}:wght@${weight}`;
    const cssResponse = await fetch(cssUrl);
    const css = await cssResponse.text();

    // Extract TTF URL from CSS
    const urlMatch =
      /url\((https:\/\/fonts\.gstatic\.com\/s\/.*?\.ttf)\)/g.exec(css);
    if (!urlMatch) {
      logger.warn(
        `Could not find TTF URL for font ${fontName} with weight ${weight}`,
      );
      return undefined;
    }

    // Fetch the font file
    const fontResponse = await fetch(urlMatch[1]);
    const fontBuffer = Buffer.from(await fontResponse.arrayBuffer());

    return fontBuffer;
  } catch (error) {
    logger.error(`Error fetching font ${fontName}:`, error);
    return undefined;
  }
}

/**
 * Get fonts for satori from config typography
 * Falls back to system fonts if fetching fails
 */
export async function getSatoriFonts(
  headerFont: string,
  bodyFont: string,
): Promise<SatoriOptions["fonts"]> {
  const fonts: SatoriOptions["fonts"] = [];

  try {
    // Fetch header font (bold)
    const headerBold = await fetchGoogleFont(headerFont, 700);
    if (headerBold) {
      fonts.push({
        name: headerFont,
        data: headerBold,
        weight: 700,
        style: "normal",
      });
    }

    // Fetch body font (regular)
    const bodyRegular = await fetchGoogleFont(bodyFont, 400);
    if (bodyRegular) {
      fonts.push({
        name: bodyFont,
        data: bodyRegular,
        weight: 400,
        style: "normal",
      });
    }
  } catch (error) {
    logger.warn(
      "Failed to fetch Google Fonts for OG images, using fallback fonts:",
      error,
    );
  }

  // If no fonts were successfully fetched, return empty array
  // Satori will use fallback system fonts
  if (fonts.length === 0) {
    logger.warn(
      "No fonts loaded for OG images, Satori will use system fallbacks",
    );
  }

  return fonts;
}

/**
 * Calculate reading time from text content
 */
export function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / WORDS_PER_MINUTE);
}
