import { v4 } from "uuid";
import { ServerWebSocket } from "bun";
import { Clients, Payload, SavedContent, SocketData } from "../../../misc/typings/Socket.types";

export function createNewQueue(payload: Payload, socket: ServerWebSocket<SocketData>) {
  const matchId = v4().replace(/-/gi, "");
  const sessionId = v4().replace(/-/gi, "");

  const newQueue = {
    playlist: payload.playlist,
    accessToken: payload.accessToken,
    matchId,
    sessionId,
    accountId: payload.accountId,
    buildId: payload.buildId,
    customKey: payload.customKey,
    socket,
    modeType: payload.modeType,
    region: payload.region,
    timestamp: payload.timestamp,
    userAgent: payload.userAgent,
    clients: SavedContent.client,
  };

  if (!SavedContent.Queues) {
    SavedContent.Queues = [];
  }

  SavedContent.Queues.push(newQueue);

  return newQueue;
}
