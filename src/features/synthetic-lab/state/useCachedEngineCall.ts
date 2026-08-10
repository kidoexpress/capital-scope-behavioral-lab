import { useEffect, useState } from 'react';

/**
 * Generic cache-by-key fetch hook shared by every engine-backed step
 * (Twin, Portfolio, Forecast). All three read the same kind of derived data —
 * "run the deterministic pipeline on these answers" — so they share one cache
 * per endpoint and one loading/error state machine instead of three near-copies.
 *
 * A cache hit is resolved during render, so the effect never needs to push
 * state for the already-known case (that would trip react-hooks/set-state-in-effect).
 */

interface FetchState<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export interface CachedCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useCachedEngineCall<T>(
  cache: Map<string, T>,
  key: string,
  fetcher: () => Promise<T>,
): CachedCallState<T> {
  const [nonce, setNonce] = useState(0);
  const cached = nonce === 0 ? cache.get(key) : undefined;
  const [state, setState] = useState<FetchState<T>>({ key, data: null, error: null });

  useEffect(() => {
    if (cached) return;
    // No synchronous "loading" write here: a key that does not match the
    // settled state already reads as loading below.
    let cancelled = false;

    fetcher()
      .then((res) => {
        cache.set(key, res);
        if (!cancelled) setState({ key, data: res, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ key, data: null, error: err instanceof Error ? err.message : 'Could not reach the engine.' });
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, cached]);

  if (cached) {
    return { data: cached, loading: false, error: null, reload: () => setNonce((n) => n + 1) };
  }

  // Ignore a settled response that belongs to a previous set of answers.
  const fresh = state.key === key;
  return {
    data: fresh ? state.data : null,
    loading: !fresh || (state.data === null && state.error === null),
    error: fresh ? state.error : null,
    reload: () => setNonce((n) => n + 1),
  };
}
