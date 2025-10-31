import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import type { VFile } from "vfile";

/**
 * Slugify a URL path for consistent link tracking
 */
function simplifySlug(url: string): string {
  // Remove leading slash
  let slug = url.replace(/^\/+/, "");
  // Remove anchor
  slug = slug.split("#")[0];
  // Remove trailing index or slash
  slug = slug.replace(/\/index$/, "").replace(/\/$/, "");
  return slug || "index";
}

/**
 * Check if URL is absolute
 */
function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith("//");
}

export interface LinkCrawlerOptions {
  /** Add external link icons */
  externalLinkIcon?: boolean;
  /** Open external links in new tab */
  openLinksInNewTab?: boolean;
}

const defaultOptions: LinkCrawlerOptions = {
  externalLinkIcon: true,
  openLinksInNewTab: false,
};

/**
 * Rehype plugin to crawl all links and track relationships
 */
export function links(options: LinkCrawlerOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return function transformer(tree: Root, file: VFile) {
    const outgoing: Set<string> = new Set();

    visit(tree, "element", (node: Element) => {
      // Process anchor tags
      if (
        node.tagName === "a" &&
        node.properties &&
        typeof node.properties.href === "string"
      ) {
        const href = node.properties.href;
        const classes = Array.isArray(node.properties.className)
          ? [...node.properties.className]
          : node.properties.className
            ? [node.properties.className as string]
            : [];

        const isExternal = isAbsoluteUrl(href);

        // Add appropriate class
        classes.push(isExternal ? "external" : "internal");
        node.properties.className = classes;

        // Add external link icon if needed
        if (isExternal && opts.externalLinkIcon) {
          node.children.push({
            type: "element",
            tagName: "svg",
            properties: {
              "aria-hidden": "true",
              class: "external-icon inline-block w-3 h-3 ml-1",
              viewBox: "0 0 512 512",
              fill: "currentColor",
            },
            children: [
              {
                type: "element",
                tagName: "path",
                properties: {
                  d: "M320 0H288V64h32 82.7L201.4 265.4 178.7 288 224 333.3l22.6-22.6L448 109.3V192v32h64V192 32 0H480 320zM32 32H0V64 480v32H32 456h32V480 352 320H424v32 96H64V96h96 32V32H160 32z",
                },
                children: [],
              },
            ],
          });
        }

        // Open external links in new tab
        if (isExternal && opts.openLinksInNewTab) {
          node.properties.target = "_blank";
          node.properties.rel = "noopener noreferrer";
        }

        // Track internal links
        if (!isExternal && !href.startsWith("#")) {
          const slug = simplifySlug(href);
          outgoing.add(slug);
        }
      }
    });

    // Merge with links from remarkWikilinks
    const existingLinks = (file.data.links as string[]) || [];
    const allLinks = [...new Set([...existingLinks, ...outgoing])];
    file.data.links = allLinks;

    return tree;
  };
}

export default links;

// Extend VFile data type
declare module "vfile" {
  interface DataMap {
    links?: string[];
  }
}
