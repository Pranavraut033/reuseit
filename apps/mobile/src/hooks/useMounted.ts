import { useEffect, useRef } from 'react';

const useMounted = (callback?: (mounted: boolean) => void) => {
  const mounted = useRef(false);
  const callbackRef = useRef(callback);

  // Update the callback ref when callback changes
  callbackRef.current = callback;

  useEffect(() => {
    mounted.current = true;
    callbackRef.current?.(mounted.current);
    return () => {
      mounted.current = false;
    };
  }, []); // Remove callback from dependencies

  return mounted;
};

export default useMounted;
