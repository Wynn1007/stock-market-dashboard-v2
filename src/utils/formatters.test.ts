import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatters';
import { Asset } from '../types';

describe('formatPrice', () => {
  const mockAssets: Asset[] = [
    { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', price: 68000, changePercent: 1.5, high: 69000, low: 67000, basePrice: 60000 },
    { symbol: '2330.TW', name: 'TSMC', category: 'stock_asia', price: 900, changePercent: -0.5, high: 905, low: 899, basePrice: 850 },
  ];

  const mockRates = {
    usdTwdRate: 32.5,
    jpyTwdRate: 0.21,
    hkdTwdRate: 4.15,
    krwTwdRate: 0.024,
  };

  it('should correctly convert a USD-based asset (BTC) to TWD', () => {
    // 68000 USD * 32.5 = 2,210,000 TWD
    const price = 68000;
    const symbol = 'BTC';
    const currency = 'TWD';
    const formattedPrice = formatPrice(price, symbol, currency, mockAssets, mockRates);
    // toLocaleString will add commas
    expect(formattedPrice).toBe('2,210,000.0'); 
  });

  it('should correctly display a TWD-based asset (TSMC) in USD', () => {
    // 900 TWD / 32.5 = 27.69 USD
    const price = 900;
    const symbol = '2330.TW';
    const currency = 'USD';
    const formattedPrice = formatPrice(price, symbol, currency, mockAssets, mockRates);
    expect(formattedPrice).toBe('27.69');
  });

  it('should return price with 4 decimal places for low-value assets', () => {
    const price = 0.12345; // USD
    const symbol = 'SHIB';
    const currency = 'USD';
    const formattedPrice = formatPrice(price, symbol, currency, mockAssets, mockRates);
    expect(formattedPrice).toBe('0.1235');
  });

  it('should not convert an index', () => {
    const price = 18000.55;
    const symbol = '^HSI';
    const currency = 'USD';
    const formattedPrice = formatPrice(price, symbol, currency, mockAssets, mockRates);
    expect(formattedPrice).toBe('18,000.55');
  });
});
