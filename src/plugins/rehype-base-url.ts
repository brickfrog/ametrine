import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

/**
 * Rehype plugin to prepend base URL to all internal links
 * This ensures all links work with Astro's base path configuration
 */
export function rehypeBaseUrl(options: { base?: string } = {}) {
  return function transformer(tree: Root) {
    const baseUrl = options.base || "/";

    visit(tree, "element", (node: Element) => {
      // Handle <a> tags
      if (node.tagName === "a" && node.properties?.href) {
        const href = node.properties.href as string;

        // Only rewrite internal links that start with /
        // Skip: external links (http/https), anchors (#), data URIs, already prefixed links
        if (
          href.startsWith("/") &&
          !href.startsWith("//") &&
          !href.startsWith(baseUrl)
        ) {
          node.properties.href = `${baseUrl}${href}`;
        }
      }

      // Handle <img> tags
      if (node.tagName === "img" && node.properties?.src) {
        const src = node.properties.src as string;

        if (
          src.startsWith("/") &&
          !src.startsWith("//") &&
          !src.startsWith(baseUrl)
        ) {
          node.properties.src = `${baseUrl}${src}`;
        }
      }
    });
  };
}
