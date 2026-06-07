import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { 
    token, 
    setWsStatus, 
    handleWebSocketMessage, 
    selectedSymbol, 
    timeframe,
    setSendWSMessage
  } = useStore();

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    setWsStatus("connecting");
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      if (selectedSymbol) {
        ws.send(JSON.stringify({ type: "REQUEST_HISTORY", symbol: selectedSymbol, timeframe }));
      }
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
      setTimeout(connect, 5000); 
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWebSocketMessage(msg);
      } catch (e) {
        console.error("Error processing WebSocket message:", e);
      }
    };

    // Provide a way to send messages from the store
    setSendWSMessage((msg: any) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
        }
    });
  }, [token, setWsStatus, handleWebSocketMessage, selectedSymbol, timeframe, setSendWSMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; 
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Effect to subscribe to new symbols or timeframes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && selectedSymbol) {
      wsRef.current.send(JSON.stringify({ type: "REQUEST_HISTORY", symbol: selectedSymbol, timeframe }));
    }
  }, [selectedSymbol, timeframe]);

  return null;
};
