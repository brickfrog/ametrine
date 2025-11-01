import { useEffect, useRef, useState, memo } from "react";
import { ExternalLink, Pin, Maximize, Minimize, X } from "lucide-react";
import { config } from "../../config";
import { LINK_PREVIEW } from "../../constants/spacing";

export interface LinkPreviewData {
  title: string;
  url: string;
  excerpt?: string;
  description?: string;
  author?: string;
  date?: string;
  tags?: string[];
  content?: string;
}

interface LinkPreviewPanelProps extends LinkPreviewData {
  id: string;
  anchorRect: DOMRect;
  zIndex: number;
  isMinimized: boolean;
  minimizedPosition?: { x: number; y: number };
  initialPosition?: { x: number; y: number };
  initialSize?: { w: number; h: number };
  onClose: (id: string) => void;
  onOpenInNewTab: (url: string) => void;
  onPinChange: (id: string, pinned: boolean) => void;
  onMinimizeChange: (id: string, minimized: boolean) => void;
  onMove: (id: string, pos: { x: number; y: number }) => void;
  onResize: (id: string, size: { w: number; h: number }) => void;
  onFocus: (id: string) => void;
}

export const LinkPreviewPanel = memo(function LinkPreviewPanel({
  id,
  title,
  url,
  excerpt,
  description,
  author,
  date,
  tags,
  content,
  anchorRect,
  zIndex,
  isMinimized,
  minimizedPosition,
  initialPosition,
  initialSize,
  onClose,
  onOpenInNewTab,
  onPinChange,
  onMinimizeChange,
  onMove,
  onResize,
  onFocus,
}: LinkPreviewPanelProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const [position, setPosition] = useState<{ x: number; y: number }>(
    initialPosition ?? { x: 0, y: 0 },
  );
  const [size, setSize] = useState<{ w: number; h: number }>(
    initialSize ?? {
      w: config.popover?.defaultSize.width ?? 560,
      h: config.popover?.defaultSize.height ?? 380,
    },
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    panelX: number;
    panelY: number;
  } | null>(null);
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Smart positioning on mount (only if no initialPosition provided)
  useEffect(() => {
    // Skip auto-positioning if we have a saved position
    if (initialPosition) return;

    const viewport = { w: window.innerWidth, h: window.innerHeight };

    let x = anchorRect.left;
    let y = anchorRect.bottom + LINK_PREVIEW.PANEL_MARGIN;

    // Flip above if no space below
    if (y + size.h > viewport.h - LINK_PREVIEW.VIEWPORT_PADDING) {
      y = anchorRect.top - LINK_PREVIEW.PANEL_MARGIN - size.h;
    }

    // Clamp horizontal position
    if (x + size.w > viewport.w - LINK_PREVIEW.VIEWPORT_PADDING) {
      x = viewport.w - LINK_PREVIEW.VIEWPORT_PADDING - size.w;
    }
    if (x < LINK_PREVIEW.VIEWPORT_PADDING) {
      x = LINK_PREVIEW.VIEWPORT_PADDING;
    }
    if (y < LINK_PREVIEW.VIEWPORT_PADDING) {
      y = LINK_PREVIEW.VIEWPORT_PADDING;
    }

    setPosition({ x, y });
  }, [anchorRect, initialPosition, size.h, size.w]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPinned) {
        onClose(id);
      } else if (e.key === "Enter") {
        window.location.href = url;
      } else if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        onClose(id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        togglePin();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        onMinimizeChange(id, !isMinimized);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPinned, isMinimized]);

  // Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".lp-controls")) return;

    e.preventDefault();
    setIsDragging(true);
    onFocus(id);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panelX: position.x,
      panelY: position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      const newX = Math.max(
        0,
        Math.min(window.innerWidth - size.w, dragStartRef.current.panelX + dx),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - size.h, dragStartRef.current.panelY + dy),
      );

      setPosition({ x: newX, y: newY });
      onMove(id, { x: newX, y: newY });
    }

    if (isResizing && resizeStartRef.current) {
      const dx = e.clientX - resizeStartRef.current.x;
      const dy = e.clientY - resizeStartRef.current.y;

      const minW = config.popover?.minSize.width ?? 320;
      const minH = config.popover?.minSize.height ?? 240;

      const newW = Math.max(minW, resizeStartRef.current.w + dx);
      const newH = Math.max(minH, resizeStartRef.current.h + dy);

      setSize({ w: newW, h: newH });
      onResize(id, { w: newW, h: newH });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    dragStartRef.current = null;
    resizeStartRef.current = null;
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  // Resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    onFocus(id);

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.w,
      h: size.h,
    };
  };

  const togglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    onPinChange(id, newPinned);
  };

  const handleMaximize = () => {
    onClose(id); // Close this popup
    window.location.href = url; // Navigate to the page (uses View Transitions)
  };

  const displayExcerpt = description || excerpt;
  const formattedDate = date ? new Date(date).toLocaleDateString() : null;

  if (isMinimized && minimizedPosition) {
    return (
      <div
        ref={panelRef}
        className="lp-panel minimized"
        data-panel-id={id}
        style={{
          left: minimizedPosition.x,
          top: minimizedPosition.y,
          zIndex,
        }}
        onClick={() => onMinimizeChange(id, false)}
      >
        <div className="lp-titlebar-mini">
          <span className="lp-title">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="lp-panel"
      data-panel-id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`lp-title-${id}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.w,
        height: size.h,
        zIndex: isDragging || isResizing ? zIndex + 1000 : zIndex,
      }}
      onClick={() => onFocus(id)}
    >
      <div
        className="lp-titlebar"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <span className="lp-title" id={`lp-title-${id}`}>
          {title}
        </span>
        <div className="lp-controls">
          <button
            onClick={() => onOpenInNewTab(url)}
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={togglePin}
            aria-label={isPinned ? "Unpin" : "Pin"}
            title={isPinned ? "Unpin" : "Pin"}
            className={isPinned ? "active" : ""}
          >
            <Pin size={16} />
          </button>
          <button
            onClick={handleMaximize}
            aria-label="Go to page"
            title="Go to page (navigate)"
          >
            <Maximize size={16} />
          </button>
          <button
            onClick={() => onMinimizeChange(id, true)}
            aria-label="Minimize"
            title="Minimize"
          >
            <Minimize size={16} />
          </button>
          <button onClick={() => onClose(id)} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="lp-content">
        <div className="lp-text">
          <h3>
            <a href={url}>{title}</a>
          </h3>
          {(author || formattedDate || (tags && tags.length > 0)) && (
            <div className="lp-meta">
              {author && <span>{author}</span>}
              {author && formattedDate && <span> · </span>}
              {formattedDate && <span>{formattedDate}</span>}
              {tags && tags.length > 0 && (
                <>
                  <span> · </span>
                  <span className="lp-tags">
                    {tags.slice(0, 5).map((tag, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        <a href={`${import.meta.env.BASE_URL}/tags/${tag}`}>
                          {tag}
                        </a>
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
          )}
          {content ? (
            <div
              className="lp-excerpt lp-full-content prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            displayExcerpt && <div className="lp-excerpt">{displayExcerpt}</div>
          )}
        </div>
      </div>
      <div
        className="lp-resizer"
        onMouseDown={handleResizeMouseDown}
        aria-hidden="true"
      />
    </div>
  );
});
