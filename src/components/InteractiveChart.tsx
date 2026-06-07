import React, { useRef, useEffect } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time } from "lightweight-charts";
import { Candle } from "../types";

interface InteractiveChartProps {
  candles: Candle[];
  livePrice?: number;
  symbol: string;
  chartType: "line" | "candlestick";
  theme: "midnight" | "milk";
  currency: "TWD" | "USD";
  usdTwdRate: number;
  jpyTwdRate: number;
  hkdTwdRate: number;
  krwTwdRate: number;
}

// Helper to convert prices based on currency selection
const convertPrice = (p: number, symbol: string, currency: string, rates: { usdTwdRate: number, jpyTwdRate: number, hkdTwdRate: number, krwTwdRate: number }) => {
    const isTW = symbol.endsWith(".TW") || symbol.startsWith("00");
    const isIndex = symbol.startsWith("^");
    if (isIndex) return p;

    let assetCurrency: "USD" | "TWD" | "JPY" | "HKD" | "KRW" = "USD";
    if (isTW) assetCurrency = "TWD";
    else if (symbol.endsWith(".T") || symbol === "^N225") assetCurrency = "JPY";
    else if (symbol.endsWith(".HK") || symbol === "^HSI") assetCurrency = "HKD";
    else if (symbol.endsWith(".KS")) assetCurrency = "KRW";

    let priceInTwd = p;
    if (assetCurrency === "USD") priceInTwd = p * rates.usdTwdRate;
    else if (assetCurrency === "JPY") priceInTwd = p * rates.jpyTwdRate;
    else if (assetCurrency === "HKD") priceInTwd = p * rates.hkdTwdRate;
    else if (assetCurrency === "KRW") priceInTwd = p * rates.krwTwdRate;

    return currency === "TWD" ? priceInTwd : priceInTwd / rates.usdTwdRate;
};

export default function InteractiveChart({
  candles,
  livePrice,
  symbol,
  chartType,
  theme,
  currency,
  usdTwdRate,
  jpyTwdRate,
  hkdTwdRate,
  krwTwdRate,
}: InteractiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isMidnight = theme === "midnight";
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: isMidnight ? "#0f172a" : "#ffffff" },
        textColor: isMidnight ? "#d1d5db" : "#1f2937",
      },
      grid: {
        vertLines: { color: isMidnight ? "#334155" : "#e5e7eb" },
        horzLines: { color: isMidnight ? "#334155" : "#e5e7eb" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        mode: 1, // Magnet mode
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#10b981",
      wickDownColor: "#ef4444",
      wickUpColor: "#10b981",
    });
    candlestickSeriesRef.current = candlestickSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Set as an overlay
    });
    volumeSeries.priceScale().applyOptions({
        scaleMargins: {
            top: 0.8, // 80% empty space
            bottom: 0,
        }
    })
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial resize

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [theme]); // Recreate chart on theme change

  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;
    
    const rates = { usdTwdRate, jpyTwdRate, hkdTwdRate, krwTwdRate };

    const candlestickData: CandlestickData<Time>[] = candles.map(c => ({
      time: (c.time / 1000) as Time,
      open: convertPrice(c.open, symbol, currency, rates),
      high: convertPrice(c.high, symbol, currency, rates),
      low: convertPrice(c.low, symbol, currency, rates),
      close: convertPrice(c.close, symbol, currency, rates),
    }));

    const volumeData: HistogramData<Time>[] = candles.map(c => ({
        time: (c.time / 1000) as Time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
    }));

    candlestickSeriesRef.current.setData(candlestickData);
    volumeSeriesRef.current.setData(volumeData);

    // Auto-fit view
    chartRef.current?.timeScale().fitContent();

  }, [candles, currency, usdTwdRate, jpyTwdRate, hkdTwdRate, krwTwdRate, symbol]);
  
  // Live price update
  useEffect(() => {
      if (
        !livePrice ||
        !candlestickSeriesRef.current ||
        !volumeSeriesRef.current ||
        candles.length === 0
      ) return;
      
      const rates = { usdTwdRate, jpyTwdRate, hkdTwdRate, krwTwdRate };
      const convertedPrice = convertPrice(livePrice, symbol, currency, rates);
      
      const lastCandle = candles[candles.length-1];
      const lastCandleTime = (lastCandle.time / 1000) as Time;

      candlestickSeriesRef.current.update({
          time: lastCandleTime,
          close: convertedPrice,
          high: Math.max(convertPrice(lastCandle.high, symbol, currency, rates), convertedPrice),
          low: Math.min(convertPrice(lastCandle.low, symbol, currency, rates), convertedPrice)
      });
      
  }, [livePrice]);

  return (
    <div className="w-full h-full flex flex-col" id="trading-chart-container">
      <div ref={chartContainerRef} className="flex-1 w-full h-full min-h-[300px]" />
    </div>
  );
}
