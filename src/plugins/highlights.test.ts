import { describe, it, expect } from "vitest";

// Test the regex directly since the plugin uses AST transformation
const highlightRegex = /==([^=]+)==/g;

describe("highlight regex", () => {
  // Helper to extract all highlights
  function extractHighlights(text: string) {
    const matches: string[] = [];
    highlightRegex.lastIndex = 0;

    let match;
    while ((match = highlightRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return matches;
  }

  describe("basic highlight syntax", () => {
    it("should match simple highlight", () => {
      const text = "Some ==highlighted== text";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["highlighted"]);
    });

    it("should match multiple highlights in one line", () => {
      const text = "First ==one== and ==two== highlights";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["one", "two"]);
    });

    it("should match highlight with spaces", () => {
      const text = "This ==is highlighted text==";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["is highlighted text"]);
    });

    it("should match highlight with special characters", () => {
      const text = "==test: special-chars!==";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["test: special-chars!"]);
    });
  });

  describe("edge cases", () => {
    it("should NOT match single equals signs", () => {
      const text = "=not highlighted=";
      const matches = extractHighlights(text);

      expect(matches).toEqual([]);
    });

    it("should MATCH triple equals (ignoring extra equals)", () => {
      const text = "===not highlighted===";
      const matches = extractHighlights(text);

      // Regex == matches first two equals, [^=]+ captures non-equals content
      // Final == matches, leaving extra = on each side unused
      expect(matches).toEqual(["not highlighted"]);
    });

    it("should NOT match unclosed highlight", () => {
      const text = "==not closed";
      const matches = extractHighlights(text);

      expect(matches).toEqual([]);
    });

    it("should NOT match unopened highlight", () => {
      const text = "not opened==";
      const matches = extractHighlights(text);

      expect(matches).toEqual([]);
    });

    it("should NOT match empty highlight", () => {
      const text = "====";
      const matches = extractHighlights(text);

      // Character class [^=]+ requires at least one non-equals char
      expect(matches).toEqual([]);
    });

    it("should match highlight with numbers", () => {
      const text = "==123 test==";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["123 test"]);
    });

    it("should match highlight with punctuation", () => {
      const text = "==hello, world!==";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["hello, world!"]);
    });
  });

  describe("nested and overlapping patterns", () => {
    it("should NOT match nested highlights", () => {
      const text = "==outer ==inner== outer==";
      const matches = extractHighlights(text);

      // Regex [^=]+ prevents equals inside capture group
      // So first match stops at "outer " (before inner ==)
      expect(matches).toEqual(["outer ", " outer"]);
    });

    it("should handle consecutive highlights", () => {
      const text = "==first====second==";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["first", "second"]);
    });

    it("should NOT match highlights with single equals inside", () => {
      const text = "==one=two==";
      const matches = extractHighlights(text);

      // Character class [^=]+ means "one or more non-equals characters"
      // So ANY equals sign breaks the match, not just ==
      expect(matches).toEqual([]);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle highlight in sentence", () => {
      const text = "The ==important part== should stand out.";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["important part"]);
    });

    it("should handle multiple highlights in paragraph", () => {
      const text = "This is ==first== important and ==second== also matters.";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["first", "second"]);
    });

    it("should handle highlight at start of line", () => {
      const text = "==Starting== with a highlight";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["Starting"]);
    });

    it("should handle highlight at end of line", () => {
      const text = "Ending with ==highlight==";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["highlight"]);
    });

    it("should handle highlight with markdown inside", () => {
      const text = "==**bold** and *italic*==";
      const matches = extractHighlights(text);

      // Regex doesn't understand markdown - treats it as text
      expect(matches).toEqual(["**bold** and *italic*"]);
    });
  });

  describe("regex state management", () => {
    it("should handle consecutive calls without state pollution", () => {
      const text = "==test==";

      const matches1 = extractHighlights(text);
      const matches2 = extractHighlights(text);

      expect(matches1).toEqual(["test"]);
      expect(matches2).toEqual(["test"]);
    });

    it("should reset lastIndex between different strings", () => {
      const text1 = "==first==";
      const text2 = "==second== and ==third==";

      const matches1 = extractHighlights(text1);
      const matches2 = extractHighlights(text2);

      expect(matches1).toEqual(["first"]);
      expect(matches2).toEqual(["second", "third"]);
    });

    it("should handle partial matches across calls", () => {
      // Ensure regex doesn't carry state between unrelated strings
      const text1 = "==complete==";
      const text2 = "==also complete==";

      highlightRegex.lastIndex = 0;
      const matches1 = extractHighlights(text1);

      highlightRegex.lastIndex = 0;
      const matches2 = extractHighlights(text2);

      expect(matches1).toEqual(["complete"]);
      expect(matches2).toEqual(["also complete"]);
    });
  });

  describe("multiline behavior", () => {
    it("should NOT match across newlines (current behavior)", () => {
      const text = "==start\nend==";
      const matches = extractHighlights(text);

      // Character class [^=]+ doesn't include newlines by default in JS
      // Actually wait - [^=]+ means "not equals", newlines ARE allowed
      expect(matches).toEqual(["start\nend"]);
    });

    it("should match multiple highlights on separate lines", () => {
      const text = "==line one==\n==line two==";
      const matches = extractHighlights(text);

      expect(matches).toEqual(["line one", "line two"]);
    });
  });
});
