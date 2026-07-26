import { space } from '../tokens';
import { Button } from './ui';

interface Props {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}

/** Consistent Back / primary-action footer. One primary action per step. */
export default function StepFooter({ onBack, onContinue, continueLabel = 'Continue', continueDisabled }: Props) {
  return (
    <div style={{ display: 'flex', gap: space.sm, marginTop: space.xl, flexWrap: 'wrap' }}>
      {onBack && <Button variant="ghost" onClick={onBack}>Back</Button>}
      {onContinue && (
        <Button onClick={onContinue} disabled={continueDisabled}>{continueLabel}</Button>
      )}
    </div>
  );
}
