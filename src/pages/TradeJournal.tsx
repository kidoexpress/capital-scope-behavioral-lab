import { useState } from 'react';
import { BookOpen, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePortfolioStore, type TradeEntry } from '../store/portfolioStore';

export default function TradeJournal() {
  const { tradeJournal, addTradeEntry, removeTradeEntry } = usePortfolioStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<TradeEntry>>({
    date: new Date().toISOString().split('T')[0],
    action: 'BUY',
    outcome: 'OPEN',
    pnl: null,
  });

  const handleSubmit = () => {
    if (!form.ticker || !form.date) return;
    const entry: TradeEntry = {
      id: crypto.randomUUID(),
      date: form.date,
      ticker: form.ticker.toUpperCase(),
      action: form.action ?? 'BUY',
      price: Number(form.price ?? 0),
      shares: Number(form.shares ?? 0),
      thesis: form.thesis ?? '',
      outcome: form.outcome ?? 'OPEN',
      lessons: form.lessons ?? '',
      pnl: form.pnl != null && form.pnl !== ('' as unknown as number) ? Number(form.pnl) : null,
    };
    addTradeEntry(entry);
    setShowForm(false);
    setForm({ date: new Date().toISOString().split('T')[0], action: 'BUY', outcome: 'OPEN', pnl: null });
  };

  const outcomeIcon = (o: TradeEntry['outcome']) => {
    if (o === 'WIN') return <TrendingUp size={12} style={{ color: '#55d99a' }} />;
    if (o === 'LOSS') return <TrendingDown size={12} style={{ color: '#ff6b6b' }} />;
    return <Minus size={12} style={{ color: 'var(--text-lo)' }} />;
  };

  const totalPnl = tradeJournal.reduce((s, e) => s + (e.pnl ?? 0), 0);
  const wins = tradeJournal.filter(e => e.outcome === 'WIN').length;
  const losses = tradeJournal.filter(e => e.outcome === 'LOSS').length;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : null;

  return (
    <div className="page-shell animate-fade-in-up" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={20} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-hi)' }}>Trade Journal</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={14} /> New Entry
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total P&L', value: totalPnl !== 0 ? `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}` : '—', color: totalPnl > 0 ? '#55d99a' : totalPnl < 0 ? '#ff6b6b' : 'var(--text-lo)' },
          { label: 'Win Rate', value: winRate != null ? `${winRate}%` : '—', color: winRate != null && winRate >= 50 ? '#55d99a' : 'var(--text-lo)' },
          { label: 'Total Entries', value: String(tradeJournal.length), color: 'var(--text-hi)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-lo)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 14 }}>New Trade Entry</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" value={form.date ?? ''} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Ticker</label>
              <input type="text" placeholder="AAPL" value={form.ticker ?? ''} onChange={e => setForm(p => ({ ...p, ticker: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Entry Price</label>
              <input type="number" placeholder="150.00" value={form.price ?? ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Shares</label>
              <input type="number" placeholder="10" value={form.shares ?? ''} onChange={e => setForm(p => ({ ...p, shares: Number(e.target.value) }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Realized P&L ($)</label>
              <input type="number" placeholder="optional" value={form.pnl ?? ''} onChange={e => setForm(p => ({ ...p, pnl: e.target.value === '' ? null : Number(e.target.value) }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Action</label>
              <select value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value as TradeEntry['action'] }))} style={{ width: '100%' }}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
                <option value="WATCH">WATCH</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Outcome</label>
              <select value={form.outcome} onChange={e => setForm(p => ({ ...p, outcome: e.target.value as TradeEntry['outcome'] }))} style={{ width: '100%' }}>
                <option value="OPEN">OPEN</option>
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
                <option value="NEUTRAL">NEUTRAL</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Investment Thesis</label>
              <textarea
                value={form.thesis ?? ''}
                onChange={e => setForm(p => ({ ...p, thesis: e.target.value }))}
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Why did you enter this trade?"
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-lo)', display: 'block', marginBottom: 4 }}>Lessons Learned</label>
              <textarea
                value={form.lessons ?? ''}
                onChange={e => setForm(p => ({ ...p, lessons: e.target.value }))}
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="What did you learn?"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>Save Entry</button>
          </div>
        </div>
      )}

      {/* Journal entries */}
      {tradeJournal.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-lo)', fontSize: 13 }}>No trade entries yet. Click "New Entry" to start tracking your decisions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...tradeJournal].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
            <div key={entry.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 15, color: 'var(--text-hi)' }}>{entry.ticker}</span>
                  <span style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                    background: entry.action === 'BUY' ? 'rgba(85,217,154,0.15)' : entry.action === 'SELL' ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.08)',
                    color: entry.action === 'BUY' ? '#55d99a' : entry.action === 'SELL' ? '#ff6b6b' : 'var(--text-lo)',
                  }}>{entry.action}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-lo)' }}>{entry.date}</span>
                    {entry.price > 0 && <span style={{ fontSize: 11, color: 'var(--text-lo)', fontFamily: 'JetBrains Mono, monospace' }}>@ ${entry.price.toFixed(2)}</span>}
                    {entry.shares > 0 && <span style={{ fontSize: 11, color: 'var(--text-lo)' }}>{entry.shares} shares</span>}
                    {entry.pnl != null && (
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: entry.pnl >= 0 ? '#55d99a' : '#ff6b6b' }}>
                        {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(0)}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {outcomeIcon(entry.outcome)}
                      <span style={{ fontSize: 10, color: 'var(--text-lo)' }}>{entry.outcome}</span>
                    </div>
                  </div>
                  {entry.thesis && (
                    <p style={{ fontSize: 12, color: 'var(--text-med)', marginBottom: 4, lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-lo)', fontSize: 10 }}>Thesis: </strong>{entry.thesis}
                    </p>
                  )}
                  {entry.lessons && (
                    <p style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.5 }}>
                      <strong style={{ fontSize: 10 }}>Lessons: </strong>{entry.lessons}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeTradeEntry(entry.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-lo)', flexShrink: 0 }}
                  title="Delete entry"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
