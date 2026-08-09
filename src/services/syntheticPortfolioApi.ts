/**
 * Client for the Synthetic Portfolio Lab backend (FastAPI, port 8100 via proxy).
 * All results are simulated, scenario-based hypotheses — not financial advice.
 */

export interface PersonaTemplate {
  key: string;
  name: string;
}

export interface ScenarioTemplate {
  key: string;
  name: string;
  regime: string;
}

export interface ScenarioDecision {
  scenario_id: string;
  action: string;
  equity_delta: number;
  probability: number;
  request_human_review: boolean;
}

export interface Suggestion {
  persona_id: string;
  persona_name: string;
  objective: { primary: string; secondary: string };
  headline: string;
  fit_score: number;
  fit_components: Record<string, number>;
  allocation: { asset: string; weight: number }[];
  estimated_metrics: Record<string, number>;
  versus_equal_weight: Record<string, number>;
  why: string[];
  remaining_risks: string[];
  constraint_violations: string[];
  scenario_decisions: ScenarioDecision[];
  disclaimer: string;
}

export interface RunResponse {
  reproducibility: {
    seed: number;
    experiment_id: string;
    code_version: string;
    model_version: string;
    scenarios: { scenario_id: string; probability: number }[];
  };
  behavioral_separation: {
    classification_accuracy: number;
    random_baseline: number;
    mean_pairwise_distance: number;
  };
  aggregate: { risk_violation_rate: number; num_personas: number; num_scenarios: number };
  suggestions: Suggestion[];
}

const BASE = '/api/synthetic-portfolio';

export async function fetchTemplates(): Promise<{
  personas: PersonaTemplate[];
  scenarios: ScenarioTemplate[];
}> {
  const res = await fetch(`${BASE}/templates`);
  if (!res.ok) throw new Error(`templates request failed (${res.status})`);
  return res.json();
}

export interface RunParams {
  seed: number;
  persona_keys: string[];
  scenario_keys: string[];
  use_memory: boolean;
}

export async function runSimulation(params: RunParams): Promise<RunResponse> {
  const res = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    let detail = `run request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.detail) detail = String(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

/** Friendly display symbol from an asset_id like "EQ_AAPL" -> "AAPL". */
export function assetLabel(assetId: string): string {
  if (assetId === 'CASH') return 'Cash';
  const parts = assetId.split('_');
  return parts.length > 1 ? parts.slice(1).join('_') : assetId;
}

// ─────────────── Financial Twin (guided flow) ───────────────

export interface TwinAllocationRow {
  asset_id: string;
  symbol: string;
  asset_class: string;
  sector: string;
  weight: number;
  risk_contribution: number;
}

export interface TwinResponse {
  twin: {
    persona_id: string;
    name: string;
    behavioral_traits: Record<string, number>;
    financial_profile: Record<string, number>;
    constraints: {
      minimum_cash_weight: number;
      maximum_equity_weight: number;
      maximum_single_asset_weight: number;
      maximum_expected_drawdown: number;
      restricted_assets: string[];
    };
    objectives: { primary: string; secondary: string };
    provenance: {
      missing: string[];
      notes: string[];
      answered: { quiz: number; scenarios: number; profile: number };
      drivers: Record<string, string[]>;
    };
  };
  portfolio: {
    method: string;
    allocation: TwinAllocationRow[];
    constraint_violations: string[];
    explanation: Record<string, unknown>;
    metrics: Record<string, number>;
    risk: {
      portfolio_volatility: number;
      diversification_ratio: number;
      covariance: { observations: number; shrinkage: number; average_correlation?: number; synthesized: string[] };
    };
  };
  disclaimer: string;
}

export interface TwinParams {
  profile: Record<string, string | number>;
  quiz: Record<string, number>;
  scenarios: Record<string, { choice: string; confidence: number }>;
  seed?: number;
  use_memory?: boolean;
}

export async function fetchTwin(params: TwinParams): Promise<TwinResponse> {
  const res = await fetch(`${BASE}/twin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    let detail = `twin request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* keep the status-based message */ }
    throw new Error(detail);
  }
  return res.json();
}
