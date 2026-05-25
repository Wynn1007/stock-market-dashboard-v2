import React, { useState, useEffect } from "react";
import { Search, Coins, Landmark, BarChart2, Activity, Filter, HelpCircle } from "lucide-react";
import { Asset } from "../types";

interface AssetListSidebarProps {
  assets: Asset[];
  selectedSymbol: string;
  onSelectAsset: (symbol: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lang: "zh" | "en";
  theme: "midnight" | "milk";
}

export default function AssetListSidebar({
  assets,
  selectedSymbol,
  onSelectAsset,
  searchQuery,
  onSearchChange,
  lang,
  theme,
}: AssetListSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashStates, setFlashStates] = useState<Record<string, "up" | "down" | null>>({});

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
      watchTitle: "全域資產監測名單",
      searchPlaceholder: "搜尋代號、名稱或資產種類...",
      noAssets: "查無任何相符的證券或代幣資產",
      totalAssets: "監察總計",
      itemsLabel: "支",
      liveIndicator: "即時連線頻道 (WS)",
    },
    en: {
      watchTitle: "Watchlist & Live Portfolio",
      searchPlaceholder: "Search symbol, nickname...",
      noAssets: "No matching security assets found.",
      totalAssets: "Total Monitored",
      itemsLabel: "items",
      liveIndicator: "Real-time Live (WS)",
    },
  }[lang];

  const categories = [
    { id: "all", name: lang === "zh" ? "全部資產" : "All", icon: Filter },
    { id: "crypto", name: lang === "zh" ? "加密貨幣" : "Crypto", icon: Coins },
    { id: "stock_us", name: lang === "zh" ? "美股股票" : "US Stocks", icon: Landmark },
    { id: "stock_asia", name: lang === "zh" ? "亞股股票" : "Asia Stocks", icon: BarChart2 },
    { id: "futures", name: lang === "zh" ? "期貨黃金" : "Futures", icon: Activity },
    { id: "etf", name: lang === "zh" ? "熱門 ETF" : "Active ETFs", icon: HelpCircle },
  ];

  const filteredAssets = assets.filter((as) => {
    const matchesCategory = activeCategory === "all" || as.category === activeCategory;
    const matchesSearch =
      as.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      as.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Theme settings
  const isMidnight = theme === "midnight";
  const sidebarBg = isMidnight ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200";
  const searchSectionBg = isMidnight ? "bg-[#0f172a]/80" : "bg-slate-50/50";
  const borderBottomClass = isMidnight ? "border-slate-800" : "border-slate-100";
  const textPrimary = isMidnight ? "text-slate-100" : "text-slate-900";
  const textSecondary = isMidnight ? "text-slate-400" : "text-slate-500";
  const inputBgClass = isMidnight ? "bg-slate-950 border-slate-850 text-slate-100 focus:border-cyan-500" : "bg-white border-slate-200 text-slate-800 focus:border-blue-500";
  const rowBorderClass = isMidnight ? "border-slate-800" : "border-slate-100";

  return (
    <div className={`w-full md:w-80 border-r flex flex-col h-full overflow-hidden transition-colors duration-200 ${sidebarBg}`} id="asset-sidebar-panel">
      {/* List Header */}
      <div className={`p-4 border-b flex flex-col space-y-3 ${searchSectionBg} ${borderBottomClass}`}>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 animate-pulse" />
          {t.watchTitle}
        </h2>

        <div className="relative">
          <input
            id="search-ticker-input"
            type="text"
            className={`w-full text-xs pl-9 pr-4 py-2 border rounded-lg shadow-sm outline-hidden transition ${inputBgClass}`}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
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
                    : "bg-slate-950 text-white shadow-sm"
                  : isMidnight
                  ? "bg-slate-800 hover:bg-slate-750 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-250 text-slate-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Assets Rows list */}
      <div className={`flex-1 overflow-y-auto divide-y ${borderBottomClass}`} id="asset-feed-list">
        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {t.noAssets}
          </div>
        ) : (
          filteredAssets.map((as) => {
            const isSelected = selectedSymbol === as.symbol;
            const priceFlash = flashStates[as.symbol];
            const isUp = as.changePercent >= 0;

            let flashBg = "";
            if (priceFlash === "up") {
              flashBg = isMidnight ? "bg-emerald-950/20 text-emerald-300" : "bg-emerald-50 text-emerald-800";
            } else if (priceFlash === "down") {
              flashBg = isMidnight ? "bg-rose-950/20 text-rose-300" : "bg-rose-50 text-rose-800";
            }

            return (
              <button
                id={`asset-sidebar-item-${as.symbol}`}
                key={as.symbol}
                onClick={() => onSelectAsset(as.symbol)}
                className={`w-full text-left p-3.5 flex items-center justify-between transition-all duration-150 cursor-pointer border-b ${
                  isSelected
                    ? isMidnight
                      ? "bg-slate-800/80 border-l-4 border-cyan-400 pl-2.5"
                      : "bg-slate-50 border-l-4 border-blue-600 pl-2.5"
                    : isMidnight
                    ? "hover:bg-slate-800/40 border-slate-800/30"
                    : "hover:bg-slate-50 border-slate-100"
                } ${flashBg}`}
              >
                <div className="flex flex-col space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate max-w-[130px] ${textPrimary}`}>
                      {as.name}
                    </span>
                    <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-xs font-semibold tracking-wider font-mono ${
                      isMidnight ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-500"
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
                    {as.price.toLocaleString(undefined, {
                      minimumFractionDigits: as.price > 1000 ? 1 : as.price < 5 ? 4 : 2,
                    })}
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
            );
          })
        )}
      </div>

      {/* Footer statistics bar */}
      <div className={`p-3 border-t text-[10px] font-mono flex items-center justify-between ${
        isMidnight ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
      }`}>
        <span>{t.totalAssets}: {assets.length} {t.itemsLabel}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.liveIndicator}</span>
        </div>
      </div>
    </div>
  );
}
