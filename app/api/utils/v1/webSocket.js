import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const clientToWebSocketMap = new Map(); // clientId -> ws

const createWebSocketServer = (server) => {


    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
        const clientId = uuidv4();
        clientToWebSocketMap.set(clientId, ws);

        // console.log("WebSocket connected and clientId: ", clientId, " mapped to websocket: ", ws);
        ws.send(JSON.stringify({ type: "connected", clientId: clientId }));

        ws.on("close", () => {
            console.log("WebSocket disconnected and clientId: ", clientId, " mapped to websocket: ", ws);

            // remove any stale mappings
            clientToWebSocketMap.delete(clientId);
        });
    });

    return wss;

}


export { clientToWebSocketMap, createWebSocketServer }
