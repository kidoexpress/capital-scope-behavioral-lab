/**
 * Simulation engine INTERFACE + not-yet-implemented stub.
 *
 * The engine is the single authority over price, balances, portfolios, results,
 * equations, market rules, metrics and persisted records. Agents only propose;
 * the engine validates (via validateAgentDecision) and executes.
 *
 * The functional implementation (period loop, agent orchestration, persistence)
 * lands in a later step — see BEHAVIORAL_LAB_IMPLEMENTATION_PLAN.md §4.
 */
import type { InvestorAgent } from '../agents/InvestorAgent';
import type { Intervention } from '../interventions/types';
import type { RunResult, RunSpec } from './types';

export interface SimulationEngine {
  /**
   * Run one deterministic simulation. Given identical `spec`, `agents` and
   * `intervention`, the result must be byte-for-byte identical (replayable).
   */
  run(
    spec: RunSpec,
    agents: InvestorAgent[],
    intervention: Intervention | null,
  ): RunResult;
}

/** Placeholder until the functional engine is implemented. */
export class NotImplementedSimulationEngine implements SimulationEngine {
  run(spec: RunSpec, agents: InvestorAgent[], intervention: Intervention | null): RunResult {
    // Params are intentionally unused in the stub; referenced so the honest
    // signature is preserved without tripping no-unused-vars.
    void spec;
    void agents;
    void intervention;
    throw new Error(
      'SimulationEngine.run is not implemented yet — see IMPLEMENTATION_PLAN §4.',
    );
  }
}
