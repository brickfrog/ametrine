---
title: Quick Start
description: Get your Ametrine digital garden running in 5 minutes
tags: [guide, setup, tutorial]
date: 2025-10-30
image: "/ametrine.png"
---

# Quick Start

Get your Ametrine digital garden up and running in just a few minutes.

## Prerequisites

You'll need:
- **Node.js** 18.14.1 or higher
- **npm**, **pnpm**, **yarn**, or **bun** package manager
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
# Clone the template
git clone https://github.com/yourusername/ametrine.git my-garden
cd my-garden

# Remove the template's git history
rm -rf .git
git init
```

### 2. Install Dependencies

Choose your preferred package manager:

```bash
# Using npm
npm install

# Using pnpm (recommended)
pnpm install

# Using yarn
yarn install

# Using bun
bun install
```

> [!tip] Package Manager Choice
> This guide uses `bun`, but you can use any package manager. Just replace `bun run` with `npm run`, `pnpm`, or `yarn`.

### 3. Start the Development Server

```bash
bun run dev
```

Open your browser to `http://localhost:4321` {{The port might be different if 4321 is already in use}}.

## Your First Note

### 1. Create a New File

Create a new markdown file in `src/content/vault/`:

```bash
touch src/content/vault/my-first-note.md
```

### 2. Add Frontmatter and Content

Open the file and add:

```markdown
---
title: My First Note
description: Testing out Ametrine features
tags: [test, personal]
date: 2025-10-30
---

# My First Note

This is my ==first note== in my digital garden!

I can link to other notes like [[documentation/index|the home page]].

> [!success] It Works!
> You're now running Ametrine successfully.
```

### 3. View Your Note

The dev server hot-reloads automatically. Visit:
`http://localhost:4321/my-first-note`

## Understanding the Structure

```
my-garden/
├── src/
│   ├── content/
│   │   └── notes/          # Your markdown notes go here
│   ├── config.ts           # Main configuration file
│   ├── components/         # UI components
│   ├── layouts/            # Page layouts
│   └── pages/              # Routes and API endpoints
├── public/                 # Static assets (images, etc.)
├── astro.config.mjs        # Astro configuration
└── package.json
```

> [!note] Content Organization
> You can create subfolders in `src/content/vault/` to organize your content. Ametrine will automatically discover all markdown files.

## Key Concepts

### Wikilinks

Link between notes using double brackets:

```markdown
`[[page-name]]`              # Links to page-name.md
`[[page-name|Display Text]]` # Custom link text
`[[page#section]]`           # Link to a specific section
```

Learn more in [[documentation/wikilinks-and-graph]].

### Frontmatter

Every note needs frontmatter with at least a `title`:

```yaml
---
title: Required Title
description: Optional description for SEO
tags: [topic1, topic2]
date: 2025-10-30
---
```

See all available fields in [[documentation/frontmatter-reference]].

### Graph Visualization

Press **Ctrl/Cmd+G** to open the global graph and see how your notes connect.

## Essential Features to Try

### 1. Highlights

Use `==double equals==` to ==highlight important text==.

### 2. Marginalia

Add side notes with `{{double curly braces}}` {{Like this!}}. See [[documentation/marginalia-demo]] for more examples.

### 3. Callouts

Create visually distinct blocks:

```markdown
> [!tip] Pro Tip
> Callouts support **markdown formatting**!
```

### 4. Search

Press **Cmd/Ctrl+K** to open the search dialog.

### 5. Backlinks

Every note automatically shows which other notes link to it.

## Customization

### Change Site Title and Description

Edit `src/config.ts`:

```typescript
export const siteConfig = {
  pageTitle: "My Digital Garden",
  defaultDescription: "My personal knowledge base",
  // ... more options
}
```

See [[documentation/configuration-guide]] for all available options.

### Change Colors

Modify the theme colors in `src/config.ts`:

```typescript
theme: {
  colors: {
    lightMode: {
      light: "#faf8f8",
      dark: "#141021",
      // ... more colors
    }
  }
}
```

### Add Your Logo

1. Place your logo in `public/`
2. Update `src/config.ts`:

```typescript
logo: {
  src: "/my-logo.png",
  alt: "My Logo"
}
```

## Next Steps

Now that you're set up, explore more features:

### For Writing Content
- [[documentation/wikilinks-and-graph]] - Master linking and navigation
- [[documentation/obsidian-features-demo]] - Learn content formatting
- [[documentation/marginalia-demo]] - Add side notes
- [[documentation/syntax-reference]] - Quick reference guide

### For Customization
- [[documentation/configuration-guide]] - Complete config options
- [[documentation/deployment-guide]] - Deploy your site
- [[documentation/frontmatter-reference]] - All metadata fields

### For Exploration
- Press **Ctrl/Cmd+G** to open the graph
- Press **Ctrl/Cmd+K** to search
- Click the theme toggle for dark mode
- Hover over links to preview pages {{If popovers are enabled}}

## Common Issues

### Port Already in Use

If port 4321 is taken, Astro will automatically use the next available port. Check the terminal output for the actual URL.

### Notes Not Showing Up

Make sure:
1. Files are in `src/content/vault/`
2. Files have `.md` extension
3. Frontmatter includes at least `title`
4. The dev server is running

### Wikilinks Not Working

Check that:
1. The target file exists in `src/content/vault/`
2. You're using the correct syntax: `[[Page Name]]`
3. The file name matches (case-insensitive)

## Getting Help

- Check the [[documentation/index|documentation]]
- Review [[documentation/configuration-guide]] for setup issues
- Explore [[documentation/syntax-reference]] for formatting questions

Happy gardening!
