import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { LoadingSkeleton } from './components/ui/product';
import Landing from './pages/Landing';

const StockAnalyzer = lazy(() => import('./pages/StockAnalyzer'));
const PortfolioBuilder = lazy(() => import('./pages/PortfolioBuilder'));
const RiskDashboard = lazy(() => import('./pages/RiskDashboard'));
const MonteCarloLab = lazy(() => import('./pages/MonteCarloLab'));
const ScenarioSimulator = lazy(() => import('./pages/ScenarioSimulator'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const EarningsReviewer = lazy(() => import('./pages/agents/EarningsReviewer'));
const MarketResearchAgent = lazy(() => import('./pages/agents/MarketResearchAgent'));
const ModelBuilder = lazy(() => import('./pages/agents/ModelBuilder'));
const TerminalPage = lazy(() => import('./pages/Terminal'));
const StockResearch = lazy(() => import('./pages/StockResearch'));
const GoldMiningScanner = lazy(() => import('./pages/GoldMiningScanner'));
const PaperTrading = lazy(() => import('./pages/PaperTrading'));
const SyntheticPortfolioLab = lazy(() => import('./pages/SyntheticPortfolioLab'));
const SyntheticLab = lazy(() => import('./pages/SyntheticLab'));
const Rebalance = lazy(() => import('./pages/Rebalance'));
const PublicPortfolios = lazy(() => import('./pages/PublicPortfolios'));

function RouteFallback() {
  return (
    <div className="route-loading-shell">
      <LoadingSkeleton lines={5} />
    </div>
  );
}

function page(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing is standalone — no sidebar, no topbar */}
        <Route path="/" element={<Landing />} />

        {/* All app routes live inside the Layout shell */}
        <Route element={<Layout />}>
          {/* Core modules */}
          <Route path="analyzer"   element={page(<StockAnalyzer />)} />
          <Route path="portfolio"  element={page(<PortfolioBuilder />)} />
          <Route path="risk"       element={page(<RiskDashboard />)} />
          <Route path="montecarlo" element={page(<MonteCarloLab />)} />
          <Route path="scenarios"  element={page(<ScenarioSimulator />)} />
          <Route path="watchlist"  element={page(<Watchlist />)} />
          <Route path="paper-trading" element={page(<PaperTrading />)} />
          <Route path="public-portfolios" element={page(<PublicPortfolios />)} />
          {/* New guided Financial Twin flow */}
          <Route path="synthetic-lab" element={page(<SyntheticLab />)} />
          <Route path="synthetic-lab/:step" element={page(<SyntheticLab />)} />
          {/* Compares real holdings (Portfolio) against the Financial Twin's target allocation */}
          <Route path="rebalance" element={page(<Rebalance />)} />
          {/* Legacy single-page lab kept reachable until the new flow reaches parity */}
          <Route path="synthetic-portfolio-lab" element={page(<SyntheticPortfolioLab />)} />
          {/* AI Agents */}
          <Route path="agents/earnings" element={page(<EarningsReviewer />)} />
          <Route path="agents/research" element={page(<MarketResearchAgent />)} />
          <Route path="agents/model"    element={page(<ModelBuilder />)} />
          {/* Research modules */}
          <Route path="research" element={page(<StockResearch />)} />
          <Route path="scanner"  element={page(<GoldMiningScanner />)} />
          {/* Terminal */}
          <Route path="terminal" element={page(<TerminalPage />)} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
