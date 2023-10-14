import { createContext, useContext, useEffect, useState } from "react";

export type WebSocketProviderProps = {
  children: React.ReactNode;
};

const WebSocketContext = createContext<WebSocket | null>(null);

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://${process.env.NEXT_PUBLIC_WEB_SOCKET_HOST_NAME}`
    );

    ws.addEventListener("open", () => {
      console.log("Connected to the WebSocket");
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
