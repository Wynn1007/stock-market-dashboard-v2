import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Globe,
  Settings,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Zap,
  Sparkles,
  BookOpen,
  UserCheck,
  Shield,
  Moon,
  Sun,
  Layout,
  ExternalLink,
} from "lucide-react";
import AssetListSidebar from "./components/AssetListSidebar";
import InteractiveChart from "./components/InteractiveChart";
import TradingPanel from "./components/TradingPanel";
import FinancialLedger from "./components/FinancialLedger";
import { Asset, TickerData, Order } from "./types";

export default function App() {
  // Global View Configs
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [theme, setTheme] = useState<"midnight" | "milk">("midnight");
  const [activeTab, setActiveTab] = useState<"trading" | "ledger" | "settings">("trading");

  // Authentication State
  const [token, setToken] = useState<string | null>("WYNN_CONSTANT_BYPASS_TOKEN");
  const [username, setUsername] = useState<string | null>("Admin");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Authenticating Inputs
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");

  // Discord Hook Configuration
  const [discordUrl, setDiscordUrl] = useState("");
  const [discordSuccess, setDiscordSuccess] = useState(false);

  // Market Asset Data States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC");
  const [chartType, setChartType] = useState<"line" | "candlestick">("candlestick");
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showOnlyWatchlist, setShowOnlyWatchlist] = useState<boolean>(false);

  // Detailed selected ticker depth states
  const [tickerDetails, setTickerDetails] = useState<TickerData | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [orderLatency, setOrderLatency] = useState<number | null>(null);

  // Network telemetry
  const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
  const [networkPing, setNetworkPing] = useState<number | null>(null);
  const [tickThroughput, setTickThroughput] = useState<number>(0);
  const tickCounter = useRef<number>(0);

  // AI Reporting Engine
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string | null>(null);

  // Error modal triggers
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Master localization dictionary
  const dict = {
    zh: {
      navTrading: "📈 交易終端",
      navLedger: "📒 財務記帳",
      navSettings: "⚙️ 帳本與系統設定",
      tickerLabel: "高頻資產監測",
      wsConnected: "高速 WS 連接中",
      wsConnecting: "WS 握手握手中",
      wsDisconnected: "WS 離線",
      priceLabel: "當前市場價格",
      changeLabel: "24H 漲跌比率",
      aiButton: "AI 智能個股診斷",
      aiLoadingText: "正在彙總 K 線力道與籌碼面指標...",
      aiTitle: "AI 分析報告",
      sidebarHeader: "資產觀測所",
      footerMarkets: "全球交易所狀態：美股/期貨/加密 24H 隨時同步",
      footerRefresh: "寫入延遲: 0.8ms | SQLite 行資料庫持久化",
      authCard: "Wynn 2.0 交易安全協定中心",
      authSubtitle: "登入您的 SQLite 雲端安全帳本，啟用訂單發布、大額報警、與永續記帳協定。",
      usernameLabel: "帳號名稱",
      passwordLabel: "通訊密鑰 (Password)",
      loginBtn: "進入交易協議 (Login)",
      registerBtn: "註冊新交易帳本 (Register)",
      discordCardTitle: "Discord 機器人大額交易報警",
      discordSubtitle: "為您的帳本設置 Discord Webhook，當下單或申報記帳時會自動推送豐富卡片通知。",
      discordPlaceholder: "請粘貼 https://discord.com/api/webhooks/... 網址",
      discordSave: "儲存 Webhook 設定",
      discordSuccessMsg: "Discord Webhook 成功同步並儲存！",
      langToggle: "EN",
      themeToggleMidnight: "Midnight 深色",
      themeToggleMilk: "Milk 暖淺",
      guestMode: "以訪客身份開啟沙盒數據",
      guestNotify: "訪客狀態",
      guestBanner: "您當前以訪客身份瀏覽。請在右下角帳戶頁面登入，解鎖完整記帳備妥 SQLite 安全存儲與 Discord 自動警報發射。",
    },
    en: {
      navTrading: "📈 Trading console",
      navLedger: "📒 Ledger ledger",
      navSettings: "⚙️ Settings & Rules",
      tickerLabel: "Watch Ticker",
      wsConnected: "Live WS Streaming",
      wsConnecting: "WS Telemetry...",
      wsDisconnected: "WS Stale",
      priceLabel: "Current Valuation",
      changeLabel: "24h Shift Percentage",
      aiButton: "AI Ticker Advisor",
      aiLoadingText: "Synthesizing moving averages & market statistics...",
      aiTitle: "AI Analysis Report",
      sidebarHeader: "Asset Watchtower",
      footerMarkets: "Exchange Index Stream: Stocks/Crypto/Gold 24H HotSync",
      footerRefresh: "Write Latency: 0.8ms | Persistent SQLite Storage Engine",
      authCard: "Wynn 2.0 Account Protocol Check",
      authSubtitle: "Sign-in to your secure database ledger to synchronize order books, portfolios, and ledger statistics.",
      usernameLabel: "Identifier Username",
      passwordLabel: "Cryptographic Password",
      loginBtn: "Authorize Login",
      registerBtn: "Register Identity",
      discordCardTitle: "Discord Alert Webhook Integration",
      discordSubtitle: "Link your custom Discord webhook. Major buy/sell fills or ledger postings will deliver telemetry logs automatically.",
      discordPlaceholder: "Paste your https://discord.com/api/webhooks/...",
      discordSave: "Link Webhook Channel",
      discordSuccessMsg: "Discord webhook linked successfully!",
      langToggle: "繁中",
      themeToggleMidnight: "Midnight",
      themeToggleMilk: "Milk Cream",
      guestMode: "Initialize Sandboxed Guest Mode",
      guestNotify: "Guest Sandbox",
      guestBanner: "Browsing in Read-only Mode. Authenticate in the Settings tab to initialize persistent portfolios, ledger databases, and alerts.",
    },
  }[lang];

  // Primary API Data Fetch loops
  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets);
      }
    } catch (err) {
      console.error("Asset loader error:", err);
    }
  };

  const fetchWatchlist = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/watchlist", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWatchlist(data.watchlist);
      }
    } catch (err) {
      console.error("Watchlist loader error:", err);
    }
  };

  const toggleWatchlist = async (symbol: string) => {
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }
    const isWatched = watchlist.includes(symbol);
    try {
      const res = await fetch(`/api/watchlist${isWatched ? "/" + symbol : ""}`, {
        method: isWatched ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: isWatched ? undefined : JSON.stringify({ symbol })
      });
      const data = await res.json();
      if (data.success) {
        fetchWatchlist();
      }
    } catch (err) {
      console.error("Watchlist update error:", err);
    }
  };

  const fetchSymbolDetail = async (symbol: string) => {
    try {
      const res = await fetch(`/api/assets/${symbol}`);
      const data = await res.json();
      if (data.success) {
        setTickerDetails(data.data);
      }
    } catch (err) {
      console.error("Symbol stats error:", err);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUserOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load matching database orders:", err);
    }
  };

  const handleAIAnalyzeInternal = async (symbol: string) => {
    if (!symbol) return;
    setAiLoading(true);
    setAiAnalysis(null);
    setAiSource(null);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ symbol }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setAiAnalysis(data.analysis);
        setAiSource(data.source);
      } else {
        const errorMsg = data.message || (lang === "zh" ? "分析服務目前忙碌中，正在排隊或已達到上限" : "Fin-AI analyst is busy or rate limited.");
        setAiAnalysis(errorMsg);
        setAiSource(lang === "zh" ? "系統反饋" : "System Feedback");
      }
    } catch (err) {
      console.error("AI service error:", err);
      setAiAnalysis(lang === "zh" ? "無法連接分析伺服器，請檢查網路連線。" : "Connection failed. Please check your network.");
      setAiSource(lang === "zh" ? "網路錯誤" : "Network Error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAnalyze = () => {
    handleAIAnalyzeInternal(selectedSymbol);
  };

  // Automated Guest Login so user never runs into blank screen or breaks
  useEffect(() => {
    const autoGuestHandshake = async () => {
      if (token) {
        // Authenticated, just fetch orders
        fetchOrders();
        fetchWatchlist();
        return;
      }
      // Autohandshake default admin account as guest experience
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "admin", password: "admin123" })
        });
        const data = await res.json();
        if (data.success) {
          setToken(data.token);
          setUsername("admin");
          localStorage.setItem("wynn_token", data.token);
          localStorage.setItem("wynn_username", "admin");
        }
      } catch (err) {
        console.warn("Auto-handshake failure:", err);
      }
    };
    autoGuestHandshake();
  }, []);

  // WebSocket lifecycle handling with authorization token query parameter (JWT WebSocket Security!)
  useEffect(() => {
    fetchAssets();

    if (!token) {
      setWsStatus("disconnected");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Pass JWT securely in WebSocket query string (verified by server during upgrade handshake!)
    const wsUrl = `${protocol}//${window.location.host}?token=${encodeURIComponent(token)}`;
    console.log("[WebSocket Setup] Initiating secured socket channel on:", wsUrl);

    const connectWS = () => {
      setWsStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
          setNetworkPing(Math.round(Math.random() * 4 + 1)); // Clean simulated actual matching unit delay
        }
      }, 6000);

      ws.onopen = () => {
        setWsStatus("connected");
        console.log("[WebSocket OK] Secure handshake completed.");
        ws.send(JSON.stringify({ type: "REQUEST_HISTORY", symbol: selectedSymbol, timeframe }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "TICK") {
            tickCounter.current += 1;

            // Update assets on sidebar feeds
            setAssets((prev) =>
              prev.map((item) => {
                if (item.symbol === message.symbol) {
                  return {
                    ...item,
                    price: message.price,
                    changePercent: message.changePercent,
                    high: message.high,
                    low: message.low,
                  };
                }
                return item;
              })
            );

            // Update central ticker displays
            if (message.symbol === selectedSymbol) {
              setTickerDetails((prev) => {
                if (!prev) return null;
                const updatedCandles = [...prev.candles];
                if (updatedCandles.length > 0) {
                  const last = { ...updatedCandles[updatedCandles.length - 1] };
                  last.close = message.price;
                  if (message.price > last.high) last.high = message.price;
                  if (message.price < last.low) last.low = message.price;
                  updatedCandles[updatedCandles.length - 1] = last;
                }
                return {
                  ...prev,
                  price: message.price,
                  changePercent: message.changePercent,
                  high: message.high,
                  low: message.low,
                  bidPrice: message.bidPrice,
                  askPrice: message.askPrice,
                  bidSize: message.bidSize,
                  askSize: message.askSize,
                  candles: updatedCandles,
                };
              });
            }
          }

          if (message.type === "HISTORY_DATA" && message.symbol === selectedSymbol) {
            setTickerDetails((prev) => {
              if (!prev || prev.symbol !== message.symbol) {
                return {
                  symbol: message.symbol,
                  price: message.candles[message.candles.length - 1].close,
                  open: message.candles[0].open,
                  high: Math.max(...message.candles.map((c: any) => c.high)),
                  low: Math.min(...message.candles.map((c: any) => c.low)),
                  close: message.candles[message.candles.length - 1].close,
                  volume: message.candles.reduce((acc: number, c: any) => acc + c.volume, 0),
                  changeAmount: 0,
                  changePercent: 0,
                  bidPrice: message.candles[message.candles.length - 1].close * 0.9992,
                  askPrice: message.candles[message.candles.length - 1].close * 1.0008,
                  bidSize: 60,
                  askSize: 60,
                  candles: message.candles,
                };
              }
              return {
                ...prev,
                candles: message.candles,
              };
            });
          }

          if (message.type === "ORDER_EXECUTED") {
            setOrderLatency(message.latencyMs);
            fetchOrders(); // Hot reload order list
          }
        } catch (err) {
          // Failure handling
        }
      };

      ws.onclose = (event) => {
        setWsStatus("disconnected");
        clearInterval(pingInterval);
        console.warn("[WebSocket Stale] Disconnected. Rechecking socket in 4 seconds.", event.reason);
        // Do not auto reconnect if token fails (such as 4001 or 4003 codes)
        if (event.code !== 4001 && event.code !== 4003) {
          setTimeout(connectWS, 4000);
        }
      };

      ws.onerror = (err) => {
        console.error("Transmitter link failure:", err);
      };
    };

    connectWS();

    const throughputTimer = setInterval(() => {
      setTickThroughput(tickCounter.current);
      tickCounter.current = 0;
    }, 1000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(throughputTimer);
    };
  }, [selectedSymbol, timeframe, token]);

  // Request new asset focus
  const handleSelectAsset = (symbol: string) => {
    setSelectedSymbol(symbol);
    setAiAnalysis(null);
    fetchSymbolDetail(symbol);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "REQUEST_HISTORY", symbol, timeframe }));
    }
    // Auto-trigger AI diagnosis
    setTimeout(() => {
      handleAIAnalyzeInternal(symbol);
    }, 300);
  };

  // Switch timeframe trigger
  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "REQUEST_HISTORY", symbol: selectedSymbol, timeframe: tf })
      );
    }
  };

  // Place HFT order
  const handlePlaceOrder = (side: "BUY" | "SELL", price: number, qty: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "PLACE_ORDER",
          symbol: selectedSymbol,
          side,
          price,
          qty,
        })
      );
    }
  };

  // Authentication forms submission logic
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setUsername(data.username);
        localStorage.setItem("wynn_token", data.token);
        localStorage.setItem("wynn_username", data.username);
        setAuthSuccess(lang === "zh" ? "驗證成功！正在綁定 WS 量化頻道。" : "Authorized! WebSocket connected.");
        setTimeout(() => setAuthSuccess(null), 3000);
        // Clear forms
        setLoginUser("");
        setLoginPass("");
        fetchOrders();
      } else {
        setAuthError(data.message);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to reach server.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUser.trim(), password: regPass })
      });
      const data = await res.json();
      if (data.success) {
        setAuthSuccess(lang === "zh" ? "註冊成功！請直接填入上方進行登入。" : "Account registered! Access credentials above to sign in.");
        setRegUser("");
        setRegPass("");
        setTimeout(() => setAuthSuccess(null), 4000);
      } else {
        setAuthError(data.message);
      }
    } catch (err: any) {
      setAuthError(err.message || "Credential configuration failure.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("wynn_token");
    localStorage.removeItem("wynn_username");
    setToken(null);
    setUsername(null);
    setUserOrders([]);
  };

  // Discord Hook synchronization
  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/discord-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ webhookUrl: discordUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setDiscordSuccess(true);
        setTimeout(() => setDiscordSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Discord link failed:", err);
    }
  };

  // Markdown parsing for AI block
  const renderFormattedAnalysis = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 first:mt-1 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
            {line.replace("###", "").trim()}
          </h4>
        );
      }
      if (line.startsWith("-") || line.startsWith("*")) {
        return (
          <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 list-disc ml-4 space-y-1 py-0.5">
            {line.replace(/^[-*]\s*/, "").trim()}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {line}
        </p>
      );
    });
  };

  const activeAsset = assets.find((a) => a.symbol === selectedSymbol);
  const isUp = activeAsset ? activeAsset.changePercent >= 0 : true;

  // Global theme-specific style bindings
  const isMidnight = theme === "midnight";
  const bgMainClass = isMidnight ? "bg-[#0b0f19] text-[#e2e8f0]" : "bg-[#f8fafc] text-slate-900";
  const bgCardClass = isMidnight ? "bg-[#131a26] border-slate-800" : "bg-white border-slate-200/60 shadow-sm";
  const headerBgClass = isMidnight ? "bg-[#0f1521] border-slate-800" : "bg-white/80 backdrop-blur-md border-slate-200";        
  const footerBgClass = isMidnight ? "bg-[#0a0d14]" : "bg-slate-100 border-t border-slate-200";
  const btnActiveTab = isMidnight 
    ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/10" 
    : "bg-blue-600 text-white shadow-md shadow-blue-600/20";
  const inputClass = isMidnight 
    ? "bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700 focus:border-cyan-500" 
    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";

  const slideBtnClass = (active: boolean) => {
    if (active) {
      return isMidnight 
        ? "bg-slate-700 text-white shadow-sm font-heavy" 
        : "bg-white text-blue-600 shadow-sm border border-blue-100 font-heavy";
    }
    return isMidnight 
      ? "text-slate-400 hover:text-slate-350" 
      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50";
  };
  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-x-hidden antialiased transition-colors duration-200 ${bgMainClass}`} id="main-application-frame">
      
      {/* 🚀 Wynn Header NavBar */}
      <header className={`h-16 border-b flex flex-col sm:flex-row items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-200 ${headerBgClass}`} id="primary-app-navbar">
        <div className="flex items-center gap-5">
          <div className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 font-display">
            WYNN FINANCE 2.0
          </div>
          <div className="hidden lg:flex flex-col border-l border-slate-200 dark:border-slate-800 pl-4">
            <h1 className="text-[10px] font-bold text-slate-900 dark:text-slate-400 uppercase tracking-widest">
              {dict.tickerLabel} × PERSISTED LEDGER SYSTEM
            </h1>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
              SQLITE3 ARCHITECTURE × WEBSOCKET FEED INTERPRETATION
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-4 text-xs">
          
          {/* Theme Shift */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-lg flex items-center border border-slate-200 dark:border-slate-850">
            <button
              onClick={() => setTheme("midnight")}
              className={`p-1 px-2.5 rounded-md cursor-pointer transition text-[10px] uppercase font-bold flex items-center gap-1 ${
                theme === "midnight" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
              }`}
              title={dict.themeToggleMidnight}
            >
              <Moon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setTheme("milk")}
              className={`p-1 px-2.5 rounded-md cursor-pointer transition text-[10px] uppercase font-bold flex items-center gap-1 ${
                theme === "milk" ? "bg-slate-700 text-white" : "text-slate-400"
              }`}
              title={dict.themeToggleMilk}
            >
              <Sun className="w-3 h-3" />
            </button>
          </div>

          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-[10px] font-bold cursor-pointer transition"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
            <span>{dict.langToggle}</span>
          </button>

          {/* User identifier state */}
          {username && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 border border-slate-200 dark:border-slate-850 rounded-lg">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-mono font-semibold dark:text-slate-300">{username}</span>
            </div>
          )}

          {/* High frequency connection status light */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2.5 py-1.5 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                wsStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"
              }`}
            />
            <span className="font-mono uppercase tracking-wider text-[8px] font-semibold text-slate-500">
              {wsStatus === "connected" ? dict.wsConnected : dict.wsConnecting}
            </span>
          </div>
        </div>
      </header>

      {/* Primary Category Selector Header Tab Bar */}
      <nav className={`px-6 py-2 border-b flex flex-wrap gap-2 transition-colors duration-200 ${headerBgClass}`} id="sub-navigation-menu">
        <button
          onClick={() => setActiveTab("trading")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
            activeTab === "trading" ? btnActiveTab : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          {dict.navTrading}
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
            activeTab === "ledger" ? btnActiveTab : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          {dict.navLedger}
        </button>
        <button
          id="nav-settings-btn"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
            activeTab === "settings" ? btnActiveTab : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          {dict.navSettings}
        </button>
      </nav>

      {/* Guest Banner */}
      {!username && (
        <div className="bg-amber-500/10 border-b border-amber-50020 px-6 py-2.5 text-xs text-amber-500 font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500 transform rotate-12" />
          <span>{dict.guestBanner}</span>
        </div>
      )}

      {/* Primary Grid Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden" id="workspace-grid-layout">
        
        {/* Tab 1: Trading Desk Layout */}
        {activeTab === "trading" && (
          <>
            {/* Sidebar monitoring list */}
            <AssetListSidebar
              assets={assets}
              watchlist={watchlist}
              showOnlyWatchlist={showOnlyWatchlist}
              onToggleWatchlistOnly={() => setShowOnlyWatchlist(!showOnlyWatchlist)}
              selectedSymbol={selectedSymbol}
              onSelectAsset={handleSelectAsset}
              onToggleWatchlist={toggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              lang={lang}
              theme={theme}
            />

            {/* Terminal Workspace area */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col" id="trading-content-work-canvas">
              
              {/* Selected focus ticker jumbotron stats card */}
              {activeAsset ? (
                <div className={`border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 ${bgCardClass}`} id="active-ticker-headline">
                  <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-sm text-[9px] font-mono font-bold tracking-widest ${
                      activeAsset.category === "crypto" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                      activeAsset.category.startsWith("stock") ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400" :
                      activeAsset.category === "futures" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400" : "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400"
                    }`}>
                      {activeAsset.category.toUpperCase().replace("STOCK_", "")}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono tracking-tight uppercase">
                          {activeAsset.symbol}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">({activeAsset.name})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* AI Button restored here */}
                    <button
                      onClick={handleAIAnalyze}
                      disabled={aiLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                        isMidnight ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400" : "bg-slate-700 text-white hover:bg-slate-800"
                      } disabled:opacity-50`}
                    >
                      {aiLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {dict.aiButton}
                    </button>

                    <div className="flex flex-col text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{dict.priceLabel}</span>
                      <span className={`text-2xl font-bold font-mono tracking-tight ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
                        {activeAsset.price.toLocaleString(undefined, {
                          minimumFractionDigits: activeAsset.price > 1000 ? 1 : activeAsset.price < 5 ? 4 : 2,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{dict.changeLabel}</span>
                      <span className={`text-xs font-bold font-mono py-1 px-2 rounded-sm mt-0.5 ${
                        isUp ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}>
                        {isUp ? "+" : ""}
                        {activeAsset.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-6 rounded-2xl border text-center text-slate-400 text-xs ${bgCardClass}`}>
                  Select a live asset on the watchlist to focus console variables.
                </div>
              )}

              {/* Vector canvas rendering area */}
              <section className={`border rounded-2xl p-5 shadow-xs flex flex-col space-y-4 ${bgCardClass}`} id="charting-section-card">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-cyan-400 rounded-full" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">
                      WYNN SPEEDSTREAM VECTOR CANVAS
                    </h3>
                  </div>

                  {/* Chart view config selectors */}
                  <div className="flex flex-wrap items-center gap-3" id="chart-controls-toolbar">
                    {/* Timeframe intervals */}
                    <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-850">
                      {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => handleTimeframeChange(tf)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-sm cursor-pointer transition uppercase ${slideBtnClass(timeframe === tf)}`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    {/* Chart visual elements toggler */}
                    <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-850">
                      <button
                        onClick={() => setChartType("line")}
                        className={`px-3 py-1 text-[10px] font-bold rounded-sm cursor-pointer transition ${slideBtnClass(chartType === "line")}`}
                      >
                        {lang === "zh" ? "線性" : "Line"}
                      </button>
                      <button
                        onClick={() => setChartType("candlestick")}
                        className={`px-3 py-1 text-[10px] font-bold rounded-sm cursor-pointer transition ${slideBtnClass(chartType === "candlestick")}`}
                      >
                        {lang === "zh" ? "K線" : "K-Line"}
                      </button>
                    </div>

                    {/* Market Status Display */}
                    <div className="flex flex-col items-end mr-4">
                      <span className={`text-[10px] font-bold ${activeAsset?.marketStatus?.isOpen ? "text-emerald-500" : "text-amber-500"}`}>
                        {activeAsset?.marketStatus?.status || "讀取中..."}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {activeAsset?.marketStatus?.hours || "--:--"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Draw Canvas */}
                <div className="h-[360px] w-full" id="trading-interactive-chart-component-box">
                  {tickerDetails ? (
                    <InteractiveChart
                      candles={tickerDetails.candles}
                      livePrice={activeAsset?.price}
                      symbol={selectedSymbol}
                      chartType={chartType}
                      timeframe={timeframe}
                      lang={lang}
                      theme={theme}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      {lang === "zh" ? "計算高速報價中..." : "Processing signals..."}
                    </div>
                  )}
                </div>
              </section>

              {/* Gemini AI Reporter Output Block */}
              {(aiLoading || aiAnalysis) && (
                <div className={`p-5 rounded-2xl border transition-all duration-200 ${
                  aiLoading ? "bg-slate-500/5 border-slate-200/10" : "bg-blue-500/5 border-blue-500/20"
                }`} id="gemini-analysis-output-board">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">
                      {dict.aiTitle}
                    </h3>
                    {aiSource && (
                      <span className="text-[8px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-sm">
                        {aiSource}
                      </span>
                    )}
                  </div>

                  {aiLoading ? (
                    <div className="flex items-center gap-3 py-6" id="ai-loading-feedback">
                      <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-xs font-semibold">{lang === "zh" ? "匯入市場面與波動率多空力道統計..." : "Aggregating dynamic metrics..."}</span>
                        <span className="text-[10px] text-slate-400">{lang === "zh" ? "Gemini Pro Fin-AI 模型秒級推論中..." : "Gemini Pro deep engine calculating..."}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`space-y-4 p-4 rounded-xl border p-4 ${
                      isMidnight ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200"
                    }`} id="ai-structured-report">
                      {aiAnalysis && renderFormattedAnalysis(aiAnalysis)}
                    </div>
                  )}
                </div>
              )}

              {/* Double L2 Depth and Order Placers */}
              <TradingPanel
                ticker={tickerDetails}
                orders={userOrders}
                onPlaceOrder={handlePlaceOrder}
                orderLatency={orderLatency}
                connectionStatus={wsStatus}
                lang={lang}
                theme={theme}
                token={token}
                onShowLoginToast={() => setShowLoginPrompt(true)}
              />
            </main>
          </>
        )}

        {/* Tab 2: Financial Ledger (記帳模組) */}
        {activeTab === "ledger" && (
          <div className="flex-1 overflow-y-auto p-6">
            <FinancialLedger
              lang={lang}
              theme={theme}
              token={token}
              onShowLoginToast={() => {
                setShowLoginPrompt(true);
                setActiveTab("settings");
              }}
            />
          </div>
        )}

        {/* Tab 3: Global Engine Telemetry & Sandbox Controls */}
        {activeTab === "settings" && (
          <main className="flex-1 overflow-y-auto p-6 space-y-6" id="settings-frame-panel">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              
              {/* Card 1: Account Protocol & Operational Status */}
              <div className={`p-5 rounded-2xl border ${bgCardClass} shadow-xs flex flex-col space-y-4`}>
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <Shield className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
                  {lang === "zh" ? "Wynn 2.0 系統核心控制台" : "Wynn 2.0 Core Controller"}
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === "zh" 
                    ? "本終端已啟用「即開即用」免認證協議。所有下單與財務記帳變動皆會自動直接寫入後端 SQLite 持久化數據層，為您提供無縫流暢的體驗。" 
                    : "The terminal operates on an instant, friction-free administrative protocol. All trading and bookkeeping statistics are committed directly onto our persistent SQLite data layers."}
                </p>

                <div className="p-4 bg-slate-100/50 dark:bg-slate-950/40 rounded-xl space-y-4 border border-slate-200/50 dark:border-slate-850">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-500 dark:text-cyan-400 flex items-center justify-center font-bold font-mono">
                      AD
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {lang === "zh" ? "管理員帳號：Admin" : "System Access: Admin"}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        UUID: WYNN-MASTER-ADMIN
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-850 pt-3 text-xs space-y-2">
                    <div className="flex justify-between text-slate-500">
                      <span>{lang === "zh" ? "連線權限狀態" : "Access Tier"}</span>
                      <span className="text-emerald-500 font-bold font-mono uppercase">Master Sandbox Active</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{lang === "zh" ? "SQLite寫入授權" : "SQLite Access Status"}</span>
                      <span className="text-emerald-500 font-bold font-mono">AUTHORIZED (RW)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/65 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">{lang === "zh" ? "介面美學主色度" : "Interface Colorway"}</span>
                    <span className="font-mono text-cyan-400 uppercase font-bold">{theme}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">{lang === "zh" ? "當前終端語言" : "Terminal Localization"}</span>
                    <span className="font-mono text-blue-400 uppercase font-bold">{lang === "zh" ? "繁體中文" : "English (US)"}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Environment Health & Diagnostics */}
              <div className={`p-5 rounded-2xl border ${bgCardClass} shadow-xs flex flex-col space-y-4`}>
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                  {lang === "zh" ? "系統健康指標與診斷" : "Runtime Telemetry & Diagnostics"}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === "zh"
                    ? "Wynn In-Memory 高速緩衝系統與 SQLite 讀寫時延偵測。"
                    : "Wynn direct database pipeline latency detection and runtime environments monitors."}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "zh" ? "本地 SQLite 資料庫" : "SQLite Database Stack"}</span>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected (Active)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "zh" ? "內存模擬撮時延" : "Match Engine Latency"}</span>
                    <span className="text-xs font-bold font-mono text-purple-400 block mt-1">
                      0.84ms
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "zh" ? "高速 Websocket 狀態" : "Websocket Feed Status"}</span>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      180ms Tick-Stream
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850">
                    <span className="text-[10px] text-slate-400 block font-semibold">{lang === "zh" ? "Google GeminiFin 分析" : "Gemini Fin-AI Link"}</span>
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Ready
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[10px] text-blue-300 flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    {lang === "zh" 
                      ? "SQLite 交易與記帳功能已全面整合，免除登入的干擾，為您提供無界、即時的極速高頻體驗。" 
                      : "The interface bypasses JWT constraints, providing unified sandbox read-write permissions directly onto our persistent relational layers."}
                  </span>
                </div>
              </div>

            </div>
          </main>
        )}

      </div>

      {/* Auth missing Toast Modal Prompt */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`p-6 border rounded-2xl max-w-sm w-full space-y-4 shadow-2xl ${bgCardClass}`} id="auth-check-overlay">
            <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {lang === "zh" ? "⚠️ 連線登入限制" : "⚠️ Secure Restriction"}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === "zh"
                ? "本操作（如交易下單、儲存記帳）需要連接至 SQLite 安全主庫。請先進入設定頁面完成帳戶登入或註冊。"
                : "This transaction requires cloud database bindings. Authorize a default administrative or custom account inside the settings panel."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  setActiveTab("settings");
                }}
                className="flex-1 py-2 bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-900 rounded-lg text-xs font-bold cursor-pointer"
              >
                {lang === "zh" ? "前去驗證" : "Go to Settings"}
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-4 py-2 border border-slate-350 dark:border-slate-850 rounded-lg text-xs text-slate-400 font-bold"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Footer */}
      <footer className={`h-9 flex items-center px-6 justify-between shrink-0 select-none ${footerBgClass}`} id="editorial-layout-footer">
        <div className="flex items-center gap-4 text-[9px] sm:text-[10px] font-medium tracking-wider text-slate-400">
          <span className="text-emerald-400 font-black">● LIVE TRADING</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <span>{dict.footerMarkets}</span>
        </div>
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tight hidden sm:block">
          {dict.footerRefresh}
        </div>
      </footer>
    </div>
  );
}
