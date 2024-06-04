import { Next } from "hono";
import { DateTime } from "luxon";
import { EventEmitter } from "events";

interface CacheEntry<Value> {
  value: Value;
  expiry: DateTime;
  lastAccessed: DateTime; // Property to track last accessed time
}

class Cache<Key, Value> {
  private cache: Map<Key, CacheEntry<Value>>;
  private maxEntries: number;
  private readonly eventEmitter: EventEmitter;

  constructor(maxEntries: number = 1000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.eventEmitter = new EventEmitter();
    this.listenForEvents();
    this.preloadData();
  }

  private listenForEvents() {
    this.eventEmitter.on("evict", (key: Key) => {
      this.cache.delete(key);
    });
  }

  private async preloadData() {
    // Preload data asynchronously into the cache
    const preloadDataList: Array<{ key: Key; value: Value; ttl: number }> = [
      { key: "freebob:1" as Key, value: { id: 1, name: "FreeBob" } as Value, ttl: 3600000 }, // TTL: 1 hour
      { key: "freebob:2" as Key, value: { id: 2, name: "PoorBob" } as Value, ttl: 86400000 }, // TTL: 1 day
      {
        key: "bobby:1" as Key,
        value: { id: 1, name: "Free Bobby", price: 99.99 } as Value,
        ttl: 604800000,
      }, // TTL: 1 week
    ];

    // Preload data in parallel
    await Promise.all(
      preloadDataList.map(async ({ key, value, ttl }) => {
        this.set(key, value, ttl);
      }),
    );
  }

  get(key: Key): Value | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiry >= DateTime.now()) {
      // Update the last accessed time for LRU
      entry.lastAccessed = DateTime.now();
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }
    return undefined;
  }

  set(key: Key, value: Value, ttl: number = 6000): void {
    if (this.cache.size >= this.maxEntries) {
      // Implement LRU eviction
      const leastRecentlyUsedKey = this.findLeastRecentlyUsedKey();
      if (leastRecentlyUsedKey) {
        this.eventEmitter.emit("evict", leastRecentlyUsedKey);
      }
    }

    const expiry = DateTime.now().plus(ttl);
    this.cache.set(key, { value, expiry, lastAccessed: DateTime.now() });
  }

  private findLeastRecentlyUsedKey(): Key | undefined {
    let leastRecentKey: Key | undefined;
    let leastRecentTime = DateTime.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < leastRecentTime) {
        leastRecentTime = entry.lastAccessed;
        leastRecentKey = key;
      }
    }

    return leastRecentKey;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  delete(key: Key): boolean {
    return this.cache.delete(key);
  }
}

const cacheClass = new Cache<string, any>(5000); // Increased to handle over 2000 RPM

export default async function cache<T extends { [key: string]: any }>(
  ctx: {
    req: {
      url: string;
    };
    json(data: any): void;
    text(data: any): void;
  },
  next: Next,
) {
  try {
    const cacheKey = ctx.req.url;
    const cachedData = cacheClass.get(cacheKey);

    if (cachedData !== undefined) {
      ctx.json(cachedData);
    } else {
      await next();
      const originalJson = ctx.json;
      const originalText = ctx.text;
      ctx.json = function (data: any) {
        cacheClass.set(cacheKey, data);
        originalJson.apply(this, [data]);
      };

      ctx.text = function (data: any) {
        cacheClass.set(cacheKey, data);
        originalText.apply(this, [data]);
      };
    }
  } catch (error) {
    await next();
  }
}
