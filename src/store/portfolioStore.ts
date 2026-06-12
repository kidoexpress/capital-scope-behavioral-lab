import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioHolding } from '../types';
import { DEFAULT_WATCHLIST } from '../data/mockStocks';

interface PortfolioState {
  holdings: PortfolioHolding[];
  watchlist: string[];
  addHolding: (holding: Omit<PortfolioHolding, 'value' | 'gainLoss' | 'gainLossPercent'>) => void;
  removeHolding: (symbol: string) => void;
  updateHoldingPrice: (symbol: string, price: number) => void;
  updateWeight: (symbol: string, weight: number) => void;
  normalizeWeights: () => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  clearPortfolio: () => void;
  activeMarketId: string;
  setActiveMarket: (id: string) => void;
}

const DEFAULT_HOLDINGS: PortfolioHolding[] = [];

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: DEFAULT_HOLDINGS,
      watchlist: DEFAULT_WATCHLIST,
      activeMarketId: 'US',

      addHolding: (holding) => {
        const h = get().holdings;
        const exists = h.find(x => x.symbol === holding.symbol);
        if (exists) {
          set({ holdings: h.map(x => x.symbol === holding.symbol ? { ...x, ...holding, value: holding.shares * holding.currentPrice, gainLoss: (holding.currentPrice - holding.avgCost) * holding.shares, gainLossPercent: ((holding.currentPrice - holding.avgCost) / holding.avgCost) * 100 } : x) });
          return;
        }
        const newHolding: PortfolioHolding = {
          ...holding,
          value: holding.shares * holding.currentPrice,
          gainLoss: (holding.currentPrice - holding.avgCost) * holding.shares,
          gainLossPercent: ((holding.currentPrice - holding.avgCost) / holding.avgCost) * 100,
        };
        set({ holdings: [...h, newHolding] });
        get().normalizeWeights();
      },

      removeHolding: (symbol) => {
        set({ holdings: get().holdings.filter(h => h.symbol !== symbol) });
        get().normalizeWeights();
      },

      updateHoldingPrice: (symbol, price) => {
        set({
          holdings: get().holdings.map(h =>
            h.symbol === symbol ? {
              ...h,
              currentPrice: price,
              value: h.shares * price,
              gainLoss: (price - h.avgCost) * h.shares,
              gainLossPercent: ((price - h.avgCost) / h.avgCost) * 100,
            } : h
          )
        });
      },

      updateWeight: (symbol, weight) => {
        set({
          holdings: get().holdings.map(h =>
            h.symbol === symbol ? { ...h, weight } : h
          )
        });
      },

      normalizeWeights: () => {
        const holdings = get().holdings;
        if (holdings.length === 0) return;
        const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);
        if (totalWeight === 0) {
          const eq = 1 / holdings.length;
          set({ holdings: holdings.map(h => ({ ...h, weight: eq })) });
          return;
        }
        set({ holdings: holdings.map(h => ({ ...h, weight: h.weight / totalWeight })) });
      },

      addToWatchlist: (symbol) => {
        if (!get().watchlist.includes(symbol)) {
          set({ watchlist: [...get().watchlist, symbol] });
        }
      },

      removeFromWatchlist: (symbol) => {
        set({ watchlist: get().watchlist.filter(s => s !== symbol) });
      },

      clearPortfolio: () => set({ holdings: [] }),

      setActiveMarket: (id) => set({ activeMarketId: id }),
    }),
    { name: 'capitalscope-portfolio' }
  )
);

/** Computed: total portfolio value */
export function getTotalValue(holdings: PortfolioHolding[]): number {
  return holdings.reduce((s, h) => s + h.value, 0);
}

/** Computed: total gain/loss */
export function getTotalGainLoss(holdings: PortfolioHolding[]): { amount: number; percent: number } {
  const totalCost = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const totalValue = getTotalValue(holdings);
  if (totalCost === 0) return { amount: 0, percent: 0 };
  return {
    amount: totalValue - totalCost,
    percent: ((totalValue - totalCost) / totalCost) * 100,
  };
}
