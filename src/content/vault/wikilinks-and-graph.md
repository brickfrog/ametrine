---
title: Wikilinks and Graph
description: Master linking and graph visualization in Ametrine
tags: [demo, features, wikilinks, graph]
date: 2025-10-30
---

# Wikilinks and Graph

Learn how to create connections between notes and visualize your knowledge network with Ametrine's powerful linking features.

> [!tip] Try It Now
> Press **Ctrl/Cmd+G** to open the global graph and see how all notes in this garden connect!

## What Are Wikilinks?

Wikilinks are ==double-bracket links== that connect notes together. They're inspired by Wikipedia's internal linking system and popularized by tools like [[Obsidian Features Demo|Obsidian]].

Wikilinks are better than regular markdown links because:
- Faster to write: `[[page]]` vs `[Page](page.md)`
- Auto-complete in most editors
- Work with note titles, not file paths
- Support aliases and sections
- Show backlinks automatically

## Basic Wikilink Syntax

### Simple Link

Link to another note by its title:

```markdown
[[Quick Start]]
```

Result: [[Quick Start]]

The link resolves to the note with matching `title` in frontmatter, case-insensitive.

### Link with Custom Text

Display different text than the page title:

```markdown
[[Configuration Guide|customizing your site]]
```

Result: [[Configuration Guide|customizing your site]]

### Link to a Section

Link directly to a heading within a page:

```markdown
[[Deployment Guide#netlify]]
```

Result: [[Deployment Guide#netlify]]

### Section with Custom Text

Combine both features:

```markdown
[[Configuration Guide#theme-customization|changing colors]]
```

Result: [[Configuration Guide#theme-customization|changing colors]]

## Aliases

Define alternate names for notes in frontmatter:

```yaml
---
title: Obsidian Features Demo
aliases: [Obsidian Demo, Feature Demo]
---
```

Now all these link to the same page:
- `[[Obsidian Features Demo]]` → [[Obsidian Features Demo]]
- `[[obsidian-features-demo|Obsidian Demo]]` → [[obsidian-features-demo|Obsidian Demo]]
- `[[obsidian-features-demo|Feature Demo]]` → [[obsidian-features-demo|Feature Demo]]

> [!note] Alias Matching
> Aliases are case-insensitive and match exactly. Use them for common abbreviations or alternate terms.

## Backlinks

Every note automatically tracks which other notes link to it. Backlinks appear at the bottom of each page in the "Links to this note" section.

For example:
- This page links to [[Quick Start]]
- [[Quick Start]] shows this page in its backlinks
- Backlinks create a ==bidirectional knowledge graph==

Backlinks help you:
- Discover unexpected connections
- Navigate related content
- Find orphaned notes (pages with no backlinks)
- Build a network of ideas

## Graph Visualization

Ametrine includes two types of graph views powered by D3.js.

### Local Graph

The **local graph** appears on every page and shows:
- The current page (center node)
- All pages linking TO this page (incoming links)
- All pages this page links TO (outgoing links)

Try scrolling to the bottom of this page to see its local graph!

Features:
- **Drag nodes** to rearrange
- **Click nodes** to navigate
- **Zoom** with mouse wheel
- **Pan** by dragging background

### Global Graph

Press **Ctrl/Cmd+G** (or click the graph icon) to open the global graph modal.

The global graph shows:
- **All pages** in your garden
- **All connections** between them
- Interactive time-travel controls

#### Time-Travel Controls

The global graph includes powerful filtering:

1. **Date Range Slider** {{Drag to filter notes by date}}
   - Shows only notes created/updated within date range
   - Useful for seeing your garden's growth over time
   - Toggle between "created" and "updated" dates

2. **Show Undated Notes**
   - Include/exclude notes without dates
   - Helpful for focusing on timestamped content

3. **Play/Pause Animation**
   - Watch your garden grow over time
   - Animates through the timeline
   - Pause at any point to explore

#### Graph Physics

The graph uses force-directed layout with:
- **Link forces** - Connected nodes attract
- **Charge forces** - All nodes repel slightly
- **Collision detection** - Nodes don't overlap
- **Center gravity** - Keeps graph centered

The result: Highly connected "hub" notes naturally move to the center, while isolated notes drift to the edges.

## Building a Knowledge Network

### Hub Notes

"Hub notes" are pages with many connections. They act as Maps of Content (MOCs) {{Like the [[index]] page}}.

Hub characteristics:
- Link to many related notes
- Summarize a topic or area
- Provide navigation entry points
- Appear central in the graph

Create hubs by:
1. Identifying theme clusters
2. Creating an overview note
3. Linking to all related notes
4. Using descriptive headings

### Evergreen Notes

Evergreen notes are continuously refined and updated. They benefit from strong linking because:
- They accumulate backlinks over time
- Updates propagate through connections
- Related ideas cluster naturally

Best practices:
- One idea per note {{Atomic notes}}
- Descriptive titles
- Link to related concepts
- Update as you learn more

### Progressive Summarization

Build understanding through layers:
1. **Capture** - Quick note with wikilinks
2. **Connect** - Link to related concepts
3. **Summarize** - Add highlights and marginalia
4. **Synthesize** - Create hub notes

Each layer strengthens the network.

## Link Strategies

### Dense vs Sparse Linking

**Dense linking**: Many connections, high discoverability
- Good for reference material
- Enables serendipitous discovery
- Risk: Too many links become noise

**Sparse linking**: Few strategic connections
- Good for narrative content
- Maintains focus
- Risk: Orphaned notes, islands

Balance both: Link generously in hubs, selectively in focused notes.

### Link Placement

Where you place links matters:

**Inline links** (like `[[this]]`) work well for:
- Direct references
- Supporting evidence
- Related tangents

**List links** work well for:
- Collections
- See-also sections
- Navigation menus

**Contextual links** (within sentences) work best for:
- Natural reading flow
- Explaining relationships
- Building arguments

## Graph Insights

What the graph reveals:

### Clusters

Groups of highly connected notes indicate:
- Topic areas or themes
- Projects or areas of focus
- Related concepts

Clusters might warrant:
- A hub note to organize them
- A tag to group them
- Better separation if unrelated

### Bridges

Notes connecting separate clusters are valuable:
- Show relationships between topics
- Enable idea cross-pollination
- Reveal unexpected connections

### Orphans

Notes with no connections are:
- New notes not yet integrated
- Private/draft content
- Potential duplicates
- Candidates for deletion

The stats page shows orphan notes so you can connect or remove them.

### Central Nodes

Highly connected notes are:
- Hubs or MOCs
- Frequently referenced concepts
- Potential candidates for splitting

If a note has too many connections, consider splitting it into multiple focused notes.

## Practical Examples

### Example 1: Topic Hub

```markdown
---
title: Digital Gardening Resources
tags: [hub, digital-garden]
---

# Digital Gardening Resources

Central hub for all digital gardening content.

## Core Concepts
- [[index|What is a Digital Garden?]]
- `[[knowledge-management]]`

## Guides
- [[Quick Start]]
- [[Configuration Guide]]
- [[Deployment Guide]]

## Features
- [[Wikilinks and Graph]]
- [[Obsidian Features Demo]]
- [[Marginalia Demo]]
```

This creates a hub with many outgoing links.

### Example 2: Concept Note

```markdown
---
title: Atomic Notes
tags: [concept, pkm]
---

# Atomic Notes

Each note should express ==one complete idea==.

Atomic notes are fundamental to `[[zettelkasten-method|Zettelkasten]]`
and `[[knowledge-management|PKM systems]]`.

Benefits:
- Easier to link
- More reusable
- Clearer focus

See also: `[[building-a-knowledge-network]]`
```

This creates targeted connections to related concepts.

### Example 3: Project Note

```markdown
---
title: Website Redesign
tags: [project, active]
status: in-progress
---

# Website Redesign

Using `[[ametrine]]` to build the new site.

## Tasks
- [x] Choose template ([[Quick Start]])
- [x] Configure theme ([[Configuration Guide#theme-customization]])
- [ ] Deploy ([[Deployment Guide]])

## Resources
- [[Obsidian Features Demo]]
- [[Syntax Reference]]
```

This links to relevant documentation and creates context.

## Advanced Techniques

### Bidirectional Thinking

Don't just link forward - think about backlinks:
- When writing, ask: "What should link here?"
- Create landing spots for backlinks
- Use descriptive text around links for context

### Link Context

The text surrounding a link provides context for backlinks:

Bad: "See `[[this-page]]`"
Good: "Learn more about [[Configuration Guide|customizing themes]]"

The backlink panel shows surrounding text, so good context helps readers.

### Orphan Prevention

When creating a note:
1. Link to it from at least one existing note
2. Add relevant tags
3. Include outgoing links to related content

This ensures the note joins the network immediately.

## Graph Keyboard Shortcuts

Master the graph with keyboard shortcuts:

Global graph:
- **Ctrl/Cmd+G** - Toggle global graph
- **Esc** - Close graph
- **Arrow keys** - Pan view
- **+/-** - Zoom in/out
- **Space** - Play/pause timeline

## Limitations and Caveats

### Case Sensitivity

Wikilinks are case-insensitive, but:
- File names might be case-sensitive on Linux
- Keep title casing consistent
- Use aliases for common variations

### Performance

Large graphs (1000+ notes) may be slow:
- Consider chunking into multiple gardens
- Use date filters to reduce visible nodes
- Optimize image sizes

### External Links

Regular markdown links still work:
```markdown
[External Site](https://google.com)
```

Use wikilinks for internal navigation, markdown links for external references.

## Inspiration and Resources

The wikilink and graph concepts draw from:
- **Zettelkasten Method** - Niklas Luhmann's slip-box system
- **Memex** - Vannevar Bush's vision (1945)
- **HyperCard** - Bill Atkinson's knowledge system
- **Wiki** - Ward Cunningham's original wiki (1995)
- **Roam Research** - Popularized bidirectional links
- **Obsidian** - Local-first knowledge management

## Try It Yourself

Practice creating connections:

1. Create a new note about a topic you know
2. Link it to this page: `[[Wikilinks and Graph]]`
3. Add 3-5 links to related notes
4. Check the backlinks on those pages
5. Open the global graph (Ctrl/Cmd+G)
6. Find your new note in the network

## Next Steps

Now that you understand linking:

- [[Obsidian Features Demo]] - Learn content formatting
- [[Marginalia Demo]] - Add side notes
- [[Advanced Features]] - Explore search and popovers
- [[Syntax Reference]] - Quick reference guide

Build your knowledge graph, one link at a time!
