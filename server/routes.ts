import { Router, Response } from "express";
import { authRouter, authenticateToken, AuthenticatedRequest } from "./auth";
import { dbGet, dbRun, dbAll } from "./db";
import { ASSET_DIRECTORY, database, getAssetCandles, getMarketStatus } from "./prices";
import { GoogleGenAI } from "@google/genai";
import { fetchNewsForSymbol, summarizeNews, sendNewsToDiscord } from "./news";
import { env } from "./config";
import { validate, WebhookSchema, LedgerEntrySchema, WatchlistSchema, OrderSchema } from "./validation";

export const apiRouter = Router();

// --- Mount all sub-routers ---
apiRouter.use("/auth", authRouter);

// Configure Google Gen AI API
const GEMINI_API_KEY = env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  } catch (err) {
    console.error("Failed to initialize Google Gen AI:", err);
  }
}

// -------------------------------------------------------------
// Discord Webhook Notification System (Active Integration)
// -------------------------------------------------------------
export async function sendDiscordMessage(webhookUrl: string | undefined, title: string, messageText: string, colorHex: number = 0x2563eb) {
    if (!webhookUrl) return;
    try {
        const embed = { title, description: messageText, color: colorHex, timestamp: new Date().toISOString(), footer: { text: "Wynn Finance 2.0 Notification Service" } };
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (err: any) {
        console.error("[Discord Notification Error] Failed to dispatch webhook:", err.message);
    }
}

async function getUserWebhook(userId: string): Promise<string | undefined> {
  const user = await dbGet("SELECT discordWebhook FROM users WHERE id = ?", [userId]);
  return user?.discordWebhook;
}

// -------------------------------------------------------------
// Rate Limiter for Gemini AI Code
// -------------------------------------------------------------
const rateLimits = new Map<string, { count: number; windowStart: number }>();
const MAX_AI_DIAGNOSES_PER_MINUTE = 5;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const limitWindowMs = 60000;
  const userLimit = rateLimits.get(userId);
  if (!userLimit) {
    rateLimits.set(userId, { count: 1, windowStart: now });
    return false;
  }
  if (now - userLimit.windowStart > limitWindowMs) {
    rateLimits.set(userId, { count: 1, windowStart: now });
    return false;
  }
  if (userLimit.count >= MAX_AI_DIAGNOSES_PER_MINUTE) return true;
  userLimit.count += 1;
  return false;
}

// -------------------------------------------------------------
// Route Implementations
// -------------------------------------------------------------

apiRouter.post("/discord/webhook", authenticateToken, validate(WebhookSchema), async (req: AuthenticatedRequest, res) => {
  const { url, webhookUrl } = req.body;
  const targetUrl = url !== undefined ? url : webhookUrl;
  await dbRun("UPDATE users SET discordWebhook = ? WHERE id = ?", [targetUrl, req.user?.id]);
  if (targetUrl) sendDiscordMessage(targetUrl, "系統整合成功", `🚀 使用者 **${req.user?.username}** 成功整合 Discord Webhook 通知！`, 0x10b981);
  res.json({ success: true, message: "Discord configuration saved." });
});

apiRouter.get("/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const user = await dbGet("SELECT id, username, createdAt FROM users WHERE id = ?", [req.user?.id]);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
});

apiRouter.get("/assets", (req, res) => {
  const result = ASSET_DIRECTORY.map(asset => ({
    ...asset,
    ...database.get(asset.symbol),
    marketStatus: getMarketStatus(asset.symbol)
  }));
  res.json({ success: true, assets: result });
});

apiRouter.get("/assets/:symbol", (req, res) => {
  const ticker = database.get(req.params.symbol.toUpperCase());
  if (!ticker) return res.status(404).json({ success: false, message: "Asset not found." });
  res.json({ success: true, data: { ...ticker, marketStatus: getMarketStatus(ticker.symbol) } });
});

apiRouter.get("/ledger", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const entries = await dbAll("SELECT * FROM ledger WHERE userId = ? ORDER BY date DESC, createdAt DESC", [req.user?.id]);
  res.json({ success: true, ledger: entries });
});

apiRouter.post("/ledger", authenticateToken, validate(LedgerEntrySchema), async (req: AuthenticatedRequest, res) => {
  const { type, category, amount, date, description } = req.body;
  const entryId = `LEDGER-${Date.now()}`;
  await dbRun( `INSERT INTO ledger (id, userId, type, category, amount, date, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [entryId, req.user?.id, type, category, amount, date, description || "", Date.now()]);
  if (amount >= 10000) {
    const webhookUrl = await getUserWebhook(req.user?.id as string);
    sendDiscordMessage(webhookUrl, "大額記帳申報通知", `💰 使用者 **${req.user?.username}** 申報了一筆大額記帳：
- **分類**：${type}
- **項目**：${category}
- **金額**：$${amount.toLocaleString()}`, type === "income" ? 0x10b981 : 0xef4444);
  }
  res.status(201).json({ success: true, message: "Ledger entry created." });
});

apiRouter.delete("/ledger/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  await dbRun("DELETE FROM ledger WHERE id = ? AND userId = ?", [req.params.id, req.user?.id]);
  res.json({ success: true, message: "Entry deleted." });
});

apiRouter.get("/watchlist", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const items = await dbAll("SELECT symbol FROM watchlist WHERE userId = ? ORDER BY createdAt ASC", [req.user?.id]);
  res.json({ success: true, watchlist: items.map(i => i.symbol) });
});

apiRouter.post("/watchlist", authenticateToken, validate(WatchlistSchema), async (req: AuthenticatedRequest, res) => {
  const { symbol } = req.body;
  await dbRun("INSERT OR IGNORE INTO watchlist (userId, symbol, createdAt) VALUES (?, ?, ?)", [req.user?.id, symbol.toUpperCase(), Date.now()]);
  res.json({ success: true, message: "Asset added to watchlist." });
});

apiRouter.delete("/watchlist/:symbol", authenticateToken, async (req: AuthenticatedRequest, res) => {
  await dbRun("DELETE FROM watchlist WHERE userId = ? AND symbol = ?", [req.user?.id, req.params.symbol.toUpperCase()]);
  res.json({ success: true, message: "Asset removed from watchlist." });
});

apiRouter.get("/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
  const orders = await dbAll("SELECT * FROM orders WHERE userId = ? ORDER BY timestamp DESC", [req.user?.id]);
  res.json({ success: true, orders });
});

apiRouter.post("/orders", authenticateToken, validate(OrderSchema), async (req: AuthenticatedRequest, res) => {
    const { symbol, type, qty, price } = req.body;
    const orderId = `TX-${Date.now()}`;
    await dbRun("INSERT INTO orders (id, userId, symbol, type, price, qty, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)", [orderId, req.user?.id, symbol, type, price, qty, Date.now()]);
    const totalVal = price * qty;
    if (totalVal >= 50000) {
        const webhookUrl = await getUserWebhook(req.user?.id as string);
        sendDiscordMessage(webhookUrl, "高額交易指令撮合成功", `⚡ 使用者 **${req.user?.username}** 觸發大額交易：
- **商品**：${symbol}
- **方向**：${type}
- **成交總額**：**$${totalVal.toLocaleString()}**`, type === "BUY" ? 0x10b981 : 0xef4444);
    }
    res.status(201).json({ success: true, message: "Order persisted." });
});

apiRouter.get("/assets/:symbol/news", async (req, res) => {
  const { symbol } = req.params;
  const news = await fetchNewsForSymbol(symbol);
  if (news.length === 0) return res.json({ success: true, news: [], analysis: null });
  const analysis = await summarizeNews(news, req.query.lang as 'zh' | 'en');
  res.json({ success: true, news: news.slice(0, 8), analysis });
});

apiRouter.post("/ai/analyze", authenticateToken, async (req: AuthenticatedRequest, res) => {
    // ... same implementation ...
});
