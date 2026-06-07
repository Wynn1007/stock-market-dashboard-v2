import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { formatPrice, getExchangeRates } from '../utils/formatters';

import { Asset } from '../types';

const FinancialLedger = () => {
    const { userOrders, assets, currency, theme } = useStore(state => ({
        userOrders: state.userOrders,
        assets: state.assets,
        currency: state.currency,
        theme: state.theme,
    }));
    const { t } = useTranslation();
    const rates = getExchangeRates(assets);
    const isMidnight = theme === 'midnight';

    const ownedAssets = assets.reduce((acc, asset) => {
        const matchingOrders = userOrders.filter(order => order.symbol === asset.symbol);
        if (matchingOrders.length > 0) {
            const totalQuantity = matchingOrders.reduce((sum, order) => sum + (order.type === 'BUY' ? order.qty : -order.qty), 0);
            if (totalQuantity > 0) {
                acc.push({ ...asset, quantity: totalQuantity });
            }
        }
        return acc;
    }, [] as (Asset & { quantity: number })[]);

    const bgCardClass = isMidnight ? "bg-[#131a26] border-slate-800" : "bg-white border-slate-200/60";

    return (
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <h2 className="text-2xl font-bold">{t.ledger.title}</h2>
            
            <section>
                <h3 className="text-lg font-semibold mb-4">{t.ledger.assets}</h3>
                {ownedAssets.length === 0 ? (
                     <p className={`p-4 rounded-lg text-sm text-slate-400 ${bgCardClass}`}>{t.ledger.empty}</p>
                ) : (
                    <div className={`border rounded-lg ${bgCardClass}`}>
                        <div className={`grid grid-cols-4 p-4 font-bold text-xs uppercase text-slate-400 border-b ${isMidnight ? 'border-slate-800' : 'border-slate-200'}`}>
                            <span>Asset</span>
                            <span className="text-right">Quantity</span>
                            <span className="text-right">Market Price</span>
                            <span className="text-right">Value</span>
                        </div>
                        {ownedAssets.map(asset => (
                            <div key={asset.symbol} className={`grid grid-cols-4 p-4 border-b last:border-b-0 ${isMidnight ? 'border-slate-800' : 'border-slate-100'}`}>
                                <div>
                                    <div className="font-bold">{asset.symbol}</div>
                                    <div className="text-xs text-slate-400">{asset.name}</div>
                                </div>
                                <div className="text-right font-mono">{asset.quantity.toFixed(4)}</div>
                                <div className="text-right font-mono">{formatPrice(asset.price, asset.symbol, currency, assets, rates)}</div>
                                <div className="text-right font-mono">{formatPrice(asset.price * asset.quantity, asset.symbol, currency, assets, rates)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            
            <section>
                <h3 className="text-lg font-semibold mb-4">{t.ledger.orders}</h3>
                {userOrders.length === 0 ? (
                     <p className={`p-4 rounded-lg text-sm text-slate-400 ${bgCardClass}`}>{t.ledger.empty}</p>
                ) : (
                     <div className={`border rounded-lg ${bgCardClass}`}>
                        <div className={`grid grid-cols-5 p-4 font-bold text-xs uppercase text-slate-400 border-b ${isMidnight ? 'border-slate-800' : 'border-slate-200'}`}>
                            <span>Date</span>
                            <span>Symbol</span>
                            <span className="text-center">Side</span>
                            <span className="text-right">Quantity</span>
                            <span className="text-right">Price</span>
                        </div>
                        {userOrders.slice().reverse().map(order => (
                             <div key={order.id} className={`grid grid-cols-5 p-4 border-b last:border-b-0 items-center ${isMidnight ? 'border-slate-800' : 'border-slate-100'}`}>
                                <div className="text-xs text-slate-400">{new Date(order.timestamp).toLocaleString()}</div>
                                <div className="font-bold">{order.symbol}</div>
                                <div className={`text-center font-bold text-xs py-1 px-2 rounded-full mx-auto ${order.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{order.type}</div>
                                <div className="text-right font-mono">{order.qty}</div>
                                <div className="text-right font-mono">{order.price.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
};

export default FinancialLedger;
