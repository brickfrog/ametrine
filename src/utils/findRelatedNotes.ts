import type { Note } from "./filterNotes";
import { getFolderPath } from "./folderUtils";

export interface RelatedNote {
  note: Note;
  score: number;
  reason: string;
}

/**
 * Extract wikilink targets from markdown content
 */
function extractWikilinks(content: string): Set<string> {
  const links = new Set<string>();
  if (!content) return links;

  const wikilinkRegex =
    /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;
  const matches = content.matchAll(wikilinkRegex);

  for (const match of matches) {
    const [_full, rawFp] = match;
    if (rawFp) {
      const pageName = rawFp.split("#")[0].trim();
      if (pageName) {
        // Simple slug conversion - convert to lowercase and replace spaces
        const slug = pageName.toLowerCase().replace(/\s+/g, "-");
        links.add(slug);
      }
    }
  }

  return links;
}

/**
 * Compute cosine similarity between two notes based on their content
 */
function computeCosineSimilarity(note1: Note, note2: Note): number {
  const text1 = (note1.body || "").toLowerCase();
  const text2 = (note2.body || "").toLowerCase();

  if (!text1 || !text2) return 0;

  // Simple word tokenization
  const words1 = text1.split(/\s+/).filter((w) => w.length > 3);
  const words2 = text2.split(/\s+/).filter((w) => w.length > 3);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Build term frequency maps
  const tf1 = new Map<string, number>();
  const tf2 = new Map<string, number>();

  for (const word of words1) {
    tf1.set(word, (tf1.get(word) || 0) + 1);
  }
  for (const word of words2) {
    tf2.set(word, (tf2.get(word) || 0) + 1);
  }

  // Compute dot product and magnitudes
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  const allWords = new Set([...tf1.keys(), ...tf2.keys()]);

  for (const word of allWords) {
    const count1 = tf1.get(word) || 0;
    const count2 = tf2.get(word) || 0;
    dotProduct += count1 * count2;
    mag1 += count1 * count1;
    mag2 += count2 * count2;
  }

  if (mag1 === 0 || mag2 === 0) return 0;

  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Calculate tag rarity weights (inverse document frequency)
 */
function calculateTagWeights(allNotes: Note[]): Map<string, number> {
  const tagDocCount = new Map<string, number>();
  const totalDocs = allNotes.length;

  // Count how many documents each tag appears in
  for (const note of allNotes) {
    const tags = new Set(note.data.tags || []);
    for (const tag of tags) {
      tagDocCount.set(tag, (tagDocCount.get(tag) || 0) + 1);
    }
  }

  // Calculate IDF: log(totalDocs / docCount)
  const tagWeights = new Map<string, number>();
  for (const [tag, count] of tagDocCount.entries()) {
    tagWeights.set(tag, Math.log(totalDocs / count));
  }

  return tagWeights;
}

/**
 * Find notes related to the current note using hybrid approach:
 * 1. Build candidate list from tags, folders, and backlinks
 * 2. Filter candidates by content similarity
 * 3. Combine both scores for final ranking
 */
export function findRelatedNotes(
  currentNote: Note,
  allNotes: Note[],
  limit: number = 10,
): RelatedNote[] {
  // Calculate tag weights (IDF)
  const tagWeights = calculateTagWeights(allNotes);

  const currentTags = new Set(currentNote.data.tags || []);
  const currentFolder = getFolderPath(currentNote.slug);
  const currentLinks = extractWikilinks(currentNote.body || "");

  // Phase 1: Build candidate list with metadata scores
  const candidates = new Map<
    string,
    { note: Note; metadataScore: number; reasons: string[] }
  >();

  for (const note of allNotes) {
    // Skip self
    if (note.slug === currentNote.slug) continue;

    let metadataScore = 0;
    const reasons: string[] = [];

    // Score by shared tags with IDF weighting
    const noteTags = new Set(note.data.tags || []);
    const sharedTags = Array.from(currentTags).filter((tag) =>
      noteTags.has(tag),
    );

    if (sharedTags.length > 0) {
      // Weight each shared tag by its rarity (IDF)
      const tagScore = sharedTags.reduce(
        (sum, tag) => sum + (tagWeights.get(tag) || 1),
        0,
      );
      metadataScore += tagScore * 10; // Scale up for better distribution
      reasons.push(
        `${sharedTags.length} shared tag${sharedTags.length > 1 ? "s" : ""}`,
      );
    }

    // Score by folder proximity
    const noteFolder = getFolderPath(note.slug);
    if (currentFolder && noteFolder === currentFolder) {
      metadataScore += 8;
      reasons.push("same folder");
    } else if (currentFolder && noteFolder.startsWith(currentFolder + "/")) {
      metadataScore += 4;
      reasons.push("subfolder");
    } else if (noteFolder && currentFolder?.startsWith(noteFolder + "/")) {
      metadataScore += 4;
      reasons.push("parent folder");
    }

    // Score by bidirectional backlinks (strongest signal)
    const noteLinks = extractWikilinks(note.body || "");
    const currentLinksToNote =
      currentLinks.has(note.slug) || currentLinks.has(note.id);
    const noteLinksToCurrentNote =
      noteLinks.has(currentNote.slug) || noteLinks.has(currentNote.id);

    if (currentLinksToNote && noteLinksToCurrentNote) {
      metadataScore += 50; // Very strong signal - bidirectional link
      reasons.push("bidirectional link");
    } else if (currentLinksToNote) {
      metadataScore += 25; // Strong signal - we link to it
      reasons.push("linked from here");
    } else if (noteLinksToCurrentNote) {
      metadataScore += 25; // Strong signal - it links to us
      reasons.push("links here");
    }

    // Only include candidates with some metadata relevance
    if (metadataScore > 0) {
      candidates.set(note.slug, { note, metadataScore, reasons });
    }
  }

  // Phase 2: Calculate content similarity for candidates
  const related: RelatedNote[] = [];
  const MIN_SIMILARITY = 0.05; // Minimum cosine similarity threshold

  for (const [_slug, candidate] of candidates) {
    const contentSimilarity = computeCosineSimilarity(
      currentNote,
      candidate.note,
    );

    // Skip if content is too dissimilar
    if (contentSimilarity < MIN_SIMILARITY) {
      continue;
    }

    // Combine metadata score and content similarity
    // Weight: 60% metadata, 40% content similarity
    const finalScore =
      candidate.metadataScore * 0.6 + contentSimilarity * 100 * 0.4;

    // Add similarity info to reasons
    const reasons = [...candidate.reasons];
    if (contentSimilarity > 0.3) {
      reasons.push("high content similarity");
    } else if (contentSimilarity > 0.15) {
      reasons.push("similar content");
    }

    related.push({
      note: candidate.note,
      score: finalScore,
      reason: reasons.join(", "),
    });
  }

  // Sort by final score descending and limit
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
