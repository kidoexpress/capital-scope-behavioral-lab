/**
 * Draft state for the guided flow, persisted to localStorage so a reload never
 * loses progress. Holds user answers only — no financial calculations here.
 */
import { useCallback, useEffect, useState } from 'react';
import type { StepId } from '../config/steps';

const STORAGE_KEY = 'financial-twin-lab-draft';
const DRAFT_VERSION = 1;

export interface AdvancedSettings {
  seed: number;
  useMemory: boolean;
  numSimulations: number;
}

export interface ScenarioAnswer {
  choice: string;
  confidence: number;
}

export interface LabDraft {
  version: number;
  lastStep: StepId;
  demo: boolean;
  /** Financial profile answers (filled in the Profile step). */
  profile: Record<string, string | number>;
  /** Behavior quiz answers: questionId -> Likert 1..5. */
  quiz: Record<string, number>;
  /** Scenario answers: scenarioId -> choice + confidence. */
  scenarios: Record<string, ScenarioAnswer>;
  advanced: AdvancedSettings;
  updatedAt: string;
}

export function emptyDraft(): LabDraft {
  return {
    version: DRAFT_VERSION,
    lastStep: 'start',
    demo: false,
    profile: {},
    quiz: {},
    scenarios: {},
    advanced: { seed: 42, useMemory: true, numSimulations: 20 },
    updatedAt: new Date().toISOString(),
  };
}

function loadDraft(): LabDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as LabDraft;
    if (parsed.version !== DRAFT_VERSION) return emptyDraft();
    return { ...emptyDraft(), ...parsed };
  } catch {
    return emptyDraft();
  }
}

export interface LabDraftApi {
  draft: LabDraft;
  hasProgress: boolean;
  setLastStep: (step: StepId) => void;
  setDemo: (demo: boolean) => void;
  setProfileField: (key: string, value: string | number) => void;
  setQuizAnswer: (questionId: string, value: number) => void;
  setScenarioAnswer: (scenarioId: string, answer: ScenarioAnswer) => void;
  setAdvanced: (patch: Partial<AdvancedSettings>) => void;
  reset: () => void;
}

export function useLabDraft(): LabDraftApi {
  const [draft, setDraft] = useState<LabDraft>(() => loadDraft());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable — flow still works in-memory */
    }
  }, [draft]);

  const update = useCallback((patch: Partial<LabDraft>) => {
    setDraft((d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));
  }, []);

  const hasProgress =
    Object.keys(draft.quiz).length > 0 ||
    Object.keys(draft.scenarios).length > 0 ||
    Object.keys(draft.profile).length > 0 ||
    draft.lastStep !== 'start';

  return {
    draft,
    hasProgress,
    setLastStep: (step) => update({ lastStep: step }),
    setDemo: (demo) => update({ demo }),
    setProfileField: (key, value) =>
      setDraft((d) => ({ ...d, profile: { ...d.profile, [key]: value }, updatedAt: new Date().toISOString() })),
    setQuizAnswer: (questionId, value) =>
      setDraft((d) => ({ ...d, quiz: { ...d.quiz, [questionId]: value }, updatedAt: new Date().toISOString() })),
    setScenarioAnswer: (scenarioId, answer) =>
      setDraft((d) => ({ ...d, scenarios: { ...d.scenarios, [scenarioId]: answer }, updatedAt: new Date().toISOString() })),
    setAdvanced: (patch) =>
      setDraft((d) => ({ ...d, advanced: { ...d.advanced, ...patch }, updatedAt: new Date().toISOString() })),
    reset: () => setDraft(emptyDraft()),
  };
}
