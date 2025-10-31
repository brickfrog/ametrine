import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Shuffle, X, Moon, Sun, BarChart3 } from "lucide-react";
import { useStore } from "@nanostores/react";
import { isReadingMode } from "../../stores/readingMode";

interface QuickActionsProps {
  allSlugs?: string[];
}

export function QuickActions({ allSlugs = [] }: QuickActionsProps) {
  const readingMode = useStore(isReadingMode);
  const [mounted, setMounted] = useState(false);
  // Initialize from DOM state (set by inline script) to prevent flash
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    setMounted(true);

    // Sync with actual DOM state on mount
    const isDark = document.documentElement.classList.contains("dark");
    const actualTheme = isDark ? "dark" : "light";
    setTheme(actualTheme);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && readingMode) {
        toggleReadingMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [readingMode]);

  const toggleReadingMode = () => {
    isReadingMode.set(!readingMode);
    document.body.classList.toggle("reading-mode", !readingMode);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  };

  const handleRandomArticle = () => {
    if (allSlugs.length > 0) {
      const randomSlug = allSlugs[Math.floor(Math.random() * allSlugs.length)];
      window.location.href = `${import.meta.env.BASE_URL}/${randomSlug}`;
    }
  };

  const handleActivityPage = () => {
    window.location.href = `${import.meta.env.BASE_URL}/stats`;
  };

  return (
    <>
      <div className="flex gap-2 quick-actions">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-theme-lightgray text-theme-dark transition-colors"
          title="Toggle dark mode"
        >
          {/* Render both icons, CSS controls which is visible */}
          <Moon size={18} className="dark:hidden" />
          <Sun size={18} className="hidden dark:block" />
        </button>
        <button
          onClick={toggleReadingMode}
          className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-theme-lightgray text-theme-dark transition-colors"
          title="Toggle reading mode (Esc to exit)"
        >
          <BookOpen size={18} />
        </button>
        <button
          onClick={handleActivityPage}
          className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-theme-lightgray text-theme-dark transition-colors"
          title="View activity stats"
        >
          <BarChart3 size={18} />
        </button>
        <button
          onClick={handleRandomArticle}
          className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-theme-lightgray text-theme-dark transition-colors"
          title="Go to random article"
          disabled={allSlugs.length === 0}
        >
          <Shuffle size={18} />
        </button>
      </div>

      {/* Floating exit button in reading mode - rendered via portal */}
      {mounted &&
        readingMode &&
        createPortal(
          <button
            onClick={toggleReadingMode}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-md bg-theme-secondary text-theme-light hover:bg-theme-tertiary transition-colors shadow-lg"
            title="Exit reading mode (Esc)"
          >
            <X size={18} />
            <span className="text-sm font-medium">Exit Reading Mode</span>
          </button>,
          document.body,
        )}
    </>
  );
}
