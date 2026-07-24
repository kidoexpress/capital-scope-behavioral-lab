/**
 * Replay bundle + audit trail types.
 *
 * A ReplayBundle is everything needed to reproduce a run exactly and to audit
 * every decision the engine accepted or rejected.
 */
import type { AgentDecision } from '../schemas/agentDecision';
import type { RunResult, RunSpec } from '../simulation/types';

/** One immutable audit entry for a single agent decision in a period. */
export interface AuditRecord {
  period: number;
  agent_id: string;
  proposed: AgentDecision;
  accepted: boolean;
  /** Validation errors if the proposal was rejected. */
  rejection_reasons: string[];
}

/** Self-contained bundle to reproduce and verify a run. */
export interface ReplayBundle {
  spec: RunSpec;
  result: RunResult;
  audit: AuditRecord[];
  /** Schema/engine version used to produce this bundle. */
  engine_version: string;
}
