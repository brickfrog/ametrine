import type { Note } from "./filterNotes";
import { getFolderPath } from "./folders";

export interface RelatedNote {
  note: Note;
  score: number;
  reason: string;
}

/**
 * Find notes related to the current note based on various criteria
 */
export function findRelatedNotes(
  currentNote: Note,
  allNotes: Note[],
  limit: number = 10,
): RelatedNote[] {
  const related: RelatedNote[] = [];
  const currentTags = new Set(currentNote.data.tags || []);
  const currentFolder = getFolderPath(currentNote.slug);

  for (const note of allNotes) {
    // Skip self
    if (note.slug === currentNote.slug) continue;

    let score = 0;
    const reasons: string[] = [];

    // Score by shared tags (highest weight)
    const noteTags = new Set(note.data.tags || []);
    const sharedTags = Array.from(currentTags).filter((tag) =>
      noteTags.has(tag),
    );
    if (sharedTags.length > 0) {
      score += sharedTags.length * 3; // 3 points per shared tag
      reasons.push(
        `${sharedTags.length} shared tag${sharedTags.length > 1 ? "s" : ""}`,
      );
    }

    // Score by same folder (medium weight)
    const noteFolder = getFolderPath(note.slug);
    if (currentFolder && noteFolder === currentFolder) {
      score += 2; // 2 points for same folder
      reasons.push("same folder");
    }

    // Score by parent/child folder relationship
    if (currentFolder && noteFolder.startsWith(currentFolder + "/")) {
      score += 1; // 1 point for subfolder
      reasons.push("related folder");
    }

    // Only include if there's some relation
    if (score > 0) {
      related.push({
        note,
        score,
        reason: reasons.join(", "),
      });
    }
  }

  // Sort by score descending and limit
  return related.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Get notes in the same folder as the current note
 */
export function getNotesInSameFolder(
  currentNote: Note,
  allNotes: Note[],
): Note[] {
  const currentFolder = getFolderPath(currentNote.slug);

  if (!currentFolder) return [];

  return allNotes.filter((note) => {
    if (note.slug === currentNote.slug) return false;
    const noteFolder = getFolderPath(note.slug);
    return noteFolder === currentFolder;
  });
}
