import { visit } from "unist-util-visit";
import type { Root } from "mdast";

/**
 * Remark plugin to convert ==highlighted text== to <mark> tags
 */
export function highlights() {
  return function transformer(tree: Root) {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined) return;

      const text = node.value;
      const highlightRegex = /==([^=]+)==/g;

      if (!highlightRegex.test(text)) return;

      const children: any[] = [];
      let lastIndex = 0;
      let match;

      highlightRegex.lastIndex = 0;
      while ((match = highlightRegex.exec(text)) !== null) {
        // Add text before the highlight
        if (match.index > lastIndex) {
          children.push({
            type: "text",
            value: text.slice(lastIndex, match.index),
          });
        }

        // Add the highlighted text as HTML
        children.push({
          type: "html",
          value: `<mark>${match[1]}</mark>`,
        });

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        children.push({
          type: "text",
          value: text.slice(lastIndex),
        });
      }

      // Replace the text node with the new children
      parent.children.splice(index, 1, ...children);
    });
  };
}

export default highlights;
