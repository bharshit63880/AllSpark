import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [clientId, setClientId] = useState(null);
    const socketRef = useRef(null);

    // This "subscribers" set will hold all the callback functions from your components
    const subscribersRef = useRef(new Set());

    const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000";

    useEffect(() => {
        const socket = new WebSocket(WS_URL);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("Global WebSocket Connected");
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);

                // 1. Handle internal infrastructure messages (like getting Client ID)
                if (parsed.type === "connected" && parsed.clientId) {
                    setClientId(parsed.clientId);
                    return;
                }

                // 2. Broadcast to all listeners
                // We iterate through all registered callbacks and let them decide if they want this message
                subscribersRef.current.forEach((callback) => callback(parsed));

            } catch (err) {
                console.warn("WS Parse Error", err);
            }
        };

        socket.onclose = () => setIsConnected(false);

        return () => {
            socket.close();
        };
    }, []);

    // Function to register a listener
    const subscribe = (callback) => {
        subscribersRef.current.add(callback);
        // Return a cleanup function so components unsubscribe when they unmount
        return () => subscribersRef.current.delete(callback);
    };

    return (
        <WebSocketContext.Provider value={{ isConnected, clientId, subscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocketContext = () => useContext(WebSocketContext);



