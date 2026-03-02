# Ametrine

Astro 5 digital garden with wikilinks, backlinks, D3 graph, and full-text search. Content lives in `src/content/vault/` as Markdown files processed by a custom vault loader.

## Rules

- DO NOT put implementation details into names. Names describe what, not how. `getUserPreferences()` not `getCachedUserPreferencesFromLocalStorage()`.
- Before running `bun run dev`, verify the server is not already running: `lsof -i :4321`. Do not start a second instance.

## Stack

- **Runtime/PM**: Bun
- **Framework**: Astro 5 (SSG, custom content loader)
- **Language**: TypeScript strict mode
- **UI**: React 19, Tailwind CSS 3, CVA for variants
- **Content**: Markdown + gray-matter frontmatter, remark/rehype pipeline
- **Testing**: Vitest (co-located `*.test.ts` files)
- **Linting**: oxlint + oxfmt (not ESLint, not Prettier)

## Commands

```bash
bun run dev          # dev server at localhost:4321 (check first!)
bun run build        # production build + validation
bun run verify       # format:check + lint + lint:markdown + test + astro check (runs on pre-commit)
bun run test         # vitest once
bun run lint         # oxlint (skips .astro files)
bun run format       # oxfmt src/
bun run check        # astro type check
```

Pre-commit hook runs `bun run verify` automatically via Husky. All checks must pass.

## Content System

Vault notes live in `src/content/vault/`. The custom loader in `src/content/config.ts` handles:
- Two-pass loading: collects all slugs first, then renders (so wikilinks resolve correctly)
- Slug generation via `slugifyPath` — lowercase, no spaces
- Date resolution: frontmatter > git log > filesystem mtime
- Wikilink extraction: auto-populates `links` field from `[[...]]` syntax

### Frontmatter schema

```yaml
title: string          # auto-generated from filename if absent
description: string    # optional
tags: [tag, sub/tag]   # hierarchical — "a/b" expands to ["a/b", "a"]
draft: false           # hides from public listing when true
aliases: [alt-name]    # alternate slugs for wikilink resolution
author: string         # optional
```

Do not manually set `created`, `modified`, or `links` — these are resolved automatically.

Schema uses `.passthrough()` so arbitrary frontmatter is preserved.

### Wikilinks

- Syntax: `[[Page Name]]` or `[[Page Name#heading]]` or `[[Page Name|display text]]`
- Resolution is case-insensitive; slugs are always lowercase
- Transclusion: `![[Note Name]]` embeds note content inline
- Implementation: `src/utils/wikilinks.ts`, `src/plugins/wikilinks.ts`

## Plugin Pipeline

Plugins are in `src/plugins/`. The pipeline runs:

1. Remark plugins (markdown AST) — added to `remarkPlugins` in `astro.config.mjs`
2. Rehype plugins (HTML AST) — added to `rehypePlugins` in `astro.config.mjs`

Custom plugins export a default function or named function, optionally accepting an options object typed with a TypeScript interface.

## Key Directories

```
src/
  components/        # Astro components
  components/react/  # React components (.tsx)
  content/vault/     # Markdown notes (user content)
  content/config.ts  # Vault loader + Zod schema
  plugins/           # Remark/Rehype plugins
  utils/             # Shared utilities
  stores/            # Nanostores global state
  config.ts          # Site config (single source of truth)
  pages/             # Routes and API endpoints
```

## Testing

Tests are co-located: `src/utils/foo.test.ts` alongside `src/utils/foo.ts`. Vitest has a module alias `astro:content` → `src/test-utils/astro-mocks.ts` to handle Astro's virtual modules.
