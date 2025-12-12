import type { FileTree } from '@principal-ai/repository-abstraction';

export interface FileDocument {
  id: string;
  path: string;
  name: string;
  relativePath: string;
}

export interface SearchResult {
  path: string;
  name: string;
  relativePath: string;
  score: number;
}

export interface DirectoryFilter {
  id: string;
  path: string;
  mode: 'include' | 'exclude';
}

export interface SearchOptions {
  directoryFilter?: string;
  excludeDirectory?: boolean;
  fileType?: string;
  limit?: number;
  directoryFilters?: DirectoryFilter[];
}

/**
 * LocalSearchService - Filename search on FileTree data
 * Content search is provided by the host application
 */
class LocalSearchService {
  private documentsMap: Map<string, FileDocument> = new Map();
  private baseDirectory: string = '';
  private initialized = false;

  /**
   * Index files from FileTree
   */
  indexFileSystemTree(tree: FileTree, baseDirectory: string): void {
    this.baseDirectory = baseDirectory;
    this.documentsMap.clear();

    let index = 0;
    for (const file of tree.allFiles) {
      const absolutePath = file.path.startsWith('/')
        ? file.path
        : `${baseDirectory}/${file.path}`.replace(/\/+/g, '/');

      const doc: FileDocument = {
        id: index.toString(),
        path: absolutePath,
        name: file.name,
        relativePath: file.relativePath,
      };

      this.documentsMap.set(doc.id, doc);
      index++;
    }

    this.initialized = true;
  }

  /**
   * Convert glob pattern to regex
   */
  private globToRegex(pattern: string): RegExp {
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${escapedPattern}$`, 'i');
  }

  /**
   * Check if query contains wildcards
   */
  private hasWildcards(query: string): boolean {
    return query.includes('*') || query.includes('?');
  }

  /**
   * Check if document matches filter options
   */
  private matchesFilters(doc: FileDocument, options?: SearchOptions): boolean {
    if (options?.directoryFilters && options.directoryFilters.length > 0) {
      const includeFilters = options.directoryFilters.filter(f => f.mode === 'include');
      const excludeFilters = options.directoryFilters.filter(f => f.mode === 'exclude');

      for (const filter of excludeFilters) {
        if (doc.relativePath.toLowerCase().includes(filter.path.toLowerCase())) {
          return false;
        }
      }

      if (includeFilters.length > 0) {
        const matchesInclude = includeFilters.some(filter =>
          doc.relativePath.toLowerCase().includes(filter.path.toLowerCase())
        );
        if (!matchesInclude) return false;
      }
    } else if (options?.directoryFilter) {
      const shouldInclude = options.excludeDirectory
        ? !doc.relativePath.includes(options.directoryFilter)
        : doc.relativePath.includes(options.directoryFilter);

      if (!shouldInclude) return false;
    }

    if (options?.fileType) {
      const fileExtension = doc.name.split('.').pop()?.toLowerCase() || '';
      if (fileExtension !== options.fileType.toLowerCase()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate relevance score for a match
   */
  private calculateScore(doc: FileDocument, query: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerName = doc.name.toLowerCase();
    const lowerPath = doc.relativePath.toLowerCase();

    let score = 0;

    if (lowerName === lowerQuery) {
      score += 100;
    } else if (lowerName.startsWith(lowerQuery)) {
      score += 80;
    } else if (lowerName.includes(lowerQuery)) {
      score += 60;
    } else if (lowerPath.includes(lowerQuery)) {
      score += 40;
    }

    score += Math.max(0, 20 - doc.relativePath.split('/').length * 2);

    return score;
  }

  /**
   * Search files by filename
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    if (!this.initialized || !query.trim()) {
      return [];
    }

    const limit = options?.limit || 100;
    const results: SearchResult[] = [];

    if (this.hasWildcards(query)) {
      const regex = this.globToRegex(query);

      this.documentsMap.forEach(doc => {
        if (doc && doc.name && regex.test(doc.name)) {
          if (!this.matchesFilters(doc, options)) return;

          results.push({
            path: doc.path,
            name: doc.name,
            relativePath: doc.relativePath,
            score: 90,
          });
        }
      });

      return results.slice(0, limit);
    }

    const lowerQuery = query.toLowerCase();

    this.documentsMap.forEach(doc => {
      if (!doc) return;

      const lowerName = doc.name.toLowerCase();
      const lowerPath = doc.relativePath.toLowerCase();

      if (lowerName.includes(lowerQuery) || lowerPath.includes(lowerQuery)) {
        if (!this.matchesFilters(doc, options)) return;

        results.push({
          path: doc.path,
          name: doc.name,
          relativePath: doc.relativePath,
          score: this.calculateScore(doc, query),
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Get unique directories from indexed files
   */
  getDirectories(): string[] {
    const directories = new Set<string>();

    this.documentsMap.forEach(doc => {
      const parts = doc.relativePath.split('/');
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        path = path ? `${path}/${parts[i]}` : parts[i];
        directories.add(path);
      }
    });

    return Array.from(directories).sort();
  }

  /**
   * Clear the search index
   */
  clear(): void {
    this.documentsMap.clear();
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const localSearchService = new LocalSearchService();
