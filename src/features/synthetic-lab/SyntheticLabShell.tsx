import { Sparkles } from 'lucide-react';
import './synthetic-lab.css';
import { color, space, tint } from './tokens';
import SyntheticLabStepper from './SyntheticLabStepper';
import InlineDisclaimer from './components/InlineDisclaimer';
import AdvancedSettingsDrawer from './components/AdvancedSettingsDrawer';
import IntroductionStep from './steps/IntroductionStep';
import TwinStep from './steps/TwinStep';
import PortfolioStep from './steps/PortfolioStep';
import ForecastStep from './steps/ForecastStep';
import FinancialProfileStep from './steps/FinancialProfileStep';
import BehaviorQuizStep from './steps/BehaviorQuizStep';
import DecisionScenariosStep from './steps/DecisionScenariosStep';
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
        return <FinancialProfileStep draftApi={draftApi} onBack={goBack} onContinue={goNext} />;
      case 'quiz':
        return <BehaviorQuizStep draftApi={draftApi} onBack={goBack} onContinue={goNext} />;
      case 'scenarios':
        return <DecisionScenariosStep draftApi={draftApi} onBack={goBack} onContinue={goNext} />;
      case 'twin':
        return <TwinStep draft={draftApi.draft} onBack={goBack} onContinue={goNext} />;
      case 'portfolio':
        return <PortfolioStep draft={draftApi.draft} onBack={goBack} onContinue={goNext} />;
      case 'forecast':
        return <ForecastStep draft={draftApi.draft} onBack={goBack} />;
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
