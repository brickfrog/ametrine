import type { Note } from "./filterNotes";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { config } from "../config";

/**
 * Extract the folder path from a note slug
 * e.g., "guides/getting-started" -> "guides"
 *      "advanced/concepts/test" -> "advanced/concepts"
 *      "simple-note" -> ""
 */
export function getFolderPath(slug: string): string {
  const parts = slug.split("/");
  if (parts.length === 1) {
    return "";
  }
  return parts.slice(0, -1).join("/");
}

/**
 * Recursively scan filesystem for all directories in vault
 */
async function scanVaultDirectories(
  basePath: string,
  currentPath: string = "",
): Promise<string[]> {
  const folders: string[] = [];
  const fullPath = currentPath ? join(basePath, currentPath) : basePath;

  try {
    const entries = await readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const folderPath = currentPath
          ? `${currentPath}/${entry.name}`
          : entry.name;
        folders.push(folderPath);

        // Recursively scan subdirectories
        const subfolders = await scanVaultDirectories(basePath, folderPath);
        folders.push(...subfolders);
      }
    }
  } catch (err) {
    // Ignore errors (e.g., permission issues)
  }

  return folders;
}

/**
 * Get all unique folder paths from filesystem and notes
 */
export async function getAllFolders(notes: Note[]): Promise<string[]> {
  const folders = new Set<string>();

  // Add folders from note slugs
  notes.forEach((note) => {
    const folderPath = getFolderPath(note.slug);
    if (folderPath) {
      // Add this folder and all parent folders
      const parts = folderPath.split("/");
      for (let i = 1; i <= parts.length; i++) {
        folders.add(parts.slice(0, i).join("/"));
      }
    }
  });

  // Add folders from filesystem
  const vaultPath = `./src/content/${config.vaultName || "vault"}`;
  const fsFolders = await scanVaultDirectories(vaultPath);
  fsFolders.forEach((folder) => folders.add(folder));

  return Array.from(folders).sort();
}

/**
 * Check if a given path corresponds to a valid folder
 */
export function isValidFolder(path: string, notes: Note[]): boolean {
  return notes.some((note) => {
    const folderPath = getFolderPath(note.slug);
    return folderPath === path || folderPath.startsWith(path + "/");
  });
}

/**
 * Get all notes in a specific folder (not including subfolders)
 */
export function getNotesInFolder(
  folderPath: string,
  notes: Note[],
  includeSubfolders: boolean = false,
): Note[] {
  return notes.filter((note) => {
    const noteFolder = getFolderPath(note.slug);

    if (includeSubfolders) {
      // Include notes in this folder and all subfolders
      return (
        noteFolder === folderPath || noteFolder.startsWith(folderPath + "/")
      );
    } else {
      // Only include notes directly in this folder
      return noteFolder === folderPath;
    }
  });
}

/**
 * Get immediate subfolders of a folder path
 */
export function getSubfolders(folderPath: string, notes: Note[]): string[] {
  const subfolders = new Set<string>();

  notes.forEach((note) => {
    const noteFolder = getFolderPath(note.slug);

    // Check if this note is in a subfolder
    if (
      noteFolder.startsWith(folderPath + "/") ||
      (folderPath === "" && noteFolder !== "")
    ) {
      const relativePath = folderPath
        ? noteFolder.slice(folderPath.length + 1)
        : noteFolder;
      const firstSegment = relativePath.split("/")[0];
      if (firstSegment) {
        subfolders.add(
          folderPath ? `${folderPath}/${firstSegment}` : firstSegment,
        );
      }
    }
  });

  return Array.from(subfolders).sort();
}

/**
 * Get the display name for a folder (last segment of path)
 */
export function getFolderDisplayName(folderPath: string): string {
  const parts = folderPath.split("/");
  return parts[parts.length - 1];
}

/**
 * Get all files in a folder (including non-markdown files)
 */
export async function getAllFilesInFolder(
  folderPath: string,
): Promise<Array<{ name: string; type: string; path: string }>> {
  const vaultPath = `./src/content/${config.vaultName || "vault"}`;
  const fullPath = join(vaultPath, folderPath);
  const files: Array<{ name: string; type: string; path: string }> = [];

  try {
    const entries = await readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith(".")) {
        const ext = entry.name.split(".").pop()?.toLowerCase() || "";
        const relativePath = folderPath
          ? `${folderPath}/${entry.name}`
          : entry.name;

        files.push({
          name: entry.name,
          type: ext,
          path: relativePath,
        });
      }
    }
  } catch (err) {
    // Folder doesn't exist or permission error
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}
