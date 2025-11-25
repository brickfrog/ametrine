import { describe, it, expect } from "vitest";
import { buildLinkGraph, calculateReadingMetrics } from "./readingMetrics";
import { slugifyPath } from "./slugify";
import type { Note } from "./filterNotes";

// Extract wikilinks from markdown content (mirrors content loader logic)
function extractLinksFromBody(content: string): string[] {
  const wikilinkRegex =
    /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;
  const links: string[] = [];
  const matches = content.matchAll(wikilinkRegex);
  for (const match of matches) {
    const [full, rawFp] = match;
    // Skip image embeds
    if (full.startsWith("!")) continue;
    if (rawFp) {
      const pageName = rawFp.split("#")[0].trim();
      if (pageName) {
        links.push(slugifyPath(pageName));
      }
    }
  }
  return [...new Set(links)];
}

// Helper to create minimal test notes
function createNote(slug: string, title: string, body: string): Note {
  return {
    id: `${slug}.md`,
    slug,
    body,
    data: {
      title,
      draft: false,
      links: extractLinksFromBody(body),
    },
  } as Note;
}

describe("buildLinkGraph", () => {
  it("should build empty graph for notes with no links", () => {
    const notes = [
      createNote("note-1", "Note 1", "Just some content"),
      createNote("note-2", "Note 2", "More content here"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("note-1")).toEqual([]);
    expect(graph.outgoing.get("note-2")).toEqual([]);
    expect(graph.incoming.get("note-1")).toEqual([]);
    expect(graph.incoming.get("note-2")).toEqual([]);
  });

  it("should detect simple wikilinks", () => {
    const notes = [
      createNote("note-1", "Note 1", "I link to [[Note 2]]"),
      createNote("note-2", "Note 2", "No links here"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("note-1")).toEqual(["note-2"]);
    expect(graph.outgoing.get("note-2")).toEqual([]);
    expect(graph.incoming.get("note-1")).toEqual([]);
    expect(graph.incoming.get("note-2")).toEqual(["note-1"]);
  });

  it("should handle wikilinks with display text", () => {
    const notes = [
      createNote("note-1", "Note 1", "Check out [[Note 2|this cool note]]"),
      createNote("note-2", "Note 2", "Content"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("note-1")).toEqual(["note-2"]);
    expect(graph.incoming.get("note-2")).toEqual(["note-1"]);
  });

  it("should handle wikilinks with heading anchors", () => {
    const notes = [
      createNote("note-1", "Note 1", "See [[Note 2#section]]"),
      createNote("note-2", "Note 2", "Content"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("note-1")).toEqual(["note-2"]);
    expect(graph.incoming.get("note-2")).toEqual(["note-1"]);
  });

  it("should ignore embedded images (wikilinks starting with !)", () => {
    const notes = [
      createNote("note-1", "Note 1", "![[image.png]] and [[Note 2]]"),
      createNote("note-2", "Note 2", "Content"),
    ];

    const graph = buildLinkGraph(notes);

    // Should only have the link to Note 2, not the image
    expect(graph.outgoing.get("note-1")).toEqual(["note-2"]);
  });

  it("should ignore links to non-existent notes", () => {
    const notes = [
      createNote(
        "note-1",
        "Note 1",
        "Link to [[Non Existent Note]] and [[Note 2]]",
      ),
      createNote("note-2", "Note 2", "Content"),
    ];

    const graph = buildLinkGraph(notes);

    // Should only include link to existing note
    expect(graph.outgoing.get("note-1")).toEqual(["note-2"]);
  });

  it("should ignore self-references", () => {
    const notes = [
      createNote("note-1", "Note 1", "I reference [[Note 1]] myself"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("note-1")).toEqual([]);
    expect(graph.incoming.get("note-1")).toEqual([]);
  });

  it("should deduplicate multiple links to same note", () => {
    const notes = [
      createNote(
        "note-1",
        "Note 1",
        "I link to [[Note 2]] multiple times. See [[Note 2]] again!",
      ),
      createNote("note-2", "Note 2", "Content"),
    ];

    const graph = buildLinkGraph(notes);

    // Should only list note-2 once
    expect(graph.outgoing.get("note-1")).toEqual(["note-2"]);
    expect(graph.incoming.get("note-2")).toEqual(["note-1"]);
  });

  it("should handle bidirectional links", () => {
    const notes = [
      createNote("note-1", "Note 1", "Links to [[Note 2]]"),
      createNote("note-2", "Note 2", "Links back to [[Note 1]]"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("note-1")).toEqual(["note-2"]);
    expect(graph.outgoing.get("note-2")).toEqual(["note-1"]);
    expect(graph.incoming.get("note-1")).toEqual(["note-2"]);
    expect(graph.incoming.get("note-2")).toEqual(["note-1"]);
  });

  it("should handle complex multi-note networks", () => {
    const notes = [
      createNote("hub", "Hub", "Links to [[Note A]], [[Note B]], [[Note C]]"),
      createNote("note-a", "Note A", "Links to [[Note B]]"),
      createNote("note-b", "Note B", "Links to [[Note C]]"),
      createNote("note-c", "Note C", "No outgoing links"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("hub")).toEqual(["note-a", "note-b", "note-c"]);
    expect(graph.outgoing.get("note-a")).toEqual(["note-b"]);
    expect(graph.outgoing.get("note-b")).toEqual(["note-c"]);
    expect(graph.outgoing.get("note-c")).toEqual([]);

    expect(graph.incoming.get("note-c")).toEqual(["hub", "note-b"]);
    expect(graph.incoming.get("note-b")).toEqual(["hub", "note-a"]);
  });

  it("should handle notes with special characters in titles", () => {
    const notes = [
      createNote("note-1", "Note 1", "Links to [[Special: Test Note]]"),
      createNote("special-test-note", "Special: Test Note", "Content"),
    ];

    const graph = buildLinkGraph(notes);

    expect(graph.outgoing.get("note-1")).toEqual(["special-test-note"]);
    expect(graph.incoming.get("special-test-note")).toEqual(["note-1"]);
  });
});

describe("calculateReadingMetrics", () => {
  it("should calculate correct metrics for empty collection", () => {
    const notes: Note[] = [];

    const metrics = calculateReadingMetrics(notes);

    expect(metrics.totalWords).toBe(0);
    expect(metrics.averageLinksPerNote).toBe(0);
    expect(metrics.linkedNotesPercentage).toBe(NaN); // 0/0
    expect(metrics.orphanNotes).toEqual([]);
    expect(metrics.mostLinkedNotes).toEqual([]);
  });

  it("should calculate word count correctly", () => {
    const notes = [
      createNote("note-1", "Note 1", "One two three four five"),
      createNote("note-2", "Note 2", "Six seven eight"),
    ];

    const metrics = calculateReadingMetrics(notes);

    expect(metrics.totalWords).toBe(8);
    expect(metrics.averageNoteLength).toBe(4);
  });

  it("should calculate reading time at 200 words per minute", () => {
    // 400 words should be 2 minutes
    const longContent = Array.from({ length: 400 }, () => "word").join(" ");
    const notes = [createNote("long", "Long", longContent)];

    const metrics = calculateReadingMetrics(notes);

    expect(metrics.medianReadingTime).toBe(2);
  });

  it("should calculate median reading time for odd number of notes", () => {
    const notes = [
      createNote(
        "short",
        "Short",
        Array.from({ length: 100 }, () => "a").join(" "),
      ), // 1 min
      createNote(
        "medium",
        "Medium",
        Array.from({ length: 200 }, () => "a").join(" "),
      ), // 1 min
      createNote(
        "long",
        "Long",
        Array.from({ length: 400 }, () => "a").join(" "),
      ), // 2 min
    ];

    const metrics = calculateReadingMetrics(notes);

    // Median of [1, 1, 2] is 1
    expect(metrics.medianReadingTime).toBe(1);
  });

  it("should calculate median reading time for even number of notes", () => {
    const notes = [
      createNote("a", "A", Array.from({ length: 100 }, () => "a").join(" ")), // 1 min
      createNote("b", "B", Array.from({ length: 300 }, () => "a").join(" ")), // 2 min
      createNote("c", "C", Array.from({ length: 500 }, () => "a").join(" ")), // 3 min
      createNote("d", "D", Array.from({ length: 700 }, () => "a").join(" ")), // 4 min
    ];

    const metrics = calculateReadingMetrics(notes);

    // Median of [1, 2, 3, 4] is (2 + 3) / 2 = 2.5
    expect(metrics.medianReadingTime).toBe(2.5);
  });

  it("should identify orphan notes (no incoming or outgoing links)", () => {
    const notes = [
      createNote("orphan", "Orphan", "No links here"),
      createNote("connected", "Connected", "Links to [[Other]]"),
      createNote("other", "Other", "Content"),
    ];

    const metrics = calculateReadingMetrics(notes);

    expect(metrics.orphanNotes).toHaveLength(1);
    expect(metrics.orphanNotes[0].slug).toBe("orphan");
  });

  it("should identify hub notes (5+ outgoing links)", () => {
    const notes = [
      createNote("hub", "Hub", "[[A]] [[B]] [[C]] [[D]] [[E]] [[F]]"),
      createNote("a", "A", ""),
      createNote("b", "B", ""),
      createNote("c", "C", ""),
      createNote("d", "D", ""),
      createNote("e", "E", ""),
      createNote("f", "F", ""),
    ];

    const metrics = calculateReadingMetrics(notes);

    expect(metrics.hubNotes).toHaveLength(1);
    expect(metrics.hubNotes[0].slug).toBe("hub");
    expect(metrics.hubNotes[0].outgoingCount).toBe(6);
  });

  it("should rank most linked notes by incoming links", () => {
    const notes = [
      createNote("popular", "Popular", ""),
      createNote("less-popular", "Less Popular", ""),
      createNote("a", "A", "[[Popular]] [[Less Popular]]"),
      createNote("b", "B", "[[Popular]]"),
      createNote("c", "C", "[[Popular]]"),
    ];

    const metrics = calculateReadingMetrics(notes);

    expect(metrics.mostLinkedNotes[0].slug).toBe("popular");
    expect(metrics.mostLinkedNotes[0].incomingCount).toBe(3);
    expect(metrics.mostLinkedNotes[1].slug).toBe("less-popular");
    expect(metrics.mostLinkedNotes[1].incomingCount).toBe(1);
  });

  it("should calculate linked notes percentage correctly", () => {
    const notes = [
      createNote("linked-1", "Linked 1", "[[Linked 2]]"),
      createNote("linked-2", "Linked 2", "Has incoming"),
      createNote("orphan-1", "Orphan 1", "No links"),
      createNote("orphan-2", "Orphan 2", "No links"),
    ];

    const metrics = calculateReadingMetrics(notes);

    // 2 out of 4 notes are linked (50%)
    expect(metrics.linkedNotesPercentage).toBe(50);
  });

  it("should count total links and average correctly", () => {
    const notes = [
      createNote("a", "A", "[[B]] [[C]]"), // 2 links
      createNote("b", "B", "[[C]]"), // 1 link
      createNote("c", "C", ""), // 0 links
    ];

    const metrics = calculateReadingMetrics(notes);

    expect(metrics.totalLinks).toBe(3);
    expect(metrics.averageLinksPerNote).toBe(1.0);
  });

  it("should limit mostLinkedNotes to top 10", () => {
    const notes = [
      createNote("popular", "Popular", ""),
      ...Array.from({ length: 15 }, (_, i) =>
        createNote(`linker-${i}`, `Linker ${i}`, "[[Popular]]"),
      ),
    ];

    const metrics = calculateReadingMetrics(notes);

    // Popular note should be the only one in mostLinkedNotes (has 15 incoming)
    expect(metrics.mostLinkedNotes).toHaveLength(1);
  });

  it("should limit hubNotes to top 10", () => {
    // Create 20 target notes
    const targetNotes = Array.from({ length: 20 }, (_, i) =>
      createNote(`target-${i}`, `Target ${i}`, ""),
    );

    // Create 15 hub notes with varying numbers of outgoing links (5-19)
    const hubNotes = Array.from({ length: 15 }, (_, i) => {
      const numLinks = 5 + i;
      const linkText = Array.from(
        { length: numLinks },
        (_, j) => `[[Target ${j}]]`,
      ).join(" ");
      return createNote(`hub-${i}`, `Hub ${i}`, linkText);
    });

    const notes = [...targetNotes, ...hubNotes];
    const metrics = calculateReadingMetrics(notes);

    expect(metrics.hubNotes).toHaveLength(10);
    // Should be sorted by outgoing count descending
    expect(metrics.hubNotes[0].outgoingCount).toBeGreaterThan(
      metrics.hubNotes[9].outgoingCount,
    );
  });
});
