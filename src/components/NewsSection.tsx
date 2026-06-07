import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import NewsFlashes from './NewsFlashes';
import { BarChart, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const NewsSection = () => {
    const { marketNews, newsAnalysis, newsLoading, fetchNews, theme } = useStore(state => ({
        marketNews: state.marketNews,
        newsAnalysis: state.newsAnalysis,
        newsLoading: state.newsLoading,
        fetchNews: state.fetchNews,
        theme: state.theme
    }));
    const { t } = useTranslation();
    const isMidnight = theme === 'midnight';

    const sentimentColor = newsAnalysis?.sentimentLabel === 'BULLISH' ? 'text-emerald-400' : newsAnalysis?.sentimentLabel === 'BEARISH' ? 'text-rose-400' : 'text-slate-400';

    return (
        <section className={`p-4 border rounded-lg ${isMidnight ? 'bg-[#131a26] border-slate-800' : 'bg-white border-slate-200/60'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{t.news.title}</h3>
                <button onClick={fetchNews} disabled={newsLoading} className="text-xs font-semibold hover:underline disabled:opacity-50">
                    {newsLoading ? t.news.loading : t.news.refresh}
                </button>
            </div>
            
            {newsLoading && <div className="text-center p-8">{t.news.loading}</div>}

            {!newsLoading && newsAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2 space-y-2">
                        <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2"><Zap className="w-4 h-4"/>{t.news.summary}</h4>
                        <p className="text-sm">{newsAnalysis.summary}</p>
                    </div>
                    <div>
                         <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2"><BarChart className="w-4 h-4"/>{t.news.sentiment}</h4>
                         <div className={`text-3xl font-bold ${sentimentColor}`}>{newsAnalysis.sentimentPercent}%</div>
                         <div className={`font-semibold ${sentimentColor}`}>
                            {newsAnalysis.sentimentLabel === 'BULLISH' && <TrendingUp className="inline-block w-5 h-5 mr-1"/>}
                            {newsAnalysis.sentimentLabel === 'BEARISH' && <TrendingDown className="inline-block w-5 h-5 mr-1"/>}
                            {newsAnalysis.sentimentLabel}
                         </div>
                    </div>
                </div>
            )}

            {!newsLoading && marketNews.length > 0 && <NewsFlashes newsItems={marketNews} analysisFlashes={newsAnalysis?.flashes || []} />}
        </section>
    );
};

export default NewsSection;
