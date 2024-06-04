import { v4 as uuidv4 } from "uuid";
import { env } from "../../..";
import { SavedContent, SocketData, Queues } from "../../../misc/typings/Socket.types";
import Bun, { ServerWebSocket } from "bun";
import Authentication from "../utils/Authentication";
import { findQueue } from "../utils/FindQueue";
import { addClient } from "../utils/addClient";
import { createNewQueue } from "../utils/createQueue";
import Queued from "../States/Queued";
import Connecting from "../States/Connecting";
import Waiting from "../States/Waiting";
import SessionAssignment from "../States/SessionAssignment";
import Join from "../States/Join";
import Logger from "../../../utils/logging/logging";
import { findClient } from "../utils/FindClient";

const MATCHMAKER_PORT = env.MATCHMAKER_PORT;
const MAX_CLIENTS_PER_QUEUE = 100;
const MAX_LATEGAME_CLIENTS_PER_QUEUE = 40;
const MAX_PLAYGROUND_CLIENTS = 6;

const intervalMap: Map<ServerWebSocket<SocketData>, Timer> = new Map();

Bun.serve<SocketData>({
  port: MATCHMAKER_PORT,
  async fetch(request, server) {
    try {
      const auth = request.headers.get("Authorization");

      if (!auth) {
        return new Response("Authorization Payload is Invalid!", {
          status: 400,
        });
      }

      const [, , encrypted, json, signature] = auth.split(" ");

      if (!encrypted) return new Response("Unauthorized request", { status: 401 });

      const key = request.headers.get("Sec-WebSocket-Key");

      const res = await Authentication.authenticate(request.headers, signature);

      if (!res)
        return new Response("Authorization Payload is Invalid!", {
          status: 400,
        });

      server.upgrade(request, {
        data: {
          socketKey: key,
          rawBody: encrypted,
          payload: res,
        },
      });
    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
  websocket: {
    open(socket) {
      handleSocketOpen(socket);
    },
    close(socket, code, reason) {
      handleSocketClose(socket, code, reason);
    },
    message(socket, message) {
      handleMessage(socket, message);
    },
  },
});

async function handleSocketOpen(socket: ServerWebSocket<SocketData>) {
  try {
    const payload = socket.data.payload;
    const queue = findQueue(payload);

    if (payload.modeType === "Battle Royale Lategame") {
      if (!queue || queue.clients.length === MAX_LATEGAME_CLIENTS_PER_QUEUE) {
        handleNewQueue(socket);
      } else {
        handleExistingQueue(socket, queue);
      }
    } else if (payload.modeType === "Battle Royale") {
      if (!queue || queue.clients.length === MAX_CLIENTS_PER_QUEUE) {
        handleNewQueue(socket);
      } else {
        handleExistingQueue(socket, queue);
      }
    } else if (payload.modeType === "Sandbox") {
      if (!queue || queue.clients.length === MAX_PLAYGROUND_CLIENTS) {
        handleNewQueue(socket);
      } else {
        handleExistingQueue(socket, queue);
      }
    }
  } catch (error) {
    socket.close(1011, "Internal Server Error");
  }
}

async function handleNewQueue(socket: ServerWebSocket<SocketData>) {
  try {
    const newQueue = createNewQueue(socket.data.payload, socket);

    const newClient = addClientToQueue(socket.data.payload.accountId, socket, newQueue);

    newClient.isUpdated = true;
    Connecting(newClient.socket);
    Waiting(newClient.socket, SavedContent.client.length);
    Queued(newClient.socket, newQueue.clients.length, 10 * Math.random(), newClient.ticketId);

    let loop: Timer;
    loop = setInterval(async () => {
      try {
        const GameServer = SavedContent.GameServerSession.find(
          (gs) =>
            !gs.customKey &&
            gs.playlist.toLowerCase() === newQueue.playlist.toLowerCase() &&
            gs.region.toLowerCase() === newQueue.region.toLowerCase(),
        );

        if (GameServer) {
          clearInterval(loop);

          SessionAssignment(socket, newQueue.matchId);

          SavedContent.Session.push({
            sessionId: newQueue.sessionId,
            matchId: newQueue.matchId,
          });

          Join(socket, newQueue.matchId, newQueue.sessionId);

          socket.close(1000);
        }
      } catch (error) {
        clearInterval(loop);
        socket.close(1011, "Internal Server Error");
      }
    }, 10);
  } catch (error) {
    socket.close(1011, "Internal Server Error");
  }
}

async function handleExistingQueue(socket: ServerWebSocket<SocketData>, queue: Queues) {
  try {
    if (queue.clients.some((client) => client.accountId === socket.data.payload.accountId)) {
      socket.close(4003, `Client is already in queue!`);
      return;
    }

    const newClient = addClientToQueue(socket.data.payload.accountId, socket, queue);
    newClient.isUpdated = true;
    Connecting(newClient.socket);
    Waiting(newClient.socket, SavedContent.client.length);
    Queued(newClient.socket, queue.clients.length, 10 * Math.random(), newClient.ticketId);

    let loop: Timer;
    loop = setInterval(async () => {
      try {
        const GameServer = SavedContent.GameServerSession.find(
          (gs) =>
            !gs.customKey &&
            gs.playlist.toLowerCase() === queue.playlist.toLowerCase() &&
            gs.region.toLowerCase() === queue.region.toLowerCase(),
        );

        if (GameServer) {
          clearInterval(loop);

          SessionAssignment(socket, queue.matchId);

          SavedContent.Session.push({
            sessionId: queue.sessionId,
            matchId: queue.matchId,
          });

          Join(socket, queue.matchId, queue.sessionId);

          socket.close(1000);
        }
      } catch (error) {
        clearInterval(loop);
        socket.close(1011, "Internal Server Error");
      }
    }, 10);
  } catch (error) {
    socket.close(1011, "Internal Server Error");
  }
}

function handleSocketClose(socket: ServerWebSocket<SocketData>, code: number, reason: string) {
  try {
    const queue = SavedContent.Queues.find((q) =>
      q.clients.some((client) => client.socket === socket),
    );

    if (!queue) return;

    const clientIndex = queue.clients.findIndex((client) => client.socket === socket);

    if (clientIndex === -1) return;

    queue.clients.splice(clientIndex, 1);

    if (queue.clients.length === 0) {
      const queueIndex = SavedContent.Queues.findIndex((q) => q === queue);
      if (queueIndex !== -1) {
        SavedContent.Queues.splice(queueIndex, 1);
      }
    }

    const interval = intervalMap.get(socket);
    if (interval) {
      clearInterval(interval);
      intervalMap.delete(socket);
    }
  } catch (error) {
    Logger.error(`Failed to close socket: ${error}`);
  }
}

function handleMessage(socket: ServerWebSocket<SocketData>, message: any) {
  try {
    const queue = findQueue(socket.data.payload);

    if (!queue) {
      Logger.warn(`Queue not found for socket: ${socket.data.payload.accountId}`);
      return;
    }

    const client = findClient(socket);

    if (!client) {
      Logger.warn(`Client not found for socket: ${socket.data.payload.accountId}`);
      return;
    }

    const delay = 30 * Math.random();
    Queued(socket, queue.clients.length, delay, client.ticketId);
  } catch (error) {
    Logger.error(`Failed to handle message: ${error}`);
  }
}

function addClientToQueue(accountId: string, socket: ServerWebSocket<SocketData>, queue: Queues) {
  if (!accountId || !socket || !queue) {
    throw new Error("Invalid parameters.");
  }

  const ticketId = uuidv4().replace(/-/gi, "");

  const existingClientIndex = SavedContent.client.findIndex(
    (client) => client.accountId === accountId,
  );
  if (existingClientIndex !== -1) {
    throw new Error("Client is already present in the client list.");
  }

  const newClient = {
    accountId,
    socket,
    ticketId,
    sessionId: queue.sessionId,
    matchId: queue.matchId,
    isUpdated: false,
  };

  SavedContent.client.push(newClient);
  return newClient;
}
