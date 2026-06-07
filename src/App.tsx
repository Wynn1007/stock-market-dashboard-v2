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
import { Shield } from "lucide-react";
import { getExchangeRates, formatPrice } from "./utils/formatters";

// A component to manage global effects
const GlobalEffects = () => {
  const { fetchInitialData, selectedSymbol, activeTab, fetchNews, token, fetchUserData } = useStore(state => ({
    fetchInitialData: state.fetchInitialData,
    selectedSymbol: state.selectedSymbol,
    activeTab: state.activeTab,
    fetchNews: state.fetchNews,
    token: state.token,
    fetchUserData: state.fetchUserData
  }));

  // Initialize WebSocket connection
  useWebSocket();

  // Fetch initial static assets on app load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch user-specific data when token changes
  useEffect(() => {
    if (token) {
        fetchUserData();
    }
  }, [token, fetchUserData]);

  // Fetch news when the symbol or tab changes
  useEffect(() => {
    if (selectedSymbol && activeTab === 'trading') {
      fetchNews();
    }
  }, [selectedSymbol, activeTab, fetchNews]);

  return null; // This component does not render anything
};

const MainContent = () => {
  const { activeTab, selectedSymbol, assets, theme, currency, tickerDetails, setActiveTab, setShowLoginPrompt } = useStore(state => ({
    activeTab: state.activeTab,
    selectedSymbol: state.selectedSymbol,
    assets: state.assets,
    theme: state.theme,
    currency: state.currency,
    tickerDetails: state.tickerDetails,
    setActiveTab: state.setActiveTab,
    setShowLoginPrompt: state.setShowLoginPrompt
  }));
  const { t } = useTranslation();
  const { placeOrder } = useWebSocket();

  const activeAsset = assets.find((a) => a.symbol === selectedSymbol);
  const rates = getExchangeRates(assets);
  const isMidnight = theme === "midnight";
  const bgCardClass = isMidnight ? "bg-[#131a26] border-slate-800" : "bg-white border-slate-200/60 shadow-sm";

  if (activeTab === "ledger") {
    return <FinancialLedger />;
  }
  
  if (activeTab === "settings") {
    return <main className="flex-1 overflow-y-auto p-6"><AuthForm /></main>;
  }

  return (
    <>
      <AssetListSidebar />
      <main className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
        {activeAsset && (
          <div className={`border rounded-2xl p-5 shadow-xs flex justify-between items-center gap-4 ${bgCardClass}`}>
              <div className="flex items-center gap-3"><div className="flex flex-col"><span className="text-2xl font-black font-mono uppercase">{activeAsset.symbol}</span><span className="text-xs text-slate-400">{activeAsset.name}</span></div></div>
              <div className="flex items-center gap-6"><div className="flex flex-col text-right"><span className="text-[10px] uppercase font-bold text-slate-500">{t.priceLabel}</span><span className={`text-2xl font-bold font-mono ${activeAsset.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{currency === "TWD" ? "NT$" : "$"}{formatPrice(activeAsset.price, activeAsset.symbol, currency, assets, rates)}</span></div><div className="flex flex-col text-right"><span className="text-[10px] uppercase font-bold text-slate-500">{t.changeLabel}</span><span className={`text-xs font-mono py-1 px-2 rounded-sm mt-0.5 ${activeAsset.changePercent >= 0 ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400"}`}>{activeAsset.changePercent >= 0 ? "+" : ""}{activeAsset.changePercent.toFixed(2)}%</span></div></div>
          </div>
        )}
        <section className="flex-1 min-h-[350px]">
          <InteractiveChart />
        </section>
        <NewsSection />
        <TradingPanel 
          category={activeAsset?.category || "crypto"}
          onPlaceOrder={(side, price, qty) => placeOrder(side, price, qty, selectedSymbol)} 
        />
      </main>
    </>
  );
};

const LoginPrompt = () => {
    const { showLoginPrompt, setShowLoginPrompt, setActiveTab } = useStore(state => ({
        showLoginPrompt: state.showLoginPrompt,
        setShowLoginPrompt: state.setShowLoginPrompt,
        setActiveTab: state.setActiveTab,
    }));
    const { t } = useTranslation();
    const theme = useStore(state => state.theme);
    const isMidnight = theme === "midnight";
    const bgCardClass = isMidnight ? "bg-[#131a26] border-slate-800" : "bg-white border-slate-200/60 shadow-sm";

    if (!showLoginPrompt) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className={`p-6 border rounded-2xl max-w-sm w-full space-y-4 shadow-2xl ${bgCardClass}`}>
                <h4 className="font-bold text-amber-500 flex items-center gap-2"><Shield className="w-5 h-5" />{t.loginPrompt.header}</h4>
                <p className="text-xs text-slate-400">{t.loginPrompt.message}</p>
                <div className="flex gap-2">
                    <button onClick={() => { setShowLoginPrompt(false); setActiveTab("settings"); }} className="flex-1 py-2 bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-900 rounded-lg text-xs font-bold">{t.loginPrompt.confirm}</button>
                    <button onClick={() => setShowLoginPrompt(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-850 rounded-lg text-xs text-slate-400 font-bold">{t.loginPrompt.cancel}</button>
                </div>
            </div>
        </div>
    );
};


export default function App() {
  const { theme } = useStore(state => ({ theme: state.theme }));
  const isMidnight = theme === "midnight";

  return (
    <>
      <GlobalEffects />
      <div className={`min-h-screen flex flex-col font-sans overflow-x-hidden antialiased transition-colors ${isMidnight ? "bg-[#0b0f19] text-[#e2e8f0]" : "bg-[#f8fafc] text-slate-900"}`}>
        <Header />
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          <MainContent />
        </div>
        <LoginPrompt />
      </div>
    </>
  );
}
