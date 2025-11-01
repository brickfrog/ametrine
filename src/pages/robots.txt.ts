import type { APIRoute } from "astro";
import { config } from "../config";

export const GET: APIRoute = () => {
  const sitemapUrl = config.baseUrl
    ? `${config.baseUrl}/sitemap-index.xml`
    : "";

  const robotsTxt = `# Robots.txt for ${config.pageTitle}
User-agent: *
Allow: /

# AI Search & Citation Crawlers (Explicitly Allowed)
# These are allowed to index and cite content in AI responses
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

# AI Training Crawlers (Explicitly Allowed)
# These are allowed to use content for model training
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Omgilibot
Allow: /
${sitemapUrl ? `\n# Sitemap\nSitemap: ${sitemapUrl}\n` : ""}`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
