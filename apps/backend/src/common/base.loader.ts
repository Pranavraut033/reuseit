import DataLoader from 'dataloader';

/**
 * Base class for all DataLoaders
 * Provides utility methods for batching and caching
 */
export abstract class BaseDataLoader<K, V> {
  protected loader: DataLoader<K, V>;

  constructor(batchLoadFn: DataLoader.BatchLoadFn<K, V>) {
    this.loader = new DataLoader(batchLoadFn, {
      cache: true,
    });
  }

  /**
   * Load a single item by key
   */
  load(key: K): Promise<V> {
    return this.loader.load(key);
  }

  /**
   * Load multiple items by keys
   */
  loadMany(keys: K[]): Promise<(V | Error)[]> {
    return this.loader.loadMany(keys);
  }

  /**
   * Clear a specific key from cache
   */
  clear(key: K): this {
    this.loader.clear(key);
    return this;
  }

  /**
   * Clear all cached values
   */
  clearAll(): this {
    this.loader.clearAll();
    return this;
  }

  /**
   * Prime the cache with a value
   */
  prime(key: K, value: V): this {
    this.loader.prime(key, value);
    return this;
  }
}

/**
 * Helper function to group items by a key
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Map<K, T[]> {
  const grouped = new Map<K, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    const group = grouped.get(key) || [];
    group.push(item);
    grouped.set(key, group);
  }

  return grouped;
}

/**
 * Helper to create ordered results matching the input keys
 */
export function orderByKeys<K, V>(
  keys: readonly K[],
  items: V[],
  keyFn: (item: V) => K,
): (V | null)[] {
  const itemMap = new Map(items.map((item) => [keyFn(item), item]));
  return keys.map((key) => itemMap.get(key) || null);
}

/**
 * Helper to create ordered results for one-to-many relationships
 */
export function orderManyByKeys<K extends string | number, V>(
  keys: readonly K[],
  items: V[],
  keyFn: (item: V) => K,
): V[][] {
  const grouped = groupBy(items, keyFn);
  return keys.map((key) => grouped.get(key) || []);
}
