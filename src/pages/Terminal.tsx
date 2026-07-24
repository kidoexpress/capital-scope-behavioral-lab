// ============================================================
// Terminal — Bloomberg-style command mode
// Commands: analyze, review, research, model, portfolio,
//           simulate, compare, export, help, clear
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TerminalSquare, ChevronRight } from 'lucide-react';

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error' | 'info' | 'success' | 'divider';
  content: string;
  ts?: string;
}

let lineId = 0;
function mkLine(type: TerminalLine['type'], content: string): TerminalLine {
  return { id: lineId++, type, content, ts: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
}

const HELP_TEXT = `
╔══════════════════════════════════════════════════════════════╗
║       CAPITAL SCOPE BEHAVIORAL LAB — COMMAND REFERENCE       ║
╚══════════════════════════════════════════════════════════════╝

STOCK ANALYSIS
  analyze <TICKER>           Open Stock Analyzer for ticker
  compare <T1> <T2> ...      Compare up to 5 tickers in Research Agent

AI AGENT WORKFLOWS
  review <TICKER>            Run Earnings Reviewer for ticker
  review <TICKER> --thesis   Open Earnings Reviewer (pre-filled)
  research <TICKER> [...]    Run Market Research Agent
  model <TICKER>             Open Model Builder for ticker

PORTFOLIO & RISK
  portfolio                  Open Portfolio Builder
  portfolio risk             Open Risk Dashboard
  portfolio montecarlo       Launch Monte Carlo simulation

SCENARIO ANALYSIS
  simulate <scenario>        Open Scenario Simulator
    Scenarios: recession | rate-hike | bull-market | tech-selloff

EXPORT
  export model <TICKER>      Build and export Excel model (opens Model Builder)

NAVIGATION
  watchlist                  Open Watchlist
  terminal                   Return to this Terminal

SYSTEM
  help                       Show this help
  clear                      Clear terminal
  version                    Show version info
  demo                       Run demo sequence

TIPS
  · Commands are case-insensitive
  · Tickers: AAPL MSFT NVDA GOOGL TSLA META AMZN
`.trim();

const VERSION_TEXT = `Capital Scope Behavioral Lab v2.5.0
Claude-powered Investment Research Platform
Built with React + TypeScript + Vite + TailwindCSS
AI Engine: Claude claude-opus-4-5 (streaming)
Market data: Yahoo Finance unified layer
AI/fundamentals: Anthropic/FMP/Finnhub when keys are configured
⚠  Educational use only. Not financial advice.`;

const DEMO_SEQUENCE = [
  { delay: 400,  cmd: 'analyze AAPL' },
  { delay: 2000, cmd: 'research AAPL MSFT NVDA' },
  { delay: 4000, cmd: 'review TSLA' },
  { delay: 5500, cmd: 'model GOOGL' },
];

export default function TerminalPage() {
  const [lines, setLines] = useState<TerminalLine[]>([
    mkLine('info', '╔══════════════════════════════════════════════════════════╗'),
    mkLine('info', '║       CAPITAL SCOPE BEHAVIORAL LAB — COMMAND MODE        ║'),
    mkLine('info', '╚══════════════════════════════════════════════════════════╝'),
    mkLine('info', ''),
    mkLine('output', 'Welcome to Capital Scope Behavioral Lab v2.5'),
    mkLine('output', 'Type  help  to see available commands.'),
    mkLine('output', 'Type  demo  for a guided walkthrough.'),
    mkLine('info', ''),
    mkLine('info', '⚠  Educational analysis only. Not financial advice.'),
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const addLines = useCallback((...newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const scroll = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useEffect(() => scroll(), [lines, scroll]);

  const processCommand = useCallback((raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    addLines(mkLine('input', `> ${cmd}`));
    setHistory(prev => [cmd, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);

    const parts = cmd.toLowerCase().split(/\s+/);
    const verb = parts[0];

    // ── HELP ─────────────────────────────────────────────────
    if (verb === 'help' || verb === '?') {
      addLines(mkLine('output', HELP_TEXT));
      scroll();
      return;
    }

    // ── CLEAR ────────────────────────────────────────────────
    if (verb === 'clear' || verb === 'cls') {
      setLines([mkLine('info', 'Terminal cleared. Type  help  for commands.')]);
      return;
    }

    // ── VERSION ──────────────────────────────────────────────
    if (verb === 'version' || verb === 'ver') {
      addLines(mkLine('output', VERSION_TEXT));
      scroll();
      return;
    }

    // ── DEMO ─────────────────────────────────────────────────
    if (verb === 'demo') {
      addLines(
        mkLine('info', '━━━ Running Demo Sequence ━━━'),
        mkLine('output', 'Will navigate through: analyze → research → review → model'),
      );
      DEMO_SEQUENCE.forEach(({ delay, cmd: dCmd }) => {
        setTimeout(() => {
          addLines(mkLine('input', `> ${dCmd}`));
          addLines(mkLine('success', `↗ Navigating... [${dCmd}]`));
          scroll();
        }, delay);
      });
      scroll();
      return;
    }

    // ── ANALYZE ──────────────────────────────────────────────
    if (verb === 'analyze' || verb === 'a') {
      const ticker = parts[1]?.toUpperCase();
      if (!ticker) {
        addLines(mkLine('error', 'Usage: analyze <TICKER>  (e.g. analyze AAPL)'));
        scroll(); return;
      }
      addLines(mkLine('success', `↗ Opening Stock Analyzer for ${ticker}...`));
      scroll();
      setTimeout(() => navigate(`/analyzer?ticker=${ticker}`), 600);
      return;
    }

    // ── REVIEW EARNINGS ──────────────────────────────────────
    if (verb === 'review') {
      const ticker = parts[1]?.toUpperCase();
      if (!ticker) {
        addLines(mkLine('error', 'Usage: review <TICKER>  (e.g. review MSFT)'));
        scroll(); return;
      }
      addLines(
        mkLine('output', `Queuing Earnings Reviewer for ${ticker}...`),
        mkLine('success', `↗ Opening agent — thesis input required.`),
      );
      scroll();
      setTimeout(() => navigate(`/agents/earnings?ticker=${ticker}`), 600);
      return;
    }

    // ── RESEARCH ─────────────────────────────────────────────
    if (verb === 'research' || verb === 'res') {
      const tickers = parts.slice(1).map(t => t.toUpperCase()).filter(Boolean);
      if (tickers.length === 0) {
        addLines(mkLine('error', 'Usage: research <T1> [T2 ...5]  (e.g. research AAPL MSFT NVDA)'));
        scroll(); return;
      }
      addLines(
        mkLine('output', `Queuing Market Research for: ${tickers.join(', ')}`),
        mkLine('success', `↗ Opening Market Research Agent...`),
      );
      scroll();
      setTimeout(() => navigate(`/agents/research?tickers=${tickers.join(',')}`), 600);
      return;
    }

    // ── COMPARE ──────────────────────────────────────────────
    if (verb === 'compare' || verb === 'cmp') {
      const tickers = parts.slice(1).map(t => t.toUpperCase()).filter(Boolean);
      if (tickers.length < 2) {
        addLines(mkLine('error', 'Usage: compare <T1> <T2> [...]  (needs at least 2 tickers)'));
        scroll(); return;
      }
      addLines(
        mkLine('output', `Comparing ${tickers.length} tickers: ${tickers.join(' vs ')}`),
        mkLine('success', `↗ Opening Market Research (comparison mode)...`),
      );
      scroll();
      setTimeout(() => navigate(`/agents/research?tickers=${tickers.join(',')}&focus=competitive`), 600);
      return;
    }

    // ── MODEL ────────────────────────────────────────────────
    if (verb === 'model' || verb === 'dcf') {
      const ticker = parts[1]?.toUpperCase();
      if (!ticker) {
        addLines(mkLine('error', 'Usage: model <TICKER>  (e.g. model GOOGL)'));
        scroll(); return;
      }
      addLines(
        mkLine('output', `Queuing Model Builder for ${ticker}...`),
        mkLine('success', `↗ Opening DCF / scenario model — configure assumptions then run.`),
      );
      scroll();
      setTimeout(() => navigate(`/agents/model?ticker=${ticker}`), 600);
      return;
    }

    // ── EXPORT MODEL ─────────────────────────────────────────
    if (verb === 'export' && parts[1] === 'model') {
      const ticker = parts[2]?.toUpperCase();
      if (!ticker) {
        addLines(mkLine('error', 'Usage: export model <TICKER>'));
        scroll(); return;
      }
      addLines(
        mkLine('output', `Routing to Model Builder for ${ticker} (run model then export xlsx)...`),
        mkLine('success', `↗ Opening Model Builder...`),
      );
      scroll();
      setTimeout(() => navigate(`/agents/model?ticker=${ticker}`), 600);
      return;
    }

    // ── PORTFOLIO ────────────────────────────────────────────
    if (verb === 'portfolio' || verb === 'port') {
      const sub = parts[1];
      if (sub === 'risk') {
        addLines(mkLine('success', '↗ Opening Risk Dashboard...'));
        scroll();
        setTimeout(() => navigate('/risk'), 600);
      } else if (sub === 'montecarlo' || sub === 'mc') {
        addLines(mkLine('success', '↗ Opening Monte Carlo Lab...'));
        scroll();
        setTimeout(() => navigate('/montecarlo'), 600);
      } else {
        addLines(mkLine('success', '↗ Opening Portfolio Builder...'));
        scroll();
        setTimeout(() => navigate('/portfolio'), 600);
      }
      return;
    }

    // ── SIMULATE ─────────────────────────────────────────────
    if (verb === 'simulate' || verb === 'sim') {
      addLines(mkLine('success', '↗ Opening Scenario Simulator...'));
      scroll();
      setTimeout(() => navigate('/scenarios'), 600);
      return;
    }

    // ── WATCHLIST ────────────────────────────────────────────
    if (verb === 'watchlist' || verb === 'wl') {
      addLines(mkLine('success', '↗ Opening Watchlist...'));
      scroll();
      setTimeout(() => navigate('/watchlist'), 600);
      return;
    }

    // ── QUICK TICKER SHORTHAND ────────────────────────────────
    const TICKERS = ['AAPL','MSFT','NVDA','GOOGL','TSLA','META','AMZN','JPM','GS','XOM','JNJ','KO','V'];
    if (TICKERS.includes(verb.toUpperCase())) {
      addLines(
        mkLine('output', `Recognized ticker: ${verb.toUpperCase()}`),
        mkLine('success', `↗ Opening analyzer... (hint: use  analyze ${verb.toUpperCase()}  or  model ${verb.toUpperCase()})`),
      );
      scroll();
      setTimeout(() => navigate(`/analyzer?ticker=${verb.toUpperCase()}`), 600);
      return;
    }

    // ── UNKNOWN ──────────────────────────────────────────────
    addLines(
      mkLine('error', `Unknown command: "${cmd}"`),
      mkLine('output', 'Type  help  for a list of commands.'),
    );
    scroll();
  }, [addLines, navigate, scroll]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(next);
      setInput(history[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(historyIdx - 1, -1);
      setHistoryIdx(next);
      setInput(next === -1 ? '' : history[next] ?? '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocomplete
      const CMDS = ['analyze', 'review', 'research', 'model', 'compare', 'portfolio', 'simulate', 'watchlist', 'export', 'help', 'clear', 'version', 'demo'];
      const match = CMDS.find(c => c.startsWith(input.toLowerCase()));
      if (match) setInput(match + ' ');
    }
  };

  const lineColor: Record<TerminalLine['type'], string> = {
    input:   'text-blue-300',
    output:  'text-slate-300',
    error:   'text-red-400',
    info:    'text-slate-600',
    success: 'text-emerald-400',
    divider: 'text-slate-700',
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#030308', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800/80"
           style={{ background: 'rgba(6,6,16,0.95)' }}>
        <TerminalSquare size={14} className="text-green-400" />
        <span className="text-xs font-semibold text-slate-400 tracking-widest">CAPITAL SCOPE BEHAVIORAL LAB</span>
        <span className="text-xs text-slate-700 ml-auto">Tab: autocomplete · ↑↓: history · Enter: execute</span>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {lines.map(line => (
          <div key={line.id} className={`text-xs leading-6 ${lineColor[line.type]}`}>
            {line.type === 'input' ? (
              <span className="whitespace-pre-wrap">{line.content}</span>
            ) : (
              <span className="whitespace-pre-wrap">{line.content}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input line */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-800/80"
           style={{ background: 'rgba(6,6,16,0.95)' }}>
        <ChevronRight size={14} className="text-green-400 shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          placeholder="Type a command... (help for reference)"
          className="flex-1 bg-transparent text-sm text-green-300 placeholder-slate-700 focus:outline-none caret-green-400"
          style={{ fontFamily: 'inherit' }}
        />
        <span className="text-xs text-slate-700 shrink-0">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
