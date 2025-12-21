import { describe, it, expect } from "vitest";
import { filterNotes } from "./filter";
import type { Note } from "../filterNotes";

function createNote(overrides: Partial<Note> & { slug: string }): Note {
  return {
    id: `${overrides.slug}.md`,
    slug: overrides.slug,
    body: overrides.body ?? "",
    collection: "vault",
    data: {
      title: overrides.data?.title ?? overrides.slug,
      tags: overrides.data?.tags ?? [],
      links: overrides.data?.links ?? [],
      aliases: overrides.data?.aliases ?? [],
      draft: overrides.data?.draft ?? false,
      ...overrides.data,
    },
  } as Note;
}

describe("bases filter smoke tests", () => {
  const notes = [
    createNote({
      slug: "docs/intro",
      data: {
        title: "Intro",
        tags: ["guide", "docs/getting-started"],
        links: ["index", "docs/overview"],
        aliases: [],
        draft: false,
        author: "Ametrine",
      },
    }),
    createNote({
      slug: "misc/notes",
      data: {
        title: "Notes",
        tags: ["reference"],
        links: [],
        aliases: [],
        draft: false,
      },
    }),
  ];

  it("supports file.hasTag() in filter expressions", () => {
    const result = filterNotes(notes, 'file.hasTag("guide")');
    expect(result.notes.map((note) => note.slug)).toEqual(["docs/intro"]);
  });

  it("supports file.inFolder() in filter expressions", () => {
    const result = filterNotes(notes, 'file.inFolder("docs")');
    expect(result.notes.map((note) => note.slug)).toEqual(["docs/intro"]);
  });

  it("supports file.hasProperty() in filter expressions", () => {
    const result = filterNotes(notes, 'file.hasProperty("author")');
    expect(result.notes.map((note) => note.slug)).toEqual(["docs/intro"]);
  });

  it("supports file.hasLink() in filter expressions", () => {
    const result = filterNotes(notes, 'file.hasLink("index")');
    expect(result.notes.map((note) => note.slug)).toEqual(["docs/intro"]);
  });
});
