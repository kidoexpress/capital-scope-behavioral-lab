import { useEffect, useState } from 'react';
import { fetchTwin, type TwinParams, type TwinResponse } from '../../../services/syntheticPortfolioApi';
import type { LabDraft } from './useLabDraft';

/**
 * Derives the user's twin + portfolio from the answers they gave in the flow.
 *
 * The Twin and Portfolio steps read the same result, so responses are cached by
 * the exact answer payload: navigating between the two steps (or going back and
 * forward) reuses the cached run instead of asking the engine again. Changing
 * any answer produces a new key and therefore a fresh run.
 */
const cache = new Map<string, TwinResponse>();

export function twinParamsFromDraft(draft: LabDraft): TwinParams {
  return {
    profile: draft.profile,
    quiz: draft.quiz,
    scenarios: Object.fromEntries(
      Object.entries(draft.scenarios).map(([id, a]) => [
        id,
        { choice: a.choice, confidence: a.confidence },
      ]),
    ),
    seed: draft.advanced.seed,
    use_memory: draft.advanced.useMemory,
  };
}

interface FetchState {
  key: string;
  data: TwinResponse | null;
  error: string | null;
  loading: boolean;
}

export interface TwinState {
  data: TwinResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useTwin(draft: LabDraft): TwinState {
  const params = twinParamsFromDraft(draft);
  const key = JSON.stringify(params);

  const [nonce, setNonce] = useState(0);
  // A cache hit is resolved during render, so the effect never has to push
  // state for the already-known case.
  const cached = nonce === 0 ? cache.get(key) : undefined;
  const [state, setState] = useState<FetchState>({ key, data: null, error: null, loading: false });

  useEffect(() => {
    if (cached) return;

    // No synchronous "loading" write here: a key that does not match the
    // settled state already reads as loading below.
    let cancelled = false;

    fetchTwin(params)
      .then((res) => {
        cache.set(key, res);
        if (!cancelled) setState({ key, data: res, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            key,
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Could not reach the engine.',
          });
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
    loading: !fresh || state.loading,
    error: fresh ? state.error : null,
    reload: () => setNonce((n) => n + 1),
  };
}
