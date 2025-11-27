import { useCallback, useEffect, useState } from 'react';

import { ClassificationResult, classifyImage, warmup } from './classifier';

export function useWasteClassifier() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ClassificationResult[] | null>(null);

  useEffect(() => {
    warmup()
      .then(() => setReady(true))
      .catch((e: Error) => setError(e.message || 'Unknown error'));
  }, []);

  const classify = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await classifyImage(uri);
      setResults(r);
    } catch (e) {
      setError((e as Error).message || 'Classification failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { ready, loading, error, results, classify };
}
