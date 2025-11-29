# Examples

This directory contains example implementations showing how to extend ametrine with custom features.

## Files

- **`custom-page.astro`** - Example custom page showing:
  - Full-width layout without sidebars
  - Loading static JSON data at build time
  - Using React components with API integration
  - Custom styling and structure

- **`ApiWidget.tsx`** - Example React component demonstrating:
  - External API integration with caching
  - Using the `api-client` utility
  - Error handling and loading states
  - Cache management

## Usage

### To Use the Example Page

1. Copy `custom-page.astro` to `/src/pages/example.astro`
2. Start dev server: `bun run dev`
3. Visit `http://localhost:4321/example`

### To Use the API Widget

```astro
---
import { ApiWidget } from '../examples/ApiWidget';
---

<ApiWidget client:load />
```

## Learn More

See `/docs/extensibility.md` for comprehensive documentation on:
- Adding custom pages
- Creating React components
- Loading static data
- External API integration
- Custom layouts
- Build-time processing

## Notes

These examples are provided as templates and learning resources. Feel free to:
- Copy and modify them for your own use
- Use them as references when creating custom features
- Delete them if you don't need them

They are not included in the build by default since they're in the `/examples/` directory rather than `/pages/`.
