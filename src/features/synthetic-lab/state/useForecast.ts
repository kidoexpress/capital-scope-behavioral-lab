import { fetchForecast, type ForecastResponse } from '../../../services/syntheticPortfolioApi';
import { useCachedEngineCall, type CachedCallState } from './useCachedEngineCall';
import { twinParamsFromDraft } from './useTwin';
import type { LabDraft } from './useLabDraft';

/** Same answer-keyed cache pattern as useTwin, against the /forecast endpoint. */
const cache = new Map<string, ForecastResponse>();

export type ForecastState = CachedCallState<ForecastResponse>;

export function useForecast(draft: LabDraft): ForecastState {
  const params = twinParamsFromDraft(draft);
  const key = JSON.stringify(params);
  return useCachedEngineCall(cache, key, () => fetchForecast(params));
}
