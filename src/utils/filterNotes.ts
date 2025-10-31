import { getCollection, type CollectionEntry } from "astro:content";
import { config } from "../config";
import type { PrivateMode } from "../config";

export type Note = CollectionEntry<"vault">;

/**
 * Determine if a note should be published based on the configured private pages mode.
 *
 * @param note - The note to check
 * @param mode - The private pages mode ('draft' or 'publish')
 * @returns true if the note should be published, false otherwise
 */
export function shouldPublishNote(
  note: Note,
  mode: PrivateMode = config.privatePages?.mode || "draft",
): boolean {
  if (mode === "draft") {
    // RemoveDrafts behavior: exclude if draft === true
    return note.data.draft !== true;
  } else {
    // ExplicitPublish behavior: include only if publish === true
    return note.data.publish === true;
  }
}

/**
 * Get all published notes from the collection, filtered by the configured private pages mode.
 *
 * @returns Promise<Note[]> - Array of published notes
 */
export async function getPublishedNotes(): Promise<Note[]> {
  const notes = await getCollection("vault");
  const mode = config.privatePages?.mode || "draft";
  return notes.filter((note) => shouldPublishNote(note, mode));
}
