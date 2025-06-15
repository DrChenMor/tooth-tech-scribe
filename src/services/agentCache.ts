
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface AgentExecutionResult {
  agentId: string;
  suggestions: any[];
  executionTime: number;
  timestamp: string;
  context: Record<string, any>;
}

class AgentResultCache {
  private cache = new Map<string, CacheEntry<AgentExecutionResult>>();
  private maxSize: number = 1000;

  set(key: string, data: AgentExecutionResult, ttlMinutes: number = 30): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): AgentExecutionResult | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  generateKey(agentId: string, context: Record<string, any>): string {
    // Create a cache key based on agent ID and context hash
    const contextString = JSON.stringify(context);
    const contextHash = this.simpleHash(contextString);
    return `${agentId}-${contextHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  getStats(): { size: number; hitRate: number; memoryUsage: number } {
    const size = this.cache.size;
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;
    
    return {
      size,
      hitRate: 0, // Would need to track hits/misses for real hit rate
      memoryUsage
    };
  }

  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

export const agentCache = new AgentResultCache();

// Start cleanup interval
setInterval(() => {
  agentCache.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes
