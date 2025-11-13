/**
 * Reading metrics and link analysis for stats page
 */

import GithubSlugger from "github-slugger";
import { WORDS_PER_MINUTE } from "../constants/reading";
import type { Note } from "./filterNotes";

export interface LinkGraph {
  // Map of note slug to array of slugs it links to
  outgoing: Map<string, string[]>;
  // Map of note slug to array of slugs that link to it
  incoming: Map<string, string[]>;
}

export interface LinkedNote {
  slug: string;
  title: string;
  incomingCount: number;
  outgoingCount: number;
}

export interface ReadingMetrics {
  totalWords: number;
  medianReadingTime: number;
  averageNoteLength: number;
  linkedNotesPercentage: number;
  mostLinkedNotes: LinkedNote[];
  orphanNotes: LinkedNote[];
  hubNotes: LinkedNote[];
  totalLinks: number;
  averageLinksPerNote: number;
}

// Wikilink regex (from wikilinks plugin)
const wikilinkRegex =
  /!?\[\[([^[\]|#\\]+)?(#+[^[\]|#\\]+)?(\\?\|[^[\]#]*)?\]\]/g;

/**
 * Extract wikilink targets from markdown content
 * Uses a fresh slugger to avoid state pollution
 */
function extractLinks(content: string | undefined): string[] {
  const links: string[] = [];
  const slugger = new GithubSlugger();

  // Handle undefined or null content
  if (!content) return links;

  const matches = content.matchAll(wikilinkRegex);
  for (const match of matches) {
    const [_full, rawFp] = match;
    if (rawFp) {
      const pageName = rawFp.split("#")[0].trim();
      if (pageName) {
        const linkSlug = slugger.slug(pageName);
        links.push(linkSlug);
      }
    }
  }

  return [...new Set(links)];
}

/**
 * Calculate word count for a note
 */
function calculateWordCount(content: string | undefined): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).length;
}

/**
 * Calculate reading time in minutes
 */
function calculateReadingTime(content: string | undefined): number {
  const words = calculateWordCount(content);
  return Math.ceil(words / WORDS_PER_MINUTE);
}

/**
 * Build link graph from all notes
 */
export function buildLinkGraph(notes: Note[]): LinkGraph {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  // Initialize maps
  for (const note of notes) {
    outgoing.set(note.slug, []);
    incoming.set(note.slug, []);
  }

  // Build outgoing links
  for (const note of notes) {
    const links = extractLinks(note.body);
    // Filter to only valid note slugs and exclude self-references
    const validLinks = links.filter(
      (slug) => slug !== note.slug && outgoing.has(slug),
    );
    outgoing.set(note.slug, validLinks);
  }

  // Build incoming links from outgoing
  for (const [fromSlug, toSlugs] of outgoing.entries()) {
    for (const toSlug of toSlugs) {
      if (!incoming.has(toSlug)) {
        incoming.set(toSlug, []);
      }
      incoming.get(toSlug)!.push(fromSlug);
    }
  }

  return { outgoing, incoming };
}

/**
 * Calculate comprehensive reading metrics
 */
export function calculateReadingMetrics(notes: Note[]): ReadingMetrics {
  // Build link graph
  const linkGraph = buildLinkGraph(notes);

  // Calculate word counts and reading times
  const wordCounts = notes.map((note) => calculateWordCount(note.body));
  const readingTimes = notes.map((note) => calculateReadingTime(note.body));

  // Total word count
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

  // Median reading time
  const sortedTimes = [...readingTimes].sort((a, b) => a - b);
  const mid = Math.floor(sortedTimes.length / 2);
  const medianReadingTime =
    sortedTimes.length % 2 === 0
      ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
      : sortedTimes[mid];

  // Average note length
  const averageNoteLength = Math.round(totalWords / notes.length);

  // Linked notes (notes with at least one incoming or outgoing link)
  let linkedCount = 0;
  for (const note of notes) {
    const hasIncoming = (linkGraph.incoming.get(note.slug) || []).length > 0;
    const hasOutgoing = (linkGraph.outgoing.get(note.slug) || []).length > 0;
    if (hasIncoming || hasOutgoing) {
      linkedCount++;
    }
  }
  const linkedNotesPercentage = Math.round((linkedCount / notes.length) * 100);

  // Most linked notes (sorted by incoming links)
  const linkedNotes: LinkedNote[] = notes.map((note) => ({
    slug: note.slug,
    title: note.data.title || note.slug,
    incomingCount: (linkGraph.incoming.get(note.slug) || []).length,
    outgoingCount: (linkGraph.outgoing.get(note.slug) || []).length,
  }));

  const mostLinkedNotes = linkedNotes
    .filter((note) => note.incomingCount > 0)
    .sort((a, b) => b.incomingCount - a.incomingCount)
    .slice(0, 10);

  // Orphan notes (no incoming AND no outgoing links)
  const orphanNotes = linkedNotes
    .filter((note) => note.incomingCount === 0 && note.outgoingCount === 0)
    .sort((a, b) => a.title.localeCompare(b.title));

  // Hub notes (5+ outgoing links)
  const hubNotes = linkedNotes
    .filter((note) => note.outgoingCount >= 5)
    .sort((a, b) => b.outgoingCount - a.outgoingCount)
    .slice(0, 10);

  // Total links and average
  const totalLinks = Array.from(linkGraph.outgoing.values()).reduce(
    (sum, links) => sum + links.length,
    0,
  );
  const averageLinksPerNote =
    notes.length > 0 ? Math.round((totalLinks / notes.length) * 10) / 10 : 0;

  return {
    totalWords,
    medianReadingTime,
    averageNoteLength,
    linkedNotesPercentage,
    mostLinkedNotes,
    orphanNotes,
    hubNotes,
    totalLinks,
    averageLinksPerNote,
  };
}
