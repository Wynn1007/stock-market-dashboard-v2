import React, { useRef, useEffect, useState } from "react";
import { Candle } from "../types";

interface InteractiveChartProps {
  candles: Candle[];
  livePrice?: number;
  symbol: string;
  chartType: "line" | "candlestick";
  timeframe?: string;
  lang: "zh" | "en";
  theme: "midnight" | "milk";
}

export default function InteractiveChart({
  candles,
  livePrice,
  symbol,
  chartType,
  timeframe = "1m",
  lang,
  theme,
}: InteractiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 680, height: 380 });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 280),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const displayCandles = [...candles];

  const calcMA = (period: number, index: number): number | null => {
    if (index < period - 1) return null;
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += displayCandles[index - i].close;
    }
    return sum / period;
  };

  const ma5List = displayCandles.map((_, idx) => calcMA(5, idx));
  const ma20List = displayCandles.map((_, idx) => calcMA(20, idx));

  // Determine theme-specific color palette for canvas rendering
  const isMidnight = theme === "midnight";
  const gridColor = isMidnight ? "rgba(51, 65, 85, 0.55)" : "#e2e8f0"; // slate-700 vs slate-200
  const textColor = isMidnight ? "#94a3b8" : "#64748b"; // slate-400 vs slate-500
  const lineChartColor = isMidnight ? "#06b6d4" : "#2563eb"; // cyan-500 vs blue-600
  const gradientStart = isMidnight ? "rgba(6, 182, 212, 0.35)" : "rgba(37, 99, 235, 0.25)";
  const crosshairColor = isMidnight ? "#64748b" : "#94a3b8";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayCandles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const width = dimensions.width;
    const height = dimensions.height;

    const paddingRight = 65;
    const paddingBottom = 24;
    const paddingTop = 16;
    const paddingLeft = 16;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const prices = displayCandles.map((c) => [c.high, c.low, c.close, c.open]).flat();
    let maxPrice = Math.max(...prices);
    let minPrice = Math.min(...prices);

    const priceDiff = maxPrice - minPrice;
    maxPrice += priceDiff * 0.08 || 5;
    minPrice -= priceDiff * 0.08 || 5;
    if (minPrice < 0) minPrice = 0;

    const maxVol = Math.max(...displayCandles.map((c) => c.volume));

    ctx.clearRect(0, 0, width, height);

    // Dynamic optional backend fill if midnight
    if (isMidnight) {
      ctx.fillStyle = "#0f172a"; // deep dark background fill
      ctx.fillRect(0, 0, width, height);
    }

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;

    const gridSlices = 6;
    for (let i = 0; i <= gridSlices; i++) {
      const x = paddingLeft + (chartWidth / gridSlices) * i;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + chartHeight);
      ctx.stroke();
    }

    const gridLevels = 5;
    ctx.fillStyle = textColor;
    ctx.font = "10px JetBrains Mono, Inter, sfc, monospace";
    ctx.textAlign = "left";

    for (let i = 0; i <= gridLevels; i++) {
      const y = paddingTop + (chartHeight / gridLevels) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartWidth, y);
      ctx.stroke();

      const priceVal = maxPrice - ((maxPrice - minPrice) / gridLevels) * i;
      ctx.fillText(
        priceVal.toLocaleString(undefined, {
          minimumFractionDigits: priceVal > 1000 ? 1 : priceVal < 5 ? 4 : 2,
          maximumFractionDigits: priceVal > 1000 ? 1 : priceVal < 5 ? 4 : 2,
        }),
        paddingLeft + chartWidth + 6,
        y + 3
      );
    }

    const getX = (index: number) => {
      return paddingLeft + (index / (displayCandles.length - 1)) * chartWidth;
    };

    const getY = (val: number) => {
      return (
        paddingTop +
        chartHeight -
        ((val - minPrice) / (maxPrice - minPrice)) * chartHeight
      );
    };

    // Draw Volume bars
    ctx.globalAlpha = isMidnight ? 0.22 : 0.15;
    const barWidth = Math.max(1.5, (chartWidth / displayCandles.length) * 0.7);
    displayCandles.forEach((candle, idx) => {
      const x = getX(idx) - barWidth / 2;
      const volHeight = (candle.volume / (maxVol || 1)) * (chartHeight * 0.2);
      const y = paddingTop + chartHeight - volHeight;

      ctx.fillStyle = candle.close >= candle.open ? "#10b981" : "#ef4444";
      ctx.fillRect(x, y, barWidth, volHeight);
    });
    ctx.globalAlpha = 1.0;

    // Draw lines or candles
    if (chartType === "candlestick") {
      displayCandles.forEach((candle, idx) => {
        const x = getX(idx);
        const yOpen = getY(candle.open);
        const yClose = getY(candle.close);
        const yHigh = getY(candle.high);
        const yLow = getY(candle.low);

        const isBullish = candle.close >= candle.open;
        ctx.strokeStyle = isBullish ? "#10b981" : "#ef4444";
        ctx.fillStyle = isBullish ? "#10b981" : "#ef4444";
        ctx.lineWidth = 1.25;

        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        const rectY = Math.min(yOpen, yClose);
        const rectH = Math.max(1.5, Math.abs(yClose - yOpen));
        ctx.fillRect(x - barWidth / 2, rectY, barWidth, rectH);
      });
    } else {
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(displayCandles[0].close));
      for (let i = 1; i < displayCandles.length; i++) {
        ctx.lineTo(getX(i), getY(displayCandles[i].close));
      }
      ctx.strokeStyle = lineChartColor;
      ctx.lineWidth = 2.25;
      ctx.stroke();

      const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
      gradient.addColorStop(0, gradientStart);
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.beginPath();
      ctx.moveTo(getX(0), paddingTop + chartHeight);
      ctx.lineTo(getX(0), getY(displayCandles[0].close));
      for (let i = 1; i < displayCandles.length; i++) {
        ctx.lineTo(getX(i), getY(displayCandles[i].close));
      }
      ctx.lineTo(getX(displayCandles.length - 1), paddingTop + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Moving averages paths
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#f59e0b";
    ctx.beginPath();
    let startedMA5 = false;
    ma5List.forEach((val, idx) => {
      if (val !== null) {
        const x = getX(idx);
        const y = getY(val);
        if (!startedMA5) {
          ctx.moveTo(x, y);
          startedMA5 = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();

    ctx.strokeStyle = "#a855f7";
    ctx.beginPath();
    let startedMA20 = false;
    ma20List.forEach((val, idx) => {
      if (val !== null) {
        const x = getX(idx);
        const y = getY(val);
        if (!startedMA20) {
          ctx.moveTo(x, y);
          startedMA20 = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();

    // Bottom Time labels
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    const labelSteps = 4;
    for (let i = 0; i < labelSteps; i++) {
      const idx = Math.floor((displayCandles.length / (labelSteps - 1)) * i);
      const safeIdx = Math.min(idx, displayCandles.length - 1);
      const candle = displayCandles[safeIdx];
      const x = getX(safeIdx);

      let dateStr = "";
      if (timeframe === "1d") {
        dateStr = new Date(candle.time).toLocaleDateString(undefined, {
          month: "2-digit",
          day: "2-digit",
        });
      } else {
        dateStr = new Date(candle.time).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      ctx.fillText(dateStr, x, paddingTop + chartHeight + 14);
    }

    // Interactive crosshairs highlighter
    if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < displayCandles.length) {
      const hovered = displayCandles[hoverIdx];
      const hX = getX(hoverIdx);
      const hY = getY(hovered.close);

      ctx.strokeStyle = crosshairColor;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      ctx.moveTo(hX, paddingTop);
      ctx.lineTo(hX, paddingTop + chartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(paddingLeft, hY);
      ctx.lineTo(paddingLeft + chartWidth, hY);
      ctx.stroke();

      ctx.setLineDash([]);

      ctx.fillStyle = chartType === "candlestick" ? (hovered.close >= hovered.open ? "#10b981" : "#ef4444") : lineChartColor;
      ctx.beginPath();
      ctx.arc(hX, hY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [dimensions, displayCandles, chartType, hoverIdx, theme]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const paddingLeft = 16;
    const paddingRight = 65;
    const chartWidth = dimensions.width - paddingLeft - paddingRight;

    const relativeX = x - paddingLeft;
    const pct = relativeX / chartWidth;
    let idx = Math.round(pct * (candles.length - 1));
    idx = Math.max(0, Math.min(idx, candles.length - 1));

    if (x >= paddingLeft && x <= dimensions.width - paddingRight) {
      setHoverIdx(idx);
    } else {
      setHoverIdx(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
  };

  const activeCandle = hoverIdx !== null ? candles[hoverIdx] : candles[candles.length - 1];
  const activeMA5 = hoverIdx !== null ? ma5List[hoverIdx] : ma5List[ma5List.length - 1];
  const activeMA20 = hoverIdx !== null ? ma20List[hoverIdx] : ma20List[ma20List.length - 1];

  const tLabels = {
    zh: {
      open: "開", high: "高", low: "低", close: "收", vol: "量", data: "數據點"
    },
    en: {
      open: "O", high: "H", low: "L", close: "C", vol: "V", data: "Cursor Data"
    }
  }[lang];

  return (
    <div className="w-full h-full flex flex-col space-y-2" id="trading-chart-container">
      {activeCandle && (
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 rounded-lg border text-xs font-mono transition-colors duration-200 ${
          isMidnight ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"
        }`}>
          <span className="font-bold text-blue-500 dark:text-cyan-400 capitalize">{symbol} {tLabels.data}:</span>
          <span>{tLabels.open}: <span className={isMidnight ? "text-slate-200" : "text-slate-900"}>{activeCandle.open.toFixed(2)}</span></span>
          <span>{tLabels.high}: <span className="text-emerald-500 font-bold">{activeCandle.high.toFixed(2)}</span></span>
          <span>{tLabels.low}: <span className="text-rose-500 font-bold">{activeCandle.low.toFixed(2)}</span></span>
          <span>{tLabels.close}: <span className={`font-black ${isMidnight ? "text-slate-100" : "text-slate-950"}`}>{activeCandle.close.toFixed(2)}</span></span>
          <span>{tLabels.vol}: <span className="text-slate-500">{activeCandle.volume.toLocaleString()}</span></span>
          <span className="flex items-center gap-1 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            MA5: <span className="text-amber-500 font-bold">{activeMA5 ? activeMA5.toFixed(2) : "--"}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
            MA20: <span className="text-purple-500 font-bold">{activeMA20 ? activeMA20.toFixed(2) : "--"}</span>
          </span>
        </div>
      )}

      <div ref={containerRef} className={`flex-1 w-full relative rounded-2xl border overflow-hidden min-h-[300px] transition-colors duration-200 ${
        isMidnight ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
      }`}>
        {candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
            {lang === "zh" ? "讀取市場高速數據中..." : "Accessing market signals..."}
          </div>
        ) : (
          <canvas
            id="interactive-financial-canvas"
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair"
          />
        )}
      </div>
    </div>
  );
}
