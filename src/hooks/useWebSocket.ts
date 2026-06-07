import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { 
    token, 
    setWsStatus, 
    handleWebSocketMessage, 
    selectedSymbol, 
    timeframe 
  } = useStore(state => ({
    token: state.token,
    setWsStatus: state.setWsStatus,
    handleWebSocketMessage: state.handleWebSocketMessage,
    selectedSymbol: state.selectedSymbol,
    timeframe: state.timeframe,
  }));

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }
    
    setWsStatus("connecting");
    
    // The server URL can be constructed to include the token if needed for auth
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      // Request initial history for the currently selected symbol
      if (selectedSymbol) {
        ws.send(JSON.stringify({ type: "REQUEST_HISTORY", symbol: selectedSymbol, timeframe }));
      }
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
      // Automatic reconnection strategy
      setTimeout(() => {
        connect();
      }, 5000); 
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      ws.close(); // This will trigger onclose and the reconnection logic
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWebSocketMessage(msg);
      } catch (e) {
        console.error("Error processing WebSocket message:", e);
      }
    };
  }, [token, setWsStatus, handleWebSocketMessage, selectedSymbol, timeframe]);

  // Effect to establish and tear down the connection
  useEffect(() => {
    connect();
    
    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        // Remove the onclose listener to prevent reconnection attempts on unmount
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

  // Function to place an order, exposed by the hook
  const placeOrder = (side: "BUY" | "SELL", price: number, qty: number, symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "PLACE_ORDER", symbol, side, price, qty }));
    } else {
      console.error("WebSocket is not connected. Cannot place order.");
      // Optionally, queue the order or show an error to the user
    }
  };

  return { placeOrder };
};
