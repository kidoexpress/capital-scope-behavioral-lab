import { fetchTwin, type TwinParams, type TwinResponse } from '../../../services/syntheticPortfolioApi';
import { useCachedEngineCall, type CachedCallState } from './useCachedEngineCall';
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

export type TwinState = CachedCallState<TwinResponse>;

export function useTwin(draft: LabDraft): TwinState {
  const params = twinParamsFromDraft(draft);
  const key = JSON.stringify(params);
  return useCachedEngineCall(cache, key, () => fetchTwin(params));
}
