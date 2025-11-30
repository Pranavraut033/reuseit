/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { Cache } from 'cache-manager';

/**
 * Decorator to cache GraphQL query results
 * @param keyFn Function to generate cache key from method arguments
 * @param ttl Time to live in seconds (default 300)
 */
export function CacheQuery(keyFn: (...args: any[]) => string, ttl: number = 300) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager: Cache = this.cacheManager;
      if (!cacheManager) {
        throw new Error('Cache manager not found. Make sure to inject CACHE_MANAGER.');
      }

      const key = keyFn(...args);
      const cached = await cacheManager.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await cacheManager.set(key, result, ttl * 1000); // TTL in milliseconds
      return result;
    };
  };
}

/**
 * Decorator to invalidate cache keys after mutation
 * @param keyFn Function that returns array of keys to invalidate, receives (result, args)
 */
export function InvalidateCache(keyFn: (result: any, ...args: any[]) => string[]) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const cacheManager = this.cacheManager;
      if (!cacheManager) {
        throw new Error('Cache manager not found. Make sure to inject CACHE_MANAGER.');
      }

      const keys = keyFn(result, ...args);
      for (const key of keys) {
        if (key.includes('*')) {
          // For now, skip patterns - would need Redis client
          console.warn(`Pattern invalidation not implemented for ${key}`);
        } else {
          await cacheManager.del(key);
        }
      }

      return result;
    };
  };
}
