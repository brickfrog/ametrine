# new-note

Create a new vault note in this digital garden.

## Description

Scaffolds a new Markdown note in `src/content/vault/` with correct frontmatter for the ametrine content schema. Use when asked to create a note, page, or entry in the vault.

## Instructions

1. Determine the file path within `src/content/vault/`. Subdirectories are fine (e.g., `src/content/vault/math/calculus.md`). The slug is derived from the relative path — lowercase, hyphens for spaces.

2. Create the file with this frontmatter:

```markdown
---
title: Note Title
description: One-sentence summary (optional but encouraged)
tags: []
draft: false
---

Content here.
```

3. Frontmatter rules:
   - `title` — required; will be auto-generated from filename if absent, but set it explicitly
   - `description` — optional; used in search results and OG metadata
   - `tags` — array of strings; supports hierarchy with `/` (e.g. `math/calculus` expands to both `math/calculus` and `math`)
   - `draft: true` — hides from public listing; use for work-in-progress
   - `aliases` — array of alternate names for wikilink resolution; add only if needed
   - **Do not set** `created`, `modified`, or `links` — these are resolved automatically by the vault loader

4. Wikilinks within note body use `[[Page Name]]` syntax. The loader extracts these automatically into the `links` field. For anchors: `[[Page#heading]]`. For display text: `[[Page|label]]`. For transclusion (embed another note): `![[Note Name]]`.

5. After creating the file, verify it appears correctly by checking `bun run check` (type check) and `bun run build` if a full validation is needed.
