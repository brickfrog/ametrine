import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { UI, TIMING } from "../../constants/spacing";
import { logger } from "../../utils/logger";

export interface ContentDetails {
  slug: string;
  title: string;
  links: string[];
  tags: string[];
  content: string;
}

interface SearchableNote extends ContentDetails {
  _titleLower: string;
  _contentLower: string;
  _tagsLower: string[];
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ContentDetails[]>([]);
  const [allNotes, setAllNotes] = useState<SearchableNote[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Pre-compute lowercase versions for faster search
  const preprocessNotes = (notes: ContentDetails[]): SearchableNote[] => {
    return notes.map((note) => ({
      ...note,
      _titleLower: note.title.toLowerCase(),
      _contentLower: note.content.toLowerCase(),
      _tagsLower: note.tags.map((tag) => tag.toLowerCase()),
    }));
  };

  useEffect(() => {
    // Load data: try cache first, then fetch
    let needsFetch = true;
    const cached = localStorage.getItem("search-notes");
    if (cached) {
      try {
        const notes = JSON.parse(cached);
        if (notes && notes.length > 0) {
          setAllNotes(preprocessNotes(notes));
          needsFetch = false;
        }
      } catch {
        logger.warn("Failed to parse cached search notes");
      }
    }

    // Fetch if no cache or cache failed
    if (needsFetch) {
      fetch(`${import.meta.env.BASE_URL}/static/contentIndex.json`)
        .then((res) => res.json())
        .then((data: Record<string, ContentDetails>) => {
          const notes = Object.values(data);
          setAllNotes(preprocessNotes(notes));
          localStorage.setItem("search-notes", JSON.stringify(notes));
        })
        .catch((err) => logger.error("Failed to load content index:", err));
    }
  }, []);

  useEffect(() => {
    // Keyboard shortcut: Cmd+K or Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isOpen, results]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, TIMING.LINK_PREVIEW_HOVER_DELAY); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search with pre-computed lowercase strings
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = debouncedQuery.toLowerCase();
    const filtered = allNotes.filter(
      (note) =>
        note._titleLower.includes(searchQuery) ||
        note._contentLower.includes(searchQuery) ||
        note._tagsLower.some((tag) => tag.includes(searchQuery)),
    );

    setResults(filtered.slice(0, UI.SEARCH_RESULTS_LIMIT));
  }, [debouncedQuery, allNotes]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-theme-darkgray bg-theme-lightgray rounded-lg hover:bg-theme-highlight transition-colors"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="hidden sm:block ml-auto text-xs bg-theme-light px-2 py-1 rounded border border-theme-gray">
          ⌘K
        </kbd>
      </button>
    );
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-modal bg-black/50 flex items-start justify-center pt-[20vh]"
      onClick={() => setIsOpen(false)}
    >
      <div
        ref={modalRef}
        className="bg-theme-light rounded-lg shadow-2xl w-full max-w-2xl border border-theme-gray"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-theme-gray">
          <SearchIcon className="h-5 w-5 text-theme-gray" />
          <input
            type="text"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-theme-dark"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-theme-lightgray rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && query && (
            <div className="p-8 text-center text-theme-gray">
              No results found for "{query}"
            </div>
          )}

          {results.length === 0 && !query && (
            <div className="p-8 text-center text-theme-gray">
              Type to search across all notes...
            </div>
          )}

          {results.map((note) => (
            <a
              key={note.slug}
              href={`${import.meta.env.BASE_URL}/${note.slug}`}
              className="block p-4 hover:bg-theme-highlight border-b border-theme-lightgray last:border-b-0"
              onClick={() => setIsOpen(false)}
            >
              <div className="font-semibold text-theme-dark">{note.title}</div>
              <div className="text-sm text-theme-darkgray mt-1 line-clamp-2">
                {note.content.slice(0, 150)}...
              </div>
              {note.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded bg-theme-highlight text-theme-secondary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
