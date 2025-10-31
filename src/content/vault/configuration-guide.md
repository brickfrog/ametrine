---
title: Configuration Guide
description: Complete guide to customizing Ametrine via config.ts
tags: [guide, configuration, technical]
date: 2025-10-30
---

# Configuration Guide

This guide covers every configuration option available in `src/config.ts`. All settings are optional unless marked as required.

> [!tip] Live Changes
> After changing `config.ts`, the dev server will automatically reload to apply your changes.

## File Location

The main configuration file is located at:
```
src/config.ts
```

## Site Settings

### Basic Information

```typescript
export const config: SiteConfig = {
  pageTitle: "Ametrine",        // Site title
  pageTitleSuffix: "",          // Optional suffix for page titles
  defaultDescription: "A digital garden built with Ametrine",
  locale: "en-US",              // Date/UI locale (e.g., "en-US", "fr-FR")
  baseUrl: undefined,           // Base URL for absolute links (RSS, OG images)
}
```

The `pageTitle` appears in:
- Browser tab title
- Social media shares {{When no page-specific title is set}}
- Search engine results

The `baseUrl` should be set to enable:
- RSS feed generation
- OG image absolute URLs
- Proper sitemap URLs

### Logo Configuration

```typescript
logo: "/ametrine.png",      // Path relative to public/ folder
logoAlt: "Ametrine",        // Alt text for accessibility
```

Place your logo file in the `public/` directory. The current template uses:
- Logo file: `public/ametrine.png`
- Config: `logo: "/ametrine.png"`

## Feature Toggles

### SPA Mode

Enable single-page application navigation for faster transitions:

```typescript
enableSPA: true  // Default: true
```

When enabled:
- Page transitions are instant
- Browser back/forward works smoothly
- Entire site loads on first visit {{Increases initial load, faster subsequent navigation}}

### Link Preview Popovers

```typescript
enablePopovers: true  // Default: true
```

When enabled, hovering over internal links shows a preview popup. Configure popover behavior:

```typescript
popover: {
  enable: true,              // Master toggle
  hoverDelay: 300,           // Milliseconds before popup appears
  defaultSize: {             // Initial popup dimensions
    width: 560,
    height: 380
  },
  minSize: {                 // Minimum resizable dimensions
    width: 320,
    height: 240
  },
  showFullContent: true,     // Show complete note content
  cacheContent: true,        // Cache loaded content for performance
}
```

> [!note] Touch Devices
> Popovers are automatically disabled on touch devices to avoid conflicts with touch navigation.

## Theme Customization

### Typography

```typescript
theme: {
  typography: {
    header: "Schibsted Grotesk",  // Headings font
    body: "Source Sans Pro",       // Body text font
    code: "IBM Plex Mono",         // Code font
  }
}
```

To use custom fonts:
1. Add font files to `public/fonts/`
2. Define `@font-face` in `src/styles/custom.css`
3. Reference font name in config

### Colors

Define colors for light and dark modes. Here are the default Ametrine colors:

```typescript
theme: {
  colors: {
    lightMode: {
      light: "#faf8f8",        // Background
      lightgray: "#e5e5e5",    // Borders, subtle UI
      gray: "#b8b8b8",         // Secondary text
      darkgray: "#4e4e4e",     // Primary text
      dark: "#2b2b2b",         // Headings
      secondary: "#b8860b",    // Links, accents (dark gold)
      tertiary: "#daa520",     // Tags, badges (goldenrod)
      highlight: "rgba(184, 134, 11, 0.15)",  // Highlight areas
      textHighlight: "#b8860b88" // ==highlight== background
    },
    darkMode: {
      light: "#1a1625",        // Background (deep purple)
      lightgray: "#2d2640",    // Borders
      gray: "#6b5f7a",         // Secondary text
      darkgray: "#c9b8d4",     // Primary text
      dark: "#e8e0f0",         // Headings
      secondary: "#9d7bd8",    // Links (purple)
      tertiary: "#c084fc",     // Tags (bright purple)
      highlight: "rgba(157, 123, 216, 0.15)",
      textHighlight: "#c084fc88"
    }
  }
}
```

> [!warning] Color Format
> Use hex colors with optional alpha channel: `#RRGGBB` or `#RRGGBBAA`.

## Analytics Integration

Track visitor analytics with your preferred provider:

### Plausible

```typescript
analytics: {
  provider: "plausible",
  host: "https://plausible.io"  // Optional: self-hosted instance
}
```

### Google Analytics

```typescript
analytics: {
  provider: "google",
  tagId: "G-XXXXXXXXXX"
}
```

### Umami

```typescript
analytics: {
  provider: "umami",
  websiteId: "your-website-id",
  host: "https://analytics.umami.is"  // Your Umami instance
}
```

### Other Providers

Also supported: `goatcounter`, `posthog`, `vercel`.

To disable analytics (current default):
```typescript
analytics: null
```

## Footer Configuration

```typescript
footer: {
  copyright: "© {year} {siteName}",
  links: {
    github: "https://github.com/brickfrog/ametrine",
    // Add more links as needed
  }
}
```

Available placeholders in `copyright`:
- `{year}` - Current year
- `{siteName}` - Value of `pageTitle`

You can add any links you want:
```typescript
links: {
  github: "https://github.com/username/repo",
  twitter: "https://twitter.com/username",
  email: "mailto:your@email.com",
  custom: "https://your-site.com"
}
```

## Metadata Display

Control which metadata fields appear on each note:

```typescript
metadata: {
  show: true,                    // Master toggle for metadata display
  dateFormat: "MMMM d, yyyy",   // Date formatting (date-fns format)
  fields: [
    {
      key: "date",               // Frontmatter key
      label: "Published",        // Display label
      icon: "Calendar",          // Lucide icon name
      format: "date"             // "date" | "computed" | "text" | "list" | "number"
    },
    {
      key: "updated",
      label: "Updated",
      icon: "RefreshCw",
      format: "date"
    },
    {
      key: "author",
      label: "Author",
      icon: "User",
      format: "text"
    },
    {
      key: "readingTime",
      label: "Reading time",
      icon: "Clock",
      format: "computed"         // Auto-calculated fields
    },
    {
      key: "wordCount",
      label: "Word count",
      icon: "Hash",
      format: "computed"
    }
  ]
}
```

### Auto-Detection

Fields not in the config are still displayed with auto-detected icons:
- URLs → Link icon
- Arrays → List icon
- Dates → Calendar icon
- Booleans → Check/X icon
- Numbers → Hash icon

Example frontmatter that uses auto-detection:

```yaml
---
title: My Note
source_url: https://wikipedia.org  # Auto-detected as URL
priority: 5                         # Auto-detected as number
verified: true                      # Auto-detected as boolean
---
```

## Breadcrumbs

```typescript
breadcrumbs: {
  spacerSymbol: "❯",             // Separator between crumbs
  rootName: "Home",               // Label for root level
  resolveFrontmatterTitle: true,  // Use frontmatter title instead of filename
  showCurrentPage: true,          // Include current page in breadcrumbs
  hideOnRoot: true,               // Hide breadcrumbs on homepage
}
```

Example breadcrumb trail:
```
Home ❯ Guides ❯ Configuration Guide
```

## Content Filtering

### Ignore Patterns

Exclude files from being processed (current defaults):

```typescript
ignorePatterns: [
  "private",        // Private folder
  "templates",      // Template files
  ".obsidian"       // Obsidian settings
]
```

Supports glob patterns: `*`, `**`, `?`, `[abc]`, `{a,b,c}`

### Private Pages Mode

Control default visibility of notes:

```typescript
privatePages: {
  mode: "draft"  // "draft" | "publish"
}
```

**Draft mode** (current default):
- All notes are public by default
- Add `draft: true` in frontmatter to hide

**Publish mode**:
- All notes are private by default
- Add `publish: true` in frontmatter to show

## Feature-Specific Configuration

### Citations

Enable academic citations with BibTeX:

```typescript
citations: {
  enable: true,
  bibliographyFile: "./bibliography.bib",  // Path to .bib file
  suppressBibliography: true,              // Don't auto-generate bibliography
  linkCitations: false,                    // Make citations clickable
  csl: "apa"  // "apa" | "mla" | "chicago" | "vancouver" | "harvard1"
}
```

Use in notes:
```markdown
This is cited[@key2023].
```

You can also provide a custom CSL file path for citation styles.

### GitHub Flavored Markdown

```typescript
gfm: {
  enableSmartyPants: true,  // Smart quotes: "text" → "text"
  linkHeadings: true,        // Add anchor links to headings
}
```

When `linkHeadings` is enabled, headings get clickable `#` anchors.

### Marginalia

```typescript
marginalia: {
  enable: true,
  readerModeMaxWidth: 900  // Max content width when marginalia present
}
```

Learn more in [[Marginalia Demo]].

### Tags

```typescript
tags: {
  enable: true,           // Master toggle for tag functionality
  showInSidebar: false,   // Show tag list in sidebar
  showWithMetadata: true, // Show tags in note metadata
}
```

### Links and Context

```typescript
linksAndContext: {
  enable: true,              // Show related links and context
  showExternalLinks: true,   // Show outgoing external links
  showRelated: true,         // Show related notes (by tags)
  relatedLimit: 10,          // Max related notes to show
  fetchMetadata: false,      // Fetch OpenGraph for external links (slower)
}
```

> [!warning] Performance Note
> Setting `fetchMetadata: true` will slow down builds as it fetches OpenGraph data for all external links.

## OG Image Generation

Generate Open Graph images for social sharing:

```typescript
ogImage: {
  enable: true,
  width: 1200,              // Standard OG image width
  height: 630,              // Standard OG image height
  colorScheme: "darkMode",  // "lightMode" | "darkMode"
  includePaths: [           // Optional: only generate for these paths
    "blog/",
    "guides/"
  ],
  excludePaths: [           // Optional: skip these paths
    "private/",
    "drafts/"
  ]
}
```

Generated images appear at: `/og/[slug].png`

## Date Configuration

```typescript
defaultDateType: "modified"  // "created" | "modified" | "published"
```

Controls which date is used by default for:
- Sorting notes
- Activity heatmap
- Timeline views

## Example: Custom Configuration

Here's an example of how you might customize Ametrine:

```typescript
export const config: SiteConfig = {
  // Change site branding
  pageTitle: "My Knowledge Base",
  pageTitleSuffix: " | Personal Wiki",
  defaultDescription: "My personal digital garden and notes",

  // Use custom logo
  logo: "/my-logo.svg",
  logoAlt: "My Logo",

  // Set base URL for production
  baseUrl: "https://notes.yoursite.com",

  // Customize theme colors
  theme: {
    typography: {
      header: "Inter",
      body: "Inter",
      code: "JetBrains Mono"
    },
    colors: {
      lightMode: {
        light: "#ffffff",
        dark: "#1a1a1a",
        secondary: "#0066cc",
        // ... customize other colors
      },
      darkMode: {
        // ... customize dark mode
      }
    }
  },

  // Enable analytics
  analytics: {
    provider: "plausible"
  },

  // Adjust metadata display
  metadata: {
    show: true,
    dateFormat: "MMM d, yyyy",
    fields: [
      { key: "date", label: "Published", icon: "Calendar", format: "date" },
      { key: "tags", label: "Topics", icon: "Tag", format: "list" }
    ]
  },

  // Make all notes private by default
  privatePages: {
    mode: "publish"  // Require publish: true to show
  }
}
```

## Testing Your Configuration

After making changes:

1. **Check the dev server** - Watch for errors in terminal
2. **View in browser** - Verify changes look correct
3. **Test dark mode** - Toggle theme to check both modes
4. **Try a build** - Run `bun run build` to catch build-time issues

## Troubleshooting

### Colors Not Changing

- Clear browser cache
- Check hex format (`#RRGGBB`)
- Restart dev server

### Fonts Not Loading

- Verify font files are in `public/fonts/`
- Check `@font-face` declarations
- Inspect browser console for 404s

### Analytics Not Working

- Verify provider name matches exactly
- Check measurement ID format
- Allow time for data to appear (15-30 minutes)

### Logo Not Appearing

- Verify file exists in `public/` folder
- Check path starts with `/`
- Clear browser cache

## Next Steps

- [[Deployment Guide]] - Deploy your customized site
- [[Syntax Reference]] - Learn content formatting options
- [[Frontmatter Reference]] - Customize individual notes

See the TypeScript type definitions in `src/config.ts` for complete documentation of all options.
