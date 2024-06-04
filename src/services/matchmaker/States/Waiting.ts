import { JwtPayload } from "jsonwebtoken";
import WebSocket from "ws";
import { ServerWebSocket } from "bun";
import { beyondSocket, Payload, SocketData } from "../../../misc/typings/Socket.types";
import { AuthorizationPayload } from "../utils/Authentication";

export default function Waiting(socket: ServerWebSocket<SocketData>, playerCount: number) {
  return socket.send(
    JSON.stringify({
      payload: {
        totalPlayers: playerCount,
        connectedPlayers: playerCount - 1,
        state: "Waiting",
      },
      name: "StatusUpdate",
    }),
  );
}
