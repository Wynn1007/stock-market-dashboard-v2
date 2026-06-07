import { GoogleGenAI } from "@google/genai";
import { env } from "./config";

const GEMINI_API_KEY = env.GEMINI_API_KEY;
let genAI: GoogleGenAI | null = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

export interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  thumbnail?: string;
  summary?: string;
  flash?: string; // Quick one-line summary
}

export interface NewsAnalysis {
  summary: string;
  sentimentPercent: number; // 0 to 100 (0 = Extreme Bearish, 100 = Extreme Bullish)
  sentimentLabel: "BULLISH" | "BEARISH" | "NEUTRAL";
  flashes: string[];
}

export async function fetchNewsForSymbol(symbol: string): Promise<NewsItem[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Referer": "https://finance.yahoo.com/",
      },
    });
    if (!res.ok) throw new Error(`Yahoo News API failed: ${res.status}`);
    const data: any = await res.json();
    const news = data.news || [];
    
    return news.map((item: any) => ({
      uuid: item.uuid,
      title: item.title,
      publisher: item.publisher,
      link: item.link,
      providerPublishTime: item.providerPublishTime,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url,
    }));
  } catch (err) {
    console.error(`[News Engine] Error fetching news for ${symbol}:`, err);
    return [];
  }
}

export async function summarizeNews(news: NewsItem[], lang: "zh" | "en" = "zh"): Promise<NewsAnalysis | null> {
  if (!genAI || news.length === 0) return null;

  const newsContext = news.slice(0, 5).map(n => `- ${n.title} (Source: ${n.publisher})`).join("\n");
  
  const prompt = lang === "zh" 
    ? `你是一位專業的財經AI分析師。請根據以下新聞標題，摘要出重點，並給出看漲/看跌的量化分析。
新聞列表：
${newsContext}

請以 JSON 格式回應，必須包含以下欄位：
- summary (字串): 簡短的整體綜合市場分析 (約3-4句話)。
- sentimentPercent (數字): 0-100的看漲情緒分數 (0=極度看跌, 50=中立, 100=極度看漲)。
- sentimentLabel (字串): "BULLISH" 或 "BEARISH" 或 "NEUTRAL"。
- flashes (字串陣列): 每則新聞的一句話快訊重點 (繁體中文)，適合作為逐行快報跑馬燈顯示。
確保回應是純 JSON，不要包含 markdown 標籤。`
    : `You are a professional financial AI analyst. Based on the following news headlines, provide a summary and a quantitative bullish/bearish analysis.
News List:
${newsContext}

Please respond in JSON format, strictly containing the following fields:
- summary (string): A brief overall market analysis (approx 3-4 sentences).
- sentimentPercent (number): 0-100 bullish sentiment score (0=Extreme Bearish, 50=Neutral, 100=Extreme Bullish).
- sentimentLabel (string): "BULLISH", "BEARISH", or "NEUTRAL".
- flashes (array of strings): A one-sentence quick flash summary for each news item, suitable for a news ticker/marquee.
Ensure the response is raw JSON without markdown formatting.`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    const text = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis: NewsAnalysis = JSON.parse(text);
    return analysis;
  } catch (err) {
    console.error("[News Engine] Summarization failed or JSON parsing error:", err);
    return null;
  }
}

export async function sendNewsToDiscord(webhookUrl: string, symbol: string, summary: string, news: NewsItem[]) {
  if (!webhookUrl || !summary) return;

  const embed = {
    title: ` Market Alert: ${symbol} Major News Summary`,
    description: summary,
    color: 0x00ff00,
    fields: news.slice(0, 3).map(item => ({
      name: item.publisher,
      value: `[${item.title}](${item.link})`,
      inline: false
    })),
    timestamp: new Date().toISOString(),
    footer: {
      text: "Wynn Finance News Engine"
    }
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (err) {
    console.error("[News Engine] Failed to send news to Discord:", err);
  }
}
