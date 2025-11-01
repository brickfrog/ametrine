# Ametrine Features Inventory

Complete list of implemented and missing features for the Ametrine digital garden system.

## Implemented Features

### Content Discovery & Navigation ✅

#### Tag System (FULLY IMPLEMENTED)
- **Tag Index Page** (`/tags/index.astro`) - Grid view of all tags with note counts
- **Individual Tag Pages** (`/tags/[tag].astro`) - Filtered views per tag
- **Tag Components** - Inline badges and sidebar display
- **Configurable** - Show in sidebar, with metadata, or both

#### Search (FULLY IMPLEMENTED)
- **Full-text search** across titles, content, and tags
- **Client-side** - Fast, no backend required
- **Keyboard shortcut** - Cmd+K / Ctrl+K
- **Live results** - Title, excerpt, tags preview
- **Cached index** - LocalStorage for performance
- **Modal interface** - Clean, accessible UI

#### Graph Visualization (FULLY IMPLEMENTED)
- **D3-based interactive graph** - Local and global views
- **Time slider** - Filter by creation/update date
- **Animation playback** - Watch graph evolve over time
- **Pan/zoom** - Smooth navigation
- **Click to navigate** - Direct link to notes
- **Canvas file rendering** - @xyflow/react for `.canvas` files

#### Breadcrumbs (FULLY IMPLEMENTED)
- **Hierarchical navigation** - Based on folder structure
- **Smart titles** - Uses frontmatter titles vs slugs
- **Configurable** - Custom spacer, root name, visibility options
- **Clickable segments** - Navigate to any parent folder

#### Activity Tracking (FULLY IMPLEMENTED)
- **RSS Feed** (`/rss.xml`) - 20 most recent notes
- **Activity Heatmap** - GitHub-style contribution graph
- **Created/Updated toggles** - Dual view modes
- **Stats Dashboard** (`/stats.astro`) - Analytics and metrics

#### File Explorer (FULLY IMPLEMENTED)
- **Hierarchical browser** - Collapsible folder tree
- **State persistence** - Remembers open/closed folders
- **File type badges** - Images, canvases, bases
- **Active highlighting** - Current note indicator

---

### Reading Experience ✅

#### Reading Time & Word Count (FULLY IMPLEMENTED)
- **Auto-calculation** - 200 WPM reading speed
- **Display in metadata** - Configurable icon and format
- **Word count** - Exact count displayed

#### Theme System (FULLY IMPLEMENTED)
- **Light/dark toggle** - Quick action button
- **Persistent preference** - LocalStorage
- **No flash** - Inline script prevents FOUC
- **Theme-aware components** - Code, graphs, diagrams all switch

#### Reading Mode (FULLY IMPLEMENTED)
- **Distraction-free** - Hides sidebars, max content width
- **Enlarged text** - 1.125rem font, 1.75 line height
- **Floating exit button** - Top-right corner
- **ESC to exit** - Keyboard shortcut
- **State management** - Nanostores for reactivity

#### Table of Contents (FULLY IMPLEMENTED)
- **Auto-generated** - From markdown headings
- **Active tracking** - IntersectionObserver highlights current section
- **Smooth scroll** - Anchor navigation
- **Reading progress bar** - Live 0-100% indicator
- **Saved position marker** - Shows where you left off
- **Collapsible** - Details element with animation

#### Backlinks (FULLY IMPLEMENTED)
- **"Notes that link here"** - Automatic detection
- **Wikilink parsing** - Extracts all `[[references]]`
- **Title + description** - Rich previews
- **Collapsible section** - With count badge

#### Related Notes (FULLY IMPLEMENTED)
- **Algorithm-based** - Scores by shared tags, folder proximity
- **Scoring system**:
  - 3 points per shared tag
  - 2 points for same folder
  - 1 point for parent/child folder
- **Sorted by relevance** - Most related first
- **Relationship reasons** - Shows "2 shared tags, same folder"
- **Configurable limit** - Default 10 notes

#### Links & Context Section (FULLY IMPLEMENTED)
- **External links** - Grouped by domain
- **Bibliography metadata** - For academic citations
- **Backlinks** - Notes referencing current page
- **Related notes** - Algorithmic suggestions
- **Three-level collapsible** - Outer + 3 inner sections
- **Preview mode** - Shows first 2 items when collapsed

---

### Markdown Processing ✅

#### Custom Plugins (7 total)
1. **Wikilinks** - `[[page]]`, `[[page|alias]]`, `[[page#section]]`
2. **Highlights** - `==text==` → `<mark>`
3. **Marginalia** - `{{side notes}}` Tufte-style sidenotes
4. **Links** - External link icons, tracking, classification
5. **Table of Contents** - Auto-generation from headings
6. **Remove Title** - Prevents duplicate H1 headings
7. **Base URL** - Deployment path rewriting

#### Third-Party Features
- **Math** - LaTeX rendering with KaTeX (`$inline$`, `$$block$$`)
- **Citations** - BibTeX integration with rehype-citation
- **Callouts** - Obsidian-style admonitions (14+ types)
- **GFM** - Tables, task lists, strikethrough, autolinks
- **Code** - Syntax highlighting with Shiki (GitHub Light/Dark)
- **Mermaid** - Client-side diagram rendering (v11)
- **Smart Typography** - Smart quotes, em-dashes (optional)

---

### Technical & Meta ✅

#### SEO & Social
- **Open Graph Images** - Auto-generated per page with Satori + Sharp
- **Default OG Image** - Fallback for pages without specific images
- **Meta Tags** - Title, description, author in BaseLayout
- **Sitemap** - Auto-generated with @astrojs/sitemap
- **RSS Feed** - 20 most recent published notes

#### Content Management
- **Draft/Publish System** - Dual-mode filtering
  - Draft mode: Excludes `draft: true`
  - Publish mode: Only includes `publish: true`
- **Content Schema** - Zod validation with custom field support
- **Frontmatter Fields** - title, description, tags, date, updated, author, aliases
- **Custom Fields** - Passthrough schema allows any field

#### Error Handling
- **404 Page** - Custom styled, theme-aware

#### Performance
- **Static Generation** - No backend, pure SSG
- **Minimal JavaScript** - Progressive enhancement
- **Client-side Caching** - Search index, reading progress

---

### Specialized Components ✅

#### Stats Dashboard (`/stats.astro`)
- **Word count totals** - Across all notes
- **Reading time metrics** - Total and average
- **Most linked notes** - Ranking by backlink count
- **Orphan detection** - Notes with no links
- **Network statistics** - Hub notes, link density

#### Bases/Tables
- **Table view** - @tanstack/react-table with filtering/sorting
- **Card view** - Alternative grid layout
- **Resizable columns** - Draggable column widths
- **Collection filtering** - Filter notes by properties

#### Canvas Viewer
- **Obsidian Canvas** - Renders `.canvas` files
- **Node types** - Text, file, image, base nodes
- **Interactive** - Pan, zoom, connections
- **Minimap** - Overview navigation

#### Quick Actions
- **Floating buttons** - Theme toggle, reading mode, graph
- **Keyboard shortcuts** - Accessible controls
- **Persistent** - Follows scroll

---

## Missing Features

### Print Support ❌
- **No print stylesheets** - Missing `@media print` rules
- **Recommended**: Hide navigation, optimize typography, show link URLs

### Font Size Controls ❌
- **No dynamic font adjustment** - Reading mode has fixed size increase only
- **Recommended**: Zoom controls (A-, A, A+) with user preference storage

### Content Validation ❌
- **No broken link checking** - Infrastructure exists in wikilinks plugin but disabled
- **No build-time validation** - Missing link validation scripts
- **Current state**: `markBroken: false` in wikilinks.ts

### Missing Build Scripts ❌
- **`scripts/claude/generateCallouts.ts`** - Referenced in package.json but file doesn't exist
- **Recommendation**: Either create the script or remove from package.json

### Tag Cloud Visualization ❌
- **Current**: Simple grid/list view
- **Missing**: Weighted/sized visualization based on tag frequency
- **Recommendation**: D3 tag cloud or weighted CSS sizing

### Dedicated Recent Notes Page ❌
- **Current**: RSS provides data, activity heatmap exists
- **Missing**: Simple chronological list/feed UI at `/recent` or `/timeline`
- **Low priority**: RSS and stats page cover most use cases

---

## Analytics & Monitoring (Skipped for Personal Site)

These features are typically useful for larger sites but may be overkill for a personal digital garden:

- **Web Analytics** - Google Analytics, Plausible, Fathom
- **Performance Monitoring** - Lighthouse CI, bundle size tracking
- **Error Tracking** - Sentry, LogRocket
- **A/B Testing** - Optimization experiments

---

## Feature Completeness Summary

| Category | Implemented | Missing | Completion |
|----------|-------------|---------|------------|
| Content Discovery | 5/6 | Tag cloud | 83% |
| Reading Experience | 6/8 | Print styles, font controls | 75% |
| Markdown Processing | 13/13 | None | 100% |
| Technical/Meta | 5/7 | Link validation, scripts | 71% |
| Specialized | 4/4 | None | 100% |
| **Overall** | **33/38** | **5 features** | **87%** |

---

## Recommendations for Implementation

### High Priority
1. **Print Stylesheet** - Simple addition, high impact for sharing
2. **Broken Link Validation** - Enable existing infrastructure

### Medium Priority
3. **Font Size Controls** - Accessibility improvement
4. **Tag Cloud** - Visual enhancement for tag discovery

### Low Priority
5. **Recent Notes Page** - Nice-to-have, covered by RSS
6. **Fix/Remove Callout Script** - Clean up package.json reference

### Skip for Personal Site
- Analytics, monitoring, A/B testing (overkill for personal PKM)

---

## Obsidian Feature Parity

Ametrine successfully implements most core Obsidian features for web publishing:

| Obsidian Feature | Ametrine Status |
|------------------|-----------------|
| Wikilinks | ✅ Full support |
| Backlinks | ✅ Implemented |
| Graph view | ✅ D3 implementation |
| Tags | ✅ Full system |
| Callouts | ✅ Via rehype-callouts |
| Highlights | ✅ ==syntax== |
| Canvas | ✅ Via @xyflow/react |
| Tables | ✅ Via GFM |
| Math | ✅ Via KaTeX |
| Mermaid | ✅ Client-side rendering |
| Embeds | ⚠️ Disabled (infrastructure exists) |
| Dataview | ✅ Via Bases/Tables |
| Search | ✅ Full-text client-side |
| Properties | ✅ Frontmatter schema |

---

## Tech Stack Highlights

The project uses modern, performant tooling:

- **Astro 5.15** - Latest stable, excellent performance
- **React 19** - Latest stable for interactive components
- **Bun** - Fast package manager and runtime
- **TypeScript Strict** - Full type safety
- **Tailwind 3** - Utility-first styling
- **Shiki 3** - Fast syntax highlighting
- **D3** - Powerful graph visualization
- **Nanostores** - Minimal state management (300 bytes)

No major tech debt or outdated dependencies detected.
