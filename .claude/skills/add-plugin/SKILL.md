# add-plugin

Add a remark or rehype plugin to the ametrine content pipeline.

## Description

Wires up a new remark (markdown AST) or rehype (HTML AST) plugin into the processing pipeline. Use when asked to add markdown extensions, custom syntax, or HTML post-processing.

## Instructions

### 1. Create the plugin file

Create `src/plugins/your-plugin.ts`. Follow this pattern:

```typescript
import type { Root } from "hast"; // or "mdast" for remark
import type { Plugin } from "unified";

interface YourPluginOptions {
  // options here, if any
}

const yourPlugin: Plugin<[YourPluginOptions?], Root> = (options = {}) => {
  return (tree) => {
    // transform tree
  };
};

export default yourPlugin;
```

- Remark plugins operate on `mdast` (markdown AST) — import types from `"mdast"` and `"mdast-util-*"`
- Rehype plugins operate on `hast` (HTML AST) — import types from `"hast"` and `"hast-util-*"`
- Use `visit` from `"unist-util-visit"` to traverse nodes
- Export default (preferred) or named export

### 2. Register in astro.config.mjs

Open `astro.config.mjs` and add to the markdown config:

```js
import yourPlugin from "./src/plugins/your-plugin.ts";

// inside defineConfig:
markdown: {
  remarkPlugins: [
    // remark plugins here (with options as [plugin, options] tuple)
    [yourPlugin, { option: value }],
    // or just yourPlugin if no options
  ],
  rehypePlugins: [
    // rehype plugins here
  ],
}
```

The order matters — plugins run in array order. Remark runs before rehype.

### 3. Write tests

Create `src/plugins/your-plugin.test.ts`. Use the existing test files as reference. Key pattern:

```typescript
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import yourPlugin from "./your-plugin.ts";

describe("yourPlugin", () => {
  it("transforms correctly", async () => {
    const result = await unified()
      .use(remarkParse)
      .use(yourPlugin)
      .process("input markdown");
    expect(String(result)).toContain("expected output");
  });
});
```

### 4. Verify

```bash
bun run test        # run tests
bun run check       # type check
bun run build       # full build to confirm integration
```
