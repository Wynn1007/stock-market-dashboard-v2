import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

interface TradingPanelProps {
    onPlaceOrder: (side: "BUY" | "SELL", price: number, quantity: number) => void;
    category: string;
}

export default function TradingPanel({ onPlaceOrder, category }: TradingPanelProps) {
    const { token, selectedSymbol, tickerDetails, setShowLoginPrompt } = useStore(state => ({
        token: state.token,
        selectedSymbol: state.selectedSymbol,
        tickerDetails: state.tickerDetails,
        setShowLoginPrompt: state.setShowLoginPrompt,
    }));
    const { t } = useTranslation();

    const [side, setSide] = useState<"BUY" | "SELL">("BUY");
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    useEffect(() => {
        if (tickerDetails?.price) {
            setPrice(tickerDetails.price.toString());
        }
    }, [tickerDetails]);

    const handlePlaceOrder = () => {
        if (!token) {
            setShowLoginPrompt(true);
            return;
        }
        const numPrice = parseFloat(price);
        const numQty = parseFloat(quantity);
        if (!isNaN(numPrice) && !isNaN(numQty) && numQty > 0) {
            onPlaceOrder(side, numPrice, numQty);
        }
    };

    const total = (parseFloat(price) || 0) * (parseFloat(quantity) || 0);
    const isCrypto = category === 'crypto';

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-bold mb-4">{t.tradingPanel.title}</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={() => setSide('BUY')}
                    className={`py-2 rounded ${side === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-slate-700'}`}
                >
                    {t.tradingPanel.buy}
                </button>
                <button
                    onClick={() => setSide('SELL')}
                    className={`py-2 rounded ${side === 'SELL' ? 'bg-rose-500 text-white' : 'bg-slate-700'}`}
                >
                    {t.tradingPanel.sell}
                </button>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-xs">{t.tradingPanel.price}</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2 mt-1 rounded bg-slate-800 border border-slate-700"
                    />
                </div>
                <div>
                    <label className="text-xs">{t.tradingPanel.quantity} ({isCrypto ? selectedSymbol : 'Shares'})</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full p-2 mt-1 rounded bg-slate-800 border border-slate-700"
                    />
                </div>
                <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                        <span>{t.tradingPanel.total}</span>
                        <span>~${total.toFixed(2)}</span>
                    </div>
                     {/* Balance can be added later from store */}
                </div>
                <button
                    onClick={handlePlaceOrder}
                    disabled={!token}
                    className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600"
                >
                    {token ? `${side === 'BUY' ? t.tradingPanel.buy : t.tradingPanel.sell} ${selectedSymbol}` : t.tradingPanel.loginToTrade}
                </button>
            </div>
        </div>
    );
}
