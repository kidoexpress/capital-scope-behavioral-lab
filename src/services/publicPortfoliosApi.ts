/**
 * Client for the Public Portfolio Tracker backend.
 * All data is real (SEC 13F + US House disclosure index). Values that are not
 * available come back as null and must be rendered as unknown — never invented.
 */

export interface ExecutiveSummary {
  headline: string;
  strategy: string;
  edge: string;
  concentration: string;
  turnover: string;
  replication_note: string;
  caveats: string[];
  style_tags: string[];
}

export interface PortfolioProfile {
  slug: string;
  name: string;
  manager: string;
  cik: string;
  category: string;
  size_tier: string;
  executive_summary: ExecutiveSummary;
}

export interface Holding {
  issuer: string;
  ticker: string | null;
  cusip: string;
  weight: number;
  value_usd: number;
  shares: number;
}

export interface FilingMeta {
  period: string;
  filed_at: string;
  accession: string;
  total_value_usd: number;
  positions: number;
  unresolved_tickers: number;
  source_url: string;
}

export interface Performance {
  start: string;
  end: string;
  portfolio_return: number | null;
  benchmark_return: number | null;
  excess_return: number | null;
  volatility: number | null;
  max_drawdown: number | null;
  coverage: number;
  priced_holdings: number;
  total_holdings: number;
  note: string;
}

export interface PortfolioDetail {
  profile: PortfolioProfile;
  filing: FilingMeta | null;
  holdings: Holding[];
  performance: Performance | null;
  disclaimer: string;
  note?: string;
}

export interface ReplicationOrder {
  ticker: string;
  issuer: string;
  target_weight: number;
  allocation_usd: number;
}

export interface ReplicationPlan {
  slug: string;
  manager: string;
  capital: number;
  orders: ReplicationOrder[];
  coverage: number;
  excluded_positions: number;
  filing_period: string;
  filed_at: string;
  replication_note: string;
  disclaimer: string;
}

export interface CongressDisclosure {
  member: string;
  state_district: string;
  filing_date: string;
  doc_id: string;
  year: number;
  pdf_url: string;
  filing_type: string;
}

export interface CongressActivity {
  summary: {
    year: number;
    total_trade_filings: number;
    unique_members: number;
    most_active: { member: string; filings: number }[];
    source: string;
    limitation: string;
  };
  recent: CongressDisclosure[];
  disclaimer: string;
}

const BASE = '/api/public-portfolios';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* keep default */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function fetchCatalog() {
  return getJson<{ portfolios: PortfolioProfile[]; categories: string[]; disclaimer: string }>(
    `${BASE}/catalog`,
  );
}

export function fetchPortfolio(slug: string) {
  return getJson<PortfolioDetail>(`${BASE}/${slug}`);
}

export function fetchReplicationPlan(slug: string, capital: number, topN: number) {
  return getJson<ReplicationPlan>(
    `${BASE}/${slug}/replication-plan?capital=${capital}&top_n=${topN}`,
  );
}

export function fetchCongressActivity(limit = 25) {
  return getJson<CongressActivity>(`${BASE}/congress/activity?limit=${limit}`);
}

export const formatPct = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? '—' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(digits)}%`;

export const formatWeight = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

export const formatUsdCompact = (v: number) => {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};
