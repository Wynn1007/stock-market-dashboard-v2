import React, { useEffect } from "react";
import { useStore } from "./store/useStore";
import { useWebSocket } from "./hooks/useWebSocket";
import { useTranslation } from "./hooks/useTranslation";
import Header from "./components/layout/Header";
import AssetListSidebar from "./components/AssetListSidebar";
import InteractiveChart from "./components/InteractiveChart";
import TradingPanel from "./components/TradingPanel";
import FinancialLedger from "./components/FinancialLedger";
import NewsSection from "./components/NewsSection";
import AuthForm from "./components/AuthForm";
import { Shield, Settings, AlertCircle } from "lucide-react";
import { getExchangeRates, formatPrice } from "./utils/formatters";

// Headless manager for side effects
const AppManager = () => {
  const { fetchInitialData, selectedSymbol, activeTab, fetchNews, token, fetchUserData } = useStore();
  
  // Singleton WS connection
  useWebSocket();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (token) fetchUserData();
  }, [token, fetchUserData]);

  useEffect(() => {
    if (selectedSymbol && activeTab === 'trading') fetchNews();
  }, [selectedSymbol, activeTab, fetchNews]);

  return null;
};

// Error Boundary fallback
const ErrorFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-slate-400">The application crashed. Please refresh the page.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 rounded-lg font-bold">Refresh Page</button>
        </div>
    </div>
);

const MainLayout = () => {
  const { activeTab, selectedSymbol, assets, theme, currency, setActiveTab, setShowLoginPrompt } = useStore();
  const { t } = useTranslation();

  const activeAsset = assets.find((a) => a.symbol === selectedSymbol);
  const rates = getExchangeRates(assets);
  const isMidnight = theme === "midnight";
  const bgCardClass = isMidnight ? "bg-[#131a26] border-slate-800" : "bg-white border-slate-200/60 shadow-sm";

  if (activeTab === "ledger") {
    return <FinancialLedger />;
  }
  
  if (activeTab === "settings") {
    return (
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className={`p-8 border rounded-2xl ${bgCardClass} text-center max-w-2xl mx-auto mt-10`}>
                <Settings className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">{t.header.settings}</h2>
                <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">Configure your trading account, security keys, and UI preferences.</p>
                <AuthForm />
            </div>
        </main>
    );
  }

  return (
    <>
      <AssetListSidebar />
      <main className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar">
        {activeAsset && (
          <div className={`border rounded-2xl p-5 shadow-xs flex justify-between items-center gap-4 ${bgCardClass}`}>
              <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                      <span className="text-2xl font-black font-mono uppercase">{activeAsset.symbol}</span>
                      <span className="text-xs text-slate-400 font-semibold">{activeAsset.name}</span>
                  </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.priceLabel}</span>
                      <span className={`text-2xl font-bold font-mono ${activeAsset.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {currency === "TWD" ? "NT$" : "$"}{formatPrice(activeAsset.price, activeAsset.symbol, currency, assets, rates)}
                      </span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{t.changeLabel}</span>
                      <span className={`text-xs font-mono py-1 px-2 rounded-sm mt-0.5 ${activeAsset.changePercent >= 0 ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400"}`}>
                        {activeAsset.changePercent >= 0 ? "+" : ""}{activeAsset.changePercent.toFixed(2)}%
                      </span>
                  </div>
              </div>
          </div>
        )}
        <section className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-slate-800/40">
          <InteractiveChart />
        </section>
        <NewsSection />
        <TradingPanel category={activeAsset?.category || "crypto"} />
      </main>
    </>
  );
};

const LoginPromptModal = () => {
    const { showLoginPrompt, setShowLoginPrompt, setActiveTab, theme } = useStore();
    const { t } = useTranslation();
    const isMidnight = theme === "midnight";
    const bgCardClass = isMidnight ? "bg-[#131a26] border-slate-800" : "bg-white border-slate-200/60 shadow-sm";

    if (!showLoginPrompt) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className={`p-6 border rounded-2xl max-w-sm w-full space-y-4 shadow-2xl scale-in ${bgCardClass}`}>
                <h4 className="font-bold text-amber-500 flex items-center gap-2"><Shield className="w-5 h-5" />{t.loginPrompt.header}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{t.loginPrompt.message}</p>
                <div className="flex gap-2">
                    <button onClick={() => { setShowLoginPrompt(false); setActiveTab("settings"); }} className="flex-1 py-2.5 bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-transform active:scale-95">{t.loginPrompt.confirm}</button>
                    <button onClick={() => setShowLoginPrompt(false)} className="px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-400 font-bold">{t.loginPrompt.cancel}</button>
                </div>
            </div>
        </div>
    );
};


export default class AppWrapper extends React.Component<{}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { console.error("App Crash:", error, info); }

  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return <App />;
  }
}

function App() {
  const { theme } = useStore();
  const isMidnight = theme === "midnight";

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-hidden antialiased transition-colors duration-300 ${isMidnight ? "bg-[#0b0f19] text-[#e2e8f0]" : "bg-[#f8fafc] text-slate-900"}`}>
      <AppManager />
      <Header />
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        <MainLayout />
      </div>
      <LoginPromptModal />
      <footer className={`p-2 px-4 border-t text-[9px] font-mono flex justify-between items-center ${isMidnight ? "bg-[#0b0f19] border-slate-800/50 text-slate-600" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
          <div className="flex items-center gap-3">
              <span>WYNN FINANCE V2.0.4</span>
              <span className="opacity-50">STABLE_BUILD_20260608</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>SYSTEM_READY</span>
          </div>
      </footer>
    </div>
  );
}
