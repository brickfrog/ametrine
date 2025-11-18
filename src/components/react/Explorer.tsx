import { useEffect, useState, useRef, memo } from "react";
import { useStore } from "@nanostores/react";
import { ChevronDown } from "lucide-react";
import { FileTrieNode } from "../../utils/fileTrie";
import type { ContentDetails } from "../../pages/static/contentIndex.json";
import { logger } from "../../utils/logger";
import {
  loadFolderStates,
  toggleFolder as toggleFolderState,
  loadScrollPosition,
  saveScrollPosition,
  folderStates,
} from "../../stores/explorer";

interface ExplorerProps {
  behavior?: "collapse" | "link";
  defaultState?: "collapsed" | "open";
  useSavedState?: boolean;
  contentIndex?: Record<string, ContentDetails>;
}

type FullSlug = string;

function simplifySlug(slug: string): string {
  return slug.replace(/\/index$/, "");
}

interface FileNodeProps {
  node: FileTrieNode<ContentDetails>;
  currentSlug: string;
}

const FileNode = memo(({ node, currentSlug }: FileNodeProps) => {
  const isBase = node.data?.type === "base";
  const isImage = node.data?.type === "image";
  const isCanvas = node.data?.type === "canvas";
  const href =
    (isBase || isImage || isCanvas) && node.data?.links?.[0]
      ? `${import.meta.env.BASE_URL}/${node.data.links[0]}`
      : `${import.meta.env.BASE_URL}/${node.slug}`;
  const isActive =
    currentSlug === node.slug || currentSlug === simplifySlug(node.slug);

  return (
    <li>
      <a
        href={href}
        data-for={node.slug}
        className={`block py-1 text-sm text-theme-dark opacity-75 hover:opacity-100 no-underline transition-opacity flex items-center gap-2 ${
          isActive ? "!opacity-100 !text-theme-secondary font-semibold" : ""
        }`}
      >
        <span className="flex-1">{node.displayName}</span>
        {isBase && (
          <span className="text-xs px-1 py-0.5 bg-theme-secondary text-theme-dark rounded font-bold">
            BASE
          </span>
        )}
        {isImage && node.data?.extension && (
          <span className="text-xs px-1 py-0.5 bg-theme-tertiary text-theme-dark rounded font-bold">
            {node.data.extension}
          </span>
        )}
        {isCanvas && (
          <span className="text-xs px-1 py-0.5 bg-theme-tertiary text-theme-dark rounded font-bold">
            CANVAS
          </span>
        )}
      </a>
    </li>
  );
});

interface FolderNodeProps {
  node: FileTrieNode<ContentDetails>;
  currentSlug: string;
  behavior: "collapse" | "link";
  defaultCollapsed: boolean;
}

const FolderNode = memo(
  ({ node, currentSlug, behavior, defaultCollapsed }: FolderNodeProps) => {
    const folderPath = node.slug;
    const folderLinkPath = folderPath.replace(/\/index$/, "");
    const folderStatesMap = useStore(folderStates);

    const isCollapsed = folderStatesMap[folderPath] ?? defaultCollapsed;

    // If this folder is a prefix of the current path, open it
    const simpleFolderPath = simplifySlug(folderPath);
    const folderIsPrefixOfCurrentSlug =
      simpleFolderPath === currentSlug.slice(0, simpleFolderPath.length);

    const isOpen = !isCollapsed || folderIsPrefixOfCurrentSlug;

    const handleToggle = () => {
      toggleFolderState(folderPath, defaultCollapsed);
    };

    const FolderContent =
      behavior === "link" ? (
        <a
          href={`${import.meta.env.BASE_URL}/${folderLinkPath}`}
          data-for={folderLinkPath}
          className="text-theme-secondary font-header text-sm font-semibold leading-6 inline-block no-underline hover:text-theme-tertiary"
        >
          {node.displayName}
        </a>
      ) : (
        <button
          onClick={handleToggle}
          className="text-left cursor-pointer p-0 bg-transparent border-none flex items-center font-header text-theme-dark"
        >
          <span className="text-sm inline-block text-theme-secondary font-semibold m-0 leading-6 pointer-events-none">
            {node.displayName}
          </span>
        </button>
      );

    return (
      <li>
        <div className="flex flex-row items-center select-none">
          <ChevronDown
            className={`mr-[5px] text-theme-secondary cursor-pointer transition-transform duration-300 flex-shrink-0 hover:text-theme-tertiary ${
              !isOpen ? "-rotate-90" : ""
            }`}
            size={12}
            onClick={handleToggle}
          />
          <div>{FolderContent}</div>
        </div>
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <ul className="overflow-hidden ml-[6px] pl-[0.8rem] border-l border-theme-lightgray list-none m-0 p-0">
            {node.children.map((child) =>
              child.isFolder ? (
                <FolderNode
                  key={child.slug}
                  node={child}
                  currentSlug={currentSlug}
                  behavior={behavior}
                  defaultCollapsed={defaultCollapsed}
                />
              ) : (
                <FileNode
                  key={child.slug}
                  node={child}
                  currentSlug={currentSlug}
                />
              ),
            )}
          </ul>
        </div>
      </li>
    );
  },
);

export function Explorer({
  behavior = "link",
  defaultState = "collapsed",
  useSavedState = true,
  contentIndex,
}: ExplorerProps) {
  const [trie, setTrie] = useState<FileTrieNode<ContentDetails> | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string>("");
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);

  const defaultCollapsed = defaultState === "collapsed";

  // Load data and initialize
  useEffect(() => {
    const init = async () => {
      // Get current slug
      const slug =
        window.location.pathname.slice(1).replace(/\/$/, "") || "index";
      setCurrentSlug(slug);

      // Load saved states
      if (useSavedState) {
        loadFolderStates();
        loadScrollPosition();
      }

      // Use provided contentIndex if available, otherwise fetch
      let data: Record<string, ContentDetails>;
      if (contentIndex) {
        data = contentIndex;
      } else {
        try {
          const response = await fetch(
            `${import.meta.env.BASE_URL}/static/contentIndex.json`,
          );
          data = await response.json();
        } catch (error) {
          logger.error("Failed to fetch content index:", error);
          return;
        }
      }

      const entries = Object.entries(data) as [FullSlug, ContentDetails][];
      const trieNode = FileTrieNode.fromEntries(entries);

      // Sort: folders first, then alphabetical
      trieNode.sort((a, b) => {
        if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
          return a.displayName.localeCompare(b.displayName, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }
        return a.isFolder ? -1 : 1;
      });

      // Filter out tags folder
      trieNode.filter((node) => node.slugSegment !== "tags");

      setTrie(trieNode);
    };

    init();
  }, [useSavedState, loadFolderStates, loadScrollPosition, contentIndex]);

  // Restore scroll position (only once after initial load)
  useEffect(() => {
    if (contentRef.current && trie && !hasRestoredScroll.current) {
      hasRestoredScroll.current = true;
      const saved = sessionStorage.getItem("explorerScrollTop");
      if (saved) {
        contentRef.current.scrollTop = parseInt(saved, 10);
      } else {
        // Scroll to active element
        const activeElement =
          contentRef.current.querySelector(".font-semibold");
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [trie]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (contentRef.current) {
        saveScrollPosition(contentRef.current.scrollTop);
      }
    };
  }, [saveScrollPosition]);

  if (!trie) {
    return null;
  }

  return (
    <div className="explorer">
      {/* Desktop toggle with title */}
      <button
        type="button"
        onClick={() => setDesktopCollapsed(!desktopCollapsed)}
        aria-expanded={!desktopCollapsed}
        className="desktop-explorer bg-transparent border-none text-left cursor-pointer p-0 text-theme-dark items-center hidden lg:flex"
      >
        <h2 className="text-base inline-block m-0">Explorer</h2>
        <ChevronDown
          className={`ml-2 transition-transform duration-300 opacity-80 ${
            desktopCollapsed ? "-rotate-90" : ""
          }`}
          size={14}
        />
      </button>

      {/* Explorer content */}
      <div
        id="explorer-content"
        ref={contentRef}
        className={`explorer-content list-none overflow-hidden overflow-y-auto mt-2 max-h-[calc(100vh-20rem)] ${
          desktopCollapsed ? "lg:hidden" : ""
        }`}
      >
        <ul className="explorer-ul list-none m-0 p-0 overscroll-contain">
          {trie.children.map((child) =>
            child.isFolder ? (
              <FolderNode
                key={child.slug}
                node={child}
                currentSlug={currentSlug}
                behavior={behavior}
                defaultCollapsed={defaultCollapsed}
              />
            ) : (
              <FileNode
                key={child.slug}
                node={child}
                currentSlug={currentSlug}
              />
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
