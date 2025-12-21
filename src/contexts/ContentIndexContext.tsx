import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { logger } from "../utils/logger";
import { fetchSearchIndex } from "../utils/fetchSearchIndex";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        // Use cache if fresh
        if (age < CACHE_TTL_MS && data && data.length > 0) {
          setAllNotes(data);
          setIsLoading(false);
          return;
        }
      } catch {
        logger.warn("Failed to parse cached search notes");
      }
    }

    // Fetch if no cache or cache expired
    fetchSearchIndex()
      .then((data: Record<string, ContentDetails>) => {
        const notes = Object.values(data);
        setAllNotes(notes);

        // Cache with timestamp
        localStorage.setItem(
          "search-notes",
          JSON.stringify({
            data: notes,
            timestamp: Date.now(),
          }),
        );

        setIsLoading(false);
      })
      .catch((err) => {
        logger.error("Failed to load content index:", err);
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
