import xmlparser from "xml-parser";

import logging from "../../../utils/logging/logging";
import { Clients, SavedContent, beyondSocket } from "../../../misc/typings/Socket.types";
import Open from "../Roots/Open";
import Auth from "../Roots/Auth";

import Iq from "../Roots/Iq";
import Presence from "../Roots/Presence";
import Message from "../Roots/Message";
import { ServerWebSocket } from "bun";

export default {
  async message(socket: ServerWebSocket<beyondSocket>, chunk: string | Buffer) {
    try {
      let clientData: xmlparser.Document;

      if (Buffer.isBuffer(chunk)) chunk = chunk.toString();

      clientData = xmlparser(chunk as string);

      if (!clientData || !clientData.root || !clientData.root.name)
        return socket.close(1008, "Invalid XML");

      const { name } = clientData.root;

      switch (name) {
        case "open":
          await Open(socket, socket.data.isAuthenticated as boolean);
          break;

        case "auth":
          await Auth(socket, clientData.root);
          break;

        case "iq":
          await Iq(socket, clientData.root);
          break;

        case "presence":
          await Presence(socket, clientData.root);
          break;

        case "message":
          await Message(socket, clientData.root);
          break;

        default:
          logging.error(`Socket root with the name ${name} is not implemented!`);
          break;
      }

      const isValidConnection =
        !SavedContent.activeConnection &&
        socket.data.isAuthenticated &&
        socket.data.accountId &&
        socket.data.displayName &&
        socket.data.jid &&
        socket.data.resource;

      if (isValidConnection) {
        Clients.push({
          socket,
          accountId: socket.data.accountId as string,
          displayName: socket.data.displayName as string,
          token: socket.data.token as string,
          jid: socket.data.jid as string,
          resource: socket.data.resource as string,
          lastPresenceUpdate: {
            away: false,
            status: "{}",
          },
        });

        SavedContent.activeConnection = true;
      }
    } catch (error) {
      logging.error(`Error handling message: ${error}`);
    }
  },
};
