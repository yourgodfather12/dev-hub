import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Simple in-memory cache for file operations
const fileCache = new Map<string, { content: string | string[]; timestamp: number; hash?: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getFileHash(content: string | Buffer): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

export async function readJsonIfExists<T = unknown>(
  filePath: string,
  useCache: boolean = true,
): Promise<T | undefined> {
  if (!(await fileExists(filePath))) return undefined;
  
  const cacheKey = `json:${filePath}`;
  
  if (useCache) {
    const cached = fileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      try {
        // Verify file hasn't changed by checking hash
        const currentStats = await fs.stat(filePath);
        const currentContent = await fs.readFile(filePath, 'utf8');
        const currentHash = getFileHash(currentContent);
        
        if (cached.hash === currentHash) {
          return JSON.parse(cached.content as string) as T;
        }
      } catch {
        // Fall through to read fresh
      }
    }
  }
  
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const hash = getFileHash(raw);
    const parsed = JSON.parse(raw) as T;
    
    if (useCache) {
      fileCache.set(cacheKey, {
        content: raw,
        timestamp: Date.now(),
        hash
      });
    }
    
    return parsed;
  } catch {
    return undefined;
  }
}

export async function readTextIfExists(
  filePath: string,
  useCache: boolean = true,
): Promise<string | undefined> {
  if (!(await fileExists(filePath))) return undefined;
  
  const cacheKey = `text:${filePath}`;
  
  if (useCache) {
    const cached = fileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      try {
        // Verify file hasn't changed
        const currentStats = await fs.stat(filePath);
        const currentContent = await fs.readFile(filePath, 'utf8');
        const currentHash = getFileHash(currentContent);
        
        if (cached.hash === currentHash) {
          return cached.content as string;
        }
      } catch {
        // Fall through to read fresh
      }
    }
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const hash = getFileHash(content);
    
    if (useCache) {
      fileCache.set(cacheKey, {
        content,
        timestamp: Date.now(),
        hash
      });
    }
    
    return content;
  } catch {
    return undefined;
  }
}

export async function walkFiles(
  root: string,
  filterExtensions?: string[],
  useCache: boolean = true,
): Promise<string[]> {
  const cacheKey = `walk:${root}:${filterExtensions?.join(',') || 'all'}`;
  
  if (useCache) {
    const cached = fileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      try {
        // Verify directory hasn't changed significantly
        const stats = await fs.stat(root);
        if (stats.mtime.getTime() < cached.timestamp) {
          return cached.content as string[];
        }
      } catch {
        // Fall through to fresh walk
      }
    }
  }
  
  const result: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === '.next' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name === 'coverage' ||
          entry.name === '.nyc_output' ||
          entry.name === '.vscode' ||
          entry.name === '.idea'
        ) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        if (
          filterExtensions &&
          !filterExtensions.some((ext) => entry.name.endsWith(ext))
        ) {
          continue;
        }
        result.push(fullPath);
      }
    }
  }

  await walk(root);
  
  if (useCache) {
    fileCache.set(cacheKey, {
      content: result,
      timestamp: Date.now()
    });
  }
  
  return result;
}

export function clearCache(): void {
  fileCache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: fileCache.size,
    keys: Array.from(fileCache.keys())
  };
}

export function setCacheTTL(ttl: number): void {
  // This would need to be implemented as a global variable
  // For now, this is a placeholder for future enhancement
  console.log(`Cache TTL set to ${ttl}ms (implementation needed)`);
}
