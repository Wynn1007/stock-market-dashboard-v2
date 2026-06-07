import React from "react";
import { RefreshCw, Globe, Sparkles, Zap, Activity } from "lucide-react";
import { useStore } from "../store/useStore";
import { useTranslation } from "../hooks/useTranslation";

const renderFormattedAnalysis = (text: string) => {
    // Basic markdown-like renderer
    return text.split('\n').map((line, idx) => {
        if (line.startsWith("###")) return <h4 key={idx} className="text-sm font-bold mt-3 mb-1 pb-1 border-b border-slate-200 dark:border-slate-800">{line.replace("###", "").trim()}</h4>;
        if (line.startsWith("-")) return <li key={idx} className="text-xs list-disc ml-4">{line.replace("-", "").trim()}</li>;
        return <p key={idx} className="text-xs leading-relaxed">{line}</p>;
    });
};

interface NewsSectionProps {
    onRefresh: () => void;
}

export default function NewsSection({ onRefresh }: NewsSectionProps) {
    const { newsLoading, newsAnalysis, marketNews, theme, lang } = useStore();
    const { t } = useTranslation(lang);
    const isMidnight = theme === "midnight";

    if (!newsLoading && !newsAnalysis && marketNews.length === 0) {
        return null; // Don't render anything if there's no news activity
    }

    return (
        <div className={`p-5 rounded-2xl border ${newsLoading ? "bg-slate-500/5" : "bg-blue-500/5 border-blue-500/20"}`} id="market-news-output-board">
            <div className="flex justify-between items-center gap-2 mb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Globe className={`w-4 h-4 ${newsLoading ? "animate-spin" : "text-blue-400"}`} />
                    {t("news.header")}
                </h3>
                <button onClick={onRefresh} disabled={newsLoading} className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition">
                    <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {newsLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">{t("news.loading")}</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* AI Summary */}
                    <div className={`space-y-3 p-4 rounded-xl border ${isMidnight ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Sparkles className="w-4 h-4 text-amber-400" /><span>{t("news.aiSummary")}</span></div>
                        {newsAnalysis ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-bold ${newsAnalysis.sentimentLabel === "BULLISH" ? "text-green-400" : newsAnalysis.sentimentLabel === "BEARISH" ? "text-red-400" : "text-slate-400"}`}>{newsAnalysis.sentimentLabel}</span>
                                    <span className="text-xs font-mono">{newsAnalysis.sentimentPercent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${newsAnalysis.sentimentPercent}%` }} /></div>
                                {renderFormattedAnalysis(newsAnalysis.summary)}
                                {newsAnalysis.flashes?.length > 0 && (
                                    <div className="pt-3 mt-3 border-t border-slate-800">
                                        <h5 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" />{t("news.flashes")}</h5>
                                        <ul className="space-y-1">{newsAnalysis.flashes.map((f, i) => <li key={i} className="text-xs list-disc ml-4">{f}</li>)}</ul>
                                    </div>
                                )}
                            </>
                        ) : <div className="text-xs text-slate-500 py-4 text-center">{t("news.noAnalysis")}</div>}
                    </div>
                    {/* News List */}
                    <div className={`space-y-2 p-4 rounded-xl border ${isMidnight ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Activity className="w-4 h-4 text-blue-400" /><span>{t("news.live")}</span></div>
                         <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {marketNews.map(item => (
                                <a key={item.uuid} href={item.link} target="_blank" rel="noopener noreferrer" className={`block p-2 rounded-lg ${isMidnight ? "hover:bg-slate-900" : "hover:bg-slate-50"}`}>
                                    <h4 className="text-xs font-bold">{item.title}</h4>
                                    <p className="text-[10px] text-slate-500">{item.publisher}</p>
                                </a>
                            ))}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}
