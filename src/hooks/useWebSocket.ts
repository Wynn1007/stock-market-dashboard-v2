import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const useWebSocket = (token: string | null) => {
  const wsRef = useRef<WebSocket | null>(null);
  const { 
    setWsStatus, 
    setAssets, 
    setTickerDetails, 
    setUserOrders,
    selectedSymbol, 
    timeframe 
  } = useStore();

  useEffect(() => {
    if (!token) {
      setWsStatus("disconnected");
      wsRef.current?.close();
      return;
    }

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("disconnected");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'TICK') {
        setAssets(assets => assets.map(a => a.symbol === msg.symbol ? { ...a, price: msg.price, changePercent: msg.changePercent } : a));
        if (msg.symbol === useStore.getState().selectedSymbol) {
          setTickerDetails(d => d ? { ...d, price: msg.price, changePercent: msg.changePercent, high: Math.max(d.high, msg.price), low: Math.min(d.low, msg.price) } : null);
        }
      } else if (msg.type === 'HISTORY_DATA' && msg.symbol === useStore.getState().selectedSymbol) {
        setTickerDetails(d => ({ ...(d || {}), symbol: msg.symbol, candles: msg.candles }));
      } else if (msg.type === 'ORDER_EXECUTED') {
        // This should trigger a refetch of orders, for now just updating the store
        fetch(`/api/orders`, { headers: { "Authorization": `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if(data.success) setUserOrders(data.orders);
            });
      }
    };
    
    return () => ws.close();
  }, [token, setWsStatus, setAssets, setTickerDetails, setUserOrders]);

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "REQUEST_HISTORY", symbol: selectedSymbol, timeframe: timeframe }));
    }
  }, [selectedSymbol, timeframe]);

  const placeOrder = (side: "BUY" | "SELL", price: number, qty: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "PLACE_ORDER", symbol: selectedSymbol, side, price, qty }));
    }
  };

  return { placeOrder };
};
