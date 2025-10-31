import { atom, map } from "nanostores";

/**
 * Explorer state management with nanostores
 */

export interface FolderState {
  path: string;
  collapsed: boolean;
}

// Global explorer state
export const explorerCollapsed = atom<boolean>(false);
export const explorerScrollTop = atom<number>(0);
export const folderStates = map<Record<string, boolean>>({});

// Load folder states from localStorage
export function loadFolderStates(): void {
  try {
    const stored = localStorage.getItem("fileTree");
    if (stored) {
      const states = JSON.parse(stored) as FolderState[];
      const stateMap: Record<string, boolean> = {};
      states.forEach(({ path, collapsed }) => {
        stateMap[path] = collapsed;
      });
      folderStates.set(stateMap);
    }
  } catch (error) {
    console.error("Failed to load folder states:", error);
  }
}

// Save folder states to localStorage
export function saveFolderStates(): void {
  try {
    const states = Object.entries(folderStates.get()).map(
      ([path, collapsed]) => ({
        path,
        collapsed,
      }),
    );
    localStorage.setItem("fileTree", JSON.stringify(states));
  } catch (error) {
    console.error("Failed to save folder states:", error);
  }
}

// Toggle a specific folder
export function toggleFolder(
  path: string,
  defaultCollapsed: boolean = true,
): void {
  const states = folderStates.get();
  const currentState = states[path] ?? defaultCollapsed;
  folderStates.setKey(path, !currentState);
  saveFolderStates();
}

// Get folder state
export function getFolderState(
  path: string,
  defaultCollapsed: boolean = true,
): boolean {
  const states = folderStates.get();
  return states[path] ?? defaultCollapsed;
}

// Load scroll position from sessionStorage
export function loadScrollPosition(): void {
  try {
    const stored = sessionStorage.getItem("explorerScrollTop");
    if (stored) {
      explorerScrollTop.set(parseInt(stored, 10));
    }
  } catch (error) {
    console.error("Failed to load scroll position:", error);
  }
}

// Save scroll position to sessionStorage
export function saveScrollPosition(scrollTop: number): void {
  try {
    explorerScrollTop.set(scrollTop);
    sessionStorage.setItem("explorerScrollTop", scrollTop.toString());
  } catch (error) {
    console.error("Failed to save scroll position:", error);
  }
}
