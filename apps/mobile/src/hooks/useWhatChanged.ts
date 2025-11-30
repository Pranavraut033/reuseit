import { useEffect, useRef } from 'react';

/**
 * Custom hook to log what changed in an object between re-renders
 * Useful for debugging unnecessary re-renders
 */
export const useWhatChanged = (obj: Record<string, unknown>, name = 'Object') => {
  const prevRef = useRef<Record<string, unknown> | undefined>(undefined);

  useEffect(() => {
    if (!__DEV__) return; // Only log in development

    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = { ...obj };
      return;
    }

    const changes: Record<string, { from: unknown; to: unknown }> = {};

    // Check for added/removed/changed properties
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(obj)]);

    for (const key of allKeys) {
      const prevValue = prev[key];
      const currentValue = obj[key];

      if (!(key in prev)) {
        // New property
        changes[key] = { from: undefined, to: currentValue };
      } else if (!(key in obj)) {
        // Removed property
        changes[key] = { from: prevValue, to: undefined };
      } else if (!shallowEqual(prevValue, currentValue)) {
        // Changed property
        changes[key] = { from: prevValue, to: currentValue };
      }
    }

    if (Object.keys(changes).length > 0) {
      console.warn(`🔄 ${name} changed:`, changes);
    }

    prevRef.current = { ...obj };
  });
};

/**
 * Shallow equality check for values
 */
const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    // For objects, just check reference for now
    // Could be enhanced with deep comparison if needed
    return a === b;
  }

  return false;
};
