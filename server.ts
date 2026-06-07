import "dotenv/config";
import { env } from "./server/config";
import express, { ErrorRequestHandler } from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Import modules
import { initializeDatabase } from "./server/db";
import { apiRouter, sendDiscordMessage } from "./server/routes";
import { setupWebSocket, startMarketSimulation } from "./server/websocket";
import { database, ASSET_DIRECTORY, getYahooSymbol, generateCandlesForTimeframe, getMarketStatus, getAssetCandles, getBinanceSymbol } from "./server/prices";

// Set IPv4 preference for stable connection resolutions
dns.setDefaultResultOrder("ipv4first");

const app = express();
const server = http.createServer(app);
const PORT = env.PORT; // Loaded from Zod env validation

app.use(express.json());

// Bind API routing sub-system
app.use("/api", apiRouter);

// -------------------------------------------------------------
// Live Real-Market Price Sync Engine (Yahoo Finance API)
// -------------------------------------------------------------
const REVERSE_YAHOO_MAPPING: Record<string, string> = {
  "BTC-USD": "BTC",
  "ETH-USD": "ETH",
  "SOL-USD": "SOL",
  "XRP-USD": "XRP",
  "BNB-USD": "BNB",
  "ADA-USD": "ADA",
  "DOGE-USD": "DOGE",
  "GC=F": "GOLD",
  "CL=F": "OIL",
  "ES=F": "US500",
  "NQ=F": "NQ=F",
  "TWD=X": "USDTWD",
  "JPYTWD=X": "JPYTWD",
  "HKDTWD=X": "HKDTWD",
  "KRWTWD=X": "KRWTWD",
  "2330.TW": "2330.TW",
  "2317.TW": "2317.TW",
  "2454.TW": "2454.TW",
  "2303.TW": "2303.TW",
  "2382.TW": "2382.TW",
  "2412.TW": "2412.TW",
  "2881.TW": "2881.TW",
  "2882.TW": "2882.TW",
  "2603.TW": "2603.TW",
  "2357.TW": "2357.TW",
  "0050.TW": "0050.TW",
  "0056.TW": "0056.TW",
  "00878.TW": "00878.TW",
  "00919.TW": "00919.TW",
  "00929.TW": "00929.TW",
  "006208.TW": "006208.TW",
  "00713.TW": "00713.TW",
  "00939.TW": "00939.TW",
  "00940.TW": "00940.TW",
  "00757.TW": "00757.TW",
  "^N225": "^N225",
  "^HSI": "^HSI",
  "9984.T": "9984.T",
  "7203.T": "7203.T",
  "0700.HK": "0700.HK",
  "9988.HK": "9988.HK",
  "005930.KS": "005930.KS",
  "AAPL": "AAPL",
  "TSLA": "TSLA",
  "NVDA": "NVDA",
  "MSFT": "MSFT",
  "GOOGL": "GOOGL",
  "AMZN": "AMZN",
  "META": "META",
  "NFLX": "NFLX",
  "SPY": "SPY",
  "QQQ": "QQQ",
  "VOO": "VOO",
  "VTI": "VTI",
  "ARKK": "ARKK",
  "SOXX": "SOXX",
  "DIA": "DIA",
  "VT": "VT",
  "BND": "BND",
};

// -------------------------------------------------------------
// Live Real-Market Price Sync Engine (Yahoo Finance API)
// -------------------------------------------------------------

// Track market open states to trigger calibration on transition
const marketOpenStates = new Map<string, boolean>();

async function syncRealPricesFromYahoo() {
  try {
    const symbolsList = ASSET_DIRECTORY.map((asset) => getYahooSymbol(asset.symbol));
    const extraRates = ["JPYTWD=X", "HKDTWD=X", "KRWTWD=X"];
    const fullSymbols = [...new Set([...symbolsList, ...extraRates])];
    
    // Using query1.finance.yahoo.com which is sometimes more permissive than query2
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${fullSymbols.join(",")}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://finance.yahoo.com/",
      },
    });
    if (!res.ok) throw new Error(`Yahoo HTTP quote error: ${res.status}`);
    const json: any = await res.json();
    const results = json?.quoteResponse?.result || [];

    for (const quote of results) {
      const yahooSymbol = quote.symbol;
      let symbol = REVERSE_YAHOO_MAPPING[yahooSymbol];
      
      if (!symbol) {
        const found = ASSET_DIRECTORY.find(a => getYahooSymbol(a.symbol) === yahooSymbol);
        symbol = found ? found.symbol : yahooSymbol;
      }
      
      // Auto-initialize if it's an exchange rate we need
      if (!database.has(symbol) && symbol.endsWith("TWD")) {
        database.set(symbol, {
          symbol,
          price: quote.regularMarketPrice || 1,
          open: quote.regularMarketOpen || 1,
          high: quote.regularMarketDayHigh || 1,
          low: quote.regularMarketDayLow || 1,
          close: quote.regularMarketPrice || 1,
          volume: 0,
          changeAmount: 0,
          changePercent: 0,
          bidPrice: quote.regularMarketPrice || 1,
          askPrice: quote.regularMarketPrice || 1,
          bidSize: 0,
          askSize: 0,
          candles: [],
        });
      }

      const ticker = database.get(symbol);
      if (ticker) {
        // --- Market Open Calibration & Chart Sync Logic ---
        const { isOpen } = getMarketStatus(symbol);
        const wasOpen = marketOpenStates.get(symbol) || false;
        
        // If price delta is huge or market just transitioned to open, force a full chart re-sync
        const currentPrice = quote.regularMarketPrice || ticker.price;
        const priceGap = Math.abs(ticker.price - currentPrice) / (ticker.price || 1);
        const shouldSyncCharts = (isOpen && !wasOpen) || priceGap > 0.05;

        if (shouldSyncCharts) {
          console.log(`[Calibration] Market event detected for ${symbol} (Price Gap: ${(priceGap*100).toFixed(2)}%). Synchronizing historical chart data...`);
          try {
            const freshCandles = await getAssetCandles(symbol, "1m", currentPrice);
            ticker.candles = freshCandles;
          } catch (e) {
            console.error(`[Calibration Error] Chart sync failed for ${symbol}`);
          }
        }
        marketOpenStates.set(symbol, isOpen);

        if (quote.regularMarketPrice !== undefined) ticker.price = quote.regularMarketPrice;
        if (quote.regularMarketOpen !== undefined) ticker.open = quote.regularMarketOpen;
        if (quote.regularMarketDayHigh !== undefined) ticker.high = quote.regularMarketDayHigh;
        if (quote.regularMarketDayLow !== undefined) ticker.low = quote.regularMarketDayLow;
        if (quote.regularMarketChange !== undefined) ticker.changeAmount = quote.regularMarketChange;
        if (quote.regularMarketChangePercent !== undefined) ticker.changePercent = quote.regularMarketChangePercent;
        if (quote.regularMarketVolume !== undefined) ticker.volume = quote.regularMarketVolume;

        // Sync candles with new price
        if (ticker.candles.length > 0 && quote.regularMarketPrice !== undefined) {
          const lastIdx = ticker.candles.length - 1;
          const last = { ...ticker.candles[lastIdx] };
          last.close = ticker.price;
          if (ticker.price > last.high) last.high = ticker.price;
          if (ticker.price < last.low) last.low = ticker.price;
          ticker.candles[lastIdx] = last;
        }

        const spread = symbol === "BTC" ? 2.5 : symbol === "ETH" ? 0.4 : ticker.price * 0.0005;
        ticker.bidPrice = Number((ticker.price - spread / 2).toFixed(2));
        ticker.askPrice = Number((ticker.price + spread / 2).toFixed(2));
      }
    }
    console.log(`[Yahoo Live Sync] Synced ${results.length} real asset prices.`);
  } catch (err: any) {
    console.warn(`[Yahoo Live Sync Warning] Could not load live ticker prices:`, err.message);
  }
}

// Populate Database with Initial Stock/Crypto States
function populateStateCache() {
  ASSET_DIRECTORY.forEach((asset) => {
    const candles = generateCandlesForTimeframe(asset.basePrice, "1m");
    const lastCandle = candles[candles.length - 1];
    const prevClose = candles[0].open;
    const changeAmount = lastCandle.close - prevClose;
    const changePercent = (changeAmount / prevClose) * 100;

    const ticker = {
      symbol: asset.symbol,
      price: lastCandle.close,
      open: lastCandle.open,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      close: lastCandle.close,
      volume: candles.reduce((acc, c) => acc + c.volume, 0),
      changeAmount,
      changePercent,
      bidPrice: Number((lastCandle.close * 0.9995).toFixed(2)),
      askPrice: Number((lastCandle.close * 1.0005).toFixed(2)),
      bidSize: Math.floor(Math.random() * 150) + 10,
      askSize: Math.floor(Math.random() * 150) + 10,
      candles,
    };
    database.set(asset.symbol, ticker);
  });
}

async function syncCryptoFromBinance() {
  const cryptos = ASSET_DIRECTORY.filter(a => a.category === "crypto");
  for (const asset of cryptos) {
    try {
      const binanceSymbol = getBinanceSymbol(asset.symbol);
      if (!binanceSymbol) continue;

      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
      if (!res.ok) continue;
      const data: any = await res.json();
      
      const ticker = database.get(asset.symbol);
      if (ticker) {
        ticker.price = Number(data.lastPrice);
        ticker.high = Number(data.highPrice);
        ticker.low = Number(data.lowPrice);
        ticker.volume = Number(data.volume);
        ticker.changePercent = Number(data.priceChangePercent);
        ticker.changeAmount = Number(data.priceChange);

        // Sync candles
        if (ticker.candles.length > 0) {
          const lastIdx = ticker.candles.length - 1;
          const last = { ...ticker.candles[lastIdx] };
          last.close = ticker.price;
          if (ticker.price > last.high) last.high = ticker.price;
          if (ticker.price < last.low) last.low = ticker.price;
          ticker.candles[lastIdx] = last;
        }
        
        const spread = asset.symbol === "BTC" ? 2.5 : asset.symbol === "ETH" ? 0.4 : ticker.price * 0.0005;
        ticker.bidPrice = Number((ticker.price - spread / 2).toFixed(2));
        ticker.askPrice = Number((ticker.price + spread / 2).toFixed(2));
      }
    } catch (err) {
      // Silent fail for background sync
    }
  }
}

// -------------------------------------------------------------
// WebSocket Initialization & Hook upgrading
// -------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });

const ALLOWED_ORIGINS = [
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`
];

server.on("upgrade", (request, socket, head) => {
  const origin = request.headers['origin'];

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`[WebSocket] Blocked connection from invalid origin: ${origin}`);
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

setupWebSocket(wss);
startMarketSimulation(wss);

// -------------------------------------------------------------
// Core System Bootstrap Start Node
// -------------------------------------------------------------
async function startApp() {
  // 1. Setup Database Layer
  await initializeDatabase();

  // 2. Clear state cache
  populateStateCache();

  // 3. Start Sync Engines after initial population
  syncRealPricesFromYahoo();
  setInterval(syncRealPricesFromYahoo, 8000); // 8 seconds for Yahoo
  
  syncCryptoFromBinance();
  setInterval(syncCryptoFromBinance, 2000); // 2 seconds for Crypto

  // 4. Vite compilation mounting modes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // --- Global Error Handling (Must be after all routes) ---
  // 404 Not Found Handler
  app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Endpoint not found." });
  });

  // 500 Global Error Handler
  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error("[Global Error Handler]:", err.stack);
    res.status(500).json({ success: false, message: "An unexpected internal server error occurred." });
  };
  app.use(errorHandler);

  // 5. Ingress listen triggers
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`----------------------------------------------------------------------`);
    console.log(`🚀 WYNN FINANCE 2.0 BOOTED SUCCESSFULLY!`);
    console.log(`🔌 Platform Live Listening Address: http://localhost:${PORT}`);
    console.log(`📈 WebSocket High-Frequency Channel: ws://localhost:${PORT}`);
    console.log(`----------------------------------------------------------------------`);
  });
}

startApp().catch((err) => {
  console.error("Root app boot loader failed:", err);
});
