import { useEffect, useState, useRef, useCallback } from "react";
import { LinkPreviewPanel, type LinkPreviewData } from "./LinkPreviewPanel";
import type { ContentDetails } from "../../pages/static/contentIndex.json";
import { config } from "../../config";

interface PanelState {
  id: string;
  data: LinkPreviewData;
  anchorRect: DOMRect;
  zIndex: number;
  isPinned: boolean;
  isMinimized: boolean;
  minimizedIndex?: number;
  position?: { x: number; y: number };
  size?: { w: number; h: number };
}

export function LinkPreviewManager() {
  const [contentIndex, setContentIndex] = useState<Record<
    string,
    ContentDetails
  > | null>(null);
  const [panels, setPanels] = useState<Map<string, PanelState>>(() => {
    // Restore panels from sessionStorage on mount
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("linkPreviewPanels");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return new Map(parsed);
        } catch (e) {
          console.error("Failed to restore panels:", e);
        }
      }
    }
    return new Map();
  });
  const [highestZIndex, setHighestZIndex] = useState(() => {
    // Restore zIndex from sessionStorage
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("linkPreviewZIndex");
      if (saved) {
        return parseInt(saved, 10);
      }
    }
    return 1000;
  });

  const hoverTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const contentCacheRef = useRef<Map<string, string>>(new Map());
  const activeSlugRef = useRef<string | null>(null);

  // Helper function to extract slug consistently
  const extractSlug = (href: string): string => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    return href
      .replace(new RegExp(`^${baseUrl.replace(/\/$/, "")}`), "")
      .replace(/^\//, "")
      .replace(/#.*$/, "");
  };

  // Save panels state to sessionStorage whenever it changes
  useEffect(() => {
    if (panels.size > 0) {
      sessionStorage.setItem(
        "linkPreviewPanels",
        JSON.stringify(Array.from(panels.entries())),
      );
      sessionStorage.setItem("linkPreviewZIndex", highestZIndex.toString());
    } else {
      sessionStorage.removeItem("linkPreviewPanels");
      sessionStorage.removeItem("linkPreviewZIndex");
    }
  }, [panels, highestZIndex]);

  // Load content index
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}/static/contentIndex.json`)
      .then((res) => res.json())
      .then((data) => {
        setContentIndex(data);
      })
      .catch((err) => console.error("Failed to load content index:", err));
  }, []);

  // Setup hover listeners using event delegation
  useEffect(() => {
    if (!contentIndex || !config.popover?.enable) return;

    // Disable on mobile/touch devices - popovers are designed for hover/mouse interaction
    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window;
    if (isTouchDevice) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a.internal-link") as HTMLAnchorElement;
      if (!link) return;

      // Extract slug from href (strip base URL if present)
      const href = link.getAttribute("href");
      if (!href) return;

      const slug = extractSlug(href);
      const content = contentIndex[slug];
      if (!content) return;

      // Clear timeout for different link if hovering over new link
      if (activeSlugRef.current && activeSlugRef.current !== slug) {
        const prevTimeout = hoverTimeoutRef.current[activeSlugRef.current];
        if (prevTimeout) {
          clearTimeout(prevTimeout);
          hoverTimeoutRef.current[activeSlugRef.current] = null;
        }
      }

      activeSlugRef.current = slug;

      // Skip if timeout already exists for this slug
      if (hoverTimeoutRef.current[slug]) return;

      // Set delay before showing preview
      hoverTimeoutRef.current[slug] = setTimeout(() => {
        showPreview(slug, link, content);
        // Clean up timeout after it fires
        hoverTimeoutRef.current[slug] = null;
      }, config.popover?.hoverDelay ?? 300);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;

      // Don't close if mouse moved to the preview panel itself
      if (relatedTarget?.closest(".lp-panel")) return;

      const link = target.closest("a.internal-link") as HTMLAnchorElement;
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      const slug = extractSlug(href);

      // Cancel pending preview
      if (hoverTimeoutRef.current[slug]) {
        clearTimeout(hoverTimeoutRef.current[slug]);
        hoverTimeoutRef.current[slug] = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if click is outside all panels
      const isOutsidePanel = !target.closest(".lp-panel");
      if (isOutsidePanel) {
        // Close unpinned, non-minimized panels
        setPanels((prev) => {
          const next = new Map(prev);
          for (const [id, panel] of prev.entries()) {
            // Only close panels that are unpinned AND not minimized
            if (!panel.isPinned && !panel.isMinimized) {
              next.delete(id);
            }
          }
          return next;
        });
      }
    };

    // Use event delegation with bubble phase for better compatibility
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("click", handleClick);

      // Clear all timeouts
      Object.values(hoverTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [contentIndex]);

  const showPreview = async (
    slug: string,
    linkElement: HTMLElement,
    content: ContentDetails,
  ) => {
    // Check if panel already exists
    if (panels.has(slug)) {
      // Clear any pending timeout for this slug
      if (hoverTimeoutRef.current[slug]) {
        clearTimeout(hoverTimeoutRef.current[slug]);
        hoverTimeoutRef.current[slug] = null;
      }
      // Bring to front
      handleFocus(slug);
      return;
    }

    const anchorRect = linkElement.getBoundingClientRect();

    // Calculate initial position and size
    const viewport = { w: window.innerWidth, h: window.innerHeight };
    const size = {
      w: config.popover?.defaultSize.width ?? 560,
      h: config.popover?.defaultSize.height ?? 380,
    };

    let x = anchorRect.left;
    let y = anchorRect.bottom + 8; // LINK_PREVIEW.PANEL_MARGIN

    // Flip above if no space below
    if (y + size.h > viewport.h - 16) {
      // LINK_PREVIEW.VIEWPORT_PADDING
      y = anchorRect.top - 8 - size.h;
    }

    // Clamp horizontal position
    if (x + size.w > viewport.w - 16) {
      x = viewport.w - 16 - size.w;
    }
    if (x < 16) {
      x = 16;
    }
    if (y < 16) {
      y = 16;
    }

    const position = { x, y };

    let htmlContent: string | undefined;

    // Fetch full content if enabled
    if (config.popover?.showFullContent) {
      // Check cache first
      if (config.popover?.cacheContent && contentCacheRef.current.has(slug)) {
        htmlContent = contentCacheRef.current.get(slug);
      } else {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}/${slug}`);
          if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // Extract article content
            const article = doc.querySelector("article");
            if (article) {
              htmlContent = article.innerHTML;

              // Cache if enabled
              if (config.popover?.cacheContent) {
                contentCacheRef.current.set(slug, htmlContent);
              }
            }
          }
        } catch {
          // Silently fail and use metadata only
        }
      }
    }

    const newPanel: PanelState = {
      id: slug,
      data: {
        title: content.title,
        url: `${import.meta.env.BASE_URL}/${slug}`,
        excerpt: content.excerpt,
        description: content.description,
        author: content.author,
        date: content.date,
        tags: content.tags,
        content: htmlContent,
      },
      anchorRect,
      zIndex: highestZIndex + 1,
      isPinned: false,
      isMinimized: false,
      position: position,
      size: size,
    };

    setHighestZIndex(highestZIndex + 1);
    setPanels((prev) => new Map(prev).set(slug, newPanel));
  };

  const handleClose = useCallback((id: string) => {
    // Clear any pending timeout for this panel
    if (hoverTimeoutRef.current[id]) {
      clearTimeout(hoverTimeoutRef.current[id]);
      hoverTimeoutRef.current[id] = null;
    }

    setPanels((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleOpenInNewTab = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handlePinChange = useCallback((id: string, pinned: boolean) => {
    setPanels((prev) => {
      const next = new Map(prev);
      const panel = next.get(id);
      if (panel) {
        next.set(id, { ...panel, isPinned: pinned });
      }
      return next;
    });
  }, []);

  const handleMove = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      setPanels((prev) => {
        const next = new Map(prev);
        const panel = next.get(id);
        if (panel) {
          next.set(id, { ...panel, position: pos });
        }
        return next;
      });
    },
    [],
  );

  const handleResize = useCallback(
    (id: string, size: { w: number; h: number }) => {
      setPanels((prev) => {
        const next = new Map(prev);
        const panel = next.get(id);
        if (panel) {
          next.set(id, { ...panel, size });
        }
        return next;
      });
    },
    [],
  );

  const handleFocus = useCallback(
    (id: string) => {
      setPanels((prev) => {
        const next = new Map(prev);
        const panel = next.get(id);
        if (panel) {
          const newZIndex = highestZIndex + 1;
          setHighestZIndex(newZIndex);
          next.set(id, { ...panel, zIndex: newZIndex });
        }
        return next;
      });
    },
    [highestZIndex],
  );

  const handleMinimizeChange = useCallback((id: string, minimized: boolean) => {
    setPanels((prev) => {
      const next = new Map(prev);
      const panel = next.get(id);
      if (!panel) return next;

      if (minimized) {
        // Count existing minimized panels to determine stack position
        const minimizedCount = Array.from(prev.values()).filter(
          (p) => p.isMinimized,
        ).length;
        const minimizedHeight = 40; // Height of minimized panel
        const margin = 16;

        // Calculate bottom-left position
        const minimizedPos = {
          x: margin,
          y:
            window.innerHeight -
            minimizedHeight * (minimizedCount + 1) -
            margin,
        };

        next.set(id, {
          ...panel,
          isMinimized: true,
          minimizedIndex: minimizedCount,
          position: minimizedPos,
        });
      } else {
        // Unminimizing - recalculate positions of remaining minimized panels
        next.set(id, {
          ...panel,
          isMinimized: false,
          minimizedIndex: undefined,
        });

        // Reindex remaining minimized panels
        const minimizedPanels = Array.from(next.values())
          .filter((p) => p.isMinimized)
          .sort((a, b) => (a.minimizedIndex || 0) - (b.minimizedIndex || 0));

        minimizedPanels.forEach((p, index) => {
          const minimizedHeight = 40;
          const margin = 16;
          const newPos = {
            x: margin,
            y: window.innerHeight - minimizedHeight * (index + 1) - margin,
          };
          next.set(p.id, { ...p, minimizedIndex: index, position: newPos });
        });
      }

      return next;
    });
  }, []);

  return (
    <>
      {Array.from(panels.values()).map((panel) => (
        <LinkPreviewPanel
          key={panel.id}
          id={panel.id}
          {...panel.data}
          anchorRect={panel.anchorRect}
          zIndex={panel.zIndex}
          isMinimized={panel.isMinimized}
          minimizedPosition={panel.position}
          initialPosition={panel.position}
          initialSize={panel.size}
          onClose={handleClose}
          onOpenInNewTab={handleOpenInNewTab}
          onPinChange={handlePinChange}
          onMinimizeChange={handleMinimizeChange}
          onMove={handleMove}
          onResize={handleResize}
          onFocus={handleFocus}
        />
      ))}
    </>
  );
}
