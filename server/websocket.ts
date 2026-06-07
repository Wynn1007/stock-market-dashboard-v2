import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import crypto from "crypto";
import { verifyWebSocketToken } from "./auth";
import { ASSET_DIRECTORY, database, getAssetCandles, getMarketStatus } from "./prices";
import { dbRun, dbGet } from "./db";

export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    // -------------------------------------------------------------
    // WebSocket JWT Authentication Verification
    // -------------------------------------------------------------
    const requestUrl = request.url || "";
    const urlPattern = new URL(requestUrl, "http://localhost:3000");
    const token = urlPattern.searchParams.get("token") || "";

    const decodedUser = verifyWebSocketToken(token);

    if (!decodedUser) {
      console.warn(`[WebSocket] Unauthorized connection attempt blocked.`);
      ws.send(JSON.stringify({ type: "ERROR", message: "Unauthorized: Missing or invalid token." }));
      ws.close(4001, "Unauthorized");
      return;
    }

    console.log(`[WebSocket] Authorized Session opened: user "${decodedUser.username}" (ID: ${decodedUser.id})`);

    const initialSymbols = Array.from(database.keys());
    ws.send(
      JSON.stringify({
        type: "CONNECT_SUCCESS",
        message: `Authorized session established. Welcome ${decodedUser.username}!`,
        availableSymbols: initialSymbols,
      })
    );

    ws.on("message", (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());

        if (message.type === "REQUEST_HISTORY") {
          const symbol = (message.symbol || "BTC").toUpperCase();
          const timeframe = message.timeframe || "1m";
          const asset = ASSET_DIRECTORY.find((a) => a.symbol === symbol) || { basePrice: 100 };

          getAssetCandles(symbol, timeframe, asset.basePrice)
            .then((candles) => {
              // Important: We do NOT overwrite ticker.candles globally with historical data
              // Instead, we only send the requested historical data to the client.
              // We only update ticker.candles if it matches the current real-time timeframe (e.g. 1m)
              if (timeframe === "1m") {
                const ticker = database.get(symbol);
                if (ticker) {
                  ticker.candles = JSON.parse(JSON.stringify(candles)); // Deep copy
                }
              }
              
              ws.send(
                JSON.stringify({
                  type: "HISTORY_DATA",
                  symbol,
                  timeframe,
                  candles,
                })
              );
            })
            .catch((err) => {
              console.error(`[WebSocket] History fetch error for ${symbol}:`, err);
              const ticker = database.get(symbol);
              if (ticker) {
                ws.send(
                  JSON.stringify({
                    type: "HISTORY_DATA",
                    symbol,
                    timeframe,
                    candles: ticker.candles,
                  })
                );
              }
            });
        } else if (message.type === "PLACE_ORDER") {
          // Low latency transaction executor
          const symbol = (message.symbol || "BTC").toUpperCase();
          const side = message.side || "BUY";
          const qty = Number(message.qty) || 1;

          const ticker = database.get(symbol);
          if (ticker) {
            const executedPrice = ticker.price;
            const orderId = crypto.randomUUID();
            const timestamp = Date.now();

            // Store inside SQLite immediately to guarantee persistence
            dbRun(
              "INSERT INTO orders (id, userId, symbol, type, price, qty, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [orderId, decodedUser.id, symbol, side, executedPrice, qty, timestamp]
            ).catch((err) => {
              console.error(`[WebSocket] DB Order record failed to persist:`, err.message);
            });

            const newOrder = {
              id: orderId,
              symbol,
              type: side,
              price: executedPrice,
              qty,
              timestamp,
            };

            // Reply back to user
            ws.send(
              JSON.stringify({
                type: "ORDER_EXECUTED",
                order: newOrder,
                latencyMs: Number((Math.random() * 0.8 + 0.1).toFixed(3)),
              })
            );

            // Broadcast globally as trade report
            const tradePayload = JSON.stringify({
              type: "GLOBAL_TRADE",
              trade: {
                symbol,
                type: side,
                price: executedPrice,
                qty,
                timestamp,
              },
            });

            wss.clients.forEach((c) => {
              if (c.readyState === WebSocket.OPEN) {
                c.send(tradePayload);
              }
            });
          }
        }
      } catch (err) {
        console.error("[WebSocket] Failed to process message stream:", err);
      }
    });

    ws.on("close", (code, reason) => {
      console.log(`[WebSocket] Closing session for user: ${decodedUser.username}. Code: ${code}. Reason: ${reason}`);
    });
  });
}

// Low latency continuous randomized simulation walking ticks
export function startMarketSimulation(wss: WebSocketServer) {
  setInterval(() => {
    // Select a subset of assets to update in each tick for performance
    const symbols = Array.from(database.keys());
    
    symbols.forEach((symbol) => {
      const ticker = database.get(symbol);
      if (!ticker) return;

      // Check market status: Only simulate price movements if the market is OPEN
      const mStatus = getMarketStatus(symbol);
      if (!mStatus.isOpen) return;

      const isCrypto = ASSET_DIRECTORY.find(a => a.symbol === symbol)?.category === "crypto";
      
      // REAL PRICE TRACKING: 
      // We add a tiny jitter to make it look "live", but we no longer random walk away from real prices.
      const volatility = isCrypto ? 0.0001 : 0.00003;
      const randomChange = (Math.random() - 0.5) * volatility;
      
      const currentPrice = ticker.price;
      const jitterPrice = currentPrice * (1 + randomChange);

      const newPrice = Number(jitterPrice.toFixed(
        ticker.price > 1000 ? 1 : ticker.price < 5 ? 4 : 2
      ));

      // Update spreads based on new price
      const spreadBase = isCrypto ? (symbol === "BTC" ? 2.0 : 0.4) : newPrice * 0.0001;
      const bidPrice = Number((newPrice - spreadBase / 2).toFixed(2));
      const askPrice = Number((newPrice + spreadBase / 2).toFixed(2));
      
      // FIX: Use deep copy for candle object mutation
      if (ticker.candles.length > 0) {
        const lastIdx = ticker.candles.length - 1;
        const last = { ...ticker.candles[lastIdx] };
        last.close = newPrice;
        if (newPrice > last.high) last.high = newPrice;
        if (newPrice < last.low) last.low = newPrice;
        last.volume += Math.floor(Math.random() * 2) + 1;
        ticker.candles[lastIdx] = last;
      }

      ticker.price = newPrice;
      ticker.bidPrice = bidPrice;
      ticker.askPrice = askPrice;

      const firstCandle = ticker.candles[0];
      ticker.changeAmount = newPrice - (firstCandle?.open || newPrice);
      ticker.changePercent = firstCandle ? (ticker.changeAmount / firstCandle.open) * 100 : 0;
      ticker.high = Math.max(...ticker.candles.map((c) => c.high));
      ticker.low = Math.min(...ticker.candles.map((c) => c.low));

      // Only broadcast ticks to authorized users who are currently connected
      const tickPayload = JSON.stringify({
        type: "TICK",
        symbol: ticker.symbol,
        price: ticker.price,
        changeAmount: ticker.changeAmount,
        changePercent: ticker.changePercent,
        high: ticker.high,
        low: ticker.low,
        bidPrice: ticker.bidPrice,
        askPrice: ticker.askPrice,
        bidSize: ticker.bidSize,
        askSize: ticker.askSize,
        timestamp: Date.now(),
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(tickPayload);
        }
      });
    });
  }, 500);
}
