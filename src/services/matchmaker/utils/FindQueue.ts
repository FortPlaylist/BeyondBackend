import { Payload, SavedContent } from "../../../misc/typings/Socket.types";

export function findQueue(payload: Payload) {
  const { region, playlist, customKey, userAgent, modeType, sessionId, matchId } = payload;

  return (
    SavedContent.Queues.find(
      (queue) =>
        queue.region === region &&
        queue.playlist === playlist &&
        queue.customKey === customKey &&
        queue.userAgent === userAgent &&
        queue.modeType === modeType &&
        queue.sessionId === sessionId &&
        queue.matchId === matchId,
    ) || null
  );
}
