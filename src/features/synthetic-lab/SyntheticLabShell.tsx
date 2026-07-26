import { Sparkles } from 'lucide-react';
import './synthetic-lab.css';
import { color, space, tint } from './tokens';
import SyntheticLabStepper from './SyntheticLabStepper';
import InlineDisclaimer from './components/InlineDisclaimer';
import AdvancedSettingsDrawer from './components/AdvancedSettingsDrawer';
import IntroductionStep from './steps/IntroductionStep';
import PlaceholderStep from './steps/PlaceholderStep';
import { nextStep, prevStep, type StepId } from './config/steps';
import type { LabDraftApi } from './state/useLabDraft';

interface Props {
  currentStep: StepId;
  maxReachedIndex: number;
  draftApi: LabDraftApi;
  onNavigate: (step: StepId) => void;
  onHowItWorks?: () => void;
}

export default function SyntheticLabShell({ currentStep, maxReachedIndex, draftApi, onNavigate, onHowItWorks }: Props) {
  const goNext = () => {
    const n = nextStep(currentStep);
    if (n) onNavigate(n);
  };
  const goBack = () => {
    const p = prevStep(currentStep);
    if (p) onNavigate(p);
  };

  const isStart = currentStep === 'start';

  const renderStep = () => {
    switch (currentStep) {
      case 'start':
        return (
          <IntroductionStep
            onPrimary={() => onNavigate('profile')}
            onDemo={() => { draftApi.setDemo(true); onNavigate('profile'); }}
          />
        );
      case 'profile':
        return <PlaceholderStep title="Financial profile" phase="Phase 3"
          description="Tell us about your goals, horizon, capital, liquidity and constraints — in short blocks."
          onBack={goBack} onContinue={goNext} />;
      case 'quiz':
        return <PlaceholderStep title="Behavior quiz" phase="Phase 3"
          description="A few questions, one at a time, about how you handle risk, losses and discipline."
          onBack={goBack} onContinue={goNext} />;
      case 'scenarios':
        return <PlaceholderStep title="Decision scenarios" phase="Phase 3"
          description="Concrete market situations. Choose what you would most likely do, and how confident you are."
          onBack={goBack} onContinue={goNext} continueLabel="See my twin" />;
      case 'twin':
        return <PlaceholderStep title="Your Financial Twin" phase="Phase 4"
          description="A behavioral estimate based on your financial context, quiz answers and scenario decisions."
          onBack={goBack} onContinue={goNext} continueLabel="Build my portfolio" />;
      case 'portfolio':
        return <PlaceholderStep title="Your portfolio" phase="Phase 5"
          description="An allocation that seeks growth while reducing the chance you abandon it under stress."
          onBack={goBack} onContinue={goNext} continueLabel="Simulate future outcomes" />;
      case 'forecast':
        return <PlaceholderStep title="Future simulation" phase="Phase 6"
          description="A range of possible outcomes for 3, 6 and 12 months — never a single guaranteed line."
          onBack={goBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="stlab-shell">
      <div className="stlab-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: tint(color.accent, 12), border: `1px solid ${tint(color.accent, 30)}`, color: color.accent,
          }}>
            <Sparkles size={16} aria-hidden />
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: color.textHi }}>Financial Twin Lab</span>
        </div>
        <InlineDisclaimer onHowItWorks={onHowItWorks} />
      </div>

      {!isStart && (
        <div className="stlab-stepper-wrap">
          <SyntheticLabStepper currentStep={currentStep} maxReachedIndex={maxReachedIndex} onNavigate={onNavigate} />
        </div>
      )}

      <div className="stlab-content">{renderStep()}</div>

      {!isStart && (
        <div style={{ marginTop: space.xxl, maxWidth: 760 }}>
          <AdvancedSettingsDrawer settings={draftApi.draft.advanced} onChange={draftApi.setAdvanced} />
        </div>
      )}
    </div>
  );
}
