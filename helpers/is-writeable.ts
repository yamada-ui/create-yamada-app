import fs from 'fs';

/**
 * Checks if the specified directory has write permission.
 */
export async function isWriteable(directory: string): Promise<boolean> {
  try {
    await fs.promises.access(directory, (fs.constants || fs).W_OK);
    return true;
  } catch (err) {
    return false;
  }
}
