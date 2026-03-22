import { createHash } from 'crypto';
import { logger } from './logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  size: number; // estimated token count
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalTokensSaved: number;
}

/**
 * In-memory LRU prompt cache with TTL.
 *
 * Caches LLM responses keyed by a hash of (system instruction + messages + tools).
 * This avoids making duplicate API calls for identical prompts, saving both tokens
 * and latency. Works alongside DeepSeek's automatic prefix caching for maximum savings.
 */
export class PromptCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, totalTokensSaved: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly maxSize: number = 200,
    private readonly ttlMs: number = 5 * 60 * 1000, // 5 minutes (matches provider cache TTL)
  ) {
    // Periodic cleanup of expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Generate a deterministic cache key from the prompt components.
   * Uses SHA-256 hash of serialized content for compact, collision-resistant keys.
   */
  static generateKey(components: {
    systemInstruction?: string | undefined;
    messages: Array<{ role: string; content: string }>;
    toolNames?: string[] | undefined;
  }): string {
    const keyData = JSON.stringify({
      sys: components.systemInstruction || '',
      msgs: components.messages.map((m) => ({ r: m.role, c: m.content })),
      tools: components.toolNames?.sort() || [],
    });

    return createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Rough token estimation: ~4 chars per token (English text average).
   */
  private estimateTokens(data: any): number {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return Math.ceil(str.length / 4);
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // LRU: move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    this.stats.totalTokensSaved += entry.size;

    logger.debug('Prompt cache HIT', {
      cacheKey: key.slice(0, 12),
      estimatedTokensSaved: entry.size,
      totalTokensSavedSession: this.stats.totalTokensSaved,
    });

    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      createdAt: Date.now(),
      size: this.estimateTokens(value),
    });

    logger.debug('Prompt cache SET', {
      cacheKey: key.slice(0, 12),
      cacheSize: this.cache.size,
    });
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug('Prompt cache cleanup', { removed: cleaned, remaining: this.cache.size });
    }
  }

  getStats(): CacheStats & { size: number; hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? `${((this.stats.hits / total) * 100).toFixed(1)}%` : 'N/A',
    };
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, totalTokensSaved: 0 };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}
