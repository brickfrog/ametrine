# Extensibility Guide

This guide shows how to extend ametrine with custom features when you fork the project. Ametrine is designed to be flexible and hackable - you can add custom pages, components, and integrations without modifying core code.

## Table of Contents

- [Adding Custom Pages](#adding-custom-pages)
- [Adding React Components](#adding-react-components)
- [Loading Static Data](#loading-static-data)
- [External API Integration](#external-api-integration)
- [Custom Layouts](#custom-layouts)
- [Build-time Processing](#build-time-processing)

---

## Adding Custom Pages

Create a new page by adding a file to `/src/pages/`.

### Example: Simple Custom Page

```astro
---
// src/pages/custom.astro
import ContentLayout from '../layouts/ContentLayout.astro';
---

<ContentLayout
  title="Custom Page"
  description="My custom page"
  slug="custom"
  marginalia={[]}
  isFolder={false}
>
  <h1>My Custom Page</h1>
  <p>Add any content here!</p>
</ContentLayout>
```

### Example: Full-Width Page (No Sidebars)

```astro
---
// src/pages/portfolio.astro
import ContentLayout from '../layouts/ContentLayout.astro';
---

<ContentLayout
  title="Portfolio"
  slug="portfolio"
  marginalia={[]}
  isFolder={true}  <!-- Full width, no prose styling -->
>
  <div class="space-y-8">
    <!-- Your custom layout here -->
  </div>
</ContentLayout>
```

The `isFolder={true}` prop removes prose styling and allows full-width custom layouts.

### Existing Examples

Check these files for real examples:
- `/src/pages/stats.astro` - Custom stats page
- `/src/pages/canvas/[...canvas].astro` - Canvas viewer with custom layout
- `/src/pages/base/[...base].astro` - Bases with table/card views

---

## Adding React Components

Create interactive components in `/src/components/react/`.

### Example: Basic React Component

```tsx
// src/components/react/MyWidget.tsx
import { useState } from 'react';

export function MyWidget() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded">
      <p>Count: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-theme-secondary text-theme-light rounded"
      >
        Increment
      </button>
    </div>
  );
}
```

### Using in Pages

```astro
---
import { MyWidget } from '../components/react/MyWidget';
---

<MyWidget client:load />
```

**Client directives:**
- `client:load` - Load immediately on page load
- `client:idle` - Load when browser is idle
- `client:visible` - Load when component enters viewport
- `client:only="react"` - Only render on client (no SSR)

### Existing Examples

- `/src/components/react/Search.tsx` - Full-text search
- `/src/components/react/Explorer.tsx` - File tree explorer
- `/src/components/react/MarginaliaManager.tsx` - Side note manager

---

## Loading Static Data

You can load data from static JSON files at build time or runtime.

### Build-time Data Loading

```astro
---
// Load data during build
const data = await fetch('https://your-api/data').then(r => r.json());
// Or load from local file
import localData from '../../public/data/items.json';
---

<ul>
  {data.map(item => <li>{item.name}</li>)}
</ul>
```

### Runtime Data Loading

For dynamic data that changes, fetch it client-side in React components:

```tsx
import { useState, useEffect } from 'react';

export function DataTable() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/data/items.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  return <table>{/* render data */}</table>;
}
```

### Where to Put Static Files

- `/public/` - Static files served as-is (JSON, images, etc.)
- Access at `/your-file.json` in the browser

---

## External API Integration

Use the built-in `api-client` utility for API calls with caching.

### Example: Fetch from External API

```tsx
// src/components/react/AnimeWidget.tsx
import { useState, useEffect } from 'react';
import { cachedFetch } from '../../utils/api-client';

interface AnimeData {
  title: string;
  status: string;
}

export function AnimeWidget() {
  const [data, setData] = useState<AnimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cachedFetch<AnimeData>('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          Media(id: 1) {
            title { romaji }
            status
          }
        }`
      }),
      ttl: 3600000, // 1 hour cache
      cacheKey: 'anime-data'
    })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h3>{data.title}</h3>
      <p>Status: {data.status}</p>
    </div>
  );
}
```

### API Client Options

```typescript
cachedFetch<T>(url, {
  ttl: 3600000,        // Cache duration (ms)
  cacheKey: 'unique',  // Required for caching
  useETag: true,       // Use ETag headers
  method: 'POST',      // HTTP method
  headers: {},         // Custom headers
  body: '',            // Request body
})
```

### Cache Management

```typescript
import { clearCache, clearAllCache, getCacheStats } from '../utils/api-client';

// Clear specific cache
clearCache('anime-data');

// Clear all caches
clearAllCache();

// Get stats
const stats = getCacheStats();
console.log(stats.keys, stats.totalSize);
```

---

## Custom Layouts

Ametrine includes flexible layout system. You can create custom layouts or use existing ones.

### Available Layouts

1. **ContentLayout** - Standard three-column layout
   - Use `isFolder={true}` for full-width content
   - Use `isFolder={false}` for prose-styled content with sidebars

2. **BaseLayout** - Minimal HTML wrapper
   - Good for completely custom pages
   - You handle all styling and structure

3. **ListLayout** - List view (see `/src/layouts/ListLayout.astro`)

### Creating Custom Layout

```astro
---
// src/layouts/MyCustomLayout.astro
import BaseLayout from './BaseLayout.astro';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<BaseLayout title={title}>
  <div class="custom-container">
    <header>
      <h1>{title}</h1>
    </header>
    <main>
      <slot />
    </main>
  </div>
</BaseLayout>

<style>
  .custom-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
```

### Layout Slots

ContentLayout provides slots for adding content to different sections:

```astro
<ContentLayout title="Page" slug="page">
  <!-- Main content -->
  <p>Main content goes here</p>

  <!-- Left sidebar -->
  <div slot="left">
    <!-- Custom left sidebar content -->
  </div>

  <!-- Right sidebar -->
  <div slot="right">
    <!-- Custom right sidebar content -->
  </div>

  <!-- Mobile bottom (shows on mobile only) -->
  <div slot="mobile-bottom">
    <!-- Shows at bottom on mobile screens -->
  </div>
</ContentLayout>
```

---

## Build-time Processing

You can preprocess data during the build using Astro integration hooks.

### Example: Preprocess JSON Before Build

```typescript
// scripts/preprocess.ts
import fs from 'fs';
import path from 'path';

export function preprocessData() {
  const input = fs.readFileSync('data/raw.json', 'utf-8');
  const data = JSON.parse(input);

  // Transform data
  const processed = data.map(item => ({
    ...item,
    processed: true,
  }));

  // Write to public directory
  fs.writeFileSync(
    'public/data/processed.json',
    JSON.stringify(processed, null, 2)
  );
}
```

### Integrate with Astro Build

Add to `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import { preprocessData } from './scripts/preprocess';

export default defineConfig({
  integrations: [{
    name: 'preprocess-data',
    hooks: {
      'astro:config:setup': () => {
        preprocessData();
      }
    }
  }],
  // ... rest of config
});
```

Or run as a separate script before build:

```json
// package.json
{
  "scripts": {
    "prebuild": "bun run scripts/preprocess.ts",
    "build": "astro build"
  }
}
```

---

## Tips and Best Practices

### File Organization

```
src/
├── components/
│   ├── react/          # React components
│   └── *.astro         # Astro components
├── pages/
│   └── custom.astro    # Your custom pages
├── layouts/
│   └── Custom.astro    # Your custom layouts
├── utils/
│   └── helpers.ts      # Your utility functions
public/
└── data/
    └── custom.json     # Your static data
```

### Styling

Use Tailwind classes that reference theme colors:
- `bg-theme-light`, `bg-theme-dark` - Background colors
- `text-theme-light`, `text-theme-dark` - Text colors
- `bg-theme-secondary` - Accent color
- `border-theme-gray` - Borders

These automatically adapt to light/dark mode.

### Type Safety

Create types for your data:

```typescript
// src/types/custom.ts
export interface MyData {
  id: string;
  title: string;
  value: number;
}
```

Use in components:

```tsx
import type { MyData } from '../types/custom';

export function MyComponent({ data }: { data: MyData }) {
  // ...
}
```

### Navigation

To add your custom page to navigation, you can:

1. Add it to Explorer tree (if it's a markdown file in vault)
2. Create custom navigation in QuickActions
3. Add links in your index page
4. Modify the header/footer components

---

## Real-World Example

Here's a complete example of adding a quotes library (similar to QuoteBack):

1. **Add static data**: `/public/data/quotes.json`
2. **Create React component**: `/src/components/react/QuotesTable.tsx`
3. **Create page**: `/src/pages/quotes.astro`
4. **Use API client if fetching from external source**

See the examples directory for full implementations.

---

## Questions?

Check the existing codebase for patterns:
- Search for similar features
- Look at existing components in `/src/components/`
- Check page implementations in `/src/pages/`
- Review the bases and canvas features for complex examples

Ametrine is designed to be hackable - don't be afraid to modify and extend it!
