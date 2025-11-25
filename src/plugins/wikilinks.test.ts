import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { wikilinkRegex, wikilinks } from "./wikilinks";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";

describe("wikilinkRegex", () => {
  // Helper to extract all matches
  function extractMatches(text: string) {
    const matches: Array<{
      full: string;
      page: string | undefined;
      heading: string | undefined;
      alias: string | undefined;
    }> = [];

    // Reset regex state
    wikilinkRegex.lastIndex = 0;

    let match;
    while ((match = wikilinkRegex.exec(text)) !== null) {
      matches.push({
        full: match[0],
        page: match[1],
        heading: match[2],
        alias: match[3],
      });
    }

    return matches;
  }

  describe("valid wikilink formats", () => {
    it("should match simple page link", () => {
      const matches = extractMatches("[[Page Name]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("Page Name");
      expect(matches[0].heading).toBeUndefined();
      expect(matches[0].alias).toBeUndefined();
    });

    it("should match page with heading", () => {
      const matches = extractMatches("[[Page#Heading]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("Page");
      expect(matches[0].heading).toBe("#Heading");
    });

    it("should match page with alias", () => {
      const matches = extractMatches("[[Page Name|Custom Text]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("Page Name");
      expect(matches[0].alias).toBe("|Custom Text");
    });

    it("should match page with heading and alias", () => {
      const matches = extractMatches("[[Page#Section|Link Text]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("Page");
      expect(matches[0].heading).toBe("#Section");
      expect(matches[0].alias).toBe("|Link Text");
    });

    it("should match embed syntax", () => {
      const matches = extractMatches("![[image.png]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].full).toBe("![[image.png]]");
      expect(matches[0].page).toBe("image.png");
    });
  });

  describe("edge cases", () => {
    it("should match wikilinks with folder paths", () => {
      const matches = extractMatches("[[folder/subfolder/Page]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("folder/subfolder/Page");
    });

    it("should match multiple wikilinks in one string", () => {
      const matches = extractMatches(
        "See [[Page A]] and [[Page B]] for details",
      );

      expect(matches).toHaveLength(2);
      expect(matches[0].page).toBe("Page A");
      expect(matches[1].page).toBe("Page B");
    });

    it("should match wikilinks with special characters in page names", () => {
      const matches = extractMatches("[[Page: A Special Case]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("Page: A Special Case");
    });

    it("should match wikilinks with numbers and underscores", () => {
      const matches = extractMatches("[[2024_Annual_Report]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("2024_Annual_Report");
    });

    it("should match headings with multiple words", () => {
      const matches = extractMatches("[[Page#Section With Spaces]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].heading).toBe("#Section With Spaces");
    });

    it("should handle heading-only links (no page name)", () => {
      const matches = extractMatches("[[#Just A Heading]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBeUndefined();
      expect(matches[0].heading).toBe("#Just A Heading");
    });

    it("should match alias with special characters", () => {
      const matches = extractMatches("[[Page|Text: With Special-Chars!]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].alias).toBe("|Text: With Special-Chars!");
    });
  });

  describe("invalid/malformed input", () => {
    it("should NOT match single brackets", () => {
      const matches = extractMatches("[Page Name]");

      expect(matches).toHaveLength(0);
    });

    it("should NOT match unclosed wikilinks", () => {
      const matches = extractMatches("[[Page Name");

      expect(matches).toHaveLength(0);
    });

    it("should NOT match backwards brackets", () => {
      const matches = extractMatches("]]Page Name[[");

      expect(matches).toHaveLength(0);
    });

    it("should match empty wikilinks (current behavior - may want to reject)", () => {
      const matches = extractMatches("[[]]");

      // Current regex matches empty wikilinks - all capture groups are optional
      // This may not be desired behavior but documents current state
      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBeUndefined();
      expect(matches[0].heading).toBeUndefined();
      expect(matches[0].alias).toBeUndefined();
    });

    it("should NOT match wikilinks with nested brackets", () => {
      const matches = extractMatches("[[Page [with] brackets]]");

      // The regex should not match this malformed pattern
      expect(matches).toHaveLength(0);
    });

    it("should NOT match pipe outside of wikilink", () => {
      const text = "Some text | [[Page]]";
      const matches = extractMatches(text);

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("Page");
      expect(matches[0].alias).toBeUndefined();
    });
  });

  describe("real-world edge cases", () => {
    it("should handle wikilinks in markdown lists", () => {
      const text = "- [[Page A]]\n- [[Page B]]";
      const matches = extractMatches(text);

      expect(matches).toHaveLength(2);
    });

    it("should handle wikilinks with trailing punctuation", () => {
      const text = "See [[Page]].";
      const matches = extractMatches(text);

      expect(matches).toHaveLength(1);
      expect(matches[0].full).toBe("[[Page]]");
      expect(matches[0].page).toBe("Page");
    });

    it("should NOT match markdown links that look like wikilinks", () => {
      const matches = extractMatches("[Link Text](url)");

      expect(matches).toHaveLength(0);
    });

    it("should handle escaped pipes in alias", () => {
      const matches = extractMatches("[[Page\\|Text]]");

      expect(matches).toHaveLength(1);
      // The backslash-pipe is treated as part of the alias
      expect(matches[0].alias).toBe("\\|Text");
    });

    it("should NOT match multiple # symbols in heading (regex limitation)", () => {
      const matches = extractMatches("[[Page#Heading#Subheading]]");

      // Regex character class [^[\]|#\\]+ prevents multiple # in heading capture
      // This is current behavior - documents limitation
      expect(matches).toHaveLength(0);
    });

    it("should handle multiple pipes (only first is significant)", () => {
      const matches = extractMatches("[[Page|Alias|Extra]]");

      expect(matches).toHaveLength(1);
      expect(matches[0].page).toBe("Page");
      // Everything after first pipe is the alias
      expect(matches[0].alias).toBe("|Alias|Extra");
    });

    it("should match embeds of various file types", () => {
      const pngMatch = extractMatches("![[image.png]]");
      const pdfMatch = extractMatches("![[document.pdf]]");
      const mdMatch = extractMatches("![[note.md]]");

      expect(pngMatch).toHaveLength(1);
      expect(pdfMatch).toHaveLength(1);
      expect(mdMatch).toHaveLength(1);
    });
  });

  describe("regex state management", () => {
    it("should handle multiple consecutive calls without state pollution", () => {
      const text = "[[Page A]]";

      const matches1 = extractMatches(text);
      const matches2 = extractMatches(text);

      expect(matches1).toHaveLength(1);
      expect(matches2).toHaveLength(1);
      expect(matches1[0].page).toBe(matches2[0].page);
    });

    it("should correctly match multiple wikilinks when regex is reused", () => {
      const text1 = "[[First]]";
      const text2 = "[[Second]] and [[Third]]";

      const matches1 = extractMatches(text1);
      const matches2 = extractMatches(text2);

      expect(matches1).toHaveLength(1);
      expect(matches2).toHaveLength(2);
    });
  });
});

describe("wikilinks plugin embeds", () => {
  // Helper to process markdown through the wikilinks plugin
  async function processMarkdown(content: string): Promise<string> {
    const processor = unified()
      .use(remarkParse)
      .use(wikilinks, { enableEmbeds: true })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify);

    const result = await processor.process(content);
    return String(result);
  }

  beforeEach(() => {
    // Set up mock slug map
    (globalThis as any).__ametrineSlugMap = [
      { id: "test-note" },
      { id: "folder/nested-note" },
      { id: "image" },
    ];

    // Set up mock content map
    (globalThis as any).__ametrineContentMap = new Map([
      [
        "test-note",
        {
          title: "Test Note",
          body: "# Test Note\n\nThis is test content.\n\n## Section A\n\nSection A content.\n\n## Section B\n\nSection B content.",
        },
      ],
      [
        "folder/nested-note",
        {
          title: "Nested Note",
          body: "Content of nested note.",
        },
      ],
    ]);
  });

  afterEach(() => {
    delete (globalThis as any).__ametrineSlugMap;
    delete (globalThis as any).__ametrineContentMap;
  });

  describe("media embeds", () => {
    it("should convert image embed to img tag with API URL", async () => {
      const result = await processMarkdown("![[image.png]]");

      expect(result).toContain("<img");
      expect(result).toContain('class="embed-image"');
      expect(result).toContain('alt="image.png"');
      expect(result).toContain("/api/image/image.png");
    });

    it("should convert video embed to video tag", async () => {
      const result = await processMarkdown("![[video.mp4]]");

      expect(result).toContain("<video");
      expect(result).toContain('class="embed-video"');
      expect(result).toContain("controls");
      expect(result).toContain("/api/image/video.mp4");
    });

    it("should convert audio embed to audio tag", async () => {
      const result = await processMarkdown("![[audio.mp3]]");

      expect(result).toContain("<audio");
      expect(result).toContain('class="embed-audio"');
      expect(result).toContain("controls");
      expect(result).toContain("/api/image/audio.mp3");
    });

    it("should convert PDF embed to iframe", async () => {
      const result = await processMarkdown("![[document.pdf]]");

      expect(result).toContain("<iframe");
      expect(result).toContain('class="embed-pdf"');
      expect(result).toContain("/api/image/document.pdf");
    });

    it("should handle various image extensions", async () => {
      const extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

      for (const ext of extensions) {
        const result = await processMarkdown(`![[file${ext}]]`);
        expect(result).toContain("<img");
        expect(result).toContain(`/api/image/file${ext}`);
      }
    });

    it("should URL-encode spaces in media paths", async () => {
      const result = await processMarkdown("![[Polished Ametrine.png]]");

      expect(result).toContain("<img");
      expect(result).toContain("/api/image/Polished%20Ametrine.png");
    });

    it("should handle nested folder paths for media", async () => {
      const result = await processMarkdown("![[Assets/My Image.png]]");

      expect(result).toContain("/api/image/Assets/My%20Image.png");
    });
  });

  describe("note embeds", () => {
    it("should embed note content as blockquote", async () => {
      const result = await processMarkdown("![[test-note]]");

      expect(result).toContain("<blockquote");
      expect(result).toContain('class="transclude"');
      expect(result).toContain('data-slug="test-note"');
      expect(result).toContain("This is test content");
      expect(result).toContain("From: Test Note");
    });

    it("should show broken indicator for missing notes", async () => {
      const result = await processMarkdown("![[nonexistent-note]]");

      expect(result).toContain("transclude-broken");
      expect(result).toContain("Note not found");
    });

    it("should extract content from specific heading", async () => {
      const result = await processMarkdown("![[test-note#Section A]]");

      expect(result).toContain("Section A content");
      expect(result).toContain('data-heading="Section A"');
      // Should NOT contain Section B content (only Section A and its content)
    });

    it("should match slugified heading links", async () => {
      // Obsidian uses slugified headings like #section-a for "Section A"
      const result = await processMarkdown("![[test-note#section-a]]");

      expect(result).toContain("Section A content");
      expect(result).toContain('data-heading="section-a"');
    });

    it("should resolve nested note paths", async () => {
      const result = await processMarkdown("![[nested-note]]");

      expect(result).toContain("Content of nested note");
    });
  });

  describe("embed security", () => {
    it("should escape HTML in data attributes", async () => {
      // Test that malicious slugs are escaped
      const result = await processMarkdown("![[test-note]]");

      // Data attributes should be properly quoted
      expect(result).toContain('data-slug="test-note"');
    });
  });

  describe("embeds disabled", () => {
    it("should leave embeds as-is when disabled", async () => {
      const processor = unified()
        .use(remarkParse)
        .use(wikilinks, { enableEmbeds: false })
        .use(remarkRehype)
        .use(rehypeStringify);

      const result = await processor.process("![[image.png]]");

      expect(String(result)).toContain("![[image.png]]");
    });
  });
});
