---
title: About Ametrine
description: What Ametrine is and how it works
tags: [meta]
date: 2025-11-13
---

# Ametrine

Ametrine is a static site generator template for digital gardens and personal knowledge bases. It's built with Astro and processes Obsidian-compatible markdown files.

## What it does

Takes a folder of markdown files and generates a website with:

- **Wikilinks** - `[[Link Name]]` syntax for connecting notes
- **Backlinks** - Shows which pages link to the current page
- **Graph view** - Visual representation of how notes connect
- **Search** - Find content across all notes
- **Tags** - Organize and filter by topics

## How it works

1. Write notes in markdown (compatible with Obsidian)
2. Run the build process
3. Deploy the generated static site

The template handles converting wikilinks to proper HTML links, building the connection graph, generating backlinks, and creating a searchable index.

## Use cases

- Personal wiki or knowledge base
- Documentation site
- Research notes
- Learning journal
- Project documentation

## Technical stack

- **Astro** - Static site framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **Remark/Rehype** - Markdown processing
- **D3.js** - Graph visualization

See [[Quick Start]] for setup instructions.
