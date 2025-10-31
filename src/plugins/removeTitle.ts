import { visit, SKIP } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import type { Root, Heading } from "mdast";
import type { VFile } from "vfile";

/**
 * Remark plugin to remove the first h1 heading if it matches the frontmatter title.
 * This prevents duplicate titles when we manually render the frontmatter title.
 */
export function removeTitle() {
  return function transformer(tree: Root, file: VFile) {
    // Get the title from frontmatter
    const frontmatterTitle = (file.data.astro?.frontmatter as any)?.title;

    if (!frontmatterTitle) {
      return tree;
    }

    // Normalize title for comparison
    const normalizedTitle = frontmatterTitle.trim().toLowerCase();
    let removed = false;

    // Find and remove the first h1 if it matches
    visit(tree, "heading", (node: Heading, index, parent) => {
      // Only process if we haven't removed a heading yet and this is an h1
      if (!removed && node.depth === 1) {
        const headingText = toString(node).trim().toLowerCase();

        // If the h1 matches the frontmatter title, remove it
        if (
          headingText === normalizedTitle &&
          parent &&
          typeof index === "number"
        ) {
          parent.children.splice(index, 1);
          removed = true;
          return [SKIP, index];
        }
      }
    });

    return tree;
  };
}
