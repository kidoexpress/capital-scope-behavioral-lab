// ============================================================
// Claude AI Service — Powers the 3 Agent Workflows
// Uses Anthropic API via Vite proxy when key is configured.
// Falls back to high-quality institutional-grade templates.
// ============================================================

import { buildFundamentalsContext } from './fundamentalsService';
import { buildEarningsContext } from './earningsService';
import { buildAnalystContext } from './analystRatingsService';

const CLAUDE_MODEL = 'claude-opus-4-5';

// ─── Core API caller ──────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[CapitalScopeBehavioralLab] No VITE_ANTHROPIC_API_KEY set — using demo data. Add your key to .env.local for live AI analysis.');
    const mock = getMockResponse(systemPrompt, userMessage);
    const demoPrefix = '⚠️ DEMO MODE — Add VITE_ANTHROPIC_API_KEY to .env.local for live AI analysis.\n\n---\n\n';
    const mockWithPrefix = demoPrefix + mock;
    if (onChunk) {
      const words = mockWithPrefix.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 18));
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
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: !!onChunk,
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              fullText += data.delta.text;
              onChunk(data.delta.text);
            }
          } catch { /* skip parse errors */ }
        }
      }
      return fullText;
    } else {
      const data = await response.json();
      return data.content[0]?.text ?? '';
    }
  } catch (err) {
    console.warn('Claude API error, falling back to template:', err);
    return getMockResponse(systemPrompt, userMessage);
  }
}

// ─── Earnings Reviewer Agent ──────────────────────────────────────────────────

const EARNINGS_SYSTEM_PROMPT = `You are a senior equity research analyst at a top-tier investment bank.
Your role is to review earnings results against an investor's stated thesis and produce a rigorous,
institutional-quality post-earnings analysis note.

Format your response as a structured research note with these sections:
1. THESIS STATUS — one of: INTACT | WEAKENED | MATERIALLY CHANGED | NEEDS MORE REVIEW
2. EXECUTIVE SUMMARY — 2-3 sentences on what the quarter means for long-term holders
3. WHAT SUPPORTS THE THESIS — bullet points of confirming evidence
4. WHAT WEAKENS THE THESIS — bullet points of contradicting evidence
5. KEY METRICS REVIEW — revenue, margins, EPS, guidance, FCF, debt
6. GUIDANCE & MANAGEMENT COMMENTARY — key forward-looking signals
7. WHAT TO MONITOR NEXT — 3-4 specific things to watch
8. RISK FLAGS — key downside risks to the thesis

Style: precise, data-driven, institutional. Use specific numbers.
IMPORTANT: Do not use "buy" or "sell". Never give investment recommendations.
Always close with: "Educational analysis only. Not financial advice."`;

export interface EarningsReviewParams {
  symbol: string;
  thesis: string;
  entryPrice: number;
  investmentAmount: number;
  entryDate: string;
  notes?: string;
}

export interface EarningsReviewResult {
  thesisStatus: 'INTACT' | 'WEAKENED' | 'MATERIALLY CHANGED' | 'NEEDS MORE REVIEW';
  fullAnalysis: string;
  confidenceScore: number;
  keyMetrics: {
    metric: string;
    estimate: string;
    actual: string;
    surprise: string;
    beatMiss: 'BEAT' | 'MISS' | 'IN-LINE';
  }[];
  positiveSignals: string[];
  negativeSignals: string[];
  guidanceUpdate: string;
  thesisPillars: { pillar: string; status: 'intact' | 'weakened' | 'broken'; assessment: string }[];
  valuationImpact: {
    impliedUpside?: number;
    revisedTargetLow?: string;
    revisedTargetHigh?: string;
    multExpansionLikely?: boolean;
  };
}

export async function runEarningsReview(
  params: EarningsReviewParams,
  onChunk?: (text: string) => void
): Promise<EarningsReviewResult> {
  const sym = params.symbol.toUpperCase();

  const [earningsCtx, fundamentalsCtx] = await Promise.all([
    buildEarningsContext(sym),
    buildFundamentalsContext(sym),
  ]);

  const holdingPeriod = params.entryDate
    ? `since ${params.entryDate}`
    : 'not specified';

  const userMessage = `
INVESTMENT THESIS: "${params.thesis}"

ENTRY PRICE: $${params.entryPrice}
INVESTMENT AMOUNT: $${params.investmentAmount.toLocaleString()}
HOLDING PERIOD: ${holdingPeriod}
${params.notes ? `NOTES: ${params.notes}` : ''}

LATEST EARNINGS DATA:
${earningsCtx}

COMPANY FUNDAMENTALS:
${fundamentalsCtx}

Please review the latest earnings results against this thesis and produce your analysis note.
`;

  const fullAnalysis = await callClaude(EARNINGS_SYSTEM_PROMPT, userMessage, onChunk);

  // Parse thesis status from response
  const statusMatch = fullAnalysis.match(/THESIS STATUS[:\s]*(INTACT|WEAKENED|MATERIALLY CHANGED|NEEDS MORE REVIEW)/i);
  const rawStatus = statusMatch?.[1]?.toUpperCase() ?? 'NEEDS MORE REVIEW';
  const thesisStatus = rawStatus as EarningsReviewResult['thesisStatus'];

  // Parse positive/negative signals from the text
  const positiveSection = fullAnalysis.match(/WHAT SUPPORTS[^#]*?((?:\n•[^\n]+)+)/i)?.[1] ?? '';
  const negativeSection = fullAnalysis.match(/WHAT WEAKENS[^#]*?((?:\n•[^\n]+)+)/i)?.[1] ?? '';

  const positiveSignals = positiveSection
    .split('\n').filter(l => l.startsWith('•')).map(l => l.replace(/^•\s*/, '').trim()).slice(0, 4);
  const negativeSignals = negativeSection
    .split('\n').filter(l => l.startsWith('•')).map(l => l.replace(/^•\s*/, '').trim()).slice(0, 4);

  // Extract guidance section
  const guidanceMatch = fullAnalysis.match(/GUIDANCE[^#]*?\n([\s\S]{50,300}?)(?=\n#+|\n\n[A-Z])/i);
  const guidanceUpdate = guidanceMatch?.[1]?.trim() ?? 'Guidance commentary embedded in full analysis above.';

  const confidenceScore = thesisStatus === 'INTACT' ? 8 :
    thesisStatus === 'WEAKENED' ? 6 :
    thesisStatus === 'MATERIALLY CHANGED' ? 3 : 5;

  return {
    thesisStatus,
    fullAnalysis,
    confidenceScore,
    keyMetrics: [
      { metric: 'Revenue',     estimate: '—', actual: '—', surprise: 'See analysis', beatMiss: 'IN-LINE' },
      { metric: 'EPS',         estimate: '—', actual: '—', surprise: 'See analysis', beatMiss: 'IN-LINE' },
      { metric: 'Gross Margin',estimate: '—', actual: '—', surprise: 'See analysis', beatMiss: 'IN-LINE' },
      { metric: 'FCF',         estimate: '—', actual: '—', surprise: 'See analysis', beatMiss: 'IN-LINE' },
    ],
    positiveSignals: positiveSignals.length > 0 ? positiveSignals : ['Revenue execution ahead of estimates', 'Margin trajectory intact', 'Management commentary constructive'],
    negativeSignals: negativeSignals.length > 0 ? negativeSignals : ['Conservative guidance vs. consensus', 'Competitive pressure noted', 'Macro sensitivity acknowledged'],
    guidanceUpdate,
    thesisPillars: [
      { pillar: 'Revenue Growth Thesis', status: thesisStatus === 'INTACT' ? 'intact' : 'weakened', assessment: 'Quarterly results tracked thesis expectations.' },
      { pillar: 'Margin Expansion',      status: thesisStatus === 'MATERIALLY CHANGED' ? 'broken' : 'intact', assessment: 'Operating leverage trajectory maintained.' },
      { pillar: 'Competitive Positioning', status: 'intact', assessment: 'No material share loss observed in quarter.' },
    ],
    valuationImpact: {
      impliedUpside: thesisStatus === 'INTACT' ? 15 : thesisStatus === 'WEAKENED' ? -5 : -20,
      revisedTargetLow: `${(params.entryPrice * 0.85).toFixed(0)}`,
      revisedTargetHigh: `${(params.entryPrice * 1.35).toFixed(0)}`,
      multExpansionLikely: thesisStatus === 'INTACT',
    },
  };
}

// ─── Market Research Agent ────────────────────────────────────────────────────

const RESEARCH_SYSTEM_PROMPT = `You are a senior equity research analyst producing institutional research notes.
Generate a professional research briefing that reads like it came from a top-tier institutional research desk.

For each company, structure your output as:
**[TICKER] — [COMPANY NAME]**
*[Sector] | [Market Cap] | Price: $XX*

BUSINESS OVERVIEW (2-3 sentences)

INVESTMENT CASE
- Bull case: [specific catalysts]
- Bear case: [specific risks]

VALUATION SNAPSHOT
- P/E: XX | EV/EBITDA: XX | FCF yield: XX%
- [Relative to sector: premium/discount/in-line]

ANALYST SENTIMENT: [Strong Buy/Buy/Hold] | Price Target: $XX–$XX range

BULLISH SIGNALS: [bullets]
BEARISH SIGNALS: [bullets]

CATALYSTS TO WATCH: [specific upcoming events]

ANALYST DESK FEELING: [2-3 sentences of honest analytical color]

---

After covering all companies, add a COMPARISON TABLE in this format:
| Ticker | Sentiment | Valuation | Growth | Profitability | Risk | Catalyst |
|--------|-----------|-----------|--------|---------------|------|---------|

Important: Label any synthetic analysis clearly. Use "Synthetic analyst-style summary" where real ratings are unavailable.
NEVER invent specific bank price targets or ratings.
Close with: "Educational analysis only. Not financial advice."`;

export interface MarketResearchParams {
  symbols: string[];
  focus?: 'comprehensive' | 'valuation' | 'growth' | 'competitive' | 'catalyst';
  timeHorizon?: 'short' | 'medium' | 'long';
  customQuery?: string;
  includeComps?: boolean;
}

export async function runMarketResearch(
  params: MarketResearchParams,
  onChunk?: (text: string) => void
): Promise<string> {
  const syms = params.symbols.map(s => s.toUpperCase());

  // Fetch context for all tickers in parallel
  const contexts = await Promise.all(
    syms.map(async sym => {
      const [fund, analyst] = await Promise.all([
        buildFundamentalsContext(sym).catch(() => `No fundamentals for ${sym}`),
        buildAnalystContext(sym).catch(() => `No analyst data for ${sym}`),
      ]);
      return `=== ${sym} ===\n${fund}\n\n${analyst}`;
    })
  );

  const focusMap: Record<string, string> = {
    comprehensive: 'full institutional research briefing',
    valuation:     'deep-dive on valuation multiples and DCF assumptions',
    growth:        'revenue growth drivers, TAM expansion, and competitive wins',
    competitive:   'competitive moat analysis, market share, and barriers to entry',
    catalyst:      'near-term catalysts, upcoming events, and sentiment triggers',
  };

  const userMessage = `
Generate an institutional research briefing for: ${syms.join(', ')}

Research focus: ${focusMap[params.focus ?? 'comprehensive']}
Investment horizon: ${params.timeHorizon ?? 'medium'} term
${params.customQuery ? `Special focus: ${params.customQuery}` : ''}
${params.includeComps !== false ? 'Include peer comparison table.' : 'Skip comparison table.'}

Market data and fundamentals:
${contexts.join('\n\n')}

Produce a comprehensive research briefing for each company, then a side-by-side comparison.
`;

  return callClaude(RESEARCH_SYSTEM_PROMPT, userMessage, onChunk);
}

// ─── Model Builder Agent ──────────────────────────────────────────────────────

const MODEL_SYSTEM_PROMPT = `You are a financial modeling analyst at an investment bank.
Build a rigorous investment model with DCF valuation and scenario analysis.

Structure your output exactly as:

## FINANCIAL MODEL — [TICKER]
*[Company] | [Date] | Educational Analysis Only*

### COMPANY SNAPSHOT
[Key financials table: Revenue, EBITDA, Net Income, FCF, Net Debt — 3 years]

### KEY ASSUMPTIONS
[User-provided assumptions with your analysis of their reasonableness]

### VALUATION — BASE CASE (DCF)
- Revenue projections (5 years)
- EBITDA margin trajectory
- WACC: XX% (risk-free rate: XX% + equity risk premium: XX% × beta: X.X)
- Terminal value: XX × EBITDA or XX% perpetuity growth
- Enterprise value: $XXB
- Equity value per share: $XX
- vs. Current price: $XX (upside/downside: XX%)

### SCENARIO ANALYSIS

**BULL CASE** (probability: XX%)
- Key assumptions: [what has to go right]
- Implied price: $XX | Return: +XX%

**BASE CASE** (probability: XX%)
- Key assumptions: [base scenario]
- Implied price: $XX | Return: +XX%

**BEAR CASE** (probability: XX%)
- Key assumptions: [downside risks]
- Implied price: $XX | Return: -XX%

### PROBABILITY-WEIGHTED VALUE: $XX (XX% from current)

### KEY RISKS TO THE MODEL
[List material assumptions that could be wrong]

### MODEL LIMITATIONS
[Honest assessment of what this model cannot capture]

Educational analysis only. Not financial advice. All projections are estimates.`;

export interface ModelBuilderParams {
  symbol: string;
  investmentAmount: number;
  entryPrice: number;
  timeHorizon: number;
  assumptions: {
    revenueGrowth: number;
    ebitdaMargin: number;
    discountRate: number;
    terminalGrowth: number;
    exitMultiple: number;
  };
}

export interface ModelScenario {
  label: 'Bull' | 'Base' | 'Bear';
  probability: number;
  impliedPrice: number;
  expectedReturn: number;
  keyAssumptions: string[];
  riskNotes: string;
}

export async function runModelBuilder(
  params: ModelBuilderParams,
  onChunk?: (text: string) => void
): Promise<{ narrative: string; scenarios: ModelScenario[] }> {
  const sym = params.symbol.toUpperCase();
  const fundamentalsData = await buildFundamentalsContext(sym).catch(() => 'Fundamentals unavailable');

  const userMessage = `
Build a financial model for ${sym}.

INVESTMENT PARAMETERS:
- Investment amount: $${params.investmentAmount.toLocaleString()}
- Entry price: $${params.entryPrice}
- Time horizon: ${params.timeHorizon} years

USER ASSUMPTIONS:
- Revenue growth (CAGR): ${params.assumptions.revenueGrowth}%
- EBITDA margin target: ${params.assumptions.ebitdaMargin}%
- Discount rate (WACC): ${params.assumptions.discountRate}%
- Terminal growth rate: ${params.assumptions.terminalGrowth}%
- Exit multiple (EV/EBITDA): ${params.assumptions.exitMultiple}x

COMPANY FUNDAMENTALS:
${fundamentalsData}

Build the DCF model, evaluate the assumptions' reasonableness, and produce Bull/Base/Bear scenarios.
`;

  const narrative = await callClaude(MODEL_SYSTEM_PROMPT, userMessage, onChunk);

  const base = params.entryPrice;
  const g = params.assumptions.revenueGrowth;
  const t = params.timeHorizon;

  const scenarios: ModelScenario[] = [
    {
      label: 'Bull',
      probability: 0.25,
      impliedPrice: parseFloat((base * (1 + (g / 100) * t * 1.3)).toFixed(2)),
      expectedReturn: parseFloat((g * t * 1.3).toFixed(1)),
      keyAssumptions: [
        `Revenue grows at ${(g * 1.3).toFixed(1)}% CAGR`,
        `EBITDA margin expands to ${(params.assumptions.ebitdaMargin + 3).toFixed(1)}%`,
        `Exit multiple re-rates to ${(params.assumptions.exitMultiple * 1.15).toFixed(1)}x`,
      ],
      riskNotes: 'Requires execution on all fronts — highest upside, most optimistic scenario.',
    },
    {
      label: 'Base',
      probability: 0.50,
      impliedPrice: parseFloat((base * (1 + (g / 100) * t)).toFixed(2)),
      expectedReturn: parseFloat((g * t).toFixed(1)),
      keyAssumptions: [
        `Revenue grows at ${g}% CAGR as assumed`,
        `EBITDA margins reach ${params.assumptions.ebitdaMargin}%`,
        `Exit at ${params.assumptions.exitMultiple}x EV/EBITDA`,
      ],
      riskNotes: 'Assumes user-provided inputs are achievable and macro stays stable.',
    },
    {
      label: 'Bear',
      probability: 0.25,
      impliedPrice: parseFloat((base * (1 + (g / 100) * t * 0.4)).toFixed(2)),
      expectedReturn: parseFloat((g * t * 0.4).toFixed(1)),
      keyAssumptions: [
        `Revenue growth disappoints at ${(g * 0.4).toFixed(1)}% CAGR`,
        `Margin compression vs. targets`,
        `Multiple contracts to ${(params.assumptions.exitMultiple * 0.8).toFixed(1)}x`,
      ],
      riskNotes: 'Material negative surprise to consensus — competition or macro headwinds.',
    },
  ];

  return { narrative, scenarios };
}

// ─── Mock response fallback ───────────────────────────────────────────────────

function getMockResponse(systemPrompt: string, userMessage: string): string {
  if (systemPrompt.includes('Earnings')) return mockEarningsAnalysis(userMessage);
  if (systemPrompt.includes('research briefing')) return mockResearchBriefing(userMessage);
  if (systemPrompt.includes('financial model')) return mockModelAnalysis(userMessage);
  return 'Analysis complete. Add your VITE_ANTHROPIC_API_KEY in .env.local for live AI analysis.';
}

function mockEarningsAnalysis(msg: string): string {
  const ticker = msg.match(/for ([A-Z]{2,5})/)?.[1] ?? msg.match(/\b[A-Z]{2,5}\b/)?.[0] ?? 'this company';
  return `**EARNINGS REVIEW — ${ticker}**
*Post-Earnings Analysis | Educational Only*

## THESIS STATUS: INTACT

## EXECUTIVE SUMMARY
The quarter delivered results broadly consistent with the long-term investment thesis. Revenue came in ahead of consensus estimates while margin trajectory continues its upward trend. Management commentary was constructive on the key secular drivers that underpin the original thesis, with no material degradation in competitive positioning.

## WHAT SUPPORTS THE THESIS
• **Revenue execution**: Top-line growth came in ahead of street estimates, reflecting continued pricing power and market share gains
• **Margin expansion**: Gross margin improved sequentially, validating the operating leverage thesis
• **Balance sheet strength**: Net cash position is growing, enabling continued capital return programs
• **Secular tailwinds intact**: Management reaffirmed the long-term market opportunity, citing structural demand drivers
• **Customer metrics**: Key engagement/retention metrics held firm, suggesting low churn risk

## WHAT WEAKENS THE THESIS
• **Guidance conservatism**: Forward guidance was set below current consensus — worth monitoring
• **Competitive pressure signals**: Management mentioned intensifying competition in one key segment
• **Macro sensitivity**: The business is not fully immune to consumer spending slowdowns

## KEY METRICS REVIEW
| Metric | Result | vs. Estimate | Signal |
|--------|--------|-------------|--------|
| Revenue | $X.XB | Beat +1.8% | ✅ Positive |
| EPS | $X.XX | Beat +8.3% | ✅ Positive |
| Gross Margin | XX.X% | In-line | ➡ Neutral |
| FCF Margin | XX.X% | Beat | ✅ Positive |
| Guidance | $X.XB | Below consensus | ⚠ Watch |

## GUIDANCE & MANAGEMENT COMMENTARY
Management struck a constructive tone while remaining appropriately cautious about the macro environment. The raised full-year guidance implies continued operational discipline. CEO commentary emphasized long-term investment in AI capabilities as a competitive differentiator.

## WHAT TO MONITOR NEXT
1. **Next quarter margins**: Is the gross margin expansion sustainable?
2. **Competition response**: Watch for customer win/loss announcements in the core segment
3. **Capex trajectory**: Capital allocation decisions indicate management confidence
4. **Macro sensitivity**: If consumer spending weakens, how much revenue risk exists?

## RISK FLAGS
• Valuation leaves limited margin of safety at current levels
• Any miss on forward guidance could trigger meaningful de-rating
• Regulatory and geopolitical exposure not fully priced in

---
*Educational analysis only. Not financial advice. Verify all data independently before making investment decisions.*`;
}

function mockResearchBriefing(msg: string): string {
  const tickers = (msg.match(/\b[A-Z]{2,5}\b/g) ?? ['AAPL', 'MSFT']).slice(0, 5);
  const companies: Record<string, string> = { AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', NVDA: 'NVIDIA Corp.', META: 'Meta Platforms', GOOGL: 'Alphabet Inc.', TSLA: 'Tesla Inc.', AMZN: 'Amazon.com Inc.' };
  const sectors: Record<string, string> = { AAPL: 'Technology', MSFT: 'Technology', NVDA: 'Semiconductors', META: 'Communication', GOOGL: 'Communication', TSLA: 'Consumer Discretionary', AMZN: 'Consumer Discretionary/Cloud' };

  const briefs = tickers.map(t => `
**${t} — ${companies[t] ?? t}**
*${sectors[t] ?? 'Technology'} | Synthetic analyst-style summary based on available data*

**BUSINESS OVERVIEW**
A leading company in its sector with durable competitive advantages including brand equity, network effects, and switching costs. Has demonstrated consistent ability to grow revenue while maintaining or expanding margins over multiple market cycles.

**INVESTMENT CASE**
- **Bull**: AI monetization + market expansion drives 15%+ revenue CAGR; margin expansion creates significant operating leverage; capital return program accelerates
- **Bear**: Macro slowdown compresses multiples; competitive disruption; regulatory overhang limits flexibility

**VALUATION SNAPSHOT**
- Forward P/E in-line to slight premium vs. sector; justified by above-average growth and margin profile
- FCF yield: ~3–4% — healthy for growth compounder
- EV/EBITDA: ~20–25x — reflects quality premium

**ANALYST SENTIMENT**: *Synthetic summary — not real analyst consensus*
Broadly constructive — strong buy / buy skew in available coverage.

**BULLISH SIGNALS**
• Consistent earnings beats over trailing 8 quarters
• Accelerating cloud/AI revenue with high incremental margins
• Strong free cash flow generation enabling buybacks at scale

**BEARISH SIGNALS**
• Rich absolute valuation limits multiple expansion upside
• Exposure to macro cyclicality in certain segments
• Regulatory risk remains an unquantified tail risk

**CATALYSTS TO WATCH**
• Next earnings call for AI monetization data points
• Product launch announcements and developer ecosystem updates

**ANALYST DESK FEELING**
*Synthetic: This name sits in the "quality compounder" category — requires patience over 3–5 years. Valuation is not cheap, but business quality and capital allocation optionality make it defensible for long-duration investors.*

---`).join('\n');

  return `# INSTITUTIONAL RESEARCH BRIEFING
*${tickers.join(' | ')} | Synthetic Analyst-Style Summary | Educational Only*

${briefs}

## COMPARATIVE ANALYSIS

| Ticker | Sentiment | Valuation | Growth | Profitability | Risk Level | Key Catalyst |
|--------|-----------|-----------|--------|---------------|------------|--------------|
${tickers.map(t => `| ${t} | Constructive | In-line | High | Strong | Medium | AI monetization |`).join('\n')}

---
*Synthetic analyst-style summary based on publicly available data. No specific buy/sell recommendations. Educational analysis only. Not financial advice.*`;
}

function mockModelAnalysis(msg: string): string {
  const ticker = msg.match(/for ([A-Z]{2,5})\./)?.[1] ?? 'this company';
  const growth = parseFloat(msg.match(/Revenue growth.*?(\d+\.?\d*)%/)?.[1] ?? '12');
  const margin = parseFloat(msg.match(/EBITDA margin.*?(\d+\.?\d*)%/)?.[1] ?? '25');
  const wacc   = parseFloat(msg.match(/Discount rate.*?(\d+\.?\d*)%/)?.[1] ?? '10');
  const tg     = parseFloat(msg.match(/Terminal growth.*?(\d+\.?\d*)%/)?.[1] ?? '3');
  const mult   = parseFloat(msg.match(/Exit multiple.*?(\d+\.?\d*)x/)?.[1] ?? '20');

  return `## FINANCIAL MODEL — ${ticker}
*Illustrative DCF Model | Educational Analysis Only | All figures estimated*

---

### COMPANY SNAPSHOT (Last 3 Years)
| Metric | FY2022 | FY2023 | FY2024 |
|--------|--------|--------|--------|
| Revenue | — | — | See fundamentals |
| EBITDA Margin | — | — | See fundamentals |
| FCF | — | — | See fundamentals |

---

### KEY ASSUMPTIONS ASSESSMENT

| Assumption | Input | Assessment |
|------------|-------|------------|
| Revenue CAGR | ${growth}% | ${growth > 20 ? '⚠ Aggressive — top-quartile only' : growth > 10 ? '✅ Reasonable for sector leader' : '✅ Conservative floor'} |
| EBITDA Margin | ${margin}% | ${margin > 40 ? '⚠ Very high — requires significant scale' : '✅ Within historical range'} |
| WACC | ${wacc}% | ${wacc < 8 ? '⚠ Low — consider 9–11% range' : wacc > 14 ? '⚠ High — may be too punitive' : '✅ Reasonable range'} |
| Terminal Growth | ${tg}% | ${tg > 5 ? '⚠ Exceeds long-run GDP — unlikely to persist' : '✅ Reasonable'} |
| Exit Multiple | ${mult}x | Sector benchmark: 18–28x EV/EBITDA |

---

### VALUATION — BASE CASE (DCF)

**Revenue Projections (5-Year)**
| Year | Growth | EBITDA Margin | FCF Margin |
|------|--------|---------------|------------|
| Y1 | ${growth.toFixed(1)}% | ${margin.toFixed(1)}% | ~${(margin * 0.70).toFixed(0)}% |
| Y2 | ${growth.toFixed(1)}% | ${(margin+0.5).toFixed(1)}% | ~${(margin*0.72).toFixed(0)}% |
| Y3 | ${(growth*0.9).toFixed(1)}% | ${(margin+1.0).toFixed(1)}% | ~${(margin*0.74).toFixed(0)}% |
| Y4 | ${(growth*0.85).toFixed(1)}% | ${(margin+1.5).toFixed(1)}% | ~${(margin*0.76).toFixed(0)}% |
| Y5 | ${(growth*0.8).toFixed(1)}% | ${(margin+2.0).toFixed(1)}% | ~${(margin*0.78).toFixed(0)}% |

**WACC**: ${wacc}% | Risk-free: 4.5% | ERP: 5.5% | Beta: ${((wacc-4.5)/5.5).toFixed(2)}x implied
**Terminal**: ${tg}% perpetuity growth / ${mult}x exit multiple cross-check

---

### SCENARIO ANALYSIS

#### 🐂 BULL CASE (25% probability)
Revenue growth at ${(growth*1.3).toFixed(1)}% CAGR; margin expands to ${(margin+3).toFixed(1)}%; multiple expands to ${(mult*1.15).toFixed(1)}x.
- **Key requirements**: AI monetization accelerates, international expansion beats, no regulatory headwinds

#### ⚖️ BASE CASE (50% probability)
Revenue grows at ${growth}% CAGR; margins at ${margin}%; exit at ${mult}x.
- **Key requirements**: Consistent execution, stable competitive environment

#### 🐻 BEAR CASE (25% probability)
Revenue disappoints at ${(growth*0.4).toFixed(1)}% CAGR; margin pressure; multiple contracts to ${(mult*0.8).toFixed(1)}x.
- **Key requirements**: Macro slowdown, competitive disruption, or margin disappointment

### PROBABILITY-WEIGHTED VALUE
Expected value = (Bull × 25%) + (Base × 50%) + (Bear × 25%)

---

### KEY RISKS TO THE MODEL
1. **Revenue assumptions**: ${growth}%+ CAGR assumes continued market share gains
2. **Margin trajectory**: ${margin}% EBITDA margin is a key value driver
3. **Multiple sensitivity**: A 5x change in exit multiple moves equity value by ~20–30%
4. **Macro/rates**: Rising rates increase WACC, compressing present values

### MODEL LIMITATIONS
This model uses simplified assumptions and cannot capture management quality evolution, competitive moat erosion, regulatory changes, M&A, or black swan events.

---
*Educational analysis only. Not financial advice. All projections are illustrative estimates, not predictions. Verify all data independently.*`;
}
