import { defineCollection, z } from "astro:content";
import type { Loader } from "astro/loaders";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { load as yamlLoad } from "js-yaml";

const vaultLoader: Loader = {
  name: "vault-loader",
  load: async ({ store, parseData, generateDigest, logger }) => {
    const vaultPath = "./src/content/vault";
    store.clear();

    let fileCount = 0;
    let skipCount = 0;

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
          try {
            const contents = await readFile(fullPath, "utf-8");
            const id = relative(vaultPath, fullPath)
              .replace(/\\/g, "/")
              .replace(/\.mdx?$/, "");

            // Extract frontmatter manually
            const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
            let data: any = {};
            let body = contents;

            if (frontmatterMatch) {
              try {
                data = (yamlLoad(frontmatterMatch[1]) as object) || {};
                body = contents.slice(frontmatterMatch[0].length).trim();
              } catch (_error) {
                logger.warn(`Skipping file with bad YAML: ${entry.name}`);
                skipCount++;
                continue;
              }
            }

            // Generate title from filename if not provided or empty
            if (
              !data.title ||
              (typeof data.title === "string" && data.title.trim() === "")
            ) {
              const filename = id.split("/").pop() || id;
              data.title = filename;
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

            // Remove file:// and zotero:// links from body
            body = body.replace(/\[([^\]]+)\]\(<file:\/\/[^>]+>\)/g, "");
            body = body.replace(/\[([^\]]+)\]\(zotero:\/\/[^)]+\)/g, "");
            body = body.replace(/file:\/\/[^\s)]+/g, "");
            body = body.replace(/zotero:\/\/[^\s)]+/g, "");

            const digest = generateDigest(contents);
            const parsedData = await parseData({ id, data });

            store.set({
              id,
              data: parsedData,
              body,
              digest,
            });
            fileCount++;
          } catch (err) {
            logger.warn(`Error loading ${entry.name}: ${err}`);
            skipCount++;
          }
        }
      }
    }

    await loadDir(vaultPath);
    logger.info(
      `[vault-loader] Loaded ${fileCount} files, skipped ${skipCount}`,
    );
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
      created: z.coerce.date().optional(),
      date: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
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
