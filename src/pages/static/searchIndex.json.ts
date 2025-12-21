import type { APIRoute } from "astro";
import { buildContentIndex } from "./contentIndex.json";

export const GET: APIRoute = async () => {
  const contentIndex = await buildContentIndex({ includeContent: true });

  return new Response(JSON.stringify(contentIndex, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const prerender = true;
