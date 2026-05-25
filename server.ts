import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Import modules
import { initializeDatabase } from "./server/db";
import { apiRouter, sendDiscordMessage } from "./server/routes";
import { setupWebSocket, startMarketSimulation } from "./server/websocket";
import { database, ASSET_DIRECTORY, getYahooSymbol, generateCandlesForTimeframe } from "./server/prices";

// Set IPv4 preference for stable connection resolutions
dns.setDefaultResultOrder("ipv4first");

const app = express();
const server = http.createServer(app);
const PORT = 8080; // MUST BE FIXED TO 8080 due to platform sandboxing context

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
  "GC=F": "GOLD",
  "CL=F": "OIL",
  "ES=F": "US500",
};

async function syncRealPricesFromYahoo() {
  try {
    const symbolsList = ASSET_DIRECTORY.map((asset) => getYahooSymbol(asset.symbol));
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsList.join(",")}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      throw new Error(`Yahoo HTTP quote error: ${res.status}`);
    }
    const json: any = await res.json();
    const results = json?.quoteResponse?.result || [];

    results.forEach((quote: any) => {
      const yahooSymbol = quote.symbol;
      const symbol = REVERSE_YAHOO_MAPPING[yahooSymbol] || yahooSymbol;
      const ticker = database.get(symbol);
      if (ticker) {
        if (quote.regularMarketPrice !== undefined) ticker.price = quote.regularMarketPrice;
        if (quote.regularMarketOpen !== undefined) ticker.open = quote.regularMarketOpen;
        if (quote.regularMarketDayHigh !== undefined) ticker.high = quote.regularMarketDayHigh;
        if (quote.regularMarketDayLow !== undefined) ticker.low = quote.regularMarketDayLow;
        if (quote.regularMarketChange !== undefined) ticker.changeAmount = quote.regularMarketChange;
        if (quote.regularMarketChangePercent !== undefined) ticker.changePercent = quote.regularMarketChangePercent;
        if (quote.regularMarketVolume !== undefined) ticker.volume = quote.regularMarketVolume;

        const spread = symbol === "BTC" ? 2.5 : symbol === "ETH" ? 0.4 : ticker.price * 0.0005;
        ticker.bidPrice = Number((ticker.price - spread / 2).toFixed(2));
        ticker.askPrice = Number((ticker.price + spread / 2).toFixed(2));
      }
    });
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

  // Hot sync immediately, then poll every 6 seconds
  syncRealPricesFromYahoo();
  setInterval(syncRealPricesFromYahoo, 6000);
}

// -------------------------------------------------------------
// WebSocket Initialization & Hook upgrading
// -------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
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

  // 3. Vite compilation mounting modes
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

  // 4. Ingress listen triggers
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
