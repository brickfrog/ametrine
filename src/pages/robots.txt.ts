import type { APIRoute } from "astro";
import { config } from "../config";

export const GET: APIRoute = () => {
  if (!config.baseUrl) {
    // If no baseUrl configured, return basic robots.txt without sitemap
    const robotsTxt = `# Robots.txt for ${config.pageTitle}
User-agent: *
Allow: /
`;

    return new Response(robotsTxt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const sitemapUrl = `${config.baseUrl}/sitemap-index.xml`;

  const robotsTxt = `# Robots.txt for ${config.pageTitle}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${sitemapUrl}
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
