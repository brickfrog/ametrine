import { defineCollection, z } from "astro:content";

const vault = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      publish: z.boolean().optional(),
      date: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      author: z.string().optional(),
      links: z.array(z.string()).default([]),
      aliases: z.array(z.string()).default([]),
    })
    .passthrough(),
});

export const collections = { vault };
