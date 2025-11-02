import { describe, it, expect } from "vitest";
import { wikilinkRegex } from "./wikilinks";

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
