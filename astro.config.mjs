// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { wikilinks } from './src/plugins/wikilinks.ts';
import { links } from './src/plugins/links.ts';
import { toc } from './src/plugins/toc.ts';
import { highlights } from './src/plugins/highlights.ts';
import { removeTitle } from './src/plugins/removeTitle.ts';
import { marginalia } from './src/plugins/marginalia.ts';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkSmartyPants from 'remark-smartypants';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeCallouts from 'rehype-callouts';
import rehypeCitation from 'rehype-citation';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { visit } from 'unist-util-visit';
import { config } from './src/config.ts';

// https://astro.build/config
export default defineConfig({
  site: config.baseUrl,
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      useDarkModeMediaQuery: false,
      themeCssRoot: ':root',
      themeCssSelector: (theme) => {
        return `[data-theme='${theme.type}']`;
      },
      defaultProps: {
        // @ts-expect-error - showLineNumbers property doesn't exist in type definition
        showLineNumbers: false,
      },
    }),
    tailwind({ applyBaseStyles: false }), // Let shadcn handle base styles
    react(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkGfm, // GitHub Flavored Markdown (tables, task lists, strikethrough, autolinks)
      // @ts-expect-error - Conditional spread type issue
      ...(config.gfm?.enableSmartyPants ? [remarkSmartyPants] : []),
      // @ts-expect-error - Plugin type incompatibility
      wikilinks, // Must come after GFM to preserve graph functionality
      // @ts-expect-error - Plugin type incompatibility
      removeTitle, // Remove duplicate h1 if it matches frontmatter title
      // @ts-expect-error - Plugin type incompatibility
      highlights, // Convert ==text== to <mark>
      // @ts-expect-error - Plugin array type incompatibility
      [marginalia, { enable: config.marginalia?.enable ?? true }], // Parse {{marginalia}} syntax
      // @ts-expect-error - Plugin type incompatibility
      toc,
    ],
    rehypePlugins: [
      [rehypeKatex, { output: 'html' }],
      // Add IDs to headings for linking
      rehypeSlug,
      // Add anchor links to headings (if enabled)
      // @ts-expect-error - Conditional spread type issue
      ...(config.gfm?.linkHeadings ? [
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'wrap',
            properties: {
              'data-no-popover': true,
            },
          },
        ],
      ] : []),
      // @ts-expect-error - Plugin array type incompatibility
      [rehypeCallouts, { theme: 'obsidian' }], // Obsidian-style callouts
      // @ts-expect-error - Plugin type incompatibility
      rehypeRaw, // Process raw HTML from remark plugins AFTER callouts
      // @ts-expect-error - Rehype plugin types are incompatible with Astro's type definitions
      links,
      // Citations - conditionally enabled
      // @ts-expect-error - Rehype plugin types are incompatible with Astro's type definitions
      ...(config.citations?.enable ? [
        [
          rehypeCitation,
          {
            bibliography: config.citations.bibliographyFile,
            suppressBibliography: config.citations.suppressBibliography,
            linkCitations: config.citations.linkCitations,
            csl: config.citations.csl,
            lang: config.locale,
          },
        ],
        // Add data-no-popover to citation links to prevent preview popover
        // @ts-expect-error - Tree parameter type cannot be annotated in .mjs file
        () => (tree) => {
          visit(tree, 'element', (node) => {
            if (node.tagName === 'a' && node.properties?.href?.startsWith('#bib')) {
              node.properties['data-no-popover'] = true;
            }
          });
        },
      ] : []),
    ],
    syntaxHighlight: false, // Disable Astro's default syntax highlighting
  },
});
