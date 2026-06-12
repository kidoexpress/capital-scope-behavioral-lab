import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import StockAnalyzer from './pages/StockAnalyzer';
import PortfolioBuilder from './pages/PortfolioBuilder';
import RiskDashboard from './pages/RiskDashboard';
import MonteCarloLab from './pages/MonteCarloLab';
import ScenarioSimulator from './pages/ScenarioSimulator';
import Watchlist from './pages/Watchlist';
import EarningsReviewer from './pages/agents/EarningsReviewer';
import MarketResearchAgent from './pages/agents/MarketResearchAgent';
import ModelBuilder from './pages/agents/ModelBuilder';
import TerminalPage from './pages/Terminal';
import StockResearch from './pages/StockResearch';
import GoldMiningScanner from './pages/GoldMiningScanner';
import PaperTrading from './pages/PaperTrading';
import TradeJournal from './pages/TradeJournal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing is standalone — no sidebar, no topbar */}
        <Route path="/" element={<Landing />} />

        {/* All app routes live inside the Layout shell */}
        <Route element={<Layout />}>
          {/* Core modules */}
          <Route path="analyzer"   element={<StockAnalyzer />} />
          <Route path="portfolio"  element={<PortfolioBuilder />} />
          <Route path="risk"       element={<RiskDashboard />} />
          <Route path="montecarlo" element={<MonteCarloLab />} />
          <Route path="scenarios"  element={<ScenarioSimulator />} />
          <Route path="watchlist"  element={<Watchlist />} />
          <Route path="paper-trading" element={<PaperTrading />} />
          <Route path="journal"    element={<TradeJournal />} />
          {/* AI Agents */}
          <Route path="agents/earnings" element={<EarningsReviewer />} />
          <Route path="agents/research" element={<MarketResearchAgent />} />
          <Route path="agents/model"    element={<ModelBuilder />} />
          {/* Research modules */}
          <Route path="research" element={<StockResearch />} />
          <Route path="scanner"  element={<GoldMiningScanner />} />
          {/* Terminal */}
          <Route path="terminal" element={<TerminalPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
