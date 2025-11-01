import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ContentDetails {
  slug: string;
  title: string;
  links: string[];
  tags: string[];
  content: string;
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContentDetails[]>([]);
  const [allNotes, setAllNotes] = useState<ContentDetails[]>([]);

  useEffect(() => {
    // Load data: try cache first, then fetch
    const cached = localStorage.getItem("search-notes");
    if (cached) {
      try {
        setAllNotes(JSON.parse(cached));
      } catch {
        console.warn("Failed to parse cached search notes");
        // Fall through to fetch if cache is corrupted
      }
    }

    // Fetch if no cache or cache failed
    if (!cached || !allNotes.length) {
      fetch(`${import.meta.env.BASE_URL}/static/contentIndex.json`)
        .then((res) => res.json())
        .then((data: Record<string, ContentDetails>) => {
          const notes = Object.values(data);
          setAllNotes(notes);
          localStorage.setItem("search-notes", JSON.stringify(notes));
        })
        .catch((err) => console.error("Failed to load content index:", err));
    }

    // Keyboard shortcut: Cmd+K or Ctrl+K (always register, regardless of cache)
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

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = allNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery) ||
        note.content.toLowerCase().includes(searchQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchQuery)),
    );

    setResults(filtered.slice(0, 10)); // Limit to 10 results
  }, [query, allNotes]);

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
