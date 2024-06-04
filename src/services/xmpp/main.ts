import { Clients, beyondSocket, MUCs, SavedContent } from "../../misc/typings/Socket.types";
import logging from "../../utils/logging/logging";
import Message from "./Handlers/Message";
import { env } from "../..";
import UpdateClientPresence from "./functions/UpdateClientPresence";

Bun.serve<beyondSocket>({
  port: env.XMPP_PORT,
  fetch(request, server) {
    const key = request.headers.get("Sec-Websocket-Key");

    if (!key) return new Response(null, { status: 400 });

    server.upgrade(request, { data: { key, socket: null } });

    return undefined;
  },
  websocket: {
    open(socket) {
      socket.data.socket = socket;
    },
    async message(socket, message) {
      await Message.message(socket, message);
    },
    close(socket, code, reason) {
      SavedContent.activeConnection = false;
      SavedContent.activeConnection = false;
      const clientIndex = Clients.findIndex((client) => client.socket === socket);
      const client = Clients[clientIndex];

      if (clientIndex === -1) return;

      UpdateClientPresence(socket, "{}", true, false);
      Clients.splice(clientIndex, 1);

      for (let muc of SavedContent.JoinedMUCs) {
        const MUCRoom = MUCs[muc];

        if (MUCRoom) {
          const MUCIndex = MUCRoom.members.findIndex(
            (member) => member.accountId === client.accountId,
          );

          if (MUCIndex !== -1) MUCRoom.members.splice(MUCIndex, 1);
        }
      }

      logging.info(`Closed Socket Connection for client with the username ${client.displayName}`);
      socket.close();
    },
  },
});
