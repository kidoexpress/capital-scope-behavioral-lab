/**
 * Default trait presets for the four initial personas (PRODUCT_SPEC §4).
 *
 * Values are illustrative starting points (0..1, trend_sensitivity may be
 * negative). They will be tuned once the rule-based agent lands.
 */
import type { PersonaTraits, PersonaType } from './types';

export const PERSONA_PRESETS: Record<PersonaType, PersonaTraits> = {
  conservative: {
    risk_tolerance: 0.2,
    loss_aversion: 0.85,
    trend_sensitivity: 0.15,
    advisor_trust: 0.7,
    ai_trust: 0.4,
    liquidity_preference: 0.8,
  },
  fundamentalist: {
    risk_tolerance: 0.5,
    loss_aversion: 0.5,
    trend_sensitivity: 0.1,
    advisor_trust: 0.5,
    ai_trust: 0.5,
    liquidity_preference: 0.4,
  },
  trend_follower: {
    risk_tolerance: 0.75,
    loss_aversion: 0.3,
    trend_sensitivity: 0.9,
    advisor_trust: 0.35,
    ai_trust: 0.6,
    liquidity_preference: 0.25,
  },
  contrarian: {
    risk_tolerance: 0.6,
    loss_aversion: 0.4,
    trend_sensitivity: -0.7,
    advisor_trust: 0.4,
    ai_trust: 0.5,
    liquidity_preference: 0.35,
  },
};
