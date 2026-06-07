import React, { useState, useEffect } from "react";
import { Search, Coins, Landmark, BarChart2, Activity, Filter, HelpCircle, Star, TrendingUp, TrendingDown } from "lucide-react";
import { Asset } from "../types";
import { useStore } from "../store/useStore";
import { getExchangeRates } from "../utils/formatters";

export default function AssetListSidebar() {
  const {
    assets,
    watchlist,
    showOnlyWatchlist,
    toggleShowOnlyWatchlist,
    selectedSymbol,
    setSelectedSymbol,
    toggleWatchlist,
    searchQuery,
    setSearchQuery,
    lang,
    theme,
    currency,
  } = useStore();

  const { usdTwdRate, jpyTwdRate, hkdTwdRate, krwTwdRate } = getExchangeRates(assets);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashStates, setFlashStates] = useState<Record<string, "up" | "down" | null>>({});

  const formatPrice = (price: number, symbol: string) => {
    const isTW = symbol.endsWith(".TW") || symbol.startsWith("00");
    const isIndex = symbol.startsWith("^");
    const isExchangeRate = symbol.endsWith("TWD");
    let displayPrice = price;
    
    if (isIndex || isExchangeRate) {
      return displayPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    // Identify asset currency
    const asset = assets.find(a => a.symbol === symbol);
    let assetCurrency: "USD" | "TWD" | "JPY" | "HKD" | "KRW" = "USD";
    if (isTW) assetCurrency = "TWD";
    else if (symbol.endsWith(".T") || symbol === "^N225") assetCurrency = "JPY";
    else if (symbol.endsWith(".HK") || symbol === "^HSI") assetCurrency = "HKD";
    else if (symbol.endsWith(".KS")) assetCurrency = "KRW";
    else if (asset?.category === "stock_asia") {
      if (symbol.includes(".T")) assetCurrency = "JPY";
      if (symbol.includes(".HK")) assetCurrency = "HKD";
      if (symbol.includes(".KS")) assetCurrency = "KRW";
    }

    // Convert to TWD first
    let priceInTwd = price;
    if (assetCurrency === "USD") priceInTwd = price * usdTwdRate;
    else if (assetCurrency === "JPY") priceInTwd = price * jpyTwdRate;
    else if (assetCurrency === "HKD") priceInTwd = price * hkdTwdRate;
    else if (assetCurrency === "KRW") priceInTwd = price * krwTwdRate;
    else if (assetCurrency === "TWD") priceInTwd = price;

    if (currency === "TWD") {
      displayPrice = priceInTwd;
    } else {
      displayPrice = priceInTwd / usdTwdRate;
    }
    
    return displayPrice.toLocaleString(undefined, {
      minimumFractionDigits: displayPrice > 1000 ? 1 : displayPrice < 5 ? 4 : 2,
      maximumFractionDigits: displayPrice > 1000 ? 1 : displayPrice < 5 ? 4 : 2,
    });
  };

  // Detect price flashes
  useEffect(() => {
    const newFlashes: Record<string, "up" | "down" | null> = {};
    let hasChanges = false;

    assets.forEach((as) => {
      const prevPrice = prevPrices[as.symbol];
      if (prevPrice !== undefined && prevPrice !== as.price) {
        newFlashes[as.symbol] = as.price > prevPrice ? "up" : "down";
        hasChanges = true;
      } else {
        newFlashes[as.symbol] = flashStates[as.symbol] || null;
      }
    });

    if (hasChanges) {
      setFlashStates((prev) => ({ ...prev, ...newFlashes }));

      const nextPrices = { ...prevPrices };
      assets.forEach((as) => {
        nextPrices[as.symbol] = as.price;
      });
      setPrevPrices(nextPrices);

      const timer = setTimeout(() => {
        setFlashStates({});
      }, 500);
      return () => clearTimeout(timer);
    } else {
      if (Object.keys(prevPrices).length === 0 && assets.length > 0) {
        const initialPrices: Record<string, number> = {};
        assets.forEach((as) => {
          initialPrices[as.symbol] = as.price;
        });
        setPrevPrices(initialPrices);
      }
    }
  }, [assets]);

  // Dictionary localization
  const t = {
    zh: {
      watchTitle: "資產監測名單",
      searchPlaceholder: "搜尋代號...",
      noAssets: "查無相符資產",
      totalAssets: "監察總計",
      itemsLabel: "支",
      liveIndicator: "即時連線 (WS)",
      onlyWatchlist: "僅顯示自訂名單",
      allAssets: "顯示全部資產"
    },
    en: {
      watchTitle: "Watchlist",
      searchPlaceholder: "Search...",
      noAssets: "No matching assets.",
      totalAssets: "Total",
      itemsLabel: "items",
      liveIndicator: "Live (WS)",
      onlyWatchlist: "Watchlist Only",
      allAssets: "Show All"
    },
  }[lang];

  const categories = [
    { id: "all", name: lang === "zh" ? "全部" : "All", icon: Filter },
    { id: "crypto", name: lang === "zh" ? "加密" : "Crypto", icon: Coins },
    { id: "stock_us", name: lang === "zh" ? "美股" : "US", icon: Landmark },
    { id: "stock_asia", name: lang === "zh" ? "亞股" : "Asia", icon: BarChart2 },
    { id: "futures", name: lang === "zh" ? "期貨" : "Futures", icon: Activity },
    { id: "etf", name: lang === "zh" ? "ETF" : "ETFs", icon: HelpCircle },
  ];

  // UX Feature: "Search Primarily", avoid empty space at bottom, categorize.
  // Instead of mapping a flat list, we generate grouped categories based on search vs empty.
  const displayGroups: { title: string; items: Asset[]; icon: any }[] = [];

  const sq = searchQuery.trim().toLowerCase();
  const baseAssets = activeCategory === "all" ? assets : assets.filter(a => a.category === activeCategory);
  
  if (sq) {
    const results = baseAssets.filter((as) => 
      as.name.toLowerCase().includes(sq) ||
      as.symbol.toLowerCase().includes(sq)
    );
    displayGroups.push({ title: lang === "zh" ? "搜尋結果 (Results)" : "Search Results", items: results, icon: Search });
  } else if (showOnlyWatchlist) {
    const watchlisted = baseAssets.filter(a => watchlist.includes(a.symbol));
    displayGroups.push({ title: lang === "zh" ? "自選清單 (Watchlist)" : "Watchlist", items: watchlisted, icon: Star });
  } else {
    // Empty search: Provide a curated, space-filling dashboard experience
    const watchlisted = baseAssets.filter(a => watchlist.includes(a.symbol));
    const notWatchlisted = baseAssets.filter(a => !watchlist.includes(a.symbol));
    
    // Sort rest by change percent
    const sorted = [...notWatchlisted].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sorted.slice(0, 8);
    const topLosers = [...sorted].reverse().slice(0, 8);
    
    if (watchlisted.length > 0) {
      displayGroups.push({ title: lang === "zh" ? "⭐ 我的自選 (Watchlist)" : "Watchlist", items: watchlisted, icon: Star });
    }
    
    // Add Mainstream Market section (only in "all" category)
    if (activeCategory === "all") {
      const mainstream = notWatchlisted.filter(a => 
        ["2330.TW", "2317.TW", "2454.TW", "0050.TW", "AAPL", "NVDA", "TSLA", "BTC", "GOLD"].includes(a.symbol)
      ).slice(0, 6);
      if (mainstream.length > 0) {
        displayGroups.push({ title: lang === "zh" ? "🏛️ 熱門市場標的 (Popular)" : "Market Leaders", items: mainstream, icon: Landmark });
      }
    }

    if (topGainers.length > 0) {
      displayGroups.push({ title: lang === "zh" ? "📈 強勢領漲 (Top Gainers)" : "Top Gainers", items: topGainers.filter(g => g.changePercent > 0), icon: TrendingUp });
    }
    
    if (topLosers.length > 0) {
      displayGroups.push({ title: lang === "zh" ? "📉 弱勢領跌 (Top Losers)" : "Top Losers", items: topLosers.filter(l => l.changePercent < 0), icon: TrendingDown });
    }
    
    // Fill remaining space with trending assets of current category
    if (displayGroups.length < 3) {
      const remaining = notWatchlisted.slice(0, 10);
      if (remaining.length > 0) {
        displayGroups.push({ title: lang === "zh" ? "🌐 更多標的 (Explore)" : "Explore Market", items: remaining, icon: Activity });
      }
    }
  }

  const validGroups = displayGroups.filter(g => g.items.length > 0);
  
  // Backwards compatibility for the footer count
  const filteredAssets = validGroups.reduce((acc, g) => [...acc, ...g.items], [] as Asset[]);

  // Theme settings
  const isMidnight = theme === "midnight";
  const sidebarBg = isMidnight ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200";
  const searchSectionBg = isMidnight ? "bg-[#0f172a]/80" : "bg-slate-50/80";
  const borderBottomClass = isMidnight ? "border-slate-800" : "border-slate-100";
  const textPrimary = isMidnight ? "text-slate-100" : "text-slate-900";
  const textSecondary = isMidnight ? "text-slate-400" : "text-slate-500";
  const inputBgClass = isMidnight ? "bg-slate-950 border-slate-850 text-slate-100 focus:border-cyan-500" : "bg-white border-slate-200 text-slate-800 focus:border-blue-500";

  return (
    <div className={`w-full md:w-80 border-r flex flex-col h-full overflow-hidden transition-colors duration-200 ${sidebarBg}`} id="asset-sidebar-panel">
      {/* List Header */}
      <div className={`p-4 border-b flex flex-col space-y-3 ${searchSectionBg} ${borderBottomClass}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 animate-pulse" />
            {t.watchTitle}
          </h2>
          <button 
            onClick={toggleShowOnlyWatchlist}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showOnlyWatchlist 
                ? (isMidnight ? "bg-cyan-500/20 text-cyan-400" : "bg-blue-600/10 text-blue-600")
                : (isMidnight ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
            }`}
            title={showOnlyWatchlist ? t.allAssets : t.onlyWatchlist}
          >
            {showOnlyWatchlist ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <input
            id="search-ticker-input"
            type="text"
            className={`w-full text-xs pl-9 pr-4 py-2 border rounded-lg shadow-sm outline-hidden transition ${inputBgClass}`}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Horizontal Scroll categories */}
      <div className={`flex gap-1 overflow-x-auto px-4 py-3 border-b scrollbar-none shrink-0 ${borderBottomClass}`} id="category-filter-toolbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              id={`cat-filter-btn-${cat.id}`}
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? isMidnight
                    ? "bg-cyan-500 text-slate-950 font-black shadow-md"
                    : "bg-slate-700 text-white shadow-sm"
                  : isMidnight
                  ? "bg-slate-800 hover:bg-slate-750 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Assets Rows list */}
      <div className={`flex-1 overflow-y-auto divide-y ${borderBottomClass} custom-scrollbar`} id="asset-feed-list">
        {validGroups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {t.noAssets}
          </div>
        ) : (
          validGroups.map((group, gIdx) => (
            <div key={gIdx} className="mb-2">
              <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isMidnight ? "bg-slate-900/50 text-slate-400" : "bg-slate-100/50 text-slate-500"}`}>
                <group.icon className="w-3.5 h-3.5" />
                {group.title}
              </div>
              <div>
                {group.items.map((as) => {
                  const isSelected = selectedSymbol === as.symbol;
                  const priceFlash = flashStates[as.symbol];
                  const isUp = as.changePercent >= 0;
                  const isWatched = watchlist.includes(as.symbol);

                  let flashBg = "";
                  if (priceFlash === "up") {
                    flashBg = isMidnight ? "bg-emerald-950/20 text-emerald-300" : "bg-emerald-50 text-emerald-800";
                  } else if (priceFlash === "down") {
                    flashBg = isMidnight ? "bg-rose-950/20 text-rose-300" : "bg-rose-50 text-rose-800";
                  }

                  return (
                    <div 
                      key={as.symbol}
                      className={`group flex items-center transition-all duration-150 border-b ${
                        isSelected
                          ? isMidnight
                            ? "bg-slate-800/80 border-l-4 border-cyan-400"
                            : "bg-slate-50 border-l-4 border-blue-600"
                          : isMidnight
                          ? "hover:bg-slate-800/40 border-slate-800/30"
                          : "hover:bg-slate-50 border-slate-100"
                      } ${flashBg}`}
                    >
                      <button
                        onClick={() => toggleWatchlist(as.symbol)}
                        className={`pl-3 pr-1 py-4 transition-colors cursor-pointer ${
                          isWatched 
                            ? "text-amber-500" 
                            : "text-slate-300 dark:text-slate-700 group-hover:text-slate-400 dark:group-hover:text-slate-500"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isWatched ? "fill-current" : ""}`} />
                      </button>

                      <button
                        id={`asset-sidebar-item-${as.symbol}`}
                        onClick={() => setSelectedSymbol(as.symbol)}
                        className="flex-1 text-left p-3.5 pl-1.5 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold truncate max-w-[110px] ${textPrimary}`}>
                              {as.name}
                            </span>
                            <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-xs font-semibold tracking-wider font-mono ${
                              isMidnight ? "bg-slate-900 text-slate-400" : "bg-slate-200 text-slate-600"
                            }`}>
                              {as.category.replace("stock_", "")}
                            </span>
                          </div>
                          <span className={`font-mono font-medium text-[10px] uppercase ${textSecondary}`}>
                            {as.symbol}
                          </span>
                        </div>

                        <div className="text-right flex flex-col space-y-1">
                          <span className={`text-xs font-mono font-bold ${textPrimary}`}>
                            {formatPrice(as.price, as.symbol)}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm shrink-0 inline-block text-center ${
                              isUp
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                            }`}
                          >
                            {isUp ? "+" : ""}
                            {as.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer statistics bar */}
      <div className={`p-3 border-t text-[10px] font-mono flex items-center justify-between ${
        isMidnight ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-500"
      }`}>
        <span>{t.totalAssets}: {filteredAssets.length} {t.itemsLabel}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.liveIndicator}</span>
        </div>
      </div>
    </div>
  );
}
