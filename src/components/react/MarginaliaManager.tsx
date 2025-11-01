import { useEffect, useRef, useState, useLayoutEffect, memo } from "react";
import { MARGINALIA, TIMING } from "../../constants/spacing";

export interface MarginaliaEntry {
  id: number;
  content: string;
  html: string;
}

interface Props {
  marginalia: MarginaliaEntry[];
}

interface PositionedNote {
  id: number;
  content: string;
  html: string;
  top: number;
}

export const MarginaliaManager = memo(function MarginaliaManager({
  marginalia,
}: Props) {
  const [positions, setPositions] = useState<PositionedNote[]>([]);
  const columnRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!marginalia || marginalia.length === 0) return;

    // Find all marginalia markers and calculate their positions
    const calculatePositions = () => {
      const markers = document.querySelectorAll(".marginalia-marker");
      const newPositions: PositionedNote[] = [];
      let lastBottom = 0;

      markers.forEach((marker) => {
        const rect = marker.getBoundingClientRect();
        const article = marker.closest("article");
        if (!article) return;

        const articleRect = article.getBoundingClientRect();
        const relativeTop = rect.top - articleRect.top;

        const marginaliaId = parseInt(
          marker.getAttribute("data-marginalia-id") || "0",
        );
        const note = marginalia.find((m) => m.id === marginaliaId);
        if (!note) return;

        // Calculate position, preventing overlap
        let top = relativeTop;
        if (top < lastBottom + MARGINALIA.NOTE_GAP) {
          top = lastBottom + MARGINALIA.NOTE_GAP;
        }

        newPositions.push({
          id: note.id,
          content: note.content,
          html: note.html,
          top,
        });

        // Use actual rendered height if available, otherwise estimate
        const existingNote = columnRef.current?.querySelector(
          `[data-note-id="${note.id}"]`,
        );
        let actualHeight;

        if (existingNote) {
          actualHeight = existingNote.getBoundingClientRect().height;
        } else {
          // Estimate: check for images in HTML
          const hasImage = /<img[^>]*>/.test(note.html);
          if (hasImage) {
            // Images constrained to 240px width, assume average 150px height + margins
            actualHeight =
              150 +
              MARGINALIA.BASE_PADDING +
              Math.ceil(
                note.content.length / MARGINALIA.ESTIMATED_CHARS_PER_LINE,
              ) *
                MARGINALIA.ESTIMATED_LINE_HEIGHT;
          } else {
            actualHeight =
              Math.ceil(
                note.content.length / MARGINALIA.ESTIMATED_CHARS_PER_LINE,
              ) *
                MARGINALIA.ESTIMATED_LINE_HEIGHT +
              MARGINALIA.BASE_PADDING;
          }
        }

        lastBottom = top + actualHeight;
      });

      setPositions(newPositions);
    };

    // Wait for images to load and then recalculate
    const waitForImages = () => {
      if (!columnRef.current) return;

      const images = columnRef.current.querySelectorAll("img");
      if (images.length === 0) {
        calculatePositions();
        return;
      }

      let loadedCount = 0;
      const totalImages = images.length;

      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          calculatePositions();
        }
      };

      images.forEach((img) => {
        if (img.complete) {
          onImageLoad();
        } else {
          img.addEventListener("load", onImageLoad);
          img.addEventListener("error", onImageLoad); // Count errors as "loaded" to not block
        }
      });
    };

    // Use ResizeObserver with debouncing for more efficient updates
    let debounceTimer: NodeJS.Timeout | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        calculatePositions();
      }, 150); // Debounce by 150ms
    });

    // Observe the article element
    const article = document.querySelector("article");
    if (article) {
      resizeObserver.observe(article);
    }

    // Also observe the marginalia column itself for when notes render/resize
    if (columnRef.current) {
      resizeObserver.observe(columnRef.current);
    }

    // Initial calculation with delay to ensure content is rendered
    const timeoutId = setTimeout(waitForImages, TIMING.MARGINALIA_RENDER_DELAY);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [marginalia]);

  if (!marginalia || marginalia.length === 0) return null;

  const handleNoteMouseEnter = (id: number) => {
    // Highlight the corresponding marker in text
    const marker = document.querySelector(
      `.marginalia-marker[data-marginalia-id="${id}"]`,
    );
    if (marker) {
      const ref = marker.querySelector(".marginalia-ref");
      if (ref) {
        ref.classList.add("highlight");
      }
    }
  };

  const handleNoteMouseLeave = (id: number) => {
    // Remove highlight from the marker in text
    const marker = document.querySelector(
      `.marginalia-marker[data-marginalia-id="${id}"]`,
    );
    if (marker) {
      const ref = marker.querySelector(".marginalia-ref");
      if (ref) {
        ref.classList.remove("highlight");
      }
    }
  };

  useEffect(() => {
    // Add hover listeners to markers in text
    const handleMarkerMouseEnter = (e: Event) => {
      const marker = (e.currentTarget as HTMLElement).closest(
        ".marginalia-marker",
      );
      if (!marker) return;
      const id = marker.getAttribute("data-marginalia-id");
      if (!id) return;

      // Highlight the corresponding note in sidebar
      const note = document.querySelector(
        `.marginalia-note[data-note-id="${id}"] .marginalia-note-num`,
      );
      if (note) {
        note.classList.add("highlight");
      }
    };

    const handleMarkerMouseLeave = (e: Event) => {
      const marker = (e.currentTarget as HTMLElement).closest(
        ".marginalia-marker",
      );
      if (!marker) return;
      const id = marker.getAttribute("data-marginalia-id");
      if (!id) return;

      // Remove highlight from the note in sidebar
      const note = document.querySelector(
        `.marginalia-note[data-note-id="${id}"] .marginalia-note-num`,
      );
      if (note) {
        note.classList.remove("highlight");
      }
    };

    const markers = document.querySelectorAll(".marginalia-marker");
    markers.forEach((marker) => {
      const ref = marker.querySelector(".marginalia-ref");
      if (ref) {
        ref.addEventListener("mouseenter", handleMarkerMouseEnter);
        ref.addEventListener("mouseleave", handleMarkerMouseLeave);
      }
    });

    return () => {
      markers.forEach((marker) => {
        const ref = marker.querySelector(".marginalia-ref");
        if (ref) {
          ref.removeEventListener("mouseenter", handleMarkerMouseEnter);
          ref.removeEventListener("mouseleave", handleMarkerMouseLeave);
        }
      });
    };
  }, [marginalia]);

  return (
    <div ref={columnRef} className="marginalia-column-react">
      {positions.map((note) => (
        <div
          key={note.id}
          data-note-id={note.id}
          className="marginalia-note"
          style={{ top: `${note.top}px` }}
          onMouseEnter={() => handleNoteMouseEnter(note.id)}
          onMouseLeave={() => handleNoteMouseLeave(note.id)}
        >
          <span className="marginalia-note-num">{note.id}.</span>
          <span
            className="marginalia-note-text"
            dangerouslySetInnerHTML={{ __html: note.html }}
          />
        </div>
      ))}
    </div>
  );
});
