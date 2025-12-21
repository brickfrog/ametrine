import { defineCollection, z } from "astro:content";
import type { Loader } from "astro/loaders";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, basename } from "node:path";
import { load as yamlLoad } from "js-yaml";
import { config } from "../config.ts";
import { slugifyPath } from "../utils/slugify";
import { buildSlugMap, slugMap } from "../utils/slugMap";
import { resolveDates } from "../utils/resolveDates";
import {
  extractWikilinkTargets,
  resolveWikilinkTarget,
} from "../utils/wikilinks";
import {
  parseNotebook,
  extractFrontmatter,
  extractNotebookLinks,
  renderNotebook,
} from "../utils/notebook";

// Media file extensions to skip when extracting transclusion dependencies
const MEDIA_EXTENSIONS =
  /\.(png|jpg|jpeg|gif|webp|svg|avif|bmp|mp4|webm|ogv|mov|mkv|mp3|wav|ogg|m4a|flac|pdf)$/i;

/** Extract note transclusion targets from markdown body (skips media embeds) */
function extractTransclusions(body: string): string[] {
  const regex = /!\[\[([^[\]|#\\]+)/g;
  const results: string[] = [];
  let match;
  while ((match = regex.exec(body)) !== null) {
    const target = match[1]?.trim();
    if (target && !MEDIA_EXTENSIONS.test(target)) {
      const resolved = resolveWikilinkTarget(target, slugMap);
      if (resolved) {
        results.push(resolved);
      }
    }
  }
  return results;
}

/** Process a single markdown file and add/update it in the store */
async function processMarkdownFile(
  fullPath: string,
  vaultPath: string,
  store: any,
  parseData: any,
  generateDigest: any,
  renderMarkdown: any,
  logger: any,
): Promise<boolean> {
  try {
    const contents = await readFile(fullPath, "utf-8");
    const filename = basename(fullPath);
    const id = slugifyPath(
      relative(vaultPath, fullPath)
        .replace(/\\/g, "/")
        .replace(/\.mdx?$/, ""),
    );

    // Extract frontmatter manually
    const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
    let data: any = {};
    let body = contents;

    if (frontmatterMatch) {
      try {
        data = (yamlLoad(frontmatterMatch[1]) as object) || {};
        body = contents.slice(frontmatterMatch[0].length).trim();
      } catch {
        logger.warn(`Skipping file with bad YAML: ${filename}`);
        return false;
      }
    }

    // Generate title from filename if not provided or empty
    if (
      !data.title ||
      (typeof data.title === "string" && data.title.trim() === "")
    ) {
      data.title = filename.replace(/\.mdx?$/, "");
    }

    // Expand hierarchical tags (e.g., "systems/networking" → ["systems/networking", "systems"])
    if (data.tags && Array.isArray(data.tags)) {
      const expandedTags = new Set<string>();

      for (const tag of data.tags) {
        if (typeof tag === "string") {
          expandedTags.add(tag); // Keep original tag

          // Add all parent levels
          const parts = tag.split("/");
          for (let i = 1; i < parts.length; i++) {
            expandedTags.add(parts.slice(0, i).join("/"));
          }
        }
      }

      data.tags = Array.from(expandedTags);
    }

    // Extract wikilinks from body and add to data.links if not already in frontmatter
    if (!data.links || (Array.isArray(data.links) && data.links.length === 0)) {
      data.links = extractWikilinkTargets(body, slugMap);
    }

    // Remove file:// and zotero:// links from body
    body = body.replace(/\[([^\]]+)\]\(<file:\/\/[^>]+>\)/g, "");
    body = body.replace(/\[([^\]]+)\]\(zotero:\/\/[^)]+\)/g, "");
    body = body.replace(/file:\/\/[^\s)]+/g, "");
    body = body.replace(/zotero:\/\/[^\s)]+/g, "");

    // Resolve dates from frontmatter > git > filesystem
    const resolvedDates = await resolveDates({
      frontmatter: {
        created: data.created,
        date: data.date,
        updated: data.updated,
        modified: data.modified,
        lastmod: data.lastmod,
      },
      filePath: fullPath,
    });
    data.created = resolvedDates.created;
    data.modified = resolvedDates.modified;

    const digest = generateDigest(contents);
    const parsedData = await parseData({ id, data });

    // Render markdown content
    const rendered = await renderMarkdown(body);

    store.set({
      id,
      data: parsedData,
      body,
      rendered,
      digest,
    });
    return true;
  } catch (err) {
    logger.warn(`Error loading ${fullPath}: ${err}`);
    return false;
  }
}

/** Process a single notebook file and add/update it in the store */
async function processNotebookFile(
  fullPath: string,
  vaultPath: string,
  store: any,
  parseData: any,
  generateDigest: any,
  logger: any,
): Promise<boolean> {
  try {
    const contents = await readFile(fullPath, "utf-8");
    const filename = basename(fullPath);
    const id = slugifyPath(
      relative(vaultPath, fullPath)
        .replace(/\\/g, "/")
        .replace(/\.ipynb$/, ""),
    );

    // Parse notebook JSON
    const notebook = parseNotebook(contents);

    // Extract frontmatter from notebook metadata
    const frontmatter = extractFrontmatter(notebook, filename);
    const data: any = {
      title: frontmatter.title,
      description: frontmatter.description,
      tags: frontmatter.tags || [],
      draft: frontmatter.draft ?? false,
      author: frontmatter.author,
      aliases: frontmatter.aliases || [],
      type: "notebook", // Mark as notebook for UI badges
    };

    // Expand hierarchical tags
    if (data.tags && Array.isArray(data.tags)) {
      const expandedTags = new Set<string>();
      for (const tag of data.tags) {
        if (typeof tag === "string") {
          expandedTags.add(tag);
          const parts = tag.split("/");
          for (let i = 1; i < parts.length; i++) {
            expandedTags.add(parts.slice(0, i).join("/"));
          }
        }
      }
      data.tags = Array.from(expandedTags);
    }

    // Extract wikilinks from markdown cells
    data.links = extractNotebookLinks(notebook, slugMap);

    // Resolve dates from frontmatter > git > filesystem
    const resolvedDates = await resolveDates({
      frontmatter: {
        created: frontmatter.created
          ? new Date(frontmatter.created)
          : undefined,
        modified: frontmatter.modified
          ? new Date(frontmatter.modified)
          : undefined,
      },
      filePath: fullPath,
    });
    data.created = resolvedDates.created;
    data.modified = resolvedDates.modified;

    // Render notebook to HTML
    const { html } = await renderNotebook(notebook);

    const digest = generateDigest(contents);
    const parsedData = await parseData({ id, data });

    store.set({
      id,
      data: parsedData,
      body: contents, // Store raw JSON for potential re-processing
      rendered: { html },
      digest,
    });
    return true;
  } catch (err) {
    logger.warn(`Error loading notebook ${fullPath}: ${err}`);
    return false;
  }
}

const vaultLoader: Loader = {
  name: "vault-loader",
  load: async ({
    store,
    parseData,
    generateDigest,
    logger,
    renderMarkdown,
    watcher,
  }) => {
    const vaultPath = `./src/content/${config.vaultName || "vault"}`;
    store.clear();

    let fileCount = 0;
    let skipCount = 0;

    // PASS 1: Collect all file IDs for slug map
    const fileIds: Array<{ id: string; fullPath: string; entry: any }> = [];

    async function collectFiles(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          if (!entry.name.startsWith(".")) {
            await collectFiles(fullPath);
          }
        } else if (
          stats.isFile() &&
          (entry.name.endsWith(".md") ||
            entry.name.endsWith(".mdx") ||
            entry.name.endsWith(".ipynb"))
        ) {
          const ext = entry.name.endsWith(".ipynb") ? /\.ipynb$/ : /\.mdx?$/;
          const id = slugifyPath(
            relative(vaultPath, fullPath).replace(/\\/g, "/").replace(ext, ""),
          );
          fileIds.push({ id, fullPath, entry });
        }
      }
    }

    await collectFiles(vaultPath);

    // Build slug map before rendering
    buildSlugMap(fileIds, logger);

    // Store on globalThis so wikilinks plugin can access it
    (globalThis as any).__ametrineSlugMap = fileIds.map((f) => ({ id: f.id }));
    logger.info(`[vault-loader] Stored ${fileIds.length} slugs on globalThis`);

    // Initialize content map for transclusion
    const contentMap = new Map<string, { title: string; body: string }>();
    (globalThis as any).__ametrineContentMap = contentMap;

    // Transclusion dependency tracking: targetSlug -> Set of slugs that transclude it
    const transcludeDeps = new Map<string, Set<string>>();
    // Mapping from slug to full path for resolving dependents
    const idToPath = new Map<string, string>();

    // Pre-populate content map with raw bodies for transclusion
    for (const { id, fullPath } of fileIds) {
      idToPath.set(id, fullPath);
      try {
        const contents = await readFile(fullPath, "utf-8");
        const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
        let data: any = {};
        let body = contents;

        if (frontmatterMatch) {
          try {
            data = (yamlLoad(frontmatterMatch[1]) as object) || {};
            body = contents.slice(frontmatterMatch[0].length).trim();
          } catch {
            continue; // Skip files with bad YAML
          }
        }

        const title = data.title || basename(fullPath).replace(/\.mdx?$/, "");
        contentMap.set(id, { title, body });

        // Build transclusion dependency map
        for (const target of extractTransclusions(body)) {
          if (!transcludeDeps.has(target)) {
            transcludeDeps.set(target, new Set());
          }
          transcludeDeps.get(target)!.add(id);
        }
      } catch {
        // Skip files that can't be read
      }
    }
    logger.info(
      `[vault-loader] Pre-populated content map with ${contentMap.size} entries`,
    );
    logger.info(
      `[vault-loader] Built transclusion dependency map with ${transcludeDeps.size} targets`,
    );

    // PASS 2: Process all files with rendering
    async function loadDir(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          if (!entry.name.startsWith(".")) {
            await loadDir(fullPath);
          }
        } else if (
          stats.isFile() &&
          (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
        ) {
          const success = await processMarkdownFile(
            fullPath,
            vaultPath,
            store,
            parseData,
            generateDigest,
            renderMarkdown,
            logger,
          );
          if (success) {
            fileCount++;
          } else {
            skipCount++;
          }
        } else if (stats.isFile() && entry.name.endsWith(".ipynb")) {
          const success = await processNotebookFile(
            fullPath,
            vaultPath,
            store,
            parseData,
            generateDigest,
            logger,
          );
          if (success) {
            fileCount++;
          } else {
            skipCount++;
          }
        }
      }
    }

    await loadDir(vaultPath);
    logger.info(
      `[vault-loader] Loaded ${fileCount} files, skipped ${skipCount}`,
    );

    // Watch for file changes in dev mode
    if (watcher) {
      const watchGlob = `${vaultPath}/**/*.{md,mdx,ipynb,base,canvas}`;
      watcher.add(watchGlob);
      logger.info(`[vault-loader] Watching ${watchGlob} for changes`);

      // Handle file changes by re-processing the changed file and its dependents
      watcher.on("change", async (changedPath: string) => {
        // Handle notebook files separately
        if (changedPath.endsWith(".ipynb")) {
          logger.info(
            `[vault-loader] Reloading changed notebook: ${changedPath}`,
          );
          await processNotebookFile(
            changedPath,
            vaultPath,
            store,
            parseData,
            generateDigest,
            logger,
          );
          return;
        }

        // Only handle markdown files (canvas/base handled elsewhere)
        if (!changedPath.match(/\.mdx?$/)) return;

        const changedSlug = slugifyPath(
          relative(vaultPath, changedPath)
            .replace(/\\/g, "/")
            .replace(/\.mdx?$/, ""),
        );

        // Update content map with new body
        try {
          const contents = await readFile(changedPath, "utf-8");
          const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
          let data: any = {};
          let body = contents;

          if (frontmatterMatch) {
            try {
              data = (yamlLoad(frontmatterMatch[1]) as object) || {};
              body = contents.slice(frontmatterMatch[0].length).trim();
            } catch {
              // Bad YAML, skip content map update
            }
          }

          const title =
            data.title || basename(changedPath).replace(/\.mdx?$/, "");
          contentMap.set(changedSlug, { title, body });

          // Update transclusion dependencies for this file
          // First, remove old dependencies
          for (const [_target, deps] of transcludeDeps) {
            deps.delete(changedSlug);
          }
          // Then add new dependencies
          for (const target of extractTransclusions(body)) {
            if (!transcludeDeps.has(target)) {
              transcludeDeps.set(target, new Set());
            }
            transcludeDeps.get(target)!.add(changedSlug);
          }
        } catch {
          // Failed to read, continue anyway
        }

        // Reprocess the changed file
        logger.info(`[vault-loader] Reloading changed file: ${changedPath}`);
        await processMarkdownFile(
          changedPath,
          vaultPath,
          store,
          parseData,
          generateDigest,
          renderMarkdown,
          logger,
        );

        // Reprocess files that transclude this file
        const dependents = transcludeDeps.get(changedSlug);
        if (dependents && dependents.size > 0) {
          logger.info(
            `[vault-loader] Cascading to ${dependents.size} files that transclude ${changedSlug}`,
          );
          for (const depId of dependents) {
            const depPath = idToPath.get(depId);
            if (depPath) {
              await processMarkdownFile(
                depPath,
                vaultPath,
                store,
                parseData,
                generateDigest,
                renderMarkdown,
                logger,
              );
            }
          }
        }
      });
    }
  },
};

const vault = defineCollection({
  loader: vaultLoader,
  schema: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z
        .union([z.array(z.string()), z.string()])
        .optional()
        .default([]),
      draft: z.boolean().optional().default(false),
      publish: z.boolean().optional(),
      // Date fields - resolved automatically from frontmatter > git > filesystem
      created: z.coerce.date().optional(),
      date: z.coerce.date().optional(), // Alias for created
      modified: z.coerce.date().optional(),
      updated: z.coerce.date().optional(), // Alias for modified
      lastmod: z.coerce.date().optional(), // Alias for modified
      author: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
      links: z
        .union([z.array(z.string()), z.string()])
        .optional()
        .default([]),
      aliases: z
        .union([z.array(z.string()), z.string()])
        .optional()
        .default([]),
    })
    .passthrough()
    .transform((data) => {
      // Normalize tags to array
      if (typeof data.tags === "string") {
        data.tags = [data.tags];
      }

      // Normalize links to array
      if (typeof data.links === "string") {
        data.links = [data.links];
      }

      // Normalize aliases to array
      if (typeof data.aliases === "string") {
        data.aliases = [data.aliases];
      }

      return data;
    }),
});

export const collections = { vault };
