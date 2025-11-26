/**
 * Notebook rendering - converts notebook cells to HTML
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeCallouts from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { createHighlighter, type Highlighter } from "shiki";
import { AnsiUp } from "ansi_up";

import type {
  Notebook,
  CodeCell,
  MarkdownCell,
  CellOutput,
  RenderedNotebook,
  TocEntry,
} from "./types";
import {
  cellSourceToString,
  isMarkdownCell,
  getNotebookLanguage,
} from "./processor";
import { highlights } from "../../plugins/highlights";

// Singleton highlighter instance
let highlighterInstance: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "python",
        "javascript",
        "typescript",
        "r",
        "julia",
        "rust",
        "sql",
        "bash",
        "shell",
        "json",
        "yaml",
        "markdown",
        "html",
        "css",
      ],
    });
  }
  return highlighterInstance;
}

// ANSI converter instance
const ansiUp = new AnsiUp();
ansiUp.use_classes = true;

/**
 * Create a markdown processor for notebook markdown cells
 * Uses a subset of the main pipeline (no wikilinks transform needed here)
 */
function createMarkdownProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkGfm)
    .use(highlights)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex, { output: "html" })
    .use(rehypeSlug)
    .use(rehypeCallouts, { theme: "obsidian" })
    .use(rehypeRaw)
    .use(rehypeStringify);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Render a markdown cell to HTML
 */
async function renderMarkdownCell(
  cell: MarkdownCell,
  isFirst: boolean,
): Promise<string> {
  let source = cellSourceToString(cell.source);

  // Skip YAML frontmatter in first cell
  if (isFirst) {
    const yamlMatch = source.match(/^---\n[\s\S]*?\n---\n*/);
    if (yamlMatch) {
      source = source.slice(yamlMatch[0].length);
    }
  }

  if (!source.trim()) return "";

  const processor = createMarkdownProcessor();
  const result = await processor.process(source);
  return `<div class="notebook-cell notebook-markdown-cell">${String(result)}</div>`;
}

/**
 * Render a code cell with syntax highlighting
 * Uses expressive-code compatible CSS variable names (--0, --1)
 */
async function renderCodeCell(
  cell: CodeCell,
  language: string,
): Promise<string> {
  const source = cellSourceToString(cell.source);
  const highlighter = await getHighlighter();

  // Check if language is loaded, fallback to text if not
  const loadedLangs = highlighter.getLoadedLanguages();
  const lang = loadedLangs.includes(language) ? language : "text";

  const highlighted = highlighter.codeToHtml(source, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: "light",
  });

  const executionCount =
    cell.execution_count !== null
      ? `<span class="cell-execution-count">${cell.execution_count}</span>`
      : "";

  const outputsHtml = cell.outputs.map(renderOutput).filter(Boolean).join("\n");

  return `
<div class="notebook-cell notebook-code-cell">
  ${executionCount}
  <div class="cell-input">${highlighted}</div>
  ${outputsHtml ? `<div class="cell-outputs">${outputsHtml}</div>` : ""}
</div>`;
}

/**
 * Render a cell output based on its type
 */
function renderOutput(output: CellOutput): string {
  switch (output.output_type) {
    case "execute_result":
    case "display_data":
      return renderMimeBundle(output.data || {});
    case "stream":
      return renderStream(
        output.name,
        Array.isArray(output.text) ? output.text.join("") : output.text,
      );
    case "error":
      return renderError(output.ename, output.evalue, output.traceback);
    default:
      return "";
  }
}

/**
 * Render a mime bundle (execute_result or display_data)
 * Priority order determines which format to use
 */
function renderMimeBundle(data: Record<string, string | string[]>): string {
  const priorities = [
    "text/html",
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "image/gif",
    "text/markdown",
    "text/latex",
    "application/json",
    "text/plain",
  ];

  for (const mime of priorities) {
    if (data[mime]) {
      const content = Array.isArray(data[mime])
        ? data[mime].join("")
        : data[mime];
      return renderMimeData(mime, content);
    }
  }

  return "";
}

/**
 * Render content for a specific mime type
 */
function renderMimeData(mime: string, content: string): string {
  switch (mime) {
    case "text/html":
      // Embed HTML directly (already sanitized by Jupyter typically)
      return `<div class="cell-output cell-output-html">${content}</div>`;

    case "image/png":
    case "image/jpeg":
    case "image/gif":
      return `<div class="cell-output cell-output-image"><img src="data:${mime};base64,${content}" alt="Output" loading="lazy" /></div>`;

    case "image/svg+xml":
      return `<div class="cell-output cell-output-svg">${content}</div>`;

    case "text/markdown":
      // Could process through markdown renderer, but keeping simple for now
      return `<div class="cell-output cell-output-markdown">${escapeHtml(content)}</div>`;

    case "text/latex":
      return `<div class="cell-output cell-output-latex">$$${escapeHtml(content)}$$</div>`;

    case "application/json":
      try {
        const formatted = JSON.stringify(JSON.parse(content), null, 2);
        return `<div class="cell-output cell-output-json"><pre><code>${escapeHtml(formatted)}</code></pre></div>`;
      } catch {
        return `<div class="cell-output cell-output-json"><pre><code>${escapeHtml(content)}</code></pre></div>`;
      }

    case "text/plain":
    default:
      // Process ANSI codes for text output
      const htmlContent = ansiUp.ansi_to_html(content);
      return `<div class="cell-output cell-output-text"><pre>${htmlContent}</pre></div>`;
  }
}

/**
 * Render stream output (stdout/stderr)
 */
function renderStream(name: string, text: string): string {
  const htmlContent = ansiUp.ansi_to_html(text);
  const streamClass =
    name === "stderr" ? "cell-output-stderr" : "cell-output-stdout";
  return `<div class="cell-output cell-output-stream ${streamClass}"><pre>${htmlContent}</pre></div>`;
}

/**
 * Render error output with traceback
 */
function renderError(
  ename: string,
  evalue: string,
  traceback: string[],
): string {
  const tracebackHtml = traceback
    .map((line) => ansiUp.ansi_to_html(line))
    .join("\n");
  return `
<div class="cell-output cell-output-error">
  <div class="error-header"><strong>${escapeHtml(ename)}</strong>: ${escapeHtml(evalue)}</div>
  <pre class="error-traceback">${tracebackHtml}</pre>
</div>`;
}

/**
 * Extract table of contents from rendered notebook
 * (looks for headings in markdown cells)
 */
function extractToc(notebook: Notebook): TocEntry[] {
  const toc: TocEntry[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;

  for (const cell of notebook.cells) {
    if (!isMarkdownCell(cell)) continue;

    const source = cellSourceToString(cell.source);
    let match;

    while ((match = headingRegex.exec(source)) !== null) {
      const depth = match[1].length;
      const text = match[2].trim();
      // Generate a simple slug (rehype-slug will add actual IDs)
      const slug = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      toc.push({ depth, text, slug });
    }
  }

  return toc;
}

/**
 * Render a complete notebook to HTML
 */
export async function renderNotebook(
  notebook: Notebook,
): Promise<RenderedNotebook> {
  const language = getNotebookLanguage(notebook);
  const htmlParts: string[] = [];
  const links: string[] = []; // Wikilinks are extracted separately by processor

  for (let i = 0; i < notebook.cells.length; i++) {
    const cell = notebook.cells[i];

    if (isMarkdownCell(cell)) {
      const html = await renderMarkdownCell(cell, i === 0);
      if (html) htmlParts.push(html);
    } else if (cell.cell_type === "code") {
      const html = await renderCodeCell(cell as CodeCell, language);
      htmlParts.push(html);
    }
    // Skip raw cells for now
  }

  const toc = extractToc(notebook);

  return {
    html: `<div class="notebook-container">${htmlParts.join("\n")}</div>`,
    toc,
    links,
  };
}
