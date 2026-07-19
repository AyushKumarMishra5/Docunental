/**
 * Storage Adapter Interface
 * Abstracts R2 (real) vs. local filesystem (mock)
 */

export interface StorageAdapter {
  /**
   * Store a file and return its storage key
   */
  store(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string>;

  /**
   * Retrieve a file by its storage key
   */
  retrieve(key: string): Promise<Buffer>;

  /**
   * Delete a file by its storage key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;
}

/**
 * Factory function to get the appropriate adapter based on environment
 */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  const useMock = process.env.USE_MOCK === '1' || !process.env.R2_ACCOUNT_ID;
  
  if (useMock) {
    const { LocalStorageAdapter } = await import('./local');
    return new LocalStorageAdapter();
  } else {
    const { R2StorageAdapter } = await import('./r2');
    return new R2StorageAdapter();
  }
}
