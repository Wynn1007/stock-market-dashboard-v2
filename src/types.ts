export interface AssetMeta {
  symbol: string;
  name: string;
  category: "crypto" | "stock_us" | "stock_asia" | "futures" | "etf";
  basePrice: number;
}

export interface MarketStatus {
  status: string;
  hours: string;
  isOpen: boolean;
}

export interface Asset extends AssetMeta {
  price: number;
  changePercent: number;
  high: number;
  low: number;
  marketStatus?: MarketStatus;
}

export interface Candle {
  time: number; // Unix timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerData {
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
  marketStatus?: MarketStatus;
}

export interface LiveTick {
  symbol: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  high: number;
  low: number;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  timestamp: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  qty: number;
  timestamp: number;
}

export interface GlobalTrade {
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  qty: number;
  timestamp: number;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description: string;
  createdAt: number;
}

export interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  thumbnail?: string;
  summary?: string;
}
