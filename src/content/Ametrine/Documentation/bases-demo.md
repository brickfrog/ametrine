---
title: Bases Demo
description: Database-like views of your notes with filtering and sorting
tags: [demo, features, bases]
date: 2025-10-30
image: "/ametrine.png"
---

# Bases Demo

Database-like views over your notes. Filter, sort, and display notes in tables.

> [!tip] Examples
> - [All Notes Base](/base/all-notes/all-notes)
> - [Showcase Base](/base/showcase/all-documentation)

## What Are Bases?

Query notes by properties (tags, folders, dates, frontmatter), display results in tables, sort by columns, filter with expressions.

## Base Files

Bases are `.base` files created in your Obsidian vault alongside your notes. This app reads them and generates the views.

Example `projects.base`:

```yaml
views:
  - type: table
    name: Active Projects
    filters:
      and:
        - file.hasTag("project")
        - 'status == "active"'
    order:
      - file.name
      - status
      - priority
      - file.mtime
```

The app automatically creates a page at `/base/projects/active-projects` for each view.

## Filtering Basics

### Simple Filters

Filter by tag:
```yaml
filters:
  and:
    - file.hasTag("guide")
```

Filter by folder:
```yaml
filters:
  and:
    - file.inFolder("concepts")
```

Filter by property:
```yaml
filters:
  and:
    - 'status == "complete"'
    - 'priority > 3'
```

### Logical Operators

**AND** - All conditions must match:
```yaml
filters:
  and:
    - file.hasTag("project")
    - 'status == "active"'
    - 'priority >= 5'
```

**OR** - Any condition must match:
```yaml
filters:
  or:
    - file.hasTag("urgent")
    - 'priority > 8'
    - 'deadline < today()'
```

**NOT** - None of the conditions should match:
```yaml
filters:
  not:
    - file.hasTag("archived")
    - 'draft == true'
```

### Nested Logic

Combine operators for complex queries:
```yaml
filters:
  and:
    - file.inFolder("projects")
    - or:
        - 'status == "active"'
        - and:
            - 'status == "paused"'
            - 'priority > 7'
    - not:
        - file.hasTag("archived")
```

## Available Properties

### File Properties

Access with `file.` prefix:

| Property | Type | Example |
|----------|------|---------|
| `file.name` | String | Note title |
| `file.path` | String | Full path/slug |
| `file.folder` | String | Parent folder |
| `file.ext` | String | File extension |
| `file.ctime` | Date | Created time |
| `file.mtime` | Date | Modified time |
| `file.tags` | Array | All tags |
| `file.links` | Array | Outgoing links |

### Note Properties

Access directly from frontmatter:

```yaml
filters:
  and:
    - 'status == "published"'
    - 'author == "John Doe"'
    - 'priority >= 5'
```

Any frontmatter field can be used: `title`, `description`, `author`, `status`, `priority`, etc.

## Built-in Functions

### File Functions

**`file.hasTag(tag)`** - Check for tag (includes nested tags):
```yaml
filters:
  and:
    - file.hasTag("project")
```

**`file.inFolder(folder)`** - Check folder location:
```yaml
filters:
  and:
    - file.inFolder("guides")
```

**`file.hasProperty(name)`** - Check if property exists:
```yaml
filters:
  and:
    - file.hasProperty("author")
```

**`file.hasLink(path)`** - Check if note links to another:
```yaml
filters:
  and:
    - file.hasLink("index")
```

### Comparison Operators

Use in filter expressions:
- `==` - Equals
- `!=` - Not equals
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal

### Date Functions

**`now()`** - Current date and time
**`today()`** - Current date (time = 00:00:00)

```yaml
filters:
  and:
    - 'file.mtime > today()'  # Modified today
```

## Multiple Views

One base can have multiple views:

```yaml
views:
  - type: table
    name: All Projects
    order:
      - file.name
      - status
      - priority

  - type: table
    name: Active Only
    filters:
      and:
        - 'status == "active"'
    order:
      - priority
      - file.name

  - type: table
    name: High Priority
    filters:
      and:
        - 'priority >= 8'
    order:
      - priority
      - file.mtime
```

Each view gets its own tab and URL:
- `/base/projects/all-projects`
- `/base/projects/active-only`
- `/base/projects/high-priority`

## Ordering Columns

The `order` field controls which columns appear and their sequence:

```yaml
order:
  - file.name        # Note title (linked)
  - status           # Frontmatter property
  - priority         # Another property
  - file.tags        # Tags as badges
  - file.mtime       # Modified date
  - description      # Description field
```

Columns are displayed left to right in the specified order.

## View Types

### Table View

```yaml
views:
  - type: table
    name: My Table
    order:
      - file.name
      - status
      - file.mtime
```

### Other View Types

Only `table` is currently implemented. Planned: `cards`, `list`, `map`.

## Configuration Examples

### Documentation Hub

```yaml
# bases/docs.base
views:
  - type: table
    name: All Docs
    filters:
      or:
        - file.hasTag("guide")
        - file.hasTag("reference")
        - file.hasTag("documentation")
    order:
      - file.name
      - file.tags
      - file.mtime

  - type: table
    name: Guides
    filters:
      and:
        - file.hasTag("guide")
    order:
      - file.name
      - description
```

### Project Tracker

```yaml
# bases/projects.base
views:
  - type: table
    name: Active Projects
    filters:
      and:
        - file.hasTag("project")
        - 'status == "active"'
    order:
      - priority
      - file.name
      - status
      - deadline

  - type: table
    name: Completed
    filters:
      and:
        - file.hasTag("project")
        - 'status == "complete"'
    order:
      - file.mtime
      - file.name
```

### Reading List

```yaml
# bases/reading.base
views:
  - type: table
    name: To Read
    filters:
      and:
        - file.hasTag("book")
        - 'status == "unread"'
    order:
      - priority
      - author
      - file.name

  - type: table
    name: Finished
    filters:
      and:
        - file.hasTag("book")
        - 'status == "read"'
    limit: 20
    order:
      - file.mtime
      - rating
      - file.name
```

## Limiting Results

Use `limit` to show only top N results:

```yaml
views:
  - type: table
    name: Recent Updates
    limit: 10  # Only show 10 most recent
    order:
      - file.mtime
      - file.name
```

Results are limited AFTER filtering.

## Tips and Tricks

### Tag Hierarchies

`file.hasTag()` matches nested tags:
```yaml
file.hasTag("project")  # Matches "project/web", "project/mobile", etc.
```

### Property Existence

Check if a field exists before comparing:
```yaml
filters:
  and:
    - file.hasProperty("status")
    - 'status == "active"'
```

### Case-Sensitive Comparisons

String comparisons are case-sensitive:
```yaml
'status == "Active"'   # Won't match "active"
```

Normalize your property values for consistency.

### Empty Filters

Omit `filters` to show all notes:
```yaml
views:
  - type: table
    name: Everything
    order:
      - file.name
      - file.mtime
```

### Combining Global and View Filters

Global filters apply to ALL views:
```yaml
filters:
  and:
    - file.inFolder("projects")  # Global: only project folder

views:
  - type: table
    name: Active
    filters:
      and:
        - 'status == "active"'  # View: only active ones
```

Global and view filters are combined with AND.

## Examples

**[All Notes](/base/all-notes/all-notes)** - All notes in a table

**[Showcase Base](/base/showcase/all-documentation)** - Filtered by tag

**[Recent Updates](/base/all-notes/recent-updates)** - 20 most recent

## How It Works

1. `.base` files parsed at build time
2. Filters evaluated against all notes
3. Results sorted by specified properties
4. Static HTML pages generated
5. No client-side processing required

## Troubleshooting

### Base Not Showing

Check:
1. File has `.base` extension
2. File is in your vault (which should be symlinked to `/src/content/vault/`)
3. YAML is valid (use a validator)
4. At least one view is defined
5. Dev server restarted

### No Results

Check:
1. Filters might be too restrictive
2. Property names are correct (case-sensitive)
3. Notes have the expected properties/tags
4. Use `filters: {}` to see all notes first

### Expression Errors

Common issues:
- Missing quotes around strings: `status == "active"` ✓
- Wrong operators: Use `==` not `=`
- Invalid property names: Check frontmatter
- Typos in function names: `file.hasTag` not `file.hasTag()`

### Build Errors

If build fails:
1. Check YAML syntax (indentation matters)
2. Verify view types are valid: `table`, `cards`, `list`, `map`
3. Ensure `views` is an array
4. Check for circular references

## Planned Features

- Formula properties (computed values)
- Cards view (gallery layout)
- List view (bulleted/numbered)
- Map view with coordinates
- Advanced functions (dates, strings, lists)
- Custom property display config
- Export to CSV/JSON

## Usage

1. Create a `.base` file in your Obsidian vault
2. Define views with filters and ordering
3. Build generates pages at `/base/yourbase/viewname`
