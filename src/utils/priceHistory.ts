// src/utils/priceHistory.ts
// Fetches 1-year daily close prices via the Yahoo Finance proxy.
export async function fetchPriceHistory(
  symbols: string[]
): Promise<Record<string, number[]>> {
  const result: Record<string, number[]> = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const res = await fetch(
          `/api/yahoo/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) return;
        const json = await res.json();
        const closes: (number | null)[] =
          json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
        const valid = closes.filter(
          (v): v is number => v != null && !isNaN(v)
        );
        if (valid.length > 20) result[sym] = valid;
      } catch {
        // skip on timeout or network error
      }
    })
  );
  return result;
}
