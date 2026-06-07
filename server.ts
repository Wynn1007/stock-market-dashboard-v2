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
    
    for (const yahooSymbol of symbolsList) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
        let res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Referer": "https://finance.yahoo.com/",
          },
        });

        let currentPrice, prevClose, changeAmount, changePercent, volume;

        if (res.status === 401 || res.status === 403) {
            // ULTIMATE FALLBACK: Scrape the HTML page
            const scrapeUrl = `https://finance.yahoo.com/quote/${yahooSymbol}`;
            const scrapeRes = await fetch(scrapeUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" }
            });
            if (!scrapeRes.ok) continue;
            const html = await scrapeRes.text();
            
            // Extract price using regex from the 'regularMarketPrice' data attribute or JSON blob
            const priceMatch = html.match(/"regularMarketPrice":\s*\{\s*"raw":\s*([\d.]+)/);
            const prevCloseMatch = html.match(/"regularMarketPreviousClose":\s*\{\s*"raw":\s*([\d.]+)/);
            
            if (priceMatch && priceMatch[1]) {
                currentPrice = parseFloat(priceMatch[1]);
                prevClose = prevCloseMatch ? parseFloat(prevCloseMatch[1]) : currentPrice;
                changeAmount = currentPrice - prevClose;
                changePercent = (changeAmount / prevClose) * 100;
                volume = 0; // Volume is harder to regex reliably, keep existing
            } else {
                continue;
            }
        } else if (res.ok) {
            const data: any = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (!meta) continue;
            currentPrice = meta.regularMarketPrice;
            prevClose = meta.previousClose;
            changeAmount = currentPrice - prevClose;
            changePercent = (changeAmount / prevClose) * 100;
            volume = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.volume?.slice(-1)[0] || 0;
        } else {
            continue;
        }

        let symbol = REVERSE_YAHOO_MAPPING[yahooSymbol];
        if (!symbol) {
            const found = ASSET_DIRECTORY.find(a => getYahooSymbol(a.symbol) === yahooSymbol);
            symbol = found ? found.symbol : yahooSymbol;
        }

        const ticker = database.get(symbol);
        if (ticker && currentPrice) {
            ticker.price = currentPrice;
            ticker.changeAmount = changeAmount || ticker.changeAmount;
            ticker.changePercent = changePercent || ticker.changePercent;
            ticker.volume = volume || ticker.volume;

            if (ticker.candles.length > 0) {
                const lastIdx = ticker.candles.length - 1;
                const last = { ...ticker.candles[lastIdx] };
                last.close = currentPrice;
                if (currentPrice > last.high) last.high = currentPrice;
                if (currentPrice < last.low) last.low = currentPrice;
                ticker.candles[lastIdx] = last;
            }

            const spread = symbol === "BTC" ? 2.5 : symbol === "ETH" ? 0.4 : ticker.price * 0.0005;
            ticker.bidPrice = Number((ticker.price - spread / 2).toFixed(2));
            ticker.askPrice = Number((ticker.price + spread / 2).toFixed(2));
        }
      } catch (err: any) {}
    }
    console.log(`[Yahoo Live Sync] Sync cycle completed for ${symbolsList.length} assets.`);
  } catch (err: any) {
    console.warn(`[Yahoo Live Sync Warning] Sync loop failed:`, err.message);
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
