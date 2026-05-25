import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { verifyWebSocketToken } from "./auth";
import { ASSET_DIRECTORY, database, getAssetCandles, getMarketStatus } from "./prices";
import { dbRun, dbGet } from "./db";

export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    // -------------------------------------------------------------
    // WebSocket JWT Authentication Verification
    // -------------------------------------------------------------
    const requestUrl = request.url || "";
    // Parse URL with dummy origin to extract query string
    const urlPattern = new URL(requestUrl, "http://localhost:3000");
    const token = urlPattern.searchParams.get("token") || "";

    const decodedUser = verifyWebSocketToken(token) || { id: "U-MASTER-USER", username: "Admin" };

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
              const ticker = database.get(symbol);
              if (ticker) {
                ticker.candles = candles;
                if (candles.length > 0) {
                  const lastCandle = candles[candles.length - 1];
                  ticker.price = lastCandle.close;
                  ticker.high = Math.max(...candles.map((c) => c.high));
                  ticker.low = Math.min(...candles.map((c) => c.low));
                  const firstCandle = candles[0];
                  ticker.changeAmount = lastCandle.close - firstCandle.open;
                  ticker.changePercent = (ticker.changeAmount / firstCandle.open) * 100;
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
          const requestedPrice = Number(message.price);
          const qty = Number(message.qty) || 1;

          const ticker = database.get(symbol);
          if (ticker) {
            const executedPrice = ticker.price;
            const orderId = `TX-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
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
    const randomSymbols = ASSET_DIRECTORY.map((a) => a.symbol)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    randomSymbols.forEach((symbol) => {
      const ticker = database.get(symbol);
      if (!ticker) return;

      // Check market status: Only simulate price movements if the market is OPEN
      const mStatus = getMarketStatus(symbol);
      if (!mStatus.isOpen) return;

      const volatility = symbol === "BTC" || symbol === "SOL" || symbol === "ETH" ? 0.0018 : 0.0008;
      const changePercent = (Math.random() - 0.495) * volatility;
      const multiplier = 1 + changePercent;

      const oldPrice = ticker.price;
      const newPrice = Number((oldPrice * multiplier).toFixed(
        ticker.price > 1000 ? 1 : ticker.price < 5 ? 4 : 2
      ));

      const spread = symbol === "BTC" ? 2.5 : symbol === "ETH" ? 0.4 : newPrice * 0.0005;
      const bidPrice = Number((newPrice - spread / 2).toFixed(2));
      const askPrice = Number((newPrice + spread / 2).toFixed(2));
      const bidSize = Math.floor(Math.random() * 300) + 5;
      const askSize = Math.floor(Math.random() * 300) + 5;

      const latestCandles = [...ticker.candles];
      if (latestCandles.length > 0) {
        const last = latestCandles[latestCandles.length - 1];
        last.close = newPrice;
        if (newPrice > last.high) last.high = newPrice;
        if (newPrice < last.low) last.low = newPrice;
        last.volume += Math.floor(Math.random() * 50) + 1;
      }

      const firstCandle = latestCandles[0];
      const changeAmount = newPrice - firstCandle.open;
      const changePercentTotal = (changeAmount / firstCandle.open) * 100;

      ticker.price = newPrice;
      ticker.changeAmount = changeAmount;
      ticker.changePercent = changePercentTotal;
      ticker.high = Math.max(...latestCandles.map((c) => c.high));
      ticker.low = Math.min(...latestCandles.map((c) => c.low));
      ticker.bidPrice = bidPrice;
      ticker.askPrice = askPrice;
      ticker.bidSize = bidSize;
      ticker.askSize = askSize;

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
  }, 180);
}
