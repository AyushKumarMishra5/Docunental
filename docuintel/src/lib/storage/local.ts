/**
 * Local filesystem storage adapter (mock/development)
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { StorageAdapter } from './adapter';

export class LocalStorageAdapter implements StorageAdapter {
  private storagePath: string;

  constructor() {
    this.storagePath = process.env.LOCAL_STORAGE_PATH || './.docuintel/storage';
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.storagePath, key);
  }

  async store(file: Buffer, filename: string, _contentType: string): Promise<string> {
    await this.ensureDirectory();
    
    // Use timestamp + original filename as storage key
    const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = this.getFilePath(key);
    
    await fs.writeFile(filePath, file);
    
    return key;
  }

  async retrieve(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return await fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File might not exist
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
