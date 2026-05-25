export interface Asset {
  symbol: string;
  name: string;
  category: "crypto" | "stock_us" | "stock_asia" | "futures" | "etf";
  basePrice: number;
}

export const ASSET_DIRECTORY: Asset[] = [
  // --- Cryptos ---
  { symbol: "BTC", name: "Bitcoin (比特幣)", category: "crypto", basePrice: 68500.0 },
  { symbol: "ETH", name: "Ethereum (乙太幣)", category: "crypto", basePrice: 3450.0 },
  { symbol: "SOL", name: "Solana (索拉納)", category: "crypto", basePrice: 165.2 },
  { symbol: "XRP", name: "Ripple (瑞波幣)", category: "crypto", basePrice: 0.58 },
  { symbol: "BNB", name: "Binance Coin (幣安幣)", category: "crypto", basePrice: 605.0 },
  { symbol: "ADA", name: "Cardano (艾達幣)", category: "crypto", basePrice: 0.45 },
  { symbol: "DOGE", name: "Dogecoin (狗狗幣)", category: "crypto", basePrice: 0.16 },

  // --- US Stocks ---
  { symbol: "AAPL", name: "Apple Inc. (蘋果公司)", category: "stock_us", basePrice: 182.5 },
  { symbol: "TSLA", name: "Tesla Inc. (特斯拉)", category: "stock_us", basePrice: 178.4 },
  { symbol: "NVDA", name: "Nvidia Corp. (輝達)", category: "stock_us", basePrice: 940.0 },
  { symbol: "MSFT", name: "Microsoft Corp. (微軟)", category: "stock_us", basePrice: 415.6 },
  { symbol: "GOOGL", name: "Alphabet Inc. (谷歌)", category: "stock_us", basePrice: 175.0 },
  { symbol: "AMZN", name: "Amazon.com Inc. (亞馬遜)", category: "stock_us", basePrice: 180.0 },
  { symbol: "META", name: "Meta Platforms (臉書)", category: "stock_us", basePrice: 480.0 },
  { symbol: "NFLX", name: "Netflix Inc. (奈飛)", category: "stock_us", basePrice: 610.0 },

  // --- Asia Stocks & Indices ---
  { symbol: "2330.TW", name: "TSMC (台積電)", category: "stock_asia", basePrice: 875.0 },
  { symbol: "2317.TW", name: "Foxconn (鴻海)", category: "stock_asia", basePrice: 180.0 },
  { symbol: "2454.TW", name: "MediaTek (聯發科)", category: "stock_asia", basePrice: 1100.0 },
  { symbol: "9984.T", name: "SoftBank Group (軟銀)", category: "stock_asia", basePrice: 8900.0 },
  { symbol: "7203.T", name: "Toyota Motor (豐田)", category: "stock_asia", basePrice: 3300.0 },
  { symbol: "0700.HK", name: "Tencent Holdings (騰訊)", category: "stock_asia", basePrice: 382.0 },
  { symbol: "9988.HK", name: "Alibaba Group (阿里巴巴)", category: "stock_asia", basePrice: 80.0 },
  { symbol: "005930.KS", name: "Samsung Electronics (三星電子)", category: "stock_asia", basePrice: 75000.0 },
  { symbol: "^N225", name: "Nikkei 225 (日經225)", category: "stock_asia", basePrice: 38500.0 },
  { symbol: "^HSI", name: "Hang Seng Index (恆生指數)", category: "stock_asia", basePrice: 18500.0 },

  // --- Futures & Commodities ---
  { symbol: "GOLD", name: "Gold Spot (黃金現貨期貨)", category: "futures", basePrice: 2345.5 },
  { symbol: "OIL", name: "Brent Crude Oil (布蘭特原油期貨)", category: "futures", basePrice: 82.3 },
  { symbol: "US500", name: "S&P 500 Index Futures (標普500期貨)", category: "futures", basePrice: 5280.0 },
  { symbol: "NQ=F", name: "Nasdaq 100 Futures (那指期貨)", category: "futures", basePrice: 18500.0 },

  // --- Taiwan ETFs ---
  { symbol: "0050.TW", name: "Yuanta Taiwan 50 (元大台灣50)", category: "etf", basePrice: 168.5 },
  { symbol: "0056.TW", name: "Yuanta Taiwan High Yield (元大高股息)", category: "etf", basePrice: 40.2 },
  { symbol: "00878.TW", name: "Cathay MSCI Taiwan ESG (國泰永續高股息)", category: "etf", basePrice: 22.5 },
  { symbol: "00919.TW", name: "Capital Carefree High Div (群益台灣精選高息)", category: "etf", basePrice: 25.8 },
  { symbol: "00929.TW", name: "Fuh Hwa Taiwan Tech (復華台灣科技優息)", category: "etf", basePrice: 20.1 },
  { symbol: "006208.TW", name: "Fu Bon Taiwan 50 (富邦台50)", category: "etf", basePrice: 95.0 },

  // --- US ETFs ---
  { symbol: "SPY", name: "SPDR S&P 500 ETF (標普500 ETF)", category: "etf", basePrice: 525.4 },
  { symbol: "QQQ", name: "Invesco QQQ Trust (納指100 ETF)", category: "etf", basePrice: 452.1 },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF (領航標普500 ETF)", category: "etf", basePrice: 485.5 },
  { symbol: "VTI", name: "Vanguard Total Stock Market (全美股市 ETF)", category: "etf", basePrice: 260.0 },
  { symbol: "ARKK", name: "ARK Innovation ETF (方舟旗艦創新 ETF)", category: "etf", basePrice: 44.8 },
  { symbol: "SOXX", name: "iShares Semiconductor ETF (半導體 ETF)", category: "etf", basePrice: 228.6 },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average (道瓊 ETF)", category: "etf", basePrice: 395.2 },
  { symbol: "VT", name: "Vanguard Total World Stock (全世界股市 ETF)", category: "etf", basePrice: 110.0 },
  { symbol: "BND", name: "Vanguard Total Bond Market (美國總體債券 ETF)", category: "etf", basePrice: 72.0 },
];

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerState {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changeAmount: number;
  changePercent: number;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  candles: Candle[];
}

export const database = new Map<string, TickerState>();

/**
 * Market Status Logic
 * Determines if a specific market is currently open.
 */
export function getMarketStatus(symbol: string): { status: string; hours: string; isOpen: boolean } {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const currentTimeInUtc = utcHours + utcMinutes / 60;

  // Crypto is always open 24/7
  if (ASSET_DIRECTORY.find(a => a.symbol === symbol)?.category === "crypto") {
    return { status: "🟢 開盤中 (24/7)", hours: "全天候交易", isOpen: true };
  }

  // Taiwan Market (UTC+8): 09:00 - 13:30. UTC: 01:00 - 05:30
  if (symbol.endsWith(".TW")) {
    const isWeekend = utcDay === 0 || utcDay === 6;
    const isTradingHours = currentTimeInUtc >= 1.0 && currentTimeInUtc <= 5.5;
    const isTrial = currentTimeInUtc >= 0.5 && currentTimeInUtc < 1.0;

    if (isWeekend) return { status: "🔴 休市中 (週末)", hours: "09:00 - 13:30", isOpen: false };
    if (isTrial) return { status: "🟡 盤前試搓", hours: "08:30 - 09:00", isOpen: false };
    if (isTradingHours) return { status: "🟢 開盤中", hours: "09:00 - 13:30", isOpen: true };
    return { status: "🔴 已收盤", hours: "09:00 - 13:30", isOpen: false };
  }

  // US Market (UTC-4/5): 09:30 - 16:00. UTC: 13:30 - 20:00 (Approx)
  const isUS = ["SPY", "QQQ", "VOO", "VTI", "ARKK", "SOXX", "DIA", "AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "NFLX"].includes(symbol) || symbol.includes("US500");
  if (isUS) {
    const isWeekend = utcDay === 0 || utcDay === 6;
    const isTradingHours = currentTimeInUtc >= 13.5 && currentTimeInUtc <= 20.0;
    const isPreMarket = currentTimeInUtc >= 8.0 && currentTimeInUtc < 13.5;

    if (isWeekend) return { status: "🔴 休市中 (週末)", hours: "21:30 - 04:00", isOpen: false };
    if (isPreMarket) return { status: "🟡 盤前交易", hours: "16:00 - 21:30", isOpen: false };
    if (isTradingHours) return { status: "🟢 開盤中", hours: "21:30 - 04:00", isOpen: true };
    return { status: "🔴 已收盤", hours: "21:30 - 04:00", isOpen: false };
  }

  return { status: "⚪ 狀態未知", hours: "--:--", isOpen: false };
}

// Generate beautiful fallback candles for any asset
export function generateCandlesForTimeframe(basePrice: number, timeframe: string = "1m"): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = basePrice * 0.98;
  const now = Date.now();

  let timeStep = 60 * 1000;
  let count = 100;
  if (timeframe === "5m") {
    timeStep = 5 * 60 * 1000;
  } else if (timeframe === "15m") {
    timeStep = 15 * 60 * 1000;
  } else if (timeframe === "1h") {
    timeStep = 60 * 60 * 1000;
  } else if (timeframe === "4h") {
    timeStep = 4 * 60 * 60 * 1000;
  } else if (timeframe === "1d") {
    timeStep = 24 * 60 * 60 * 1000;
    count = 150;
  }

  for (let i = count; i >= 0; i--) {
    const open = currentPrice;
    const change = (Math.random() - 0.492) * (basePrice * 0.006);
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.003);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.003);
    const volume = Math.floor(Math.random() * 5000) + 200;

    candles.push({
      time: now - i * timeStep,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Number(volume.toFixed(0)),
    });
    currentPrice = close;
  }
  return candles;
}

// Yahoo Symbol translation
export function getYahooSymbol(symbol: string): string {
  if (symbol === "BTC") return "BTC-USD";
  if (symbol === "ETH") return "ETH-USD";
  if (symbol === "SOL") return "SOL-USD";
  if (symbol === "XRP") return "XRP-USD";
  if (symbol === "GOLD") return "GC=F";
  if (symbol === "OIL") return "CL=F";
  if (symbol === "US500") return "ES=F";
  return symbol;
}

// Binance Symbol translation
export function getBinanceSymbol(symbol: string): string {
  if (symbol === "BTC") return "BTCUSDT";
  if (symbol === "ETH") return "ETHUSDT";
  if (symbol === "SOL") return "SOLUSDT";
  if (symbol === "XRP") return "XRPUSDT";
  return "";
}

function getTimeframeParams(timeframe: string): { range: string; interval: string } {
  switch (timeframe) {
    case "1m": return { range: "1d", interval: "1m" };
    case "5m": return { range: "5d", interval: "5m" };
    case "15m": return { range: "5d", interval: "15m" };
    case "1h": return { range: "1mo", interval: "1h" };
    case "4h": return { range: "3mo", interval: "1h" };
    case "1d": return { range: "1y", interval: "1d" };
    default: return { range: "1d", interval: "1m" };
  }
}

function getBinanceInterval(timeframe: string): string {
  switch (timeframe) {
    case "1m": return "1m";
    case "5m": return "5m";
    case "15m": return "15m";
    case "1h": return "1h";
    case "4h": return "4h";
    case "1d": return "1d";
    default: return "1m";
  }
}

// Low latency cache store
interface CacheEntry {
  candles: Candle[];
  timestamp: number;
}
const cacheStore = new Map<string, CacheEntry>();

// High fidelity downloader with multiple fallbacks (Yahoo -> Binance -> Mock Simulator)
export async function getAssetCandles(symbol: string, timeframe: string, basePrice: number): Promise<Candle[]> {
  const cacheKey = `${symbol}_${timeframe}`;
  const cached = cacheStore.get(cacheKey);
  const now = Date.now();

  // Cache for 10 seconds
  if (cached && now - cached.timestamp < 10000) {
    return cached.candles;
  }

  // 1. First choice: try Yahoo finance
  try {
    const { range, interval } = getTimeframeParams(timeframe);
    const candles = await fetchYahooCandles(symbol, range, interval);
    cacheStore.set(cacheKey, { candles, timestamp: now });
    return candles;
  } catch (yahooErr: any) {
    console.warn(`[Prices Engine] Yahoo fetch failed for ${symbol} @ ${timeframe}. Trying backup sources...`);

    // 2. Second choice: Try Binance API if symbol is a standard crypto
    const binanceSymbol = getBinanceSymbol(symbol);
    if (binanceSymbol) {
      try {
        const binanceInterval = getBinanceInterval(timeframe);
        const candles = await fetchBinanceCandles(binanceSymbol, binanceInterval);
        console.log(`[Prices Engine] Real price synchronized from Binance API for ${symbol}.`);
        cacheStore.set(cacheKey, { candles, timestamp: now });
        return candles;
      } catch (binanceErr: any) {
        console.error(`[Prices Engine] Binance fallback failed too:`, binanceErr.message);
      }
    }

    // 3. Final choice: generate beautiful simulation data
    const candles = generateCandlesForTimeframe(basePrice, timeframe);
    cacheStore.set(cacheKey, { candles, timestamp: now });
    return candles;
  }
}

async function fetchYahooCandles(symbol: string, range: string, interval: string): Promise<Candle[]> {
  const yahooSymbol = getYahooSymbol(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP status ${res.status}`);
  }

  const json: any = await res.json();
  const quoteData = json?.chart?.result?.[0];
  if (!quoteData) {
    throw new Error("Empty Quote Results");
  }

  const timestamps: number[] = quoteData.timestamp || [];
  const indicators = quoteData.indicators?.quote?.[0] || {};
  const opens: (number | null)[] = indicators.open || [];
  const highs: (number | null)[] = indicators.high || [];
  const lows: (number | null)[] = indicators.low || [];
  const closes: (number | null)[] = indicators.close || [];
  const volumes: (number | null)[] = indicators.volume || [];

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = opens[i];
    const h = highs[i];
    const l = lows[i];
    const c = closes[i];
    const v = volumes[i];

    if (o !== null && h !== null && l !== null && c !== null) {
      candles.push({
        time: timestamps[i] * 1000,
        open: Number(o.toFixed(2)),
        high: Number(h.toFixed(2)),
        low: Number(l.toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: Number((v || 0).toFixed(0)),
      });
    }
  }

  if (candles.length === 0) {
    throw new Error("Zero candles loaded from yahoo");
  }

  return candles;
}

// Fetch cryptos candles from public Binance APIs
async function fetchBinanceCandles(binanceSymbol: string, interval: string): Promise<Candle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=120`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Binance network issue. HTTP ${res.status}`);
  }
  const resultList: any[] = await res.json();
  return resultList.map((item) => ({
    time: Number(item[0]),
    open: Number(Number(item[1]).toFixed(2)),
    high: Number(Number(item[2]).toFixed(2)),
    low: Number(Number(item[3]).toFixed(2)),
    close: Number(Number(item[4]).toFixed(2)),
    volume: Number(Number(item[5]).toFixed(0)),
  }));
}
