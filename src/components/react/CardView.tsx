import { memo } from "react";
import type { Note } from "../../utils/filterNotes";
import type { BaseView } from "../../utils/bases/types";
import {
  getPropertyValue,
  formatPropertyValue,
} from "../../utils/bases/filter";

interface CardViewProps {
  notes: Note[];
  view: BaseView;
  baseName: string;
  imageUrlMap?: Record<string, string>;
}

function getPropertyLabel(propertyName: string): string {
  if (propertyName.startsWith("file.")) {
    const name = propertyName.substring(5);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  if (propertyName.startsWith("formula.")) {
    return propertyName.substring(8);
  }
  return propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
}

const Card = memo(
  ({
    note,
    view,
    imageUrl,
  }: {
    note: Note;
    view: BaseView;
    imageUrl?: string;
  }) => {
    const propertyOrder = view.order || ["file.name"];

    // Use the pre-processed image URL if available
    const imageValue = imageUrl || null;

    const imageFit = view.imageFit || "cover";
    const imageAspectRatio = view.imageAspectRatio || 0.75; // Default 4:3

    return (
      <div className="rounded-lg overflow-hidden transition-shadow bg-theme-light border border-theme-lightgray hover:shadow-lg">
        {/* Image */}
        {imageValue && (
          <div
            className="w-full overflow-hidden relative bg-theme-lightgray"
            style={{
              paddingBottom: `${imageAspectRatio * 100}%`,
            }}
          >
            <img
              src={String(imageValue)}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: imageFit === "contain" ? "contain" : "cover",
              }}
            />
          </div>
        )}

        {/* Card Content */}
        <div className="p-4 space-y-2">
          {propertyOrder.map((propertyName) => {
            const value = getPropertyValue(note, propertyName);
            const formatted = formatPropertyValue(value);

            // Title/Name - always clickable and prominent
            if (propertyName === "file.name") {
              return (
                <div key={propertyName}>
                  <a
                    href={`${import.meta.env.BASE_URL}/${note.slug}`}
                    className="text-lg font-semibold no-underline hover:underline block text-theme-secondary hover:text-theme-tertiary transition-colors"
                  >
                    {formatted || note.data.title || note.slug}
                  </a>
                </div>
              );
            }

            // Tags - render as badges
            if (propertyName === "file.tags" || propertyName === "tags") {
              return Array.isArray(value) && value.length > 0 ? (
                <div key={propertyName} className="flex flex-wrap gap-1.5">
                  {value.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded text-theme-light bg-theme-tertiary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null;
            }

            // Backlinks - show count
            if (propertyName === "file.backlinks") {
              const count = Array.isArray(value) ? value.length : 0;
              return count > 0 ? (
                <div key={propertyName} className="text-sm text-theme-darkgray">
                  <span className="font-medium">Backlinks:</span> {count}
                </div>
              ) : null;
            }

            // Other properties - render with label
            if (value !== null && value !== undefined && value !== "") {
              return (
                <div key={propertyName} className="text-sm text-theme-darkgray">
                  <span className="font-medium">
                    {getPropertyLabel(propertyName)}:
                  </span>{" "}
                  {formatted}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  },
);

export function CardView({ notes, view, imageUrlMap = {} }: CardViewProps) {
  const cardSize = view.cardSize || 250; // Default 250px card width

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 px-4 italic text-theme-darkgray">
        <p>No notes match the current filters.</p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 w-full"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`,
      }}
    >
      {notes.map((note) => (
        <Card
          key={note.slug}
          note={note}
          view={view}
          imageUrl={imageUrlMap[note.slug]}
        />
      ))}
    </div>
  );
}
