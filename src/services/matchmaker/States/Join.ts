import { ServerWebSocket } from "bun";
import WebSocket from "ws";
import { beyondSocket, SocketData } from "../../../misc/typings/Socket.types";

export default function Join(
  socket: ServerWebSocket<SocketData>,
  matchId: string,
  sessionId: string,
) {
  return socket.send(
    JSON.stringify({
      payload: {
        state: "Play",
        matchId,
        sessionId,
        joinDelaySec: 0,
      },
      name: "StatusUpdate",
    }),
  );
}
