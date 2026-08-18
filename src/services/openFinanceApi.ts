/**
 * Client for /api/open-finance — connects a user's real investment portfolio
 * via Pluggy (an Open Finance Brasil aggregator) to prefill Portfolio Builder.
 *
 * Runs in 'mock' mode until the backend has PLUGGY_CLIENT_ID/SECRET set, in
 * which case every call returns clearly-labeled illustrative sample data
 * instead of failing — check `mode` on the response before treating anything
 * as a real position. See open_finance/__init__.py (backend) for the same
 * caveat from the other side.
 */

const BASE = '/api/open-finance';

export type OpenFinanceMode = 'mock' | 'live';

export interface OpenFinanceStatus {
  mode: OpenFinanceMode;
  message: string;
}

export interface OpenFinanceInstitution {
  id: string;
  name: string;
  imageUrl: string | null;
  primaryColor: string;
}

export interface OpenFinanceHolding {
  symbol: string;
  name: string;
  weight: number;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
}

export interface OpenFinanceInvestmentsResponse {
  institution_id: string;
  mode: OpenFinanceMode;
  holdings: OpenFinanceHolding[];
  count: number;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* keep the status-based message */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchOpenFinanceStatus(): Promise<OpenFinanceStatus> {
  return asJson(await fetch(`${BASE}/status`));
}

export async function fetchInstitutions(): Promise<{ institutions: OpenFinanceInstitution[]; mode: OpenFinanceMode }> {
  return asJson(await fetch(`${BASE}/institutions`));
}

export async function fetchInvestments(institutionId: string): Promise<OpenFinanceInvestmentsResponse> {
  return asJson(await fetch(`${BASE}/investments/${encodeURIComponent(institutionId)}`));
}

/** Live mode only — throws in mock mode (no widget to open without real credentials). */
export async function createConnectToken(): Promise<string> {
  const res = await fetch(`${BASE}/connect-token`, { method: 'POST' });
  const body = await asJson<{ connectToken: string }>(res);
  return body.connectToken;
}
