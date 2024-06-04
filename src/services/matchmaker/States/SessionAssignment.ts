import { JwtPayload } from "jsonwebtoken";
import WebSocket from "ws";
import { v4 as uuid } from "uuid";
import { ServerWebSocket } from "bun";
import { SavedContent, SocketData } from "../../../misc/typings/Socket.types";

export default function SessionAssignment(socket: ServerWebSocket<SocketData>, matchId: string) {
  return socket.send(
    JSON.stringify({
      payload: {
        state: "SessionAssignment",
        matchId,
      },
      name: "StatusUpdate",
    }),
  );
}
