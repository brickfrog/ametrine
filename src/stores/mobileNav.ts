import { atom } from "nanostores";

/**
 * Mobile navigation state management
 * Controls scroll lock when mobile explorer is open
 */

export const isMobileExplorerOpen = atom<boolean>(false);

/**
 * Toggle mobile explorer and manage scroll lock
 */
export function toggleMobileExplorer(): void {
  const newState = !isMobileExplorerOpen.get();
  isMobileExplorerOpen.set(newState);

  // Apply scroll lock to document
  if (newState) {
    document.documentElement.classList.add("overflow-hidden");
  } else {
    document.documentElement.classList.remove("overflow-hidden");
  }
}

/**
 * Close mobile explorer and remove scroll lock
 */
export function closeMobileExplorer(): void {
  isMobileExplorerOpen.set(false);
  document.documentElement.classList.remove("overflow-hidden");
}

/**
 * Open mobile explorer and apply scroll lock
 */
export function openMobileExplorer(): void {
  isMobileExplorerOpen.set(true);
  document.documentElement.classList.add("overflow-hidden");
}
