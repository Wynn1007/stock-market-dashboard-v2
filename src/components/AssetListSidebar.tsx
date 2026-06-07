import React, { useState, useEffect, useMemo } from "react";
import { Search, Coins, Landmark, BarChart2, Activity, Filter, Star, TrendingUp, TrendingDown } from "lucide-react";
import { Asset } from "../types";
import { useStore } from "../store/useStore";
import { useTranslation } from "../hooks/useTranslation";
import { formatPrice, getExchangeRates } from "../utils/formatters";

// Category definitions
const categories = [
  { id: "all", icon: Filter },
  { id: "crypto", icon: Coins },
  { id: "stock_us", icon: Landmark },
  { id: "stock_asia", icon: BarChart2 },
  { id: "futures", icon: Activity },
];

const AssetRow = React.memo(({ asset, isSelected, isWatched, flash, onSelect, onToggleWatchlist }: {
    asset: Asset;
    isSelected: boolean;
    isWatched: boolean;
    flash: "up" | "down" | null;
    onSelect: (symbol: string) => void;
    onToggleWatchlist: (symbol: string) => void;
}) => {
    const { theme, currency, assets } = useStore(state => ({ theme: state.theme, currency: state.currency, assets: state.assets }));
    const rates = getExchangeRates(assets);
    const isMidnight = theme === "midnight";
    const isUp = asset.changePercent >= 0;

    let flashBg = "";
    if (flash === "up") flashBg = isMidnight ? "bg-emerald-950/20" : "bg-emerald-50";
    else if (flash === "down") flashBg = isMidnight ? "bg-rose-950/20" : "bg-rose-50";

    return (
        <div className={`group flex items-center transition-all duration-150 border-b ${ isSelected ? (isMidnight ? "bg-slate-800/80 border-l-4 border-cyan-400" : "bg-slate-50 border-l-4 border-blue-600") : (isMidnight ? "hover:bg-slate-800/40 border-slate-800/30" : "hover:bg-slate-50 border-slate-100")} ${flashBg}`}>
            <button onClick={() => onToggleWatchlist(asset.symbol)} className={`pl-3 pr-1 py-4 transition-colors ${ isWatched ? "text-amber-500" : "text-slate-300 dark:text-slate-700 group-hover:text-slate-400"}`}>
                <Star className={`w-3.5 h-3.5 ${isWatched ? "fill-current" : ""}`} />
            </button>
            <button onClick={() => onSelect(asset.symbol)} className="flex-1 text-left p-3.5 pl-1.5 flex items-center justify-between">
                <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate max-w-[110px]`}>{asset.name}</span>
                        <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded-xs font-semibold tracking-wider font-mono ${ isMidnight ? "bg-slate-900 text-slate-400" : "bg-slate-200 text-slate-600"}`}>{asset.category.replace("stock_", "")}</span>
                    </div>
                    <span className={`font-mono font-medium text-[10px] uppercase ${isMidnight ? "text-slate-400" : "text-slate-500"}`}>{asset.symbol}</span>
                </div>
                <div className="text-right flex flex-col space-y-1">
                    <span className="text-xs font-mono font-bold">{formatPrice(asset.price, asset.symbol, currency, assets, rates)}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${ isUp ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400"}`}>
                        {isUp ? "+" : ""}{asset.changePercent.toFixed(2)}%
                    </span>
                </div>
            </button>
        </div>
    );
});

export default function AssetListSidebar() {
  const { assets, watchlist, showOnlyWatchlist, toggleShowOnlyWatchlist, selectedSymbol, setSelectedSymbol, toggleWatchlist, searchQuery, setSearchQuery, theme, wsStatus } = useStore();
  const { t, lang } = useTranslation();
  
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashStates, setFlashStates] = useState<Record<string, "up" | "down" | null>>({});

  useEffect(() => {
    const newFlashes: Record<string, "up" | "down" | null> = {};
    assets.forEach((asset) => {
      const prevPrice = prevPrices[asset.symbol];
      if (prevPrice !== undefined && asset.price !== prevPrice) {
        newFlashes[asset.symbol] = asset.price > prevPrice ? "up" : "down";
      }
    });

    if (Object.keys(newFlashes).length > 0) {
      setFlashStates(prev => ({...prev, ...newFlashes}));
      const timer = setTimeout(() => {
        const resetFlashes = Object.keys(newFlashes).reduce((acc, key) => ({...acc, [key]: null }), {});
        setFlashStates(prev => ({...prev, ...resetFlashes}));
      }, 500);
      return () => clearTimeout(timer);
    }
    
    setPrevPrices(assets.reduce((acc, asset) => ({...acc, [asset.symbol]: asset.price }), {}));
  }, [assets]);

  const displayGroups = useMemo(() => {
    const groups: { titleKey: string; items: Asset[]; icon: React.ElementType }[] = [];
    const sq = searchQuery.trim().toLowerCase();
    const baseAssets = activeCategory === "all" ? assets : assets.filter(a => a.category === activeCategory);

    if (sq) {
      const results = baseAssets.filter(as => as.name.toLowerCase().includes(sq) || as.symbol.toLowerCase().includes(sq));
      groups.push({ titleKey: "Search Results", items: results, icon: Search });
    } else if (showOnlyWatchlist) {
      const watchlisted = baseAssets.filter(a => watchlist.includes(a.symbol));
      groups.push({ titleKey: "Watchlist", items: watchlisted, icon: Star });
    } else {
      const watchlisted = baseAssets.filter(a => watchlist.includes(a.symbol));
      const notWatchlisted = baseAssets.filter(a => !watchlist.includes(a.symbol));
      const sorted = [...notWatchlisted].sort((a, b) => b.changePercent - a.changePercent);

      if (watchlisted.length > 0) groups.push({ titleKey: "⭐ My Watchlist", items: watchlisted, icon: Star });
      
      const topGainers = sorted.filter(a => a.changePercent > 0).slice(0, 8);
      if (topGainers.length > 0) groups.push({ titleKey: "📈 Top Gainers", items: topGainers, icon: TrendingUp });
      
      const topLosers = sorted.filter(a => a.changePercent < 0).reverse().slice(0, 8);
      if (topLosers.length > 0) groups.push({ titleKey: "📉 Top Losers", items: topLosers, icon: TrendingDown });
    }
    return groups.filter(g => g.items.length > 0);
  }, [searchQuery, assets, activeCategory, showOnlyWatchlist, watchlist]);

  const isMidnight = theme === "midnight";
  const catNames = useMemo(() => ({
      all: lang === "zh" ? "全部" : "All",
      crypto: lang === "zh" ? "加密" : "Crypto",
      stock_us: lang === "zh" ? "美股" : "US",
      stock_asia: lang === "zh" ? "亞股" : "Asia",
      futures: lang === "zh" ? "期貨" : "Futures",
  }), [lang]);
  
  return (
    <div className={`w-full md:w-80 border-r flex flex-col h-full overflow-hidden transition-colors ${isMidnight ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200"}`}>
      <div className={`p-4 border-b space-y-3 ${isMidnight ? "bg-[#0f172a]/80 border-slate-800" : "bg-slate-50/80 border-slate-100"}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.watchTitle}</h2>
          <button onClick={toggleShowOnlyWatchlist} title={showOnlyWatchlist ? t.allAssets : t.onlyWatchlist} className={`p-1.5 rounded-lg ${showOnlyWatchlist ? (isMidnight ? "bg-cyan-500/20 text-cyan-400" : "bg-blue-600/10 text-blue-600") : "text-slate-400 hover:text-slate-300"}`}>
            <Star className={`w-4 h-4 ${showOnlyWatchlist ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="relative">
          <input type="text" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full text-xs pl-9 pr-4 py-2 border rounded-lg shadow-sm outline-none transition ${isMidnight ? "bg-slate-950 border-slate-850 focus:border-cyan-500" : "bg-white border-slate-200 focus:border-blue-500"}`} />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className={`flex gap-1 overflow-x-auto px-4 py-3 border-b scrollbar-none ${isMidnight ? 'border-slate-800' : 'border-slate-100'}`}>
        {categories.map(({ id, icon: Icon }) => (
          <button key={id} onClick={() => setActiveCategory(id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${activeCategory === id ? (isMidnight ? "bg-cyan-500 text-slate-950" : "bg-slate-700 text-white") : (isMidnight ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200")}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{catNames[id]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {displayGroups.length === 0 ? (
          <p className="p-8 text-center text-slate-400 text-xs">{t.noAssets}</p>
        ) : (
          displayGroups.map((group, gIdx) => (
            <div key={gIdx} className="mb-2">
                <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isMidnight ? "bg-slate-900/50 text-slate-400" : "bg-slate-100/50 text-slate-500"}`}>
                    <group.icon className="w-3.5 h-3.5" />{group.titleKey}
                </div>
                <div>{group.items.map(asset => <AssetRow key={asset.symbol} asset={asset} isSelected={selectedSymbol === asset.symbol} isWatched={watchlist.includes(asset.symbol)} flash={flashStates[asset.symbol] || null} onSelect={setSelectedSymbol} onToggleWatchlist={toggleWatchlist} />)}</div>
            </div>
          ))
        )}
      </div>

      <div className={`p-3 border-t text-[10px] font-mono flex items-center justify-between ${isMidnight ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-100 border-slate-200"}`}>
        <span>{t.totalAssets}: {assets.length} {t.itemsLabel}</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full transition-colors ${wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span className={`${wsStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.liveIndicator}</span>
        </div>
      </div>
    </div>
  );
}
