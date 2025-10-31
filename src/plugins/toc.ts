import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import Slugger from "github-slugger";
import type { Root } from "mdast";
import type { VFile } from "vfile";

export interface TocEntry {
  depth: number;
  text: string;
  slug: string;
}

export interface TableOfContentsOptions {
  maxDepth?: 1 | 2 | 3 | 4 | 5 | 6;
  minEntries?: number;
  showByDefault?: boolean;
  collapseByDefault?: boolean;
}

const defaultOptions: Required<TableOfContentsOptions> = {
  maxDepth: 3,
  minEntries: 1,
  showByDefault: true,
  collapseByDefault: false,
};

export function toc(userOpts: TableOfContentsOptions = {}) {
  const opts = { ...defaultOptions, ...userOpts };

  return function transformer(tree: Root, file: VFile) {
    const slugger = new Slugger();
    const toc: TocEntry[] = [];
    let highestDepth: number = opts.maxDepth;

    visit(tree, "heading", (node: any) => {
      if (node.depth <= opts.maxDepth) {
        const text = toString(node);
        highestDepth = Math.min(highestDepth, node.depth);
        toc.push({
          depth: node.depth,
          text,
          slug: slugger.slug(text),
        });
      }
    });

    // Always store TOC data, even if empty
    if (!file.data.astro) {
      file.data.astro = {};
    }
    if (!file.data.astro.frontmatter) {
      file.data.astro.frontmatter = {};
    }

    if (toc.length > 0 && toc.length >= opts.minEntries) {
      // Normalize depths to start from 0
      const normalizedToc = toc.map((entry) => ({
        ...entry,
        depth: entry.depth - highestDepth,
      }));

      file.data.astro.frontmatter.toc = normalizedToc;
      file.data.astro.frontmatter.collapseToc = opts.collapseByDefault;
    } else {
      // Ensure toc is explicitly set to empty array if no entries
      file.data.astro.frontmatter.toc = [];
    }

    return tree;
  };
}

// Extend VFile data types
declare module "vfile" {
  interface DataMap {
    toc?: TocEntry[];
    collapseToc?: boolean;
  }
}
