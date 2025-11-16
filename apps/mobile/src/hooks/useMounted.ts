import { useEffect, useRef } from 'react';

const useMounted = (callback: (mounted: boolean) => void) => {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    callback(mounted.current);
    return () => {
      mounted.current = false;
    };
  }, [callback]);

  return mounted;
};

export default useMounted;
