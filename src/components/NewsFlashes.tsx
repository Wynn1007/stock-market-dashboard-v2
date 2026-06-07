import React from "react";
import { useStore } from "../store/useStore";
import { Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";

const NewsFlashes: React.FC = () => {
  const { newsAnalysis, theme } = useStore();

  if (!newsAnalysis || !newsAnalysis.flashes || newsAnalysis.flashes.length === 0) {
    return null;
  }

  const isMidnight = theme === "midnight";
  const { sentimentPercent, sentimentLabel, flashes } = newsAnalysis;

  const getSentimentColor = () => {
    if (sentimentLabel === "BULLISH") return "text-emerald-500";
    if (sentimentLabel === "BEARISH") return "text-rose-500";
    return "text-amber-500";
  };

  const getSentimentBg = () => {
    if (sentimentLabel === "BULLISH") return "bg-emerald-500/10";
    if (sentimentLabel === "BEARISH") return "bg-rose-500/10";
    return "bg-amber-500/10";
  };

  const SentimentIcon = () => {
    if (sentimentLabel === "BULLISH") return <TrendingUp className="w-4 h-4" />;
    if (sentimentLabel === "BEARISH") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className={`mt-4 rounded-xl border ${isMidnight ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"} overflow-hidden shadow-sm`}>
      <div className="p-3 flex items-center justify-between border-b border-inherit">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider">AI News Flashes</span>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${getSentimentBg()} ${getSentimentColor()}`}>
          <SentimentIcon />
          <span className="text-[10px] font-black">{sentimentPercent}% {sentimentLabel}</span>
        </div>
      </div>
      
      <div className="p-2 max-h-32 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5">
          {flashes.map((flash, idx) => (
            <div key={idx} className="flex gap-2 items-start group">
              <div className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${isMidnight ? "bg-slate-700 group-hover:bg-cyan-500" : "bg-slate-300 group-hover:bg-blue-500"}`} />
              <p className={`text-[11px] leading-relaxed ${isMidnight ? "text-slate-400 group-hover:text-slate-200" : "text-slate-600 group-hover:text-slate-900"}`}>
                {flash}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Gauge */}
      <div className="px-3 pb-3">
        <div className={`h-1 w-full rounded-full ${isMidnight ? "bg-slate-800" : "bg-slate-200"} mt-2 relative`}>
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
              sentimentLabel === "BULLISH" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
              sentimentLabel === "BEARISH" ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : 
              "bg-amber-500"
            }`}
            style={{ width: `${sentimentPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-[8px] font-bold text-rose-500/70 uppercase">Bearish</span>
          <span className="text-[8px] font-bold text-slate-500 uppercase">Neutral</span>
          <span className="text-[8px] font-bold text-emerald-500/70 uppercase">Bullish</span>
        </div>
      </div>
    </div>
  );
};

export default NewsFlashes;
