/**
 * Lightweight project-wide logger.
 * - Enabled in development (__DEV__ === true) and disabled in production.
 * - Provides simple helpers and a `createLogger(tag)` convenience.
 */

const isEnabled = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const safeStringify = (value: unknown): string => {
  try {
    // Handle Errors specially
    if (value instanceof Error) return value.stack ?? value.message;
    // Safe JSON stringify with circular refs protection
    const seen = new WeakSet();
    return JSON.stringify(
      value,
      (_, v) => {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        return v;
      },
      2,
    );
  } catch {
    try {
      return String(value);
    } catch {
      return '[unserializable]';
    }
  }
};

const safePrint = (fn: (...args: unknown[]) => void, args: unknown[]) => {
  try {
    fn(...args);
  } catch (_e) {
    // Fallback: attempt to print a safe, stringified version of arguments
    try {
      fn(args.map(safeStringify).join(' '));
    } catch {
      // final fallback: swallow
    }
  }
};

const baseLogger = {
  enabled: isEnabled,
  debug: (...args: unknown[]) => {
    if (!isEnabled) return;
    safePrint(console.debug.bind(console), args);
  },
  info: (...args: unknown[]) => {
    if (!isEnabled) return;
    safePrint(console.info.bind(console), args);
  },
  warn: (...args: unknown[]) => {
    if (!isEnabled) return;
    safePrint(console.warn.bind(console), args);
  },
  error: (...args: unknown[]) => {
    if (!isEnabled) return;
    safePrint(console.error.bind(console), args);
  },
  /**
   * Create a namespaced logger that prepends a tag to messages
   */
  create: (tag: string) => ({
    debug: (...args: unknown[]) => baseLogger.debug(`[${tag}]`, ...args),
    info: (...args: unknown[]) => baseLogger.info(`[${tag}]`, ...args),
    warn: (...args: unknown[]) => baseLogger.warn(`[${tag}]`, ...args),
    error: (...args: unknown[]) => baseLogger.warn(`[${tag}]:[ERROR]`, ...args),
    enabled: isEnabled,
  }),
};

export const createLogger = baseLogger.create;
export default baseLogger;
