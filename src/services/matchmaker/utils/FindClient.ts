import { ServerWebSocket } from "bun";
import { Clients, SavedContent, SocketData } from "../../../misc/typings/Socket.types";

export function findClient(socket: ServerWebSocket<SocketData>): Clients | null {
  return SavedContent.client.find((client) => client.socket === socket) || null;
}
