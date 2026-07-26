/** Step configuration for the guided Financial Twin flow. */

export type StepId =
  | 'start'
  | 'profile'
  | 'quiz'
  | 'scenarios'
  | 'twin'
  | 'portfolio'
  | 'forecast';

export interface StepMeta {
  id: StepId;
  /** Short label shown in the stepper. */
  label: string;
  /** Whether the step appears in the top stepper (Introduction does not). */
  inStepper: boolean;
}

export const STEPS: StepMeta[] = [
  { id: 'start', label: 'Start', inStepper: false },
  { id: 'profile', label: 'Profile', inStepper: true },
  { id: 'quiz', label: 'Behavior', inStepper: true },
  { id: 'scenarios', label: 'Scenarios', inStepper: true },
  { id: 'twin', label: 'Your Twin', inStepper: true },
  { id: 'portfolio', label: 'Portfolio', inStepper: true },
  { id: 'forecast', label: 'Forecast', inStepper: true },
];

export const STEPPER_STEPS = STEPS.filter((s) => s.inStepper);

const ORDER: StepId[] = STEPS.map((s) => s.id);

export function isStepId(value: string | undefined): value is StepId {
  return value !== undefined && (ORDER as string[]).includes(value);
}

export function stepIndex(id: StepId): number {
  return ORDER.indexOf(id);
}

export function nextStep(id: StepId): StepId | null {
  const i = stepIndex(id);
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null;
}

export function prevStep(id: StepId): StepId | null {
  const i = stepIndex(id);
  return i > 0 ? ORDER[i - 1] : null;
}
