import React, { useRef, useEffect } from 'react';
import { createChart, IChartApi, ISeriesApi, SeriesType, Time } from 'lightweight-charts';
import { useStore } from '../store/useStore';

const InteractiveChart = () => {
    const { tickerDetails, theme, setTimeframe } = useStore(state => ({
        tickerDetails: state.tickerDetails,
        theme: state.theme,
        setTimeframe: state.setTimeframe,
    }));

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        chartRef.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            layout: {
                background: { color: 'transparent' },
                textColor: theme === 'midnight' ? '#D1D5DB' : '#1F2937',
            },
            grid: {
                vertLines: { color: theme === 'midnight' ? '#2A2E39' : '#E5E7EB' },
                horzLines: { color: theme === 'midnight' ? '#2A2E39' : '#E5E7EB' },
            },
            timeScale: {
                borderColor: theme === 'midnight' ? '#4B5563' : '#D1D5DB',
            },
        });

        candleSeriesRef.current = chartRef.current.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            wickUpColor: '#22c55e',
        });

        volumeSeriesRef.current = chartRef.current.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: 'volume_scale',
        });
        chartRef.current.priceScale('volume_scale').applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chartRef.current?.remove();
        };
    }, [theme]);

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.applyOptions({
                 layout: {
                    textColor: theme === 'midnight' ? '#D1D5DB' : '#1F2937',
                },
                grid: {
                    vertLines: { color: theme === 'midnight' ? '#2A2E39' : '#E5E7EB' },
                    horzLines: { color: theme === 'midnight' ? '#2A2E39' : '#E5E7EB' },
                },
            });
        }
    }, [theme]);

    useEffect(() => {
        if (candleSeriesRef.current && tickerDetails?.candles) {
            const data = tickerDetails.candles.map(c => ({
                time: (c.time / 1000) as Time,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
            }));
            candleSeriesRef.current.setData(data);
        }
        if (volumeSeriesRef.current && tickerDetails?.candles) {
            const volumeData = tickerDetails.candles.map(c => ({
                time: (c.time / 1000) as Time,
                value: c.volume,
                color: c.close > c.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            }));
            volumeSeriesRef.current.setData(volumeData);
        }
    }, [tickerDetails]);

    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

    return (
        <div className="h-full w-full relative">
             <div className="absolute top-2 left-2 z-10 flex gap-1">
                {timeframes.map(tf => (
                    <button 
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className="px-2 py-1 text-xs bg-slate-700/50 rounded hover:bg-slate-600"
                    >
                        {tf}
                    </button>
                ))}
            </div>
            <div ref={chartContainerRef} className="h-full w-full" />
        </div>
    );
};

export default InteractiveChart;
