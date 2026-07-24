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
