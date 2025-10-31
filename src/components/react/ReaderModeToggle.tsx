import { BookOpen, BookOpenCheck } from "lucide-react";
import { useStore } from "@nanostores/react";
import { isReadingMode } from "../../stores/readingMode";

export function ReaderModeToggle() {
  const readerMode = useStore(isReadingMode);

  const toggleReaderMode = () => {
    const newMode = !readerMode;
    isReadingMode.set(newMode);
    document.body.classList.toggle("reading-mode", newMode);
  };

  return (
    <button
      onClick={toggleReaderMode}
      className="p-2 rounded-lg hover:bg-theme-highlight transition-colors"
      aria-label="Toggle reader mode"
      title={readerMode ? "Exit reader mode" : "Enter reader mode"}
    >
      {readerMode ? (
        <BookOpenCheck className="h-5 w-5" />
      ) : (
        <BookOpen className="h-5 w-5" />
      )}
    </button>
  );
}
