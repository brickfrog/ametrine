import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Shuffle, X, Moon, Sun, BarChart3, Type } from "lucide-react";
import { useStore } from "@nanostores/react";
import { isReadingMode } from "../../stores/readingMode";
import { fontScale } from "../../stores/fontScale";

interface QuickActionsProps {
  allSlugs?: string[];
}

export function QuickActions({ allSlugs = [] }: QuickActionsProps) {
  const readingMode = useStore(isReadingMode);
  const currentFontScale = useStore(fontScale);
  const [mounted, setMounted] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
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

  const changeFontScale = (newScale: number) => {
    fontScale.set(newScale);
    setShowFontMenu(false);
  };

  const fontSizes = [
    { label: "A-", value: 0.875, title: "Small" },
    { label: "A", value: 1.0, title: "Normal" },
    { label: "A+", value: 1.125, title: "Large" },
    { label: "A++", value: 1.25, title: "Extra Large" },
  ];

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
        <div className="relative">
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-theme-lightgray text-theme-dark transition-colors"
            title="Adjust font size"
          >
            <Type size={18} />
          </button>
          {showFontMenu && (
            <div className="absolute top-full mt-2 left-0 bg-theme-light border border-theme-gray rounded-lg shadow-xl p-2 z-dropdown min-w-[160px]">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => changeFontScale(size.value)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                    currentFontScale === size.value
                      ? "bg-theme-highlight text-theme-secondary font-semibold"
                      : "text-theme-dark hover:bg-theme-lightgray"
                  }`}
                  title={size.title}
                >
                  <span className="font-mono text-base">{size.label}</span>
                  <span className="text-xs text-theme-darkgray">
                    {size.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
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
            className="fixed top-4 right-4 z-modal flex items-center gap-2 px-4 py-2 rounded-md bg-theme-secondary text-theme-light hover:bg-theme-tertiary transition-colors shadow-lg"
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
