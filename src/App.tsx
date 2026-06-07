import React, { useEffect } from "react";
import AssetListSidebar from "./components/AssetListSidebar";
import InteractiveChart from "./components/InteractiveChart";
import TradingPanel from "./components/TradingPanel";
import FinancialLedger from "./components/FinancialLedger";
import NewsSection from "./components/NewsSection";
import Header from "./components/layout/Header";
import { useTranslation } from "./hooks/useTranslation";
import { useAuth } from "./hooks/useAuth";
import { useStore } from "./store/useStore";
import { useWebSocket } from "./hooks/useWebSocket";
import { getExchangeRates, formatPrice } from "./utils/formatters";
import { Shield } from "lucide-react";

export default function App() {
  const store = useStore();
  const { t } = useTranslation(store.lang);
  const { token, username, handleLogout } = useAuth(store.lang);
  const { placeOrder } = useWebSocket(token);

  const fetchBackendAPI = async (endpoint: string, params?: Record<string, any>) => {
    if (!token && (endpoint.includes('watchlist') || endpoint.includes('orders'))) return;
    try {
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`/api/${endpoint}`, { headers });
      const data = await res.json();
      if (data.success) {
        if (endpoint === 'assets') store.setAssets(data.assets);
        else if (endpoint === 'watchlist') store.setWatchlist(data.watchlist);
        else if (endpoint === 'orders') store.setUserOrders(data.orders);
      }
    } catch (err) { console.error(`Failed to fetch ${endpoint}:`, err); }
  };
  
  const fetchNews = async () => {
    if (!store.selectedSymbol) return;
    store.setNewsLoading(true);
    try {
      const url = new URL(`/api/assets/${store.selectedSymbol}/news`, window.location.origin);
      url.searchParams.append("lang", store.lang);
      const res = await fetch(url.toString(), { headers: { "Authorization": token ? `Bearer ${token}` : "" } });
      const data = await res.json();
      if (data.success) {
        store.setMarketNews(data.news);
        store.setNewsAnalysis(data.analysis);
      }
    } catch (err) { console.error("News engine failure:", err); }
    finally { store.setNewsLoading(false); }
  };

  useEffect(() => {
    fetchBackendAPI("assets");
    if(token) {
      fetchBackendAPI("watchlist");
      fetchBackendAPI("orders");
    }
  }, [token]);
  
  useEffect(() => {
    if (store.selectedSymbol && store.activeTab === 'trading') fetchNews();
  }, [store.selectedSymbol, store.activeTab, store.lang]);

  const activeAsset = store.assets.find((a) => a.symbol === store.selectedSymbol);
  const rates = getExchangeRates(store.assets);
  const isMidnight = store.theme === "midnight";
  const bgCardClass = isMidnight ? "bg-[#131a26] border-slate-800" : "bg-white border-slate-200/60 shadow-sm";

  return (
    <div className={`min-h-screen flex flex-col font-sans overflow-x-hidden antialiased transition-colors ${isMidnight ? "bg-[#0b0f19] text-[#e2e8f0]" : "bg-[#f8fafc] text-slate-900"}`}>
      <Header username={username} handleLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {store.activeTab === "trading" ? (
          <>
            <AssetListSidebar />
            <main className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
              {activeAsset && (
                <div className={`border rounded-2xl p-5 shadow-xs flex justify-between items-center gap-4 ${bgCardClass}`}>
                    <div className="flex items-center gap-3"><div className="flex flex-col"><span className="text-2xl font-black font-mono uppercase">{activeAsset.symbol}</span><span className="text-xs text-slate-400">{activeAsset.name}</span></div></div>
                    <div className="flex items-center gap-6"><div className="flex flex-col text-right"><span className="text-[10px] uppercase font-bold text-slate-500">{t.priceLabel}</span><span className={`text-2xl font-bold font-mono ${activeAsset.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{store.currency === "TWD" ? "NT$" : "$"}{formatPrice(activeAsset.price, activeAsset.symbol, store.currency, store.assets, rates)}</span></div><div className="flex flex-col text-right"><span className="text-[10px] uppercase font-bold text-slate-500">{t.changeLabel}</span><span className={`text-xs font-mono py-1 px-2 rounded-sm mt-0.5 ${activeAsset.changePercent >= 0 ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400"}`}>{activeAsset.changePercent >= 0 ? "+" : ""}{activeAsset.changePercent.toFixed(2)}%</span></div></div>
                </div>
              )}
              <section className="flex-1 min-h-[350px]">
                <InteractiveChart key={`${store.selectedSymbol}-${store.timeframe}-${store.currency}`} candles={store.tickerDetails?.candles || []} livePrice={store.tickerDetails?.price} symbol={store.selectedSymbol} theme={store.theme} currency={store.currency} chartType="candlestick" {...rates} />
              </section>
              <NewsSection onRefresh={fetchNews} />
              <TradingPanel category={activeAsset?.category || "crypto"} onPlaceOrder={placeOrder} orderLatency={null} token={token} onShowLoginToast={() => store.setShowLoginPrompt(true)} />
            </main>
          </>
        ) : store.activeTab === "ledger" ? (
          <FinancialLedger lang={store.lang} theme={store.theme} token={token} onShowLoginToast={() => {store.setShowLoginPrompt(true); store.setActiveTab("settings");}} />
        ) : (
          <main className="flex-1 overflow-y-auto p-6"> {/* Settings */} </main>
        )}
      </div>

      {store.showLoginPrompt && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className={`p-6 border rounded-2xl max-w-sm w-full space-y-4 shadow-2xl ${bgCardClass}`}>
                  <h4 className="font-bold text-amber-500 flex items-center gap-2"><Shield className="w-5 h-5" />{t("loginPrompt.header")}</h4>
                  <p className="text-xs text-slate-400">{t("loginPrompt.message")}</p>
                  <div className="flex gap-2">
                      <button onClick={() => {store.setShowLoginPrompt(false); store.setActiveTab("settings");}} className="flex-1 py-2 bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-900 rounded-lg text-xs font-bold">{t("loginPrompt.confirm")}</button>
                      <button onClick={() => store.setShowLoginPrompt(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-850 rounded-lg text-xs text-slate-400">{t("loginPrompt.cancel")}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
