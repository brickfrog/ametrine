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

  const rssItems = recentNotes
    .filter((note) => {
      // Ensure title is a non-empty string
      return (
        note.data.title &&
        typeof note.data.title === "string" &&
        note.data.title.trim().length > 0
      );
    })
    .map((note) => {
      // Ensure description is a non-empty string
      let description = "No description available";
      if (
        note.data.description &&
        typeof note.data.description === "string" &&
        note.data.description.trim()
      ) {
        description = note.data.description;
      } else if (
        note.body &&
        typeof note.body === "string" &&
        note.body.trim()
      ) {
        description = note.body.slice(0, 200);
      }

      return {
        title: note.data.title as string,
        description: description,
        content: note.body || "",
        link: `/${note.id}`,
        pubDate: note.data.date || note.data.updated || new Date(),
        ...(note.data.author &&
          typeof note.data.author === "string" && { author: note.data.author }),
        ...(note.data.tags &&
          Array.isArray(note.data.tags) &&
          note.data.tags.length > 0 && { categories: note.data.tags }),
      };
    });

  return rss({
    title: config.pageTitle,
    description: `Digital garden and notes from ${config.pageTitle}`,
    site: siteUrl,
    items: rssItems,
    customData: `<language>${config.locale}</language>`,
  });
};
