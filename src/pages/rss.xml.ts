import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getPublishedNotes } from "../utils/filterNotes";
import { config } from "../config";

export const GET: APIRoute = async (context) => {
  const publishedNotes = await getPublishedNotes();

  // Sort by date (most recent first)
  const sortedNotes = publishedNotes.sort((a, b) => {
    const dateA = a.data.date || a.data.updated || new Date(0);
    const dateB = b.data.date || b.data.updated || new Date(0);
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Limit to 20 most recent items
  const recentNotes = sortedNotes.slice(0, 20);

  // Get site URL from context.site or config.baseUrl
  const siteUrl =
    context.site?.href ||
    (config.baseUrl ? `https://${config.baseUrl}` : undefined);

  if (!siteUrl) {
    throw new Error(
      "RSS feed requires a site URL. Please set config.baseUrl in src/config.ts or site in astro.config.mjs",
    );
  }

  return rss({
    title: config.pageTitle,
    description: `Digital garden and notes from ${config.pageTitle}`,
    site: siteUrl,
    items: recentNotes.map((note) => ({
      title: note.data.title,
      description: note.data.description || "",
      content: note.body, // Full content for better AI understanding
      link: `/${note.id.replace(".md", "")}`,
      pubDate: note.data.date || note.data.updated || new Date(),
      author: note.data.author,
      categories: note.data.tags || [], // Add tags as categories for better discoverability
    })),
    customData: `<language>${config.locale}</language>`,
  });
};
