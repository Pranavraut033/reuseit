import { useCallback, useEffect, useState } from 'react';

import { detectObjects, ObjectDetectionResult, warmup } from './objectDetector';

export function useObjectDetector() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ObjectDetectionResult | null>(null);

  useEffect(() => {
    warmup()
      .then(() => setReady(true))
      .catch((e: Error) => setError(e.message || 'Unknown error'));
  }, []);

  const detect = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await detectObjects(uri);
      setResults(r);
    } catch (e) {
      setError((e as Error).message || 'Object detection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { ready, loading, error, results, detect };
}
