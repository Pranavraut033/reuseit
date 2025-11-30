import { useCallback, useEffect, useState } from 'react';

import { detectObjects, ObjectDetectionResult, warmup } from './objectDetector';

export function useObjectDetector() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ObjectDetectionResult | null>(null);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    warmup()
      .then(() => setReady(true))
      .catch((e: Error) => setError(e.message || 'Unknown error'));
  }, []);

  const detect = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    let r: ObjectDetectionResult | null = null;
    try {
      r = await detectObjects(uri);
      setResults(r);
    } catch (e) {
      setError((e as Error).message || 'Object detection failed');
    } finally {
      setLoading(false);
    }
    return r;
  }, []);

  return { ready, loading, error, results, detect, reset };
}
