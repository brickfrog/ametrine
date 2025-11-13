import type { APIRoute } from "astro";
import { getPublishedNotes } from "../utils/filterNotes";

export const GET: APIRoute = async () => {
  const notes = await getPublishedNotes();
  const validSlugs = new Set(notes.map((note) => note.slug));

  const brokenLinks: Array<{ sourceFile: string; targetSlug: string }> = [];
  let totalLinksChecked = 0;

  for (const note of notes) {
    const links = Array.isArray(note.data.links) ? note.data.links : [];
    for (const link of links) {
      totalLinksChecked++;
      if (!validSlugs.has(link)) {
        brokenLinks.push({
          sourceFile: note.slug,
          targetSlug: link,
        });
      }
    }
  }

  return new Response(
    JSON.stringify(
      {
        totalNotes: notes.length,
        totalLinksChecked,
        brokenLinksCount: brokenLinks.length,
        brokenLinks,
        isValid: brokenLinks.length === 0,
      },
      null,
      2,
    ),
    {
      status: brokenLinks.length === 0 ? 200 : 422,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
