export function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) =>
    i < period - 1 ? null : closes.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) / period
  );
}

export function calcEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emas: number[] = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    emas.push(closes[i] * k + emas[i - 1] * (1 - k));
  }
  return emas;
}

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(period).fill(null);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period; avgLoss /= period;
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

export function calcMACD(closes: number[]): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine.slice(25), 9);
  const fullSignal: (number | null)[] = new Array<number | null>(25).fill(null).concat(signalLine);
  const histogram = macdLine.map((v, i) =>
    fullSignal[i] != null ? v - (fullSignal[i] as number) : null
  );
  return { macd: macdLine, signal: fullSignal, histogram };
}

export function calcBollingerBands(closes: number[], period = 20, stdDevMult = 2): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calcSMA(closes, period);
  const upper = middle.map((mid, i) => {
    if (mid == null) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    const variance = slice.reduce((s, v) => s + (v - mid) ** 2, 0) / period;
    return mid + stdDevMult * Math.sqrt(variance);
  });
  const lower = middle.map((mid, i) => {
    if (mid == null) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    const variance = slice.reduce((s, v) => s + (v - mid) ** 2, 0) / period;
    return mid - stdDevMult * Math.sqrt(variance);
  });
  return { upper, middle, lower };
}
