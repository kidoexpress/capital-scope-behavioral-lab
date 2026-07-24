/**
 * Capital Scope Behavioral Lab — module barrel.
 *
 * Public surface of the isolated behavioral-lab module. Nothing here is wired
 * into the app UI/routes yet (by design — see IMPLEMENTATION_PLAN §1).
 */
export * from './schemas/common';
export * from './schemas/agentDecision';
export * from './schemas/experiment';
export * from './personas/types';
export * from './personas/presets';
export * from './interventions/types';
export * from './agents/InvestorAgent';
export * from './simulation/prng';
export * from './simulation/marketEquations';
export * from './simulation/types';
export * from './simulation/engine';
export * from './metrics/types';
export * from './replay/types';

/** Module/engine version stamped into replay bundles. */
export const BEHAVIORAL_LAB_VERSION = '0.1.0-scaffold';
