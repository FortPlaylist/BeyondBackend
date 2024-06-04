import WebSocket from "ws";
import jwt from "jsonwebtoken";
import xmlparser from "xml-parser";
import xmlbuilder from "xmlbuilder";
import Users from "../../../misc/models/Users";
import logging from "../../../utils/logging/logging";
import { Authorization } from "../../../misc/typings/Auth.types";
import { Clients, beyondSocket } from "../../../misc/typings/Socket.types";
import { ServerWebSocket } from "bun";
import Encoding from "../../../utils/performance/Encoding";

export default async function Auth(
  socket: ServerWebSocket<beyondSocket>,
  clientData: xmlparser.Node,
): Promise<void> {
  if (!clientData || !clientData.content) return socket.close(1008, "Invalid XML");

  if (!Encoding.decodeBase64(clientData.content).includes("\u0000"))
    return socket.close(1008, "Invalid XML");

  const decodedContent = Encoding.decodeBase64(clientData.content);

  const authFields = decodedContent.split("\u0000");

  if (authFields.length !== 3 || !Array.isArray(authFields))
    return socket.close(1008, "Invalid Length or Not an Array.");

  const accountId = authFields[1];

  const accessToken = Authorization.accessTokens.find(
    (token) => token && jwt.decode(token.token.replace("eg1~", ""))?.sub === accountId,
  );

  if (Clients.some((client) => client.accountId === accountId)) return socket.close();

  const user = await Users.findOne({ accountId });

  if (!user) return socket.close(1008, "User not found");
  if (user.banned) return socket.close(1008, "User is banned.");

  socket.data.accountId = user.accountId;
  socket.data.displayName = user.username;

  if (accessToken) socket.data.token = accessToken.token;

  if (
    decodedContent &&
    socket.data.accountId &&
    socket.data.displayName &&
    authFields.length === 3
  ) {
    socket.data.isAuthenticated = true;

    logging.info(`Socket Client with the username ${socket.data.displayName} has connected.`);

    socket.send(
      xmlbuilder
        .create("success")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
        .toString(),
    );
  } else {
    socket.send(
      xmlbuilder
        .create("failure")
        .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
        .ele("not-authorized")
        .ele("text")
        .attribute("xml:lang", "eng")
        .text("Password not verified")
        .end()
        .toString(),
    );
  }
}
