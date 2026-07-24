// ============================================================
// Excel Export Utility — Investment Banking Style Models
// Uses SheetJS (xlsx) to generate proper .xlsx files
// ============================================================

import * as XLSX from 'xlsx';
import type { CompanyFundamentals } from '../data/financialData';
import type { ModelScenario } from '../services/claudeService';

// ─── Color palette (used as named styles) ────────────────────────────────────
// IB convention: blue = input, black = formula, green = output

function createWorkbook(): XLSX.WorkBook {
  return XLSX.utils.book_new();
}

function addSheet(wb: XLSX.WorkBook, name: string, data: unknown[][]): void {
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmt$(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string { return `${n.toFixed(1)}%`; }
function fmtX(n: number): string { return `${n.toFixed(1)}x`; }

// ─── Summary Sheet ────────────────────────────────────────────────────────────

function buildSummarySheet(
  company: CompanyFundamentals,
  investmentAmount: number,
  entryPrice: number,
  timeHorizon: number,
  scenarios: ModelScenario[]
): unknown[][] {
  const rows: unknown[][] = [];
  rows.push(['CAPITAL SCOPE BEHAVIORAL LAB', '', '', '', '']);
  rows.push([`Investment Model — ${company.symbol}`, '', '', '', '']);
  rows.push([`${company.name}`, '', '', '', '']);
  rows.push([`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, '', '', '', '']);
  rows.push(['FOR EDUCATIONAL PURPOSES ONLY — NOT FINANCIAL ADVICE', '', '', '', '']);
  rows.push(['']);
  rows.push(['COMPANY OVERVIEW', '', '', '', '']);
  rows.push(['Sector', company.sector, '', '', '']);
  rows.push(['Industry', company.industry, '', '', '']);
  rows.push(['CEO', company.ceo, '', '', '']);
  rows.push(['Employees', company.employees.toLocaleString(), '', '', '']);
  rows.push(['Headquarters', company.headquarters, '', '', '']);
  rows.push(['']);
  rows.push(['INVESTMENT PARAMETERS', '', '', '', '']);
  rows.push(['Investment Amount', fmt$(investmentAmount), '', '', '']);
  rows.push(['Entry Price', fmt$(entryPrice), '', '', '']);
  rows.push(['Shares (implied)', (investmentAmount / entryPrice).toFixed(0), '', '', '']);
  rows.push(['Time Horizon', `${timeHorizon} years`, '', '', '']);
  rows.push(['']);
  rows.push(['SCENARIO SUMMARY', '', '', '', '']);
  rows.push(['Scenario', 'Probability', 'Implied Price', 'Expected Return', 'ROI on Investment']);
  scenarios.forEach(s => {
    const shares = investmentAmount / entryPrice;
    const terminalValue = shares * s.impliedPrice;
    const roi = ((terminalValue - investmentAmount) / investmentAmount) * 100;
    rows.push([
      `${s.label} Case`,
      fmtPct(s.probability * 100),
      fmt$(s.impliedPrice),
      fmtPct(s.expectedReturn),
      fmtPct(roi),
    ]);
  });
  rows.push(['']);
  const weighted = scenarios.reduce((sum, s) => sum + s.probability * s.impliedPrice, 0);
  rows.push(['Probability-Weighted Price', fmt$(weighted), '', '', '']);
  rows.push(['vs. Entry Price', fmtPct(((weighted - entryPrice) / entryPrice) * 100), '', '', '']);
  return rows;
}

// ─── Historical Financials Sheet ──────────────────────────────────────────────

function buildFinancialsSheet(company: CompanyFundamentals): unknown[][] {
  const rows: unknown[][] = [];
  rows.push([`${company.symbol} — Historical Financial Summary`, '', '', '', '', '']);
  rows.push(['Source: Company filings | All figures in $M unless noted', '', '', '', '', '']);
  rows.push(['']);

  const years = company.incomeStatements.map(s => s.year);
  rows.push(['INCOME STATEMENT', ...years]);
  rows.push(['Revenue ($M)', ...company.incomeStatements.map(s => (s.revenue / 1e6).toFixed(0))]);
  rows.push(['Revenue Growth', ...company.incomeStatements.map(s => fmtPct(s.revenueGrowth))]);
  rows.push(['Gross Profit ($M)', ...company.incomeStatements.map(s => (s.grossProfit / 1e6).toFixed(0))]);
  rows.push(['Gross Margin', ...company.incomeStatements.map(s => fmtPct(s.grossMargin))]);
  rows.push(['EBITDA ($M)', ...company.incomeStatements.map(s => (s.ebitda / 1e6).toFixed(0))]);
  rows.push(['EBITDA Margin', ...company.incomeStatements.map(s => fmtPct(s.ebitdaMargin))]);
  rows.push(['Operating Income ($M)', ...company.incomeStatements.map(s => (s.operatingIncome / 1e6).toFixed(0))]);
  rows.push(['Operating Margin', ...company.incomeStatements.map(s => fmtPct(s.operatingMargin))]);
  rows.push(['Net Income ($M)', ...company.incomeStatements.map(s => (s.netIncome / 1e6).toFixed(0))]);
  rows.push(['Net Margin', ...company.incomeStatements.map(s => fmtPct(s.netMargin))]);
  rows.push(['EPS', ...company.incomeStatements.map(s => `$${s.eps.toFixed(2)}`)]);
  rows.push(['']);

  const bsYears = company.balanceSheets.map(s => s.year);
  rows.push(['BALANCE SHEET HIGHLIGHTS', ...bsYears]);
  rows.push(['Cash & Equivalents ($M)', ...company.balanceSheets.map(s => (s.cash / 1e6).toFixed(0))]);
  rows.push(['Total Debt ($M)', ...company.balanceSheets.map(s => (s.totalDebt / 1e6).toFixed(0))]);
  rows.push(['Net Debt / (Cash) ($M)', ...company.balanceSheets.map(s => (s.netDebt / 1e6).toFixed(0))]);
  rows.push(['Equity ($M)', ...company.balanceSheets.map(s => (s.equity / 1e6).toFixed(0))]);
  rows.push(['D/E Ratio', ...company.balanceSheets.map(s => fmtX(s.debtToEquity))]);
  rows.push(['']);

  const cfYears = company.cashFlows.map(s => s.year);
  rows.push(['CASH FLOW', ...cfYears]);
  rows.push(['Operating CF ($M)', ...company.cashFlows.map(s => (s.operatingCF / 1e6).toFixed(0))]);
  rows.push(['CapEx ($M)', ...company.cashFlows.map(s => (Math.abs(s.capex) / 1e6).toFixed(0))]);
  rows.push(['Free Cash Flow ($M)', ...company.cashFlows.map(s => (s.freeCashFlow / 1e6).toFixed(0))]);
  rows.push(['FCF Margin', ...company.cashFlows.map(s => fmtPct(s.fcfMargin))]);

  return rows;
}

// ─── Assumptions Sheet ────────────────────────────────────────────────────────

function buildAssumptionsSheet(
  assumptions: { revenueGrowth: number; ebitdaMargin: number; discountRate: number; terminalGrowth: number; exitMultiple: number },
  timeHorizon: number
): unknown[][] {
  const rows: unknown[][] = [];
  rows.push(['MODEL ASSUMPTIONS', '', '']);
  rows.push(['(Blue cells = inputs | These drive the valuation)', '', '']);
  rows.push(['']);
  rows.push(['GROWTH ASSUMPTIONS', '', '']);
  rows.push(['Revenue CAGR (user input)', fmtPct(assumptions.revenueGrowth), 'User-provided']);
  rows.push(['EBITDA Margin Target', fmtPct(assumptions.ebitdaMargin), 'User-provided']);
  rows.push(['Margin Expansion (implied)', fmtPct(assumptions.ebitdaMargin * 0.1), 'Derived']);
  rows.push(['Time Horizon', `${timeHorizon} years`, 'User-provided']);
  rows.push(['']);
  rows.push(['VALUATION ASSUMPTIONS', '', '']);
  rows.push(['Discount Rate (WACC)', fmtPct(assumptions.discountRate), 'User-provided']);
  rows.push(['Terminal Growth Rate', fmtPct(assumptions.terminalGrowth), 'User-provided']);
  rows.push(['Exit Multiple (EV/EBITDA)', fmtX(assumptions.exitMultiple), 'User-provided']);
  rows.push(['']);
  rows.push(['SCENARIO MULTIPLIERS', '', '']);
  rows.push(['Bull Case (vs. base)', '1.3x revenue | +3pp margin | +15% multiple', '']);
  rows.push(['Bear Case (vs. base)', '0.4x revenue | flat margin | -20% multiple', '']);
  rows.push(['']);
  rows.push(['SENSITIVITY NOTE', '', '']);
  rows.push(['A 1% change in WACC moves equity value by ~8-15%', '', '']);
  rows.push(['A 1x change in exit multiple moves value by ~5-10%', '', '']);
  rows.push(['A 1% change in revenue CAGR moves value by ~6-12%', '', '']);
  return rows;
}

// ─── Scenarios Sheet ─────────────────────────────────────────────────────────

function buildScenariosSheet(scenarios: ModelScenario[], entryPrice: number, investmentAmount: number): unknown[][] {
  const shares = investmentAmount / entryPrice;
  const rows: unknown[][] = [];
  rows.push(['ROI SCENARIO ANALYSIS', '', '', '']);
  rows.push(['']);

  scenarios.forEach(s => {
    rows.push([`${s.label.toUpperCase()} CASE`, '', '', '']);
    rows.push(['Probability', fmtPct(s.probability * 100), '', '']);
    rows.push(['Implied Price', fmt$(s.impliedPrice), '', '']);
    rows.push(['Expected Return', fmtPct(s.expectedReturn), '', '']);
    rows.push(['Investment Value (terminal)', fmt$(shares * s.impliedPrice), '', '']);
    rows.push(['Gain / Loss', fmt$(shares * s.impliedPrice - investmentAmount), '', '']);
    rows.push(['ROI', fmtPct(((shares * s.impliedPrice - investmentAmount) / investmentAmount) * 100), '', '']);
    rows.push(['Key Assumptions', s.keyAssumptions.join('; '), '', '']);
    rows.push(['Risk Notes', s.riskNotes, '', '']);
    rows.push(['']);
  });

  const pwp = scenarios.reduce((sum, s) => sum + s.probability * s.impliedPrice, 0);
  rows.push(['PROBABILITY-WEIGHTED ANALYSIS', '', '', '']);
  rows.push(['Prob.-Weighted Price', fmt$(pwp), '', '']);
  rows.push(['Prob.-Weighted Return', fmtPct(((pwp - entryPrice) / entryPrice) * 100), '', '']);
  rows.push(['Prob.-Weighted Terminal Value', fmt$(shares * pwp), '', '']);
  rows.push(['Expected P&L', fmt$(shares * pwp - investmentAmount), '', '']);
  rows.push(['']);
  rows.push(['DISCLAIMER', '', '', '']);
  rows.push(['All projections are illustrative estimates, not predictions.', '', '', '']);
  rows.push(['Educational analysis only. Not financial advice.', '', '', '']);
  rows.push(['Verify all data independently before making investment decisions.', '', '', '']);

  return rows;
}

// ─── Main export function ─────────────────────────────────────────────────────

export function exportModelToExcel(
  company: CompanyFundamentals,
  investmentAmount: number,
  entryPrice: number,
  timeHorizon: number,
  assumptions: { revenueGrowth: number; ebitdaMargin: number; discountRate: number; terminalGrowth: number; exitMultiple: number },
  scenarios: ModelScenario[]
): void {
  const wb = createWorkbook();

  addSheet(wb, 'Summary', buildSummarySheet(company, investmentAmount, entryPrice, timeHorizon, scenarios));
  addSheet(wb, 'Assumptions', buildAssumptionsSheet(assumptions, timeHorizon));
  addSheet(wb, 'Historical Financials', buildFinancialsSheet(company));
  addSheet(wb, 'ROI Scenarios', buildScenariosSheet(scenarios, entryPrice, investmentAmount));

  const filename = `${company.symbol}_CapitalScopeBehavioralLab_Model_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// ─── CSV export (lightweight fallback) ───────────────────────────────────────

export function exportModelToCSV(
  company: CompanyFundamentals,
  scenarios: ModelScenario[],
  entryPrice: number,
  investmentAmount: number
): void {
  const shares = investmentAmount / entryPrice;
  const rows = [
    ['Capital Scope Behavioral Lab — Investment Model'],
    [`${company.name} (${company.symbol})`],
    ['Educational Analysis Only — Not Financial Advice'],
    [''],
    ['Scenario', 'Probability', 'Implied Price', 'Expected Return (%)', 'Terminal Value', 'P&L', 'ROI (%)'],
    ...scenarios.map(s => [
      `${s.label} Case`,
      fmtPct(s.probability * 100),
      fmt$(s.impliedPrice),
      fmtPct(s.expectedReturn),
      fmt$(shares * s.impliedPrice),
      fmt$(shares * s.impliedPrice - investmentAmount),
      fmtPct(((shares * s.impliedPrice - investmentAmount) / investmentAmount) * 100),
    ]),
  ];

  const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${company.symbol}_scenarios_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
