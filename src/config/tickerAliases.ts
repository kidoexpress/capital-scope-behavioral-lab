// src/config/tickerAliases.ts
// Brand/common-name → canonical ticker aliases.
//
// Yahoo's symbol search indexes companies by their *legal* name, so well-known
// brand names sometimes fail to surface the local listing (e.g. searching "Vivo"
// does not return VIVT3.SA — Yahoo only knows it as "Telefônica Brasil", and even
// "telefonica" returns the NYSE ADR, not the B3 line). This table bridges that gap
// for the most common cases. Keys are matched case-insensitively as a prefix.

export interface TickerAlias {
  ticker: string;   // canonical symbol with market suffix
  name: string;     // human-friendly display name
  sector: string;
}

export const TICKER_ALIASES: Record<string, TickerAlias[]> = {
  // ── Brazil (B3) ──────────────────────────────────────────────
  vivo:       [{ ticker: 'VIVT3.SA', name: 'Vivo (Telefônica Brasil)', sector: 'Communication' }],
  telefonica: [{ ticker: 'VIVT3.SA', name: 'Vivo (Telefônica Brasil)', sector: 'Communication' }],
  oi:         [{ ticker: 'OIBR3.SA', name: 'Oi S.A.', sector: 'Communication' }],
  tim:        [{ ticker: 'TIMS3.SA', name: 'TIM S.A.', sector: 'Communication' }],
  claro:      [{ ticker: 'AMOB3.SA', name: 'Claro / América Móvel', sector: 'Communication' }],
  petrobras:  [{ ticker: 'PETR4.SA', name: 'Petrobras (PN)', sector: 'Energy' }, { ticker: 'PETR3.SA', name: 'Petrobras (ON)', sector: 'Energy' }],
  vale:       [{ ticker: 'VALE3.SA', name: 'Vale S.A.', sector: 'Materials' }],
  itau:       [{ ticker: 'ITUB4.SA', name: 'Itaú Unibanco', sector: 'Financials' }],
  bradesco:   [{ ticker: 'BBDC4.SA', name: 'Bradesco', sector: 'Financials' }],
  nubank:     [{ ticker: 'ROXO34.SA', name: 'Nubank (BDR)', sector: 'Financials' }],
  ambev:      [{ ticker: 'ABEV3.SA', name: 'Ambev S.A.', sector: 'Consumer Staples' }],
  magalu:     [{ ticker: 'MGLU3.SA', name: 'Magazine Luiza', sector: 'Consumer Discretionary' }],
  'magazine luiza': [{ ticker: 'MGLU3.SA', name: 'Magazine Luiza', sector: 'Consumer Discretionary' }],
  'banco do brasil': [{ ticker: 'BBAS3.SA', name: 'Banco do Brasil', sector: 'Financials' }],
  bb:         [{ ticker: 'BBAS3.SA', name: 'Banco do Brasil', sector: 'Financials' }],
  b3:         [{ ticker: 'B3SA3.SA', name: 'B3 S.A.', sector: 'Financials' }],
  weg:        [{ ticker: 'WEGE3.SA', name: 'WEG S.A.', sector: 'Industrials' }],
  gerdau:     [{ ticker: 'GGBR4.SA', name: 'Gerdau', sector: 'Materials' }],
  jbs:        [{ ticker: 'JBSS3.SA', name: 'JBS S.A.', sector: 'Consumer Staples' }],
  natura:     [{ ticker: 'NTCO3.SA', name: 'Natura & Co', sector: 'Consumer Staples' }],
  eletrobras: [{ ticker: 'ELET3.SA', name: 'Eletrobras', sector: 'Utilities' }],

  // ── Japan (TSE) — common English names ───────────────────────
  toyota:     [{ ticker: '7203.T', name: 'Toyota Motor', sector: 'Consumer Discretionary' }],
  sony:       [{ ticker: '6758.T', name: 'Sony Group', sector: 'Technology' }],
  nintendo:   [{ ticker: '7974.T', name: 'Nintendo', sector: 'Communication' }],
  honda:      [{ ticker: '7267.T', name: 'Honda Motor', sector: 'Consumer Discretionary' }],
  softbank:   [{ ticker: '9984.T', name: 'SoftBank Group', sector: 'Communication' }],
  mitsubishi: [{ ticker: '8058.T', name: 'Mitsubishi Corp', sector: 'Industrials' }],
  keyence:    [{ ticker: '6861.T', name: 'Keyence', sector: 'Technology' }],

  // ── Hong Kong (HKEX) ─────────────────────────────────────────
  tencent:    [{ ticker: '0700.HK', name: 'Tencent Holdings', sector: 'Communication' }],
  alibaba:    [{ ticker: '9988.HK', name: 'Alibaba Group', sector: 'Consumer Discretionary' }],
  meituan:    [{ ticker: '3690.HK', name: 'Meituan', sector: 'Consumer Discretionary' }],
  xiaomi:     [{ ticker: '1810.HK', name: 'Xiaomi', sector: 'Technology' }],
  byd:        [{ ticker: '1211.HK', name: 'BYD Company', sector: 'Consumer Discretionary' }],
  hsbc:       [{ ticker: '0005.HK', name: 'HSBC Holdings', sector: 'Financials' }],

  // ── Germany (XETRA) ──────────────────────────────────────────
  volkswagen: [{ ticker: 'VOW3.DE', name: 'Volkswagen', sector: 'Consumer Discretionary' }],
  siemens:    [{ ticker: 'SIE.DE', name: 'Siemens', sector: 'Industrials' }],
  allianz:    [{ ticker: 'ALV.DE', name: 'Allianz', sector: 'Financials' }],
  bmw:        [{ ticker: 'BMW.DE', name: 'BMW', sector: 'Consumer Discretionary' }],
  adidas:     [{ ticker: 'ADS.DE', name: 'Adidas', sector: 'Consumer Discretionary' }],

  // ── France (Euronext) ────────────────────────────────────────
  lvmh:       [{ ticker: 'MC.PA', name: 'LVMH', sector: 'Consumer Discretionary' }],
  totalenergies: [{ ticker: 'TTE.PA', name: 'TotalEnergies', sector: 'Energy' }],
  airbus:     [{ ticker: 'AIR.PA', name: 'Airbus', sector: 'Industrials' }],

  // ── United Kingdom (LSE) ─────────────────────────────────────
  vodafone:   [{ ticker: 'VOD.L', name: 'Vodafone Group', sector: 'Communication' }],
  shell:      [{ ticker: 'SHEL.L', name: 'Shell plc', sector: 'Energy' }],
  'astrazeneca': [{ ticker: 'AZN.L', name: 'AstraZeneca', sector: 'Health Care' }],
};

/**
 * Look up alias matches for a query.
 * - `suffix === undefined` → GLOBAL: match aliases from every market.
 * - `suffix === ''`        → US only (no dotted suffix).
 * - `suffix === '.XX'`     → that market only.
 */
export function lookupAliases(query: string, suffix?: string): TickerAlias[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: TickerAlias[] = [];
  for (const [key, entries] of Object.entries(TICKER_ALIASES)) {
    if (key.startsWith(q) || q.startsWith(key)) {
      for (const e of entries) {
        const keep =
          suffix === undefined ? true
          : suffix === '' ? !e.ticker.includes('.')
          : e.ticker.toUpperCase().endsWith(suffix.toUpperCase());
        if (keep) hits.push(e);
      }
    }
  }
  return hits;
}
