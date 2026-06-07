import { create } from 'zustand';
import { Asset, TickerData, Order, NewsItem, Candle } from '../types';
import { immer } from 'zustand/middleware/immer';

export interface NewsAnalysis {
  summary: string;
  sentimentPercent: number;
  sentimentLabel: "BULLISH" | "BEARISH" | "NEUTRAL";
  flashes: string[];
}

interface MarketState {
  // App-level state
  token: string | null;
  username: string | null;
  wsStatus: "connected" | "disconnected" | "connecting";
  lang: "zh" | "en";
  theme: "midnight" | "milk";
  currency: "TWD" | "USD";
  activeTab: "trading" | "ledger" | "settings";
  selectedSymbol: string;
  timeframe: string;
  showLoginPrompt: boolean;

  // Market data
  assets: Asset[];
  watchlist: string[];
  tickerDetails: TickerData | null;
  userOrders: Order[];
  marketNews: NewsItem[];
  newsAnalysis: NewsAnalysis | null;
  
  // UI state
  searchQuery: string;
  showOnlyWatchlist: boolean;
  newsLoading: boolean;

  // Actions
  setToken: (token: string | null, username: string | null) => void;
  setWsStatus: (status: MarketState['wsStatus']) => void;
  setLang: (lang: MarketState['lang']) => void;
  setTheme: (theme: MarketState['theme']) => void;
  setCurrency: (currency: MarketState['currency']) => void;
  setActiveTab: (tab: MarketState['activeTab']) => void;
  setSelectedSymbol: (symbol: string) => void;
  setTimeframe: (tf: string) => void;
  setShowLoginPrompt: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleShowOnlyWatchlist: () => void;
  
  // Async Actions (Data Fetching)
  fetchInitialData: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  fetchNews: () => Promise<void>;
  
  // WebSocket Actions
  handleWebSocketMessage: (message: any) => void;
  updateAssetPrice: (symbol: string, price: number, changePercent: number) => void;
  updateTickerHistory: (symbol: string, candles: Candle[]) => void;
  
  // User-specific actions
  toggleWatchlist: (symbol: string) => Promise<void>;
}

export const useStore = create<MarketState>()(
  immer((set, get) => ({
    // ========= App-level state =========
    token: localStorage.getItem("token") || null,
    username: localStorage.getItem("username") || null,
    wsStatus: "disconnected",
    lang: (localStorage.getItem("lang") as MarketState['lang']) || "en",
    theme: (localStorage.getItem("theme") as MarketState['theme']) || "midnight",
    currency: (localStorage.getItem("currency") as MarketState['currency']) || "TWD",
    activeTab: "trading",
    selectedSymbol: "BTC",
    timeframe: "1m",
    showLoginPrompt: false,

    // ========= Market data =========
    assets: [],
    watchlist: [],
    tickerDetails: null,
    userOrders: [],
    marketNews: [],
    newsAnalysis: null,

    // ========= UI state =========
    searchQuery: "",
    showOnlyWatchlist: false,
    newsLoading: false,

    // ========= Actions =========
    setToken: (token, username) => {
      set((state) => {
        state.token = token;
        state.username = username;
      });
      if (token && username) {
        localStorage.setItem("token", token);
        localStorage.setItem("username", username);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
      }
    },
    setWsStatus: (status) => set({ wsStatus: status }),
    setLang: (lang) => {
      set({ lang });
      localStorage.setItem("lang", lang);
    },
    setTheme: (theme) => {
      set({ theme });
      localStorage.setItem("theme", theme);
    },
    setCurrency: (currency) => {
      set({ currency });
      localStorage.setItem("currency", currency);
    },
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
    setTimeframe: (tf) => set({ timeframe: tf }),
    setShowLoginPrompt: (show) => set({ showLoginPrompt: show }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    toggleShowOnlyWatchlist: () => set((state) => ({ showOnlyWatchlist: !state.showOnlyWatchlist })),

    // ========= Async Actions (Data Fetching) =========
    fetchInitialData: async () => {
      try {
        const res = await fetch("/api/assets");
        const data = await res.json();
        if (data.success) {
          set((state) => {
            state.assets = data.assets;
          });
        }
      } catch (err) {
        console.error("Asset loader error:", err);
      }
      // If logged in, fetch user data as well
      if (get().token) {
        get().fetchUserData();
      }
    },

    fetchUserData: async () => {
      const { token } = get();
      if (!token) return;
      try {
        const [watchlistRes, ordersRes] = await Promise.all([
          fetch("/api/watchlist", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const watchlistData = await watchlistRes.json();
        const ordersData = await ordersRes.json();
        set((state) => {
          if (watchlistData.success) state.watchlist = watchlistData.watchlist;
          if (ordersData.success) state.userOrders = ordersData.orders;
        });
      } catch (e) {
        console.error("Failed to fetch user data", e);
      }
    },

    fetchNews: async () => {
      const { selectedSymbol, lang, token } = get();
      if (!selectedSymbol) return;
      set({ newsLoading: true });
      try {
        const url = new URL(`/api/assets/${selectedSymbol}/news`, window.location.origin);
        url.searchParams.append("lang", lang);
        const res = await fetch(url.toString(), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          set((state) => {
            state.marketNews = data.news;
            state.newsAnalysis = data.analysis;
          });
        }
      } catch (err) {
        console.error("News engine failure:", err);
      } finally {
        set({ newsLoading: false });
      }
    },
    
    // ========= WebSocket Actions =========
    handleWebSocketMessage: (msg) => {
      const { selectedSymbol } = get();
      switch (msg.type) {
        case 'TICK':
          get().updateAssetPrice(msg.symbol, msg.price, msg.changePercent);
          if (msg.symbol === selectedSymbol) {
            set(state => {
              if (state.tickerDetails) {
                state.tickerDetails.price = msg.price;
                state.tickerDetails.changePercent = msg.changePercent;
                state.tickerDetails.high = Math.max(state.tickerDetails.high, msg.price);
                state.tickerDetails.low = Math.min(state.tickerDetails.low, msg.price);
              }
            });
          }
          break;
        case 'HISTORY_DATA':
           if (msg.symbol === selectedSymbol) {
             get().updateTickerHistory(msg.symbol, msg.candles);
           }
          break;
        case 'ORDER_EXECUTED':
          // Re-fetch orders to get the latest state
          get().fetchUserData(); 
          break;
        default:
          // console.log("Unhandled WS message type:", msg.type);
      }
    },
    
    updateAssetPrice: (symbol, price, changePercent) => {
       set(state => {
         const asset = state.assets.find(a => a.symbol === symbol);
         if (asset) {
           asset.price = price;
           asset.changePercent = changePercent;
         }
       });
    },

    updateTickerHistory: (symbol, candles) => {
        set(state => {
            const lastCandle = candles[candles.length - 1];
            const firstCandle = candles[0];
            const high = Math.max(...candles.map(c => c.high));
            const low = Math.min(...candles.map(c => c.low));
            const price = lastCandle?.close || 0;
            const open = firstCandle?.open || 0;
            const changeAmount = price - open;
            const changePercent = open !== 0 ? (changeAmount / open) * 100 : 0;

            state.tickerDetails = {
                symbol,
                price,
                open,
                high,
                low,
                close: price,
                volume: candles.reduce((acc, c) => acc + c.volume, 0),
                changeAmount,
                changePercent,
                bidPrice: price * 0.9995,
                askPrice: price * 1.0005,
                bidSize: 100,
                askSize: 100,
                candles,
            };
        });
    },

    // ========= User-specific actions =========
    toggleWatchlist: async (symbol: string) => {
      const { token, watchlist } = get();
      if (!token) {
        set({ showLoginPrompt: true });
        return;
      }
      
      const isWatched = watchlist.includes(symbol);
      // Optimistic update
      set(state => {
          if(isWatched) {
              state.watchlist = state.watchlist.filter(s => s !== symbol);
          } else {
              state.watchlist.push(symbol);
          }
      });
      
      try {
        await fetch(`/api/watchlist/${symbol}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error("Failed to update watchlist", e);
        // Revert on failure
        set(state => {
          if(isWatched) {
              state.watchlist.push(symbol);
          } else {
              state.watchlist = state.watchlist.filter(s => s !== symbol);
          }
        });
      }
    },
  }))
);
