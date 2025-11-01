import { describe, it, expect } from "vitest";
import { shouldPublishNote } from "./filterNotes";
import type { Note } from "./filterNotes";

// Helper to create minimal test note
function createNote(data: {
  draft?: boolean;
  publish?: boolean;
  title?: string;
}): Note {
  return {
    id: "test.md",
    slug: "test",
    body: "",
    collection: "vault",
    data: {
      title: data.title || "Test",
      draft: data.draft,
      publish: data.publish,
    },
  } as Note;
}

describe("shouldPublishNote", () => {
  describe("draft mode (default)", () => {
    it("should publish notes without draft field", () => {
      const note = createNote({});
      expect(shouldPublishNote(note, "draft")).toBe(true);
    });

    it("should publish notes with draft: false", () => {
      const note = createNote({ draft: false });
      expect(shouldPublishNote(note, "draft")).toBe(true);
    });

    it("should NOT publish notes with draft: true", () => {
      const note = createNote({ draft: true });
      expect(shouldPublishNote(note, "draft")).toBe(false);
    });

    it("should ignore publish field in draft mode", () => {
      const note = createNote({ draft: false, publish: false });
      expect(shouldPublishNote(note, "draft")).toBe(true);
    });

    it("should use draft mode by default when mode not specified", () => {
      const note = createNote({ draft: true });
      expect(shouldPublishNote(note)).toBe(false);
    });
  });

  describe("publish mode", () => {
    it("should NOT publish notes without publish field", () => {
      const note = createNote({});
      expect(shouldPublishNote(note, "publish")).toBe(false);
    });

    it("should NOT publish notes with publish: false", () => {
      const note = createNote({ publish: false });
      expect(shouldPublishNote(note, "publish")).toBe(false);
    });

    it("should publish notes with publish: true", () => {
      const note = createNote({ publish: true });
      expect(shouldPublishNote(note, "publish")).toBe(true);
    });

    it("should ignore draft field in publish mode", () => {
      const note = createNote({ draft: true, publish: true });
      expect(shouldPublishNote(note, "publish")).toBe(true);
    });

    it("should require explicit publish: true", () => {
      const note = createNote({ draft: false });
      expect(shouldPublishNote(note, "publish")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle draft: undefined as falsy", () => {
      const note = createNote({ draft: undefined });
      expect(shouldPublishNote(note, "draft")).toBe(true);
    });

    it("should handle publish: undefined as falsy", () => {
      const note = createNote({ publish: undefined });
      expect(shouldPublishNote(note, "publish")).toBe(false);
    });

    it("should handle both fields set in draft mode", () => {
      const note = createNote({ draft: false, publish: false });
      expect(shouldPublishNote(note, "draft")).toBe(true);
    });

    it("should handle both fields set in publish mode", () => {
      const note = createNote({ draft: false, publish: true });
      expect(shouldPublishNote(note, "publish")).toBe(true);
    });

    it("should handle conflicting fields (draft: false, publish: false) in draft mode", () => {
      const note = createNote({ draft: false, publish: false });
      // In draft mode, only draft matters - should publish
      expect(shouldPublishNote(note, "draft")).toBe(true);
    });

    it("should handle conflicting fields (draft: true, publish: true) in publish mode", () => {
      const note = createNote({ draft: true, publish: true });
      // In publish mode, only publish matters - should publish
      expect(shouldPublishNote(note, "publish")).toBe(true);
    });
  });

  describe("mode transition scenarios", () => {
    it("should publish different notes when switching from draft to publish mode", () => {
      const draftNote = createNote({ draft: false });
      const publishNote = createNote({ publish: true });
      const bothNote = createNote({ draft: false, publish: true });

      // Draft mode
      expect(shouldPublishNote(draftNote, "draft")).toBe(true);
      expect(shouldPublishNote(publishNote, "draft")).toBe(true);
      expect(shouldPublishNote(bothNote, "draft")).toBe(true);

      // Publish mode
      expect(shouldPublishNote(draftNote, "publish")).toBe(false);
      expect(shouldPublishNote(publishNote, "publish")).toBe(true);
      expect(shouldPublishNote(bothNote, "publish")).toBe(true);
    });

    it("should handle migration scenario (adding publish field)", () => {
      // Old note with just draft field
      const oldNote = createNote({ draft: false });

      // Works in draft mode
      expect(shouldPublishNote(oldNote, "draft")).toBe(true);

      // Won't work in publish mode until publish: true is added
      expect(shouldPublishNote(oldNote, "publish")).toBe(false);
    });
  });
});
