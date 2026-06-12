// ============================================================
// Research Service — Deep Dive + Peer Comparison + Scanner
// Powers: Stock Research Report & Gold Mining Scanner
// ============================================================

import { DATA_SOURCE_LABEL, getQuote } from './marketDataService';

const CLAUDE_MODEL = 'claude-opus-4-5';

// ─── Types ────────────────────────────────────────────────────

export interface DeepDiveParams {
  ticker: string;
  competitors: string[];
  portfolioProfile?: string;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  horizon?: '1Y' | '3Y' | '5Y' | '10Y';
  thesis?: string;
}

export interface ResearchBullet {
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  title: string;
  body: string;
}

export interface ResearchSection {
  number: 1 | 2 | 3 | 4;
  title: string;
  bullets: ResearchBullet[];
}

export interface KeyMetric {
  label: string;
  value: string;
  note: string;
  positive?: boolean;
}

export interface DeepDiveResult {
  ticker: string;
  companyName: string;
  sector: string;
  analysisDate: string;
  keyMetrics: KeyMetric[];
  sections: ResearchSection[];
  thesisSummary: string;
  risks: string[];
  rawOutput: string;
}

export interface PeerRow {
  rank: number;
  ticker: string;
  name: string;
  psTTM: string;
  forwardPS: string;
  evEbitda: string;
  grossMargin: string;
  yoyGrowth: string;
  valueGrowthScore: string;
  scoreLabel: 'Best' | 'Peer' | 'Premium' | 'N/A';
  isMain: boolean;
}

export interface ScannerFilters {
  sectors: string[];
  minRevenueGrowth: number;
  maxPS: number;
  minGrossMargin: number;
  marketCapTier: 'small' | 'mid' | 'large' | 'any';
  riskLevel: 'low' | 'medium' | 'high' | 'any';
}

export interface ScannerResult {
  rank: number;
  ticker: string;
  name: string;
  sector: string;
  whyItAppeared: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  portfolioFitScore: number;
  growthScore: number;
  valuationScore: number;
  overallScore: number;
  thesisSummary: string;
  keyMetrics: { label: string; value: string; positive?: boolean }[];
}

// ─── Peer mock database ───────────────────────────────────────

interface PeerMock {
  name: string; sector: string;
  psTTM: number; forwardPS: number;
  evEbitda: number | null;
  grossMargin: number; yoyGrowth: number;
}

const PEER_DB: Record<string, PeerMock> = {
  AAPL:  { name: 'Apple Inc.',               sector: 'Technology',          psTTM: 7.8,  forwardPS: 7.1,  evEbitda: 24.5, grossMargin: 46.2, yoyGrowth: 2.8   },
  MSFT:  { name: 'Microsoft Corp.',          sector: 'Technology',          psTTM: 12.4, forwardPS: 11.1, evEbitda: 31.8, grossMargin: 69.8, yoyGrowth: 16.4  },
  NVDA:  { name: 'NVIDIA Corp.',             sector: 'Semiconductors',      psTTM: 28.6, forwardPS: 21.4, evEbitda: 48.2, grossMargin: 75.1, yoyGrowth: 122.4 },
  GOOGL: { name: 'Alphabet Inc.',            sector: 'Communication',       psTTM: 6.2,  forwardPS: 5.6,  evEbitda: 18.2, grossMargin: 57.4, yoyGrowth: 11.8  },
  META:  { name: 'Meta Platforms Inc.',      sector: 'Communication',       psTTM: 9.1,  forwardPS: 8.2,  evEbitda: 22.8, grossMargin: 81.2, yoyGrowth: 22.1  },
  TSLA:  { name: 'Tesla Inc.',               sector: 'Consumer Disc.',      psTTM: 7.4,  forwardPS: 6.8,  evEbitda: 35.6, grossMargin: 18.2, yoyGrowth: 1.1   },
  AMZN:  { name: 'Amazon.com Inc.',          sector: 'Consumer Disc./Cloud',psTTM: 3.8,  forwardPS: 3.2,  evEbitda: 22.1, grossMargin: 48.1, yoyGrowth: 12.6  },
  AMD:   { name: 'Advanced Micro Devices',   sector: 'Semiconductors',      psTTM: 9.8,  forwardPS: 7.2,  evEbitda: 38.4, grossMargin: 52.1, yoyGrowth: 8.7   },
  INTC:  { name: 'Intel Corp.',              sector: 'Semiconductors',      psTTM: 1.8,  forwardPS: 2.1,  evEbitda: null, grossMargin: 32.4, yoyGrowth: -8.2  },
  V:     { name: 'Visa Inc.',                sector: 'Financials',          psTTM: 14.2, forwardPS: 12.8, evEbitda: 22.4, grossMargin: 80.6, yoyGrowth: 9.8   },
  JPM:   { name: 'JPMorgan Chase & Co.',     sector: 'Financials',          psTTM: 3.4,  forwardPS: 3.1,  evEbitda: null, grossMargin: 62.1, yoyGrowth: 14.2  },
  GS:    { name: 'Goldman Sachs Group',      sector: 'Financials',          psTTM: 2.8,  forwardPS: 2.6,  evEbitda: null, grossMargin: 58.4, yoyGrowth: 22.8  },
  PLTR:  { name: 'Palantir Technologies',    sector: 'Technology',          psTTM: 48.2, forwardPS: 38.4, evEbitda: 124.8, grossMargin: 80.1, yoyGrowth: 28.8 },
  SNOW:  { name: 'Snowflake Inc.',           sector: 'Technology',          psTTM: 14.8, forwardPS: 11.2, evEbitda: null, grossMargin: 67.4, yoyGrowth: 29.8  },
  CRM:   { name: 'Salesforce Inc.',          sector: 'Technology',          psTTM: 7.8,  forwardPS: 6.8,  evEbitda: 28.4, grossMargin: 77.2, yoyGrowth: 11.2  },
  SHOP:  { name: 'Shopify Inc.',             sector: 'Technology',          psTTM: 12.4, forwardPS: 10.8, evEbitda: null, grossMargin: 52.4, yoyGrowth: 23.6  },
  DDOG:  { name: 'Datadog Inc.',             sector: 'Technology',          psTTM: 18.2, forwardPS: 14.8, evEbitda: 68.4, grossMargin: 81.2, yoyGrowth: 26.4  },
  NET:   { name: 'Cloudflare Inc.',          sector: 'Technology',          psTTM: 22.4, forwardPS: 18.2, evEbitda: null, grossMargin: 77.8, yoyGrowth: 28.2  },
  CRWD:  { name: 'CrowdStrike Holdings',     sector: 'Technology',          psTTM: 18.8, forwardPS: 14.8, evEbitda: 96.2, grossMargin: 76.4, yoyGrowth: 31.6  },
  MELI:  { name: 'MercadoLibre Inc.',        sector: 'Consumer Disc.',      psTTM: 4.2,  forwardPS: 3.4,  evEbitda: 28.8, grossMargin: 54.2, yoyGrowth: 36.4  },
  UBER:  { name: 'Uber Technologies',        sector: 'Technology',          psTTM: 3.8,  forwardPS: 3.2,  evEbitda: 28.4, grossMargin: 39.8, yoyGrowth: 16.8  },
  COIN:  { name: 'Coinbase Global',          sector: 'Financials',          psTTM: 8.2,  forwardPS: 7.1,  evEbitda: 18.6, grossMargin: 62.4, yoyGrowth: 74.2  },
  SOFI:  { name: 'SoFi Technologies',        sector: 'Financials',          psTTM: 3.8,  forwardPS: 3.1,  evEbitda: null, grossMargin: 68.4, yoyGrowth: 28.8  },
  RXRX:  { name: 'Recursion Pharmaceuticals',sector: 'Healthcare',          psTTM: 18.4, forwardPS: 12.8, evEbitda: null, grossMargin: 72.1, yoyGrowth: 42.6  },
  AEHR:  { name: 'Aehr Test Systems',        sector: 'Semiconductors',      psTTM: 8.4,  forwardPS: 6.2,  evEbitda: 22.4, grossMargin: 54.8, yoyGrowth: 18.4  },
};

// ─── Core Claude caller ───────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[CapitalScope] No VITE_ANTHROPIC_API_KEY — showing demo data. Add key to .env.local for live AI.');
    const mock = getMockDeepDive(userMessage);
    const demoPrefix = '⚠️ **DEMO MODE** — Set `VITE_ANTHROPIC_API_KEY` in `.env.local` for live AI analysis.\n\n---\n\n';
    const mockWithPrefix = demoPrefix + mock;
    if (onChunk) {
      for (const word of mockWithPrefix.split(' ')) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 3));
      }
    }
    return mockWithPrefix;
  }
  try {
    const response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: !!onChunk,
      }),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'content_block_delta' && d.delta?.text) {
              full += d.delta.text;
              onChunk(d.delta.text);
            }
          } catch { /* skip */ }
        }
      }
      return full;
    }
    const data = await response.json();
    return data.content[0]?.text ?? '';
  } catch (err) {
    console.warn('Claude error, using mock:', err);
    return getMockDeepDive(userMessage);
  }
}

// ─── Deep Dive Report ─────────────────────────────────────────

const DEEP_DIVE_SYSTEM = `You are a senior equity research analyst at a top-tier investment bank.
Generate a comprehensive 4-part deep dive research report.

Output EXACTLY in this format with these exact markers (no deviations):

KEY_METRICS:
METRIC: [label] | [value] | [note]
METRIC: [label] | [value] | [note]
METRIC: [label] | [value] | [note]

SECTION_1_START
BULLET_BLUE: [Bold title — max 10 words]
[2-4 sentence body with specific numbers and data points]

BULLET_GREEN: [Bold title]
[Body]

BULLET_BLUE: [Bold title]
[Body]
SECTION_1_END

SECTION_2_START
BULLET_BLUE: [Title for moat analysis]
[Body]

BULLET_ORANGE: [Top competitors analysis]
[List the 3 main competitors and explain why the company does or does not have a durable advantage]

BULLET_GREEN: [Unique advantage if any]
[Body]
SECTION_2_END

SECTION_3_START
BULLET_GREEN: [Catalyst 1 — specific event or timeline]
[Body]

BULLET_BLUE: [Catalyst 2]
[Body]

BULLET_ORANGE: [Risk catalyst or wild card]
[Body]
SECTION_3_END

SECTION_4_START
BULLET_BLUE: [Valuation floor analysis]
[Body with specific numbers]

BULLET_GREEN: [Growth ceiling analysis]
[Body with specific numbers]

BULLET_BLUE: [Asymmetry conclusion]
[Body summarizing upside/downside ratio]
SECTION_4_END

THESIS_SUMMARY: [2-3 sentence institutional-quality thesis]

RISKS:
RISK: [Specific risk 1]
RISK: [Specific risk 2]
RISK: [Specific risk 3]

Rules: Use specific numbers. Be institutional, precise, and honest.
Do not say buy or sell. Label as educational analysis.`;

export async function generateDeepDive(
  params: DeepDiveParams,
  onChunk?: (text: string) => void
): Promise<DeepDiveResult> {
  const quote = await getQuote(params.ticker).catch(() => null);
  const fundCtx = PEER_DB[params.ticker.toUpperCase()]
    ? `P/S: ${PEER_DB[params.ticker.toUpperCase()].psTTM}x | Gross Margin: ${PEER_DB[params.ticker.toUpperCase()].grossMargin}% | YoY Growth: ${PEER_DB[params.ticker.toUpperCase()].yoyGrowth}%`
    : 'No fundamental data pre-loaded';

  const msg = `
TICKER: ${params.ticker.toUpperCase()}
COMPETITORS: ${params.competitors.join(', ')}
INVESTMENT HORIZON: ${params.horizon ?? '3Y'}
RISK TOLERANCE: ${params.riskTolerance ?? 'moderate'}
${params.thesis ? `INVESTOR THESIS: ${params.thesis}` : ''}
${params.portfolioProfile ? `PORTFOLIO CONTEXT: ${params.portfolioProfile}` : ''}
AVAILABLE FUNDAMENTALS: ${fundCtx}
CURRENT MARKET DATA:
${quote
  ? `${DATA_SOURCE_LABEL}; quote timestamp ${quote.lastUpdated}; current price $${quote.price.toFixed(2)}; day change ${quote.changePercent.toFixed(2)}%; market cap ${quote.marketCap > 0 ? `$${(quote.marketCap / 1e9).toFixed(1)}B` : 'unavailable from current Yahoo response'}; volume ${quote.volume ? quote.volume.toLocaleString() : 'unavailable'}`
  : `${DATA_SOURCE_LABEL}; market data unavailable. Do not invent current price, market cap, or volume.`}

Generate the deep dive research report.
`;
  const raw = await callClaude(DEEP_DIVE_SYSTEM, msg, onChunk);
  return parseDeepDive(params.ticker.toUpperCase(), raw);
}

// ─── Parser ───────────────────────────────────────────────────

function parseDeepDive(ticker: string, raw: string): DeepDiveResult {
  const peer = PEER_DB[ticker];

  // Key metrics
  const keyMetrics: KeyMetric[] = [];
  const metricRegex = /^METRIC:\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = metricRegex.exec(raw)) !== null) {
    keyMetrics.push({ label: m[1].trim(), value: m[2].trim(), note: m[3].trim() });
  }
  // Fallback metrics from mock data
  if (keyMetrics.length === 0 && peer) {
    keyMetrics.push(
      { label: 'P/S Ratio (TTM)',   value: `${peer.psTTM}×`,        note: `Fwd: ~${peer.forwardPS}×` },
      { label: 'Gross Margin',      value: `${peer.grossMargin}%`,   note: 'TTM basis' },
      { label: 'YoY Rev. Growth',   value: `${peer.yoyGrowth >= 0 ? '+' : ''}${peer.yoyGrowth}%`, note: 'Most recent FY', positive: peer.yoyGrowth > 0 },
    );
  }

  // Sections
  const sections: ResearchSection[] = [];
  const sectionTitles = ['Business Model — How They Make Money', 'Moat & Competition', 'Catalysts — Next 12 Months', 'Asymmetry Check'];
  for (let i = 1; i <= 4; i++) {
    const start = raw.indexOf(`SECTION_${i}_START`);
    const end   = raw.indexOf(`SECTION_${i}_END`);
    if (start === -1 || end === -1) continue;
    const block = raw.slice(start + `SECTION_${i}_START`.length, end).trim();
    const bullets = parseBullets(block);
    sections.push({ number: i as 1|2|3|4, title: sectionTitles[i - 1], bullets });
  }

  // Thesis
  const thesisMatch = raw.match(/^THESIS_SUMMARY:\s*(.+)$/m);
  const thesisSummary = thesisMatch?.[1]?.trim() ?? 'No thesis summary extracted.';

  // Risks
  const risks: string[] = [];
  const riskRegex = /^RISK:\s*(.+)$/gm;
  while ((m = riskRegex.exec(raw)) !== null) risks.push(m[1].trim());

  return {
    ticker,
    companyName: peer?.name ?? ticker,
    sector: peer?.sector ?? 'Technology',
    analysisDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    keyMetrics: keyMetrics.slice(0, 3),
    sections,
    thesisSummary,
    risks,
    rawOutput: raw,
  };
}

function parseBullets(block: string): ResearchBullet[] {
  const bullets: ResearchBullet[] = [];
  const lines = block.split('\n');
  let current: Partial<ResearchBullet> | null = null;
  let bodyLines: string[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^BULLET_(BLUE|GREEN|ORANGE|RED|PURPLE):\s*(.+)$/);
    if (bulletMatch) {
      if (current?.title) {
        bullets.push({ color: current.color!, title: current.title, body: bodyLines.join(' ').trim() });
      }
      current = { color: bulletMatch[1].toLowerCase() as ResearchBullet['color'], title: bulletMatch[2].trim() };
      bodyLines = [];
    } else if (current && line.trim()) {
      bodyLines.push(line.trim());
    }
  }
  if (current?.title) {
    bullets.push({ color: current.color!, title: current.title, body: bodyLines.join(' ').trim() });
  }
  return bullets;
}

// ─── Peer Comparison ──────────────────────────────────────────

export function buildPeerComparison(mainTicker: string, competitors: string[]): PeerRow[] {
  const tickers = [mainTicker, ...competitors].map(t => t.toUpperCase()).slice(0, 3);
  const rows = tickers.map((t, idx) => {
    const d = PEER_DB[t];
    if (!d) return {
      rank: idx + 1,
      ticker: t, name: t,
      psTTM: 'N/A', forwardPS: 'N/A', evEbitda: 'N/A',
      grossMargin: 'N/A', yoyGrowth: 'N/A',
      valueGrowthScore: 'N/A', scoreLabel: 'N/A' as const,
      isMain: idx === 0,
    };
    const score = d.yoyGrowth > 0 ? +(d.psTTM / d.yoyGrowth).toFixed(3) : null;
    return {
      rank: 0,
      ticker: t, name: d.name,
      psTTM: `${d.psTTM}×`, forwardPS: `~${d.forwardPS}×`,
      evEbitda: d.evEbitda ? `~${d.evEbitda}×` : 'N/M',
      grossMargin: `${d.grossMargin}%`,
      yoyGrowth: `${d.yoyGrowth >= 0 ? '+' : ''}${d.yoyGrowth}%`,
      valueGrowthScore: score !== null ? score.toFixed(2) : 'N/M',
      _scoreNum: score,
      scoreLabel: 'Peer' as 'Best' | 'Peer' | 'Premium' | 'N/A',
      isMain: idx === 0,
    };
  });

  // Rank by score (lower = better)
  const scored = rows.filter(r => (r as any)._scoreNum !== null && (r as any)._scoreNum !== undefined);
  scored.sort((a, b) => ((a as any)._scoreNum ?? 999) - ((b as any)._scoreNum ?? 999));
  scored.forEach((r, i) => {
    r.rank = i + 1;
    r.scoreLabel = i === 0 ? 'Best' : i === scored.length - 1 ? 'Premium' : 'Peer';
  });

  // Assign ranks to unscored rows
  rows.forEach(r => {
    const found = scored.find(s => s.ticker === r.ticker);
    if (found) { r.rank = found.rank; r.scoreLabel = found.scoreLabel; }
    else r.rank = rows.length;
  });

  return rows.sort((a, b) => a.rank - b.rank);
}

// ─── Gold Mining Scanner ──────────────────────────────────────

const SCANNER_UNIVERSE = [
  'NVDA','AMD','CRWD','DDOG','NET','SHOP','MELI','PLTR','SNOW','COIN',
  'META','MSFT','AMZN','GOOGL','CRM','SOFI','UBER','RXRX','V','GS',
];

const SCANNER_SYSTEM = `You are a quantitative equity research analyst running a stock screening process.
Given a universe of stocks with their financial data, identify the most promising opportunities.

For each recommended stock, output EXACTLY in this format:

STOCK_START
TICKER: [ticker]
WHY: [1-2 sentences — specific reason it appeared in the scan]
RISK_LEVEL: [Low|Medium|High]
GROWTH_SCORE: [0.0-10.0]
VALUE_SCORE: [0.0-10.0]
FIT_SCORE: [0.0-10.0]
THESIS: [2-3 sentences — core investment thesis]
STOCK_END

Output the top 6 stocks from the universe. Be precise, data-driven, and specific.
Educational analysis only. Not financial advice.`;

export async function runScanner(
  filters: ScannerFilters,
  onChunk?: (text: string) => void
): Promise<ScannerResult[]> {
  // Build data snapshot for Claude
  const universe = SCANNER_UNIVERSE
    .filter(t => {
      const d = PEER_DB[t];
      if (!d) return false;
      if (filters.sectors.length > 0 && !filters.sectors.some(s => d.sector.includes(s))) return false;
      if (d.yoyGrowth < filters.minRevenueGrowth) return false;
      if (d.psTTM > filters.maxPS) return false;
      if (d.grossMargin < filters.minGrossMargin) return false;
      return true;
    })
    .map(t => {
      const d = PEER_DB[t]!;
      return `${t} (${d.name}): P/S=${d.psTTM}x, GrMgn=${d.grossMargin}%, YoYGrowth=${d.yoyGrowth}%, EV/EBITDA=${d.evEbitda ?? 'N/M'}`;
    })
    .join('\n');

  const msg = `
SCAN FILTERS:
- Min revenue growth: ${filters.minRevenueGrowth}%
- Max P/S: ${filters.maxPS}×
- Min gross margin: ${filters.minGrossMargin}%
- Sectors: ${filters.sectors.length > 0 ? filters.sectors.join(', ') : 'All'}
- Risk level: ${filters.riskLevel}

QUALIFYING STOCKS:
${universe || 'No stocks matched filters — use broader criteria'}

Score and rank the top 6 opportunities.
`;

  const raw = await callClaude(SCANNER_SYSTEM, msg, onChunk);
  return parseScanner(raw);
}

function parseScanner(raw: string): ScannerResult[] {
  const results: ScannerResult[] = [];
  const blocks = raw.split('STOCK_START').slice(1);

  blocks.forEach((block, idx) => {
    const end = block.indexOf('STOCK_END');
    const content = end !== -1 ? block.slice(0, end) : block;

    const get = (key: string) => {
      const m = content.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
      return m?.[1]?.trim() ?? '';
    };

    const ticker   = get('TICKER').toUpperCase();
    const peer     = PEER_DB[ticker];
    if (!ticker) return;

    const growthScore    = parseFloat(get('GROWTH_SCORE'))    || 7.0;
    const valueScore     = parseFloat(get('VALUE_SCORE'))     || 7.0;
    const fitScore       = parseFloat(get('FIT_SCORE'))       || 7.0;
    const overallScore   = +((growthScore + valueScore + fitScore) / 3).toFixed(1);
    const riskRaw        = get('RISK_LEVEL');
    const riskLevel      = (['Low','Medium','High'].includes(riskRaw) ? riskRaw : 'Medium') as ScannerResult['riskLevel'];

    results.push({
      rank: idx + 1,
      ticker,
      name:             peer?.name ?? ticker,
      sector:           peer?.sector ?? 'Technology',
      whyItAppeared:    get('WHY')    || 'High growth with reasonable valuation',
      riskLevel,
      portfolioFitScore: fitScore,
      growthScore,
      valuationScore:   valueScore,
      overallScore,
      thesisSummary:    get('THESIS') || 'No thesis extracted.',
      keyMetrics: peer ? [
        { label: 'P/S TTM',       value: `${peer.psTTM}×` },
        { label: 'Gross Margin',  value: `${peer.grossMargin}%`, positive: peer.grossMargin > 50 },
        { label: 'YoY Growth',    value: `${peer.yoyGrowth >= 0 ? '+' : ''}${peer.yoyGrowth}%`, positive: peer.yoyGrowth > 10 },
      ] : [],
    });
  });

  // Fallback mock results if parse fails
  if (results.length === 0) return getMockScannerResults();

  return results.sort((a, b) => b.overallScore - a.overallScore).map((r, i) => ({ ...r, rank: i + 1 }));
}

// ─── Mock fallbacks ───────────────────────────────────────────

function getMockDeepDive(msg: string): string {
  const tickerMatch = msg.match(/TICKER:\s*([A-Z]{1,6})/);
  const ticker = tickerMatch?.[1] ?? 'AAPL';
  const peer = PEER_DB[ticker];
  const name = peer?.name ?? ticker;
  const margin = peer?.grossMargin ?? 52;
  const growth = peer?.yoyGrowth ?? 15;
  const ps = peer?.psTTM ?? 12;

  return `KEY_METRICS:
METRIC: P/S Ratio (TTM) | ${ps}× | Fwd: ~${peer?.forwardPS ?? (ps * 0.9).toFixed(1)}×
METRIC: Gross Margin | ${margin}% | TTM basis — indicates pricing power
METRIC: YoY Revenue Growth | ${growth >= 0 ? '+' : ''}${growth}% | Most recent fiscal year

SECTION_1_START
BULLET_BLUE: How ${name} generates revenue
${name} generates revenue through a combination of product sales and high-margin recurring services. The business has evolved from a pure hardware/transaction model toward a platform model with multiple monetization layers. This layering of revenue streams creates resilience and compound growth.

BULLET_GREEN: The core value proposition in plain English
At its core, ${name} provides essential infrastructure or services that customers become deeply embedded in. This stickiness — measured through high retention rates and expanding revenue per customer — is the foundation of the investment thesis. Switching costs are meaningful across the customer base.

BULLET_BLUE: Capital allocation and margin trajectory
Management has demonstrated disciplined capital allocation, reinvesting in R&D while maintaining ${margin}% gross margins. Operating leverage is visible as revenue scales, suggesting meaningful EBITDA margin expansion potential over the next 2-3 years.
SECTION_1_END

SECTION_2_START
BULLET_BLUE: Competitive moat assessment
${name}'s competitive moat rests on a combination of (1) high switching costs, (2) network effects where applicable, and (3) proprietary technology or data advantages. The ${margin}% gross margin is structural evidence of pricing power — commodity businesses don't sustain margins at this level.

BULLET_ORANGE: Top 3 competitors and where they stand
The three primary competitors are mid-sized players with narrower product coverage, a large incumbent with legacy architecture constraints, and an emerging challenger with specific niche advantages. None currently replicates the full platform breadth of ${name}, though the challenger warrants close monitoring.

BULLET_GREEN: Unique technology or distribution advantage
The key differentiator — whether proprietary IP, exclusive partnerships, or cost structure — creates a 12-18 month head start versus the nearest competitor. This gap is not insurmountable over a 5-year horizon but provides meaningful near-term protection of market share and margins.
SECTION_2_END

SECTION_3_START
BULLET_GREEN: Upcoming product cycle or platform expansion (next 6 months)
Management has guided for a significant product launch or platform expansion within the next two quarters that could drive meaningful revenue acceleration. Prior launches in this category have historically driven 20-30% step-ups in adoption metrics in the 12 months post-launch.

BULLET_BLUE: Earnings inflection and consensus re-rating opportunity
Current consensus estimates may be too conservative given the operating leverage dynamics already visible in recent quarters. An earnings beat cycle — particularly if accompanied by upward guidance revisions — could be the catalyst for multiple expansion from current levels.

BULLET_ORANGE: Macro headwind and sector rotation risk
Near-term, higher rates and broader tech sector sentiment are the primary external risks. Any deterioration in consumer/enterprise spending confidence could delay the revenue acceleration. Sector rotation away from growth into value would create near-term price pressure regardless of fundamentals.
SECTION_3_END

SECTION_4_START
BULLET_BLUE: Valuation floor — downside protection
At current P/S of ${ps}×, the stock is not in "deep value" territory, but the revenue quality justifies a premium. In a bear scenario with compression to ${(ps * 0.65).toFixed(1)}× and flat growth, the downside is approximately 25-35% from current levels. This assumes no fundamental deterioration.

BULLET_GREEN: Growth ceiling — upside scenario analysis
In a bull scenario where the product cycle lands well and margins expand 400-600bps over 3 years, the stock could re-rate to ${(ps * 1.5).toFixed(1)}-${(ps * 1.8).toFixed(1)}× P/S on higher revenue. This implies potential upside of 60-90% over a 3-year horizon — a favorable asymmetry for patient investors.

BULLET_BLUE: Asymmetry conclusion — risk/reward balance
The risk/reward at current levels skews positive for a 3-year horizon: approximately ${Math.round(Math.abs((ps * 1.5 / ps - 1) * 100))}% upside in the bull case versus ${Math.round(30)} % downside in the bear case. This 2:1+ asymmetry, combined with the strong balance sheet and sticky revenue, makes the investment case compelling on a risk-adjusted basis.
SECTION_4_END

THESIS_SUMMARY: ${name} offers a compelling combination of revenue quality, margin expansion potential, and competitive positioning in a secular growth market. At current valuation, the risk/reward skews favorably for investors with a 3-year+ horizon, with the upcoming product cycle representing a near-term catalyst. The core thesis hinges on continued execution on margins and market share retention.

RISKS:
RISK: Valuation compression risk if growth disappoints or rates rise materially — the stock is priced for execution
RISK: Competitive disruption from well-funded challengers, particularly in the fastest-growing product segments
RISK: Macro slowdown reducing enterprise/consumer spending and pushing out the revenue acceleration timeline`;
}

function getMockScannerResults(): ScannerResult[] {
  return [
    { rank: 1, ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors',
      whyItAppeared: 'Dominant AI accelerator position with 122% YoY revenue growth and 75% gross margin — exceptional growth/quality combination.',
      riskLevel: 'Medium', portfolioFitScore: 8.4, growthScore: 9.8, valuationScore: 6.2, overallScore: 8.1,
      thesisSummary: 'NVIDIA owns the AI infrastructure layer via CUDA ecosystem lock-in. Datacenter demand from hyperscalers and sovereign AI build-outs sustains multi-year growth. NIM software margin expansion provides valuation upside.',
      keyMetrics: [{ label: 'P/S TTM', value: '28.6×' }, { label: 'Gross Margin', value: '75.1%', positive: true }, { label: 'YoY Growth', value: '+122.4%', positive: true }] },
    { rank: 2, ticker: 'CRWD', name: 'CrowdStrike Holdings', sector: 'Technology',
      whyItAppeared: 'Best-in-class cybersecurity platform with 31.6% revenue growth, 76% gross margins, and expanding ARR from platform cross-sell.',
      riskLevel: 'Medium', portfolioFitScore: 7.8, growthScore: 8.6, valuationScore: 7.2, overallScore: 7.9,
      thesisSummary: 'CrowdStrike\'s Falcon platform benefits from the security consolidation trend as enterprises move to fewer, broader vendors. Land-and-expand model drives efficient growth, and AI-powered threat detection creates ongoing competitive differentiation.',
      keyMetrics: [{ label: 'P/S TTM', value: '18.8×' }, { label: 'Gross Margin', value: '76.4%', positive: true }, { label: 'YoY Growth', value: '+31.6%', positive: true }] },
    { rank: 3, ticker: 'MELI', name: 'MercadoLibre Inc.', sector: 'Consumer Disc.',
      whyItAppeared: 'LatAm e-commerce and fintech leader growing 36% YoY at a 4.2× P/S — exceptional value/growth score of 0.12.',
      riskLevel: 'Medium', portfolioFitScore: 7.2, growthScore: 8.8, valuationScore: 8.6, overallScore: 8.2,
      thesisSummary: 'MercadoLibre is the Amazon + PayPal of Latin America, with fintech (Mercado Pago) now generating more revenue than marketplace. The underpenetrated LatAm market provides a multi-decade runway.',
      keyMetrics: [{ label: 'P/S TTM', value: '4.2×' }, { label: 'Gross Margin', value: '54.2%', positive: true }, { label: 'YoY Growth', value: '+36.4%', positive: true }] },
    { rank: 4, ticker: 'DDOG', name: 'Datadog Inc.', sector: 'Technology',
      whyItAppeared: 'Best observability platform with 81% gross margins and 26% growth — infrastructure spending resilience in AI-driven cloud migration.',
      riskLevel: 'Medium', portfolioFitScore: 7.4, growthScore: 8.0, valuationScore: 6.8, overallScore: 7.4,
      thesisSummary: 'Datadog benefits from complexity growth in cloud-native architectures — every new AI workload generates more observability data. Platform expansion across 18+ products increases land-and-expand efficiency.',
      keyMetrics: [{ label: 'P/S TTM', value: '18.2×' }, { label: 'Gross Margin', value: '81.2%', positive: true }, { label: 'YoY Growth', value: '+26.4%', positive: true }] },
    { rank: 5, ticker: 'COIN', name: 'Coinbase Global', sector: 'Financials',
      whyItAppeared: 'Crypto cycle leverage with 74% YoY growth, institutional product expansion, and regulatory clarity improving in the US.',
      riskLevel: 'High', portfolioFitScore: 5.8, growthScore: 8.4, valuationScore: 7.0, overallScore: 7.1,
      thesisSummary: 'Coinbase is the regulatory-compliant institutional on-ramp for crypto assets. Stablecoin/USDC revenue provides lower-volatility base. Risk is high correlation to BTC price cycle and regulatory developments.',
      keyMetrics: [{ label: 'P/S TTM', value: '8.2×' }, { label: 'Gross Margin', value: '62.4%', positive: true }, { label: 'YoY Growth', value: '+74.2%', positive: true }] },
    { rank: 6, ticker: 'SHOP', name: 'Shopify Inc.', sector: 'Technology',
      whyItAppeared: 'E-commerce infrastructure leader reaccelerating to 23.6% growth post-logistics exit, with improving unit economics.',
      riskLevel: 'Medium', portfolioFitScore: 7.0, growthScore: 7.6, valuationScore: 6.4, overallScore: 7.0,
      thesisSummary: 'Shopify is the operating system for commerce. Merchant of Record capabilities, Shopify Payments penetration, and Audiences for ad targeting create durable monetization. The logistics exit unlocks margin improvement.',
      keyMetrics: [{ label: 'P/S TTM', value: '12.4×' }, { label: 'Gross Margin', value: '52.4%', positive: true }, { label: 'YoY Growth', value: '+23.6%', positive: true }] },
  ];
}
