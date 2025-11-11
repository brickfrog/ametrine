import { glob } from "fast-glob";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";

/**
 * Markdown linting script inspired by Gwern's markdown-lint.sh
 * Validates markdown syntax, frontmatter, and common issues
 * Run with: bun run scripts/lint-markdown.ts
 */

interface LintError {
  file: string;
  line?: number;
  severity: "error" | "warning";
  message: string;
  category: string;
}

interface LintConfig {
  titleMinLength: number;
  titleMaxLength: number;
  descriptionMinLength: number;
  descriptionMaxLength: number;
  requiredFields: string[];
  checkEmptyLinks: boolean;
  checkUnbalancedBrackets: boolean;
  checkMalformedWikilinks: boolean;
}

const defaultConfig: LintConfig = {
  titleMinLength: 1,
  titleMaxLength: 100,
  descriptionMinLength: 0,
  descriptionMaxLength: 500,
  requiredFields: ["title"],
  checkEmptyLinks: true,
  checkUnbalancedBrackets: true,
  checkMalformedWikilinks: true,
};

class MarkdownLinter {
  private errors: LintError[] = [];
  private warnings: LintError[] = [];
  private config: LintConfig;

  constructor(config: Partial<LintConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private addError(error: Omit<LintError, "severity">) {
    this.errors.push({ ...error, severity: "error" });
  }

  private addWarning(warning: Omit<LintError, "severity">) {
    this.warnings.push({ ...warning, severity: "warning" });
  }

  /**
   * Extract frontmatter from markdown content
   */
  private extractFrontmatter(content: string): {
    frontmatter: Record<string, unknown> | null;
    contentStart: number;
  } {
    const lines = content.split("\n");

    if (lines[0] !== "---") {
      return { frontmatter: null, contentStart: 0 };
    }

    const endIndex = lines.findIndex((line, i) => i > 0 && line === "---");
    if (endIndex === -1) {
      return { frontmatter: null, contentStart: 0 };
    }

    const yamlContent = lines.slice(1, endIndex).join("\n");
    try {
      const frontmatter = parseYaml(yamlContent) as Record<string, unknown>;
      return { frontmatter, contentStart: endIndex + 1 };
    } catch {
      return { frontmatter: null, contentStart: 0 };
    }
  }

  /**
   * Validate frontmatter fields
   */
  private validateFrontmatter(
    file: string,
    frontmatter: Record<string, unknown> | null
  ) {
    if (!frontmatter) {
      this.addError({
        file,
        category: "frontmatter",
        message: "Missing or invalid frontmatter",
      });
      return;
    }

    // Check required fields
    for (const field of this.config.requiredFields) {
      if (!(field in frontmatter) || !frontmatter[field]) {
        this.addError({
          file,
          category: "frontmatter",
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Validate title length
    if (typeof frontmatter.title === "string") {
      const { title } = frontmatter;
      if (title.length < this.config.titleMinLength) {
        this.addError({
          file,
          category: "frontmatter",
          message: `Title too short (${title.length} < ${this.config.titleMinLength})`,
        });
      }
      if (title.length > this.config.titleMaxLength) {
        this.addWarning({
          file,
          category: "frontmatter",
          message: `Title too long (${title.length} > ${this.config.titleMaxLength})`,
        });
      }
    }

    // Validate description length if present
    if (
      typeof frontmatter.description === "string" &&
      frontmatter.description.length > 0
    ) {
      const { description } = frontmatter;
      if (description.length < this.config.descriptionMinLength) {
        this.addWarning({
          file,
          category: "frontmatter",
          message: `Description too short (${description.length} < ${this.config.descriptionMinLength})`,
        });
      }
      if (description.length > this.config.descriptionMaxLength) {
        this.addWarning({
          file,
          category: "frontmatter",
          message: `Description too long (${description.length} > ${this.config.descriptionMaxLength})`,
        });
      }
    }
  }

  /**
   * Check for empty links: []() or [text]()
   */
  private checkEmptyLinks(file: string, content: string, startLine: number) {
    if (!this.config.checkEmptyLinks) return;

    const lines = content.split("\n");
    const emptyLinkRegex = /\[([^\]]*)\]\(\s*\)/g;

    lines.forEach((line, index) => {
      let match;
      while ((match = emptyLinkRegex.exec(line)) !== null) {
        this.addError({
          file,
          line: startLine + index + 1,
          category: "links",
          message: `Empty link found: [${match[1]}]()`,
        });
      }
    });
  }

  /**
   * Check for malformed wikilinks
   */
  private checkMalformedWikilinks(
    file: string,
    content: string,
    startLine: number
  ) {
    if (!this.config.checkMalformedWikilinks) return;

    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Check for single brackets that might be incomplete wikilinks
      const singleOpenBracket = /(?<!\[)\[(?!\[)(?![^\]]*\]\()/g;
      const singleCloseBracket = /(?<!\])\](?!\])/g;

      if (line.match(singleOpenBracket) || line.match(singleCloseBracket)) {
        // This might be valid markdown, so only warn if it looks suspicious
        if (
          line.includes("[[") ||
          line.includes("]]") ||
          line.match(/\[\w+\s+\w+\](?!\()/)
        ) {
          this.addWarning({
            file,
            line: startLine + index + 1,
            category: "wikilinks",
            message: "Possibly malformed wikilink or mixed bracket syntax",
          });
        }
      }

      // Check for incomplete wikilinks
      if (line.includes("[[") && !line.includes("]]")) {
        this.addError({
          file,
          line: startLine + index + 1,
          category: "wikilinks",
          message: "Unclosed wikilink: [[ without matching ]]",
        });
      }
      if (line.includes("]]") && !line.includes("[[")) {
        this.addError({
          file,
          line: startLine + index + 1,
          category: "wikilinks",
          message: "Unmatched closing brackets: ]] without opening [[",
        });
      }

      // Check for empty wikilinks
      if (line.match(/\[\[\s*\]\]/)) {
        this.addError({
          file,
          line: startLine + index + 1,
          category: "wikilinks",
          message: "Empty wikilink: [[]]",
        });
      }
    });
  }

  /**
   * Check for unbalanced brackets and parentheses
   */
  private checkUnbalancedBrackets(
    file: string,
    content: string,
    startLine: number
  ) {
    if (!this.config.checkUnbalancedBrackets) return;

    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Skip code blocks
      if (line.trim().startsWith("```") || line.trim().startsWith("    ")) {
        return;
      }

      // Count brackets
      const openSquare = (line.match(/\[/g) || []).length;
      const closeSquare = (line.match(/\]/g) || []).length;
      const openParen = (line.match(/\(/g) || []).length;
      const closeParen = (line.match(/\)/g) || []).length;

      if (openSquare !== closeSquare) {
        this.addWarning({
          file,
          line: startLine + index + 1,
          category: "syntax",
          message: `Unbalanced square brackets (${openSquare} open, ${closeSquare} close)`,
        });
      }

      if (openParen !== closeParen) {
        this.addWarning({
          file,
          line: startLine + index + 1,
          category: "syntax",
          message: `Unbalanced parentheses (${openParen} open, ${closeParen} close)`,
        });
      }
    });
  }

  /**
   * Lint a single markdown file
   */
  async lintFile(filePath: string) {
    try {
      const content = await readFile(filePath, "utf-8");
      const { frontmatter, contentStart } = this.extractFrontmatter(content);
      const lines = content.split("\n");
      const bodyContent = lines.slice(contentStart).join("\n");

      // Validate frontmatter
      this.validateFrontmatter(filePath, frontmatter);

      // Check content
      this.checkEmptyLinks(filePath, bodyContent, contentStart);
      this.checkMalformedWikilinks(filePath, bodyContent, contentStart);
      this.checkUnbalancedBrackets(filePath, bodyContent, contentStart);
    } catch (error) {
      this.addError({
        file: filePath,
        category: "file",
        message: `Failed to read file: ${error}`,
      });
    }
  }

  /**
   * Lint all markdown files in the vault
   */
  async lintAll() {
    console.log("🔍 Linting markdown files...\n");

    const files = await glob("src/content/vault/**/*.md");
    console.log(`📝 Found ${files.length} markdown files\n`);

    for (const file of files) {
      await this.lintFile(file);
    }

    return this.getResults();
  }

  /**
   * Get linting results
   */
  getResults() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      hasErrors: this.errors.length > 0,
      hasWarnings: this.warnings.length > 0,
    };
  }

  /**
   * Print results to console
   */
  printResults() {
    const { errors, warnings } = this;

    if (errors.length === 0 && warnings.length === 0) {
      console.log("✅ All markdown files are valid!\n");
      return;
    }

    if (errors.length > 0) {
      console.error(`❌ Found ${errors.length} error(s):\n`);

      // Group by category
      const byCategory = new Map<string, LintError[]>();
      for (const error of errors) {
        const list = byCategory.get(error.category) || [];
        list.push(error);
        byCategory.set(error.category, list);
      }

      for (const [category, items] of byCategory) {
        console.error(`  [${category.toUpperCase()}]`);
        for (const item of items) {
          const location = item.line ? `:${item.line}` : "";
          console.error(`    ${item.file}${location}`);
          console.error(`      → ${item.message}`);
        }
        console.error("");
      }
    }

    if (warnings.length > 0) {
      console.warn(`⚠️  Found ${warnings.length} warning(s):\n`);

      // Group by category
      const byCategory = new Map<string, LintError[]>();
      for (const warning of warnings) {
        const list = byCategory.get(warning.category) || [];
        list.push(warning);
        byCategory.set(warning.category, list);
      }

      for (const [category, items] of byCategory) {
        console.warn(`  [${category.toUpperCase()}]`);
        for (const item of items) {
          const location = item.line ? `:${item.line}` : "";
          console.warn(`    ${item.file}${location}`);
          console.warn(`      → ${item.message}`);
        }
        console.warn("");
      }
    }
  }
}

async function main() {
  const linter = new MarkdownLinter();
  await linter.lintAll();
  linter.printResults();

  const { hasErrors } = linter.getResults();
  process.exit(hasErrors ? 1 : 0);
}

main();
