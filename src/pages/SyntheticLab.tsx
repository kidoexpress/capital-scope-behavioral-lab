import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import SyntheticLabShell from '../features/synthetic-lab/SyntheticLabShell';
import { useLabDraft } from '../features/synthetic-lab/state/useLabDraft';
import { isStepId, stepIndex, type StepId } from '../features/synthetic-lab/config/steps';

/**
 * Route wrapper for the guided Financial Twin flow. The step lives in the URL
 * (`/synthetic-lab/:step`) and progress is persisted, so a reload resumes where
 * the user left off. An unknown/missing step redirects to the last reached step.
 */
export default function SyntheticLab() {
  const { step } = useParams();
  const navigate = useNavigate();
  const draftApi = useLabDraft();

  const valid = isStepId(step);
  const current = (valid ? step : draftApi.draft.lastStep) as StepId;
  const maxReachedIndex = Math.max(stepIndex(draftApi.draft.lastStep), stepIndex(current));

  useEffect(() => {
    if (valid && stepIndex(current) > stepIndex(draftApi.draft.lastStep)) {
      draftApi.setLastStep(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, valid]);

  if (!valid) {
    return <Navigate to={`/synthetic-lab/${draftApi.draft.lastStep}`} replace />;
  }

  return (
    <SyntheticLabShell
      currentStep={current}
      maxReachedIndex={maxReachedIndex}
      draftApi={draftApi}
      onNavigate={(s: StepId) => navigate(`/synthetic-lab/${s}`)}
    />
  );
}
