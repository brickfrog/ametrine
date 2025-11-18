import type { Html, Parent, Root, RootContent, Text } from "mdast";
import type { VFile } from "vfile";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import { toMarkdown } from "mdast-util-to-markdown";

export interface MarginaliaEntry {
  id: number;
  content: string;
  html: string;
}

export interface MarginaliaOptions {
  enable?: boolean;
}

const defaultOptions: Required<MarginaliaOptions> = {
  enable: true,
};

function stripTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value.slice(0, -1) : value;
}

/**
 * Process markdown content to HTML
 * Converts markdown to HTML and unwraps single paragraphs
 */
async function processMarkdown(content: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify);

  const result = await processor.process(content);
  let html = String(result).trim();

  // Strip wrapping <p> tags for inline display
  if (html.startsWith("<p>") && html.endsWith("</p>")) {
    html = html.slice(3, -4);
  }

  return html;
}

/**
 * Remark plugin to parse {{marginalia}} syntax
 * Extracts side notes for Tufte-style margin notes or mobile footnotes
 */
export function marginalia(userOpts: MarginaliaOptions = {}) {
  const opts = { ...defaultOptions, ...userOpts };

  if (!opts.enable) {
    return () => (tree: Root) => tree;
  }

  return async function transformer(tree: Root, file: VFile) {
    const marginalia: MarginaliaEntry[] = [];
    let marginaliaId = 0;

    async function processChildren(
      nodes: RootContent[],
    ): Promise<RootContent[]> {
      const newChildren: RootContent[] = [];
      let buffer: RootContent[] | null = null;

      const flushAsNote = async () => {
        if (!buffer || buffer.length === 0) {
          buffer = null;
          return;
        }

        const rawMarkdown = stripTrailingNewline(
          toMarkdown({ type: "root", children: buffer }),
        );
        const markdownContent = rawMarkdown.trim();

        if (!markdownContent) {
          buffer = null;
          return;
        }

        const html = await processMarkdown(markdownContent);
        marginaliaId += 1;
        const id = marginaliaId;

        marginalia.push({
          id,
          content: markdownContent,
          html,
        });

        const htmlMarker = `<span class="marginalia-marker" data-marginalia-id="${id}" id="marginalia-ref-${id}"><a href="#marginalia-${id}"><sup class="marginalia-ref">${id}</sup></a><span class="marginalia-content">${html}</span></span>`;

        const htmlNode: Html = {
          type: "html",
          value: htmlMarker,
        };
        newChildren.push(htmlNode);

        buffer = null;
      };

      const flushAsLiteral = () => {
        if (!buffer) {
          return;
        }

        const literalContent = stripTrailingNewline(
          toMarkdown({ type: "root", children: buffer }),
        );
        const literalText = `{{${literalContent}`;

        const literalNode: Text = {
          type: "text",
          value: literalText,
        };
        newChildren.push(literalNode);

        buffer = null;
      };

      for (const node of nodes) {
        if (node.type === "text") {
          let text = (node as Text).value;

          while (text.length > 0) {
            if (buffer) {
              const endIndex = text.indexOf("}}");

              if (endIndex === -1) {
                buffer.push({
                  type: "text",
                  value: text,
                } as Text);
                text = "";
              } else {
                const contentPortion = text.slice(0, endIndex);
                if (contentPortion) {
                  buffer.push({
                    type: "text",
                    value: contentPortion,
                  } as Text);
                }
                text = text.slice(endIndex + 2);
                await flushAsNote();
              }
            } else {
              const startIndex = text.indexOf("{{");

              if (startIndex === -1) {
                newChildren.push({
                  type: "text",
                  value: text,
                } as Text);
                text = "";
              } else {
                if (startIndex > 0) {
                  newChildren.push({
                    type: "text",
                    value: text.slice(0, startIndex),
                  } as Text);
                }
                text = text.slice(startIndex + 2);
                buffer = [];
              }
            }
          }
        } else if (buffer) {
          buffer.push(node);
        } else {
          if (isParent(node) && Array.isArray(node.children)) {
            // TODO(sweep): Replace 'any' cast with proper type assertion
            node.children = (await processChildren(
              node.children as RootContent[],
            )) as any;
          }
          newChildren.push(node);
        }
      }

      if (buffer) {
        flushAsLiteral();
      }

      return newChildren;
    }

    function isParent(node: RootContent): node is Parent & RootContent {
      // TODO(sweep): Replace 'any' with proper type guard pattern
      return typeof (node as any).children !== "undefined";
    }

    tree.children = await processChildren(tree.children);

    // Store marginalia data in frontmatter
    if (!file.data.astro) {
      file.data.astro = {};
    }
    if (!file.data.astro.frontmatter) {
      file.data.astro.frontmatter = {};
    }

    file.data.astro.frontmatter.marginalia = marginalia;

    return tree;
  };
}

// Extend VFile data types
declare module "vfile" {
  interface DataMap {
    marginalia?: MarginaliaEntry[];
  }
}

export default marginalia;
