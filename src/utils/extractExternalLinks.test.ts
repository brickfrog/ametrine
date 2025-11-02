import { describe, it, expect } from "vitest";
import { extractExternalLinks } from "./extractExternalLinks";

describe("extractExternalLinks", () => {
  describe("markdown link extraction", () => {
    it("should extract simple markdown link", () => {
      const markdown = "[Google](https://google.com)";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://google.com");
      expect(links[0].domain).toBe("google.com");
      expect(links[0].title).toBe("Google");
      expect(links[0].source).toBe("markdown");
    });

    it("should extract multiple markdown links", () => {
      const markdown =
        "[Google](https://google.com) and [GitHub](https://github.com)";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(2);
      expect(links[0].domain).toBe("google.com");
      expect(links[1].domain).toBe("github.com");
    });

    it("should NOT extract non-HTTP links", () => {
      const markdown =
        "[Local](/local/page) and [Mailto](mailto:test@mail.com)";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(0);
    });

    it("should handle markdown links with query parameters", () => {
      const markdown = "[Search](https://github.com/search?q=test&lang=en)";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://github.com/search?q=test&lang=en");
    });

    it("should handle markdown links with URL fragments", () => {
      const markdown = "[Docs](https://github.com/docs#section)";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://github.com/docs#section");
    });
  });

  describe("bare URL extraction", () => {
    it("should extract bare HTTP URL", () => {
      const markdown = "Visit http://wikipedia.org for details";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("http://wikipedia.org");
      expect(links[0].source).toBe("markdown");
    });

    it("should extract bare HTTPS URL", () => {
      const markdown = "Visit https://github.com for details";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://github.com");
    });

    it("should extract multiple bare URLs", () => {
      const markdown =
        "See https://github.com and also https://stackoverflow.com";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(2);
    });

    it("should NOT extract bare URL if already in markdown link", () => {
      const markdown =
        "[GitHub](https://github.com) and also https://stackoverflow.com";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(2);
      // Should only have github.com once
      const githubLinks = links.filter((l) => l.domain === "github.com");
      expect(githubLinks).toHaveLength(1);
    });
  });

  describe("edge cases with special characters", () => {
    it("should NOT fully capture URLs with unbalanced parens in markdown links", () => {
      const markdown =
        "[Wiki](https://en.wikipedia.org/wiki/Test_(disambiguation))";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      // Markdown regex `[^)]+` stops at first closing paren
      // Limitation: can't handle URLs with parens in markdown links
      expect(links[0].url).toBe(
        "https://en.wikipedia.org/wiki/Test_(disambiguation",
      );
    });

    it("should INCLUDE period in bare URLs (regex behavior)", () => {
      const markdown = "See https://github.com.";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      // Bare URL regex includes period - doesn't stop at punctuation
      // `new URL()` will throw on invalid URLs, so only valid ones are kept
      expect(links[0].url).toBe("https://github.com.");
    });

    it("should INCLUDE comma in bare URLs (regex behavior)", () => {
      const markdown = "Visit https://github.com, it's great";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      // Bare URL regex includes comma - no special punctuation handling
      expect(links[0].url).toBe("https://github.com,");
    });

    it("should handle URLs with dashes and underscores", () => {
      const markdown = "https://analytics.umami.is/path_with-dash";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://analytics.umami.is/path_with-dash");
    });

    it("should handle URLs in parentheses", () => {
      const markdown = "(See https://github.com for more)";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      // Closing paren should not be included due to character class exclusion
      expect(links[0].url).toBe("https://github.com");
    });

    it("should handle subdomains", () => {
      const markdown = "https://blog.docs.github.com/post";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].domain).toBe("blog.docs.github.com");
    });
  });

  describe("malformed URLs", () => {
    it("should skip invalid URLs in markdown links", () => {
      const markdown = "[Bad](not-a-valid-url)";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(0);
    });

    it("should skip URLs with invalid protocol", () => {
      const markdown = "ftp://files.org and gopher://old.site";
      const links = extractExternalLinks(markdown);

      // Bare URL regex only matches http(s)://
      expect(links).toHaveLength(0);
    });

    it("should handle mixed valid and invalid URLs", () => {
      const markdown = "[Good](https://github.com) [Bad](javascript:alert(1))";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].domain).toBe("github.com");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle URLs in code blocks (they are still extracted)", () => {
      const markdown = "`https://api.github.com/v1/users`";
      const links = extractExternalLinks(markdown);

      // Regex doesn't understand markdown syntax context
      expect(links).toHaveLength(1);
    });

    it("should handle URLs in list items", () => {
      const markdown = `
- https://github.com
- https://stackoverflow.com
- https://wikipedia.org
      `;
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(3);
    });

    it("should handle URLs with port numbers", () => {
      const markdown = "https://localhost:3000/api";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://localhost:3000/api");
    });

    it("should deduplicate same URL appearing multiple times", () => {
      const markdown = "https://github.com and https://github.com again";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
    });

    it("should deduplicate between markdown link and bare URL", () => {
      const markdown = "[GitHub](https://github.com) or https://github.com";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
    });

    it("should convert international domains to punycode", () => {
      const markdown = "https://例え.jp/path";
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      // URL() constructor converts IDN to punycode (ASCII-compatible encoding)
      expect(links[0].domain).toBe("xn--r8jz45g.jp");
    });

    it("should handle very long URLs", () => {
      const longPath = "a".repeat(200);
      const markdown = `https://github.com/${longPath}`;
      const links = extractExternalLinks(markdown);

      expect(links).toHaveLength(1);
      expect(links[0].url).toContain(longPath);
    });
  });

  describe("regex state management", () => {
    it("should handle consecutive calls without state pollution", () => {
      const markdown = "https://github.com";

      const links1 = extractExternalLinks(markdown);
      const links2 = extractExternalLinks(markdown);

      expect(links1).toHaveLength(1);
      expect(links2).toHaveLength(1);
      expect(links1[0].url).toBe(links2[0].url);
    });

    it("should handle different inputs across multiple calls", () => {
      const markdown1 = "https://github.com";
      const markdown2 = "https://stackoverflow.com and https://wikipedia.org";

      const links1 = extractExternalLinks(markdown1);
      const links2 = extractExternalLinks(markdown2);

      expect(links1).toHaveLength(1);
      expect(links2).toHaveLength(2);
    });
  });
});
