import { create } from 'zustand';
import { Asset, TickerData, Order, NewsItem } from '../types';

export interface NewsAnalysis {
  summary: string;
  sentimentPercent: number;
  sentimentLabel: "BULLISH" | "BEARISH" | "NEUTRAL";
  flashes: string[];
}

interface MarketState {
  // Global config
  lang: "zh" | "en";
  setLang: (lang: "zh" | "en") => void;
  theme: "midnight" | "milk";
  setTheme: (theme: "midnight" | "milk") => void;
  currency: "TWD" | "USD";
  setCurrency: (cur: "TWD" | "USD") => void;
  
  // Navigation
  activeTab: "trading" | "ledger" | "settings";
  setActiveTab: (tab: "trading" | "ledger" | "settings") => void;

  // Market Data
  assets: Asset[];
  setAssets: (assets: Asset[] | ((prev: Asset[]) => Asset[])) => void;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  wsStatus: "connected" | "disconnected" | "connecting";
  setWsStatus: (status: "connected" | "disconnected" | "connecting") => void;
  
  // Ticker Details
  tickerDetails: TickerData | null;
  setTickerDetails: (details: TickerData | null | ((prev: TickerData | null) => TickerData | null)) => void;
  
  // User Data
  watchlist: string[];
  setWatchlist: (watchlist: string[]) => void;
  toggleWatchlist: (symbol: string) => void;
  userOrders: Order[];
  setUserOrders: (orders: Order[]) => void;

  // UI State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showOnlyWatchlist: boolean;
  toggleShowOnlyWatchlist: () => void;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  
  // AI News
  marketNews: NewsItem[];
  setMarketNews: (news: NewsItem[]) => void;
  newsAnalysis: NewsAnalysis | null;
  setNewsAnalysis: (analysis: NewsAnalysis | null) => void;
  newsLoading: boolean;
  setNewsLoading: (loading: boolean) => void;
}

export const useStore = create<MarketState>((set) => ({
  lang: "zh",
  setLang: (lang) => set({ lang }),
  theme: "midnight",
  setTheme: (theme) => set({ theme }),
  currency: "TWD",
  setCurrency: (currency) => set({ currency }),
  
  activeTab: "trading",
  setActiveTab: (activeTab) => set({ activeTab }),

  assets: [],
  setAssets: (assets) => set((state) => ({ assets: typeof assets === 'function' ? assets(state.assets) : assets })),
  
  selectedSymbol: "BTC",
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  
  timeframe: "1m",
  setTimeframe: (timeframe) => set({ timeframe }),

  wsStatus: "disconnected",
  setWsStatus: (wsStatus) => set({ wsStatus }),

  tickerDetails: null,
  setTickerDetails: (tickerDetails) => set((state) => ({ tickerDetails: typeof tickerDetails === 'function' ? tickerDetails(state.tickerDetails) : tickerDetails })),
  
  watchlist: [],
  setWatchlist: (watchlist) => set({ watchlist }),
  toggleWatchlist: (symbol) => set((state) => ({
    watchlist: state.watchlist.includes(symbol)
      ? state.watchlist.filter(s => s !== symbol)
      : [...state.watchlist, symbol]
  })),
  userOrders: [],
  setUserOrders: (userOrders) => set({ userOrders }),

  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  showOnlyWatchlist: false,
  toggleShowOnlyWatchlist: () => set(state => ({ showOnlyWatchlist: !state.showOnlyWatchlist })),
  showLoginPrompt: false,
  setShowLoginPrompt: (show) => set({ showLoginPrompt: show }),

  marketNews: [],
  setMarketNews: (marketNews) => set({ marketNews }),
  newsAnalysis: null,
  setNewsAnalysis: (newsAnalysis) => set({ newsAnalysis }),
  newsLoading: false,
  setNewsLoading: (newsLoading) => set({ newsLoading }),
}));
