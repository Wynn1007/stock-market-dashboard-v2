import { Asset } from "../types";

export function getExchangeRates(assets: Asset[]) {
  return {
    usdTwdRate: assets.find(a => a.symbol === "USDTWD")?.price || 32.5,
    jpyTwdRate: assets.find(a => a.symbol === "JPYTWD")?.price || 0.21,
    hkdTwdRate: assets.find(a => a.symbol === "HKDTWD")?.price || 4.15,
    krwTwdRate: assets.find(a => a.symbol === "KRWTWD")?.price || 0.024,
  };
}

export function formatPrice(
    price: number, 
    symbol: string, 
    currency: "TWD" | "USD", 
    assets: Asset[], 
    rates: { usdTwdRate: number, jpyTwdRate: number, hkdTwdRate: number, krwTwdRate: number }
) {
    const isIndex = symbol.startsWith("^");
    const isExchangeRate = symbol.endsWith("TWD");
    let displayPrice = price;
    
    if (isIndex || isExchangeRate) {
      return displayPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    const asset = assets.find(a => a.symbol === symbol);
    let assetCurrency: "USD" | "TWD" | "JPY" | "HKD" | "KRW" = "USD";
    if (asset?.category === 'stock_asia') {
        if (symbol.endsWith('.TW') || symbol.startsWith('00')) assetCurrency = 'TWD';
        else if (symbol.endsWith('.T')) assetCurrency = 'JPY';
        else if (symbol.endsWith('.HK')) assetCurrency = 'HKD';
        else if (symbol.endsWith('.KS')) assetCurrency = 'KRW';
    }

    let priceInTwd = price;
    if (assetCurrency === "USD") priceInTwd = price * rates.usdTwdRate;
    else if (assetCurrency === "JPY") priceInTwd = price * rates.jpyTwdRate;
    else if (assetCurrency === "HKD") priceInTwd = price * rates.hkdTwdRate;
    else if (assetCurrency === "KRW") priceInTwd = price * rates.krwTwdRate;

    displayPrice = currency === "TWD" ? priceInTwd : priceInTwd / rates.usdTwdRate;
    
    return displayPrice.toLocaleString(undefined, {
      minimumFractionDigits: displayPrice > 1000 ? 1 : displayPrice < 5 ? 4 : 2,
      maximumFractionDigits: displayPrice > 1000 ? 1 : displayPrice < 5 ? 4 : 2,
    });
};
