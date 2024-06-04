import { Clients, SavedContent } from "../../../misc/typings/Socket.types";

export function addClient(client: Clients) {
  if (
    !client ||
    !client.accountId ||
    !client.socket ||
    !client.ticketId ||
    !client.sessionId ||
    !client.matchId
  ) {
    throw new Error("Invalid client data.");
  }

  if (SavedContent.client.some((existingClient) => existingClient.accountId === client.accountId)) {
    throw new Error("Client with the same account ID already exists.");
  }

  SavedContent.client.push(client);
  return client;
}
