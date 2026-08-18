import { lazy, Suspense, useEffect, useState } from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import {
  fetchOpenFinanceStatus,
  fetchInstitutions,
  fetchInvestments,
  createConnectToken,
  type OpenFinanceMode,
  type OpenFinanceInstitution,
  type OpenFinanceHolding,
} from '../../services/openFinanceApi';

/**
 * "Connect via Open Finance" — bulk-populates Portfolio Builder from a real
 * brokerage/bank account instead of manual entry, via Pluggy.
 *
 * Two modes, surfaced honestly to the user (never silently swap one for the
 * other):
 * - mock (default, no backend Pluggy credentials): a small picker of sample
 *   institutions returns illustrative fixture holdings. Fully working today.
 * - live (PLUGGY_CLIENT_ID/SECRET set on the backend): opens Pluggy's real
 *   Connect widget. This path has never been exercised against Pluggy's
 *   servers — no sandbox account was created for this integration — so treat
 *   it as implemented-per-docs, not verified, until tried with a real key.
 */

// Loaded only if a real Pluggy connection is ever attempted, so mock-mode
// users (everyone, today) never pay for this bundle weight.
const PluggyConnectWidget = lazy(() =>
  import('react-pluggy-connect').then((mod) => ({ default: mod.PluggyConnect })),
);

interface Props {
  onImported: (holdings: OpenFinanceHolding[]) => void;
}

export default function OpenFinanceConnect({ onImported }: Props) {
  const [mode, setMode] = useState<OpenFinanceMode | null>(null);
  const [institutions, setInstitutions] = useState<OpenFinanceInstitution[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectToken, setConnectToken] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenFinanceStatus()
      .then((s) => setMode(s.mode))
      .catch(() => setMode('mock'));
    fetchInstitutions()
      .then((r) => setInstitutions(r.institutions))
      .catch(() => setInstitutions([]));
  }, []);

  const importFromInstitution = async (institutionId: string) => {
    setConnectingId(institutionId);
    setError(null);
    try {
      const res = await fetchInvestments(institutionId);
      onImported(res.holdings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import holdings.');
    } finally {
      setConnectingId(null);
    }
  };

  const openLiveWidget = async () => {
    setError(null);
    try {
      const token = await createConnectToken();
      setConnectToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the Pluggy connection.');
    }
  };

  return (
    <div className="of-connect-card">
      <div className="of-connect-header">
        <h3><Landmark size={14} style={{ marginRight: 6, verticalAlign: -2 }} />Connect via Open Finance</h3>
        {mode && <span className={`of-mode-badge ${mode}`}>{mode === 'live' ? 'Connected' : 'Sample data'}</span>}
      </div>

      {mode === null && (
        <p className="of-connect-footnote"><Loader2 size={12} className="spin" style={{ marginRight: 4 }} />Checking connection…</p>
      )}

      {mode === 'mock' && (
        <>
          <p className="of-connect-footnote">
            No live Open Finance connection is configured yet. Pick a sample institution to see how
            importing a real portfolio would populate your holdings below.
          </p>
          <div className="of-institution-grid">
            {institutions.map((inst) => (
              <button
                key={inst.id}
                className="of-institution-btn"
                disabled={connectingId !== null}
                onClick={() => importFromInstitution(inst.id)}
              >
                {inst.name}
                {connectingId === inst.id && <Loader2 size={14} className="spin" />}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'live' && !connectToken && (
        <>
          <p className="of-connect-footnote">Securely connect a real account via Pluggy's Open Finance widget.</p>
          <button className="of-institution-btn" onClick={openLiveWidget}>
            Connect with Pluggy
          </button>
        </>
      )}

      {mode === 'live' && connectToken && (
        <Suspense fallback={<p className="of-connect-footnote">Loading connection widget…</p>}>
          <PluggyConnectWidget
            connectToken={connectToken}
            onSuccess={(itemData: { item: { id: string } }) => {
              setConnectToken(null);
              void importFromInstitution(itemData.item.id);
            }}
            onError={() => {
              setConnectToken(null);
              setError('The Pluggy connection widget reported an error.');
            }}
          />
        </Suspense>
      )}

      {error && <p className="of-connect-error">{error}</p>}
    </div>
  );
}
