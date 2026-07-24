/**
 * Communication interventions delivered to agents after a market move.
 *
 * The MVP compares two:
 *   - control:   a generic volatility message.
 *   - treatment: a message with context, portfolio impact, risk explanation
 *                and an option to talk to a human advisor.
 */
import type { VariantKind } from '../schemas/experiment';

export interface Intervention {
  kind: VariantKind;
  /** Short identifier for logs/audit. */
  id: string;
  /** Message shown/relayed to the agent. */
  message: string;
  /** Whether the message includes personalized portfolio impact. */
  includes_portfolio_impact: boolean;
  /** Whether the message includes a risk explanation. */
  includes_risk_explanation: boolean;
  /** Whether the message offers a human advisor. */
  offers_advisor: boolean;
}

/** Canonical control intervention (generic message). */
export const CONTROL_INTERVENTION: Intervention = {
  kind: 'control',
  id: 'control-generic-volatility',
  message: 'Markets are volatile right now. Stay the course.',
  includes_portfolio_impact: false,
  includes_risk_explanation: false,
  offers_advisor: false,
};

/** Canonical treatment intervention (contextual + advisor option). */
export const TREATMENT_INTERVENTION: Intervention = {
  kind: 'treatment',
  id: 'treatment-contextual-advisor',
  message:
    'Prices moved sharply. Here is the impact on your portfolio and why the ' +
    'risk fits your profile. You can speak with an advisor if helpful.',
  includes_portfolio_impact: true,
  includes_risk_explanation: true,
  offers_advisor: true,
};
