/**
 * CLI Sync - Automatically sync workspace data to ~/.config/postroc/data/
 * Uses the File System Access API to write directly to the filesystem
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'postroc-cli-sync';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'cli-directory';

interface SyncDB {
  handles: {
    key: string;
    value: FileSystemDirectoryHandle;
  };
}

let dbPromise: Promise<IDBPDatabase<SyncDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SyncDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('handles');
      },
    });
  }
  return dbPromise;
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Get stored directory handle
 */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await getDB();
    const handle = await db.get(STORE_NAME, HANDLE_KEY);
    return handle || null;
  } catch {
    return null;
  }
}

/**
 * Store directory handle for future use
 */
async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, handle, HANDLE_KEY);
}

/**
 * Clear stored directory handle
 */
export async function clearDirectoryHandle(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, HANDLE_KEY);
}

/**
 * Request permission for the directory handle
 */
async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const options = { mode: 'readwrite' as const };

  // Check if we already have permission
  // @ts-expect-error - queryPermission is part of File System Access API
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  // Request permission
  // @ts-expect-error - requestPermission is part of File System Access API
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
}

/**
 * Prompt user to select CLI data directory
 * Ideally: ~/.config/postroc/data/
 */
export async function selectCLIDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    // @ts-expect-error - showDirectoryPicker is not in all TypeScript definitions
    const handle = await window.showDirectoryPicker({
      id: 'postroc-cli-data',
      mode: 'readwrite',
      startIn: 'documents',
    });

    await storeDirectoryHandle(handle);
    return handle;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

/**
 * Get or request CLI directory handle
 */
export async function getCLIDirectory(): Promise<FileSystemDirectoryHandle | null> {
  // Try to get stored handle first
  const storedHandle = await getStoredDirectoryHandle();

  if (storedHandle) {
    // Verify we still have permission
    const hasPermission = await verifyPermission(storedHandle);
    if (hasPermission) {
      return storedHandle;
    }
  }

  // Need to prompt user to select directory
  return selectCLIDirectory();
}

/**
 * Write workspace data to CLI directory
 */
export async function syncWorkspaceToCLI(
  workspaceId: string,
  workspaceName: string,
  jsonContent: string
): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    const dirHandle = await getCLIDirectory();

    if (!dirHandle) {
      return { success: false, error: 'No directory selected' };
    }

    // Create filename from workspace name
    const safeName = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `${safeName}.postroc.json`;

    // Write the file
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(jsonContent);
    await writable.close();

    return { success: true, path: `${dirHandle.name}/${filename}` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Sync all workspaces to CLI directory
 */
export async function syncAllWorkspacesToCLI(
  workspaces: Array<{ id: string; name: string; json: string }>
): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    const dirHandle = await getCLIDirectory();

    if (!dirHandle) {
      return { success: false, synced: 0, error: 'No directory selected' };
    }

    let synced = 0;

    for (const workspace of workspaces) {
      const safeName = workspace.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `${safeName}.postroc.json`;

      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(workspace.json);
      await writable.close();
      synced++;
    }

    return { success: true, synced };
  } catch (err) {
    return { success: false, synced: 0, error: (err as Error).message };
  }
}

/**
 * Check if we have a configured CLI sync directory
 */
export async function hasCLISyncConfigured(): Promise<boolean> {
  const handle = await getStoredDirectoryHandle();
  if (!handle) return false;

  try {
    const hasPermission = await verifyPermission(handle);
    return hasPermission;
  } catch {
    return false;
  }
}

/**
 * Get the name of the configured sync directory
 */
export async function getSyncDirectoryName(): Promise<string | null> {
  const handle = await getStoredDirectoryHandle();
  return handle?.name || null;
}
