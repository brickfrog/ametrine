import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface ContentDetails {
  slug: string;
  title: string;
  links: string[];
  tags: string[];
  content: string;
}

interface ContentIndexContextType {
  allNotes: ContentDetails[];
  isLoading: boolean;
  error: Error | null;
}

const ContentIndexContext = createContext<ContentIndexContextType | undefined>(
  undefined,
);

export function ContentIndexProvider({ children }: { children: ReactNode }) {
  const [allNotes, setAllNotes] = useState<ContentDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Try cache first
    const cached = localStorage.getItem("search-notes");
    if (cached) {
      try {
        const notes = JSON.parse(cached);
        if (notes && notes.length > 0) {
          setAllNotes(notes);
          setIsLoading(false);
          return;
        }
      } catch {
        console.warn("Failed to parse cached search notes");
      }
    }

    // Fetch if no cache
    fetch(`${import.meta.env.BASE_URL}/static/contentIndex.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
        return res.json();
      })
      .then((data: Record<string, ContentDetails>) => {
        const notes = Object.values(data);
        setAllNotes(notes);
        localStorage.setItem("search-notes", JSON.stringify(notes));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load content index:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, []);

  return (
    <ContentIndexContext.Provider value={{ allNotes, isLoading, error }}>
      {children}
    </ContentIndexContext.Provider>
  );
}

export function useContentIndex() {
  const context = useContext(ContentIndexContext);
  if (context === undefined) {
    throw new Error(
      "useContentIndex must be used within a ContentIndexProvider",
    );
  }
  return context;
}
