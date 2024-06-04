import { JwtPayload } from "jsonwebtoken";
import WebSocket from "ws";
import { ServerWebSocket } from "bun";
import { Payload, SavedContent, SocketData } from "../../../misc/typings/Socket.types";

export default function Queued(
  socket: ServerWebSocket<SocketData>,
  playerCount: number,
  eta: number,
  ticketId: string,
) {
  return socket.send(
    JSON.stringify({
      payload: {
        state: "Queued",
        status: playerCount === 0 ? 2 : 3,
        estimatedWaitSec: eta,
        queuedPlayers: playerCount,
        ticketId,
      },
      name: "StatusUpdate",
    }),
  );
}
