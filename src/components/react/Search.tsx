import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { UI, TIMING } from "../../constants/spacing";
import { logger } from "../../utils/logger";
import { fetchContentIndex } from "../../utils/fetchContentIndex";

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

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Highlight search matches in text
function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  try {
    const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-yellow-300/50 text-theme-dark rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  } catch {
    return text;
  }
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ContentDetails[]>([]);
  const [searchableNotes, setSearchableNotes] = useState<SearchableNote[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Pre-compute lowercase versions for faster search
  const preprocessNotes = (notes: ContentDetails[]): SearchableNote[] => {
    return notes.map((note) => ({
      ...note,
      _titleLower: note.title.toLowerCase(),
      _contentLower: note.content.toLowerCase(),
      _tagsLower: note.tags.map((tag) => tag.toLowerCase()),
    }));
  };

  // Get the currently selected note
  const selectedNote = useMemo(() => {
    return results[selectedIndex] || null;
  }, [results, selectedIndex]);

  useEffect(() => {
    // Check cache first
    const cached = localStorage.getItem("search-notes-cache");
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if fresh
        if (age < CACHE_TTL_MS && data?.length > 0) {
          setSearchableNotes(data);
          return;
        }
      } catch {
        logger.warn("Failed to parse cached search notes");
      }
    }

    // Fetch using shared utility
    fetchContentIndex()
      .then((data: Record<string, ContentDetails>) => {
        const notes = Object.values(data);
        const preprocessed = preprocessNotes(notes);

        // Cache with timestamp
        localStorage.setItem(
          "search-notes-cache",
          JSON.stringify({
            data: preprocessed,
            timestamp: Date.now(),
          }),
        );

        setSearchableNotes(preprocessed);
      })
      .catch((err) => logger.error("Failed to load content index:", err));
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

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow key navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        const selectedResult = results[selectedIndex];
        if (selectedResult) {
          window.location.href = `${import.meta.env.BASE_URL}/${selectedResult.slug}`;
        }
      } else if (e.key === "Tab") {
        // Focus trap
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstFocusable = focusableElements[0] as HTMLElement;
        const lastFocusable = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);
    return () => modal.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const selectedElement = resultsContainerRef.current.querySelector(
      `[data-index="${selectedIndex}"]`,
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

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
    const filtered = searchableNotes.filter(
      (note) =>
        note._titleLower.includes(searchQuery) ||
        note._contentLower.includes(searchQuery) ||
        note._tagsLower.some((tag) => tag.includes(searchQuery)),
    );

    setResults(filtered.slice(0, UI.SEARCH_RESULTS_LIMIT));
  }, [debouncedQuery, searchableNotes]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-theme-darkgray bg-theme-lightgray rounded-lg hover:bg-theme-highlight"
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
      className="fixed inset-0 z-modal bg-black/50 flex items-start justify-center pt-[10vh]"
      onClick={() => setIsOpen(false)}
    >
      <div
        ref={modalRef}
        className="bg-theme-light rounded-lg shadow-2xl w-full max-w-5xl border border-theme-gray mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-theme-gray">
          <SearchIcon className="h-5 w-5 text-theme-gray flex-shrink-0" />
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
            className="p-1 hover:bg-theme-lightgray rounded flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Split Pane Content */}
        <div className="flex h-[60vh]">
          {/* Left Pane: Results List */}
          <div
            ref={resultsContainerRef}
            className="w-full md:w-[300px] md:min-w-[300px] overflow-y-auto border-r border-theme-gray"
          >
            {results.length === 0 && query && (
              <div className="p-6 text-center text-theme-gray">
                No results found for "{query}"
              </div>
            )}

            {results.length === 0 && !query && (
              <div className="p-6 text-center text-theme-gray text-sm">
                <p>Type to search across all notes...</p>
                <p className="mt-2 text-xs opacity-75">
                  Use{" "}
                  <kbd className="px-1 py-0.5 bg-theme-lightgray rounded">
                    ↑
                  </kbd>{" "}
                  <kbd className="px-1 py-0.5 bg-theme-lightgray rounded">
                    ↓
                  </kbd>{" "}
                  to navigate,{" "}
                  <kbd className="px-1 py-0.5 bg-theme-lightgray rounded">
                    Enter
                  </kbd>{" "}
                  to open
                </p>
              </div>
            )}

            {results.map((note, index) => (
              <a
                key={note.slug}
                href={`${import.meta.env.BASE_URL}/${note.slug}`}
                data-index={index}
                className={`block p-3 border-b border-theme-lightgray last:border-b-0 transition-colors ${
                  index === selectedIndex
                    ? "bg-theme-highlight border-l-2 border-l-theme-secondary"
                    : "hover:bg-theme-lightgray border-l-2 border-l-transparent"
                }`}
                onClick={() => setIsOpen(false)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="font-medium text-theme-dark text-sm">
                  {highlightMatches(note.title, debouncedQuery)}
                </div>
                <div className="text-xs text-theme-darkgray mt-1 line-clamp-1">
                  {highlightMatches(note.content.slice(0, 80), debouncedQuery)}
                </div>
              </a>
            ))}
          </div>

          {/* Right Pane: Preview (hidden on mobile) */}
          <div className="hidden md:flex flex-1 flex-col overflow-hidden">
            {selectedNote ? (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Title */}
                <h2 className="text-xl font-semibold text-theme-dark mb-2">
                  {highlightMatches(selectedNote.title, debouncedQuery)}
                </h2>

                {/* Tags */}
                {selectedNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedNote.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded bg-theme-highlight text-theme-secondary"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content Preview */}
                <div className="prose prose-sm prose-theme max-w-none text-theme-darkgray">
                  <ReactMarkdown
                    components={{
                      // Highlight search terms in text nodes
                      p: ({ children }) => (
                        <p>
                          {typeof children === "string"
                            ? highlightMatches(children, debouncedQuery)
                            : children}
                        </p>
                      ),
                      li: ({ children }) => (
                        <li>
                          {typeof children === "string"
                            ? highlightMatches(children, debouncedQuery)
                            : children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong>
                          {typeof children === "string"
                            ? highlightMatches(children, debouncedQuery)
                            : children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em>
                          {typeof children === "string"
                            ? highlightMatches(children, debouncedQuery)
                            : children}
                        </em>
                      ),
                      // Render headings with highlighting
                      h1: ({ children }) => (
                        <h1>
                          {typeof children === "string"
                            ? highlightMatches(children, debouncedQuery)
                            : children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2>
                          {typeof children === "string"
                            ? highlightMatches(children, debouncedQuery)
                            : children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3>
                          {typeof children === "string"
                            ? highlightMatches(children, debouncedQuery)
                            : children}
                        </h3>
                      ),
                      // Skip rendering images in preview
                      img: () => null,
                      // Simplify code blocks
                      code: ({ children }) => (
                        <code className="bg-theme-lightgray px-1 py-0.5 rounded text-sm">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {selectedNote.content.slice(0, 2000)}
                  </ReactMarkdown>
                  {selectedNote.content.length > 2000 && (
                    <p className="text-theme-gray italic mt-4">
                      Content truncated...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-theme-gray">
                {query
                  ? "Select a result to preview"
                  : "Start typing to search"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
