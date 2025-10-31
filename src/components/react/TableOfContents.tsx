import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "@nanostores/react";
import { TOC } from "../../constants/spacing";
import {
  currentProgress,
  updateCurrentProgress,
  getSavedProgress,
  saveProgress,
  loadSavedProgress,
} from "../../stores/readingProgress";

export interface TocEntry {
  depth: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  toc: TocEntry[];
  collapsed?: boolean;
  slug?: string;
}

export function TableOfContents({
  toc,
  collapsed = false,
  slug,
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(!collapsed);
  const [activeId, setActiveId] = useState<string>("");
  const [savedProgressPercent, setSavedProgressPercent] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  const liveProgress = useStore(currentProgress);
  const saveTimerRef = useRef<number | null>(null);

  // Suppress hydration mismatch by only rendering progress bar after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    if (!slug) return;

    loadSavedProgress();
    const saved = getSavedProgress(slug);
    setSavedProgressPercent(saved);
  }, [slug]);

  // Calculate and update scroll progress
  const updateScrollProgress = useCallback(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const windowHeight = window.innerHeight;
    const articleHeight = article.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const articleTop = article.offsetTop;

    // Calculate how far into the article we've scrolled
    const articleScrollTop = Math.max(0, scrollTop - articleTop);
    const scrollableHeight = articleHeight - windowHeight;
    const percent =
      scrollableHeight > 0 ? (articleScrollTop / scrollableHeight) * 100 : 0;

    updateCurrentProgress(percent);

    // Throttled save to sessionStorage
    if (slug && saveTimerRef.current === null) {
      saveTimerRef.current = window.setTimeout(() => {
        saveProgress(slug, percent);
        saveTimerRef.current = null;
      }, 2000); // Save every 2 seconds
    }
  }, [slug]);

  // Scroll tracking effect
  useEffect(() => {
    updateScrollProgress();

    window.addEventListener("scroll", updateScrollProgress);
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);

      // Clear timer on unmount
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [updateScrollProgress]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (!slug) return;
      const progress = currentProgress.get();
      if (progress > 0) {
        saveProgress(slug, progress);
      }
    };
  }, [slug]);

  // TOC heading tracking effect
  useEffect(() => {
    // Get all heading elements
    const headingElements = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    ).filter((heading) => heading.id); // Only headings with IDs

    if (headingElements.length === 0) return;

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Find all currently visible headings
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({
            id: entry.target.id,
            top: entry.boundingClientRect.top,
          }))
          .sort((a, b) => a.top - b.top);

        // Set the first visible heading as active
        if (visibleHeadings.length > 0) {
          setActiveId(visibleHeadings[0].id);
        }
      },
      {
        // Trigger when heading enters top portion of viewport
        rootMargin: `-${TOC.SCROLL_THRESHOLD}px 0px -80% 0px`,
        threshold: 0,
      },
    );

    // Observe all headings
    headingElements.forEach((heading) => observer.observe(heading));

    return () => {
      headingElements.forEach((heading) => observer.unobserve(heading));
    };
  }, []);

  if (!toc || toc.length === 0) {
    return null;
  }

  return (
    <div className="toc-container mt-8">
      <details open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
        <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-theme-darkgray hover:text-theme-dark">
          <h3 className="text-sm font-semibold m-0">Table of Contents</h3>
          <ChevronDown
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            size={20}
          />
        </summary>

        {/* Reading Progress Bar */}
        {slug && isOpen && isMounted && (
          <div className="relative w-full h-1.5 bg-theme-gray rounded-full mt-3 mb-2 overflow-hidden">
            {/* Live progress fill - using solid color approach like heatmap */}
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, liveProgress))}%`,
                backgroundColor: "var(--color-tertiary)",
                opacity: 0.7,
              }}
            />

            {/* Saved progress marker */}
            {savedProgressPercent > 0 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-theme-dark opacity-60"
                style={{
                  left: `${Math.min(100, Math.max(0, savedProgressPercent))}%`,
                }}
                title={`Last read: ${Math.round(savedProgressPercent)}%`}
              />
            )}
          </div>
        )}

        <ul className="toc-list mt-2 space-y-1 list-none p-0">
          {toc.map((entry) => (
            <li
              key={entry.slug}
              className="toc-item m-0"
              style={{ paddingLeft: `${entry.depth * TOC.DEPTH_INDENT}rem` }}
            >
              <a
                href={`#${entry.slug}`}
                data-for={entry.slug}
                className={`block py-1 px-2 text-sm rounded transition-colors ${
                  activeId === entry.slug
                    ? "text-theme-tertiary bg-theme-highlight font-medium"
                    : "text-theme-darkgray hover:text-theme-dark hover:bg-theme-highlight"
                }`}
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
