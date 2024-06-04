import xmlparser from "xml-parser";
import xmlbuilder from "xmlbuilder";
import { Clients, beyondSocket, MUCs } from "../../../misc/typings/Socket.types";
import logging from "../../../utils/logging/logging";
import SendMessageToClient from "../functions/SendMessageToClient";
import { ServerWebSocket } from "bun";

export default async function Message(
  socket: ServerWebSocket<beyondSocket>,
  clientData: xmlparser.Node,
) {
  const findBodyContent = clientData.children.find((value) => value.name === "body");

  if (!findBodyContent || !findBodyContent.content) {
    logging.error("Body is not valid!");
    return;
  }

  const body = findBodyContent.content;
  const { type } = clientData.attributes;

  switch (type) {
    case "chat":
      if (body.length >= 300) return;

      const client = Clients.find(
        (client) => client.accountId === clientData.attributes.to.split("@")[0],
      );

      const sender = Clients.find(
        (client) => client.accountId === clientData.attributes.to.split("@")[0],
      );

      if (!client || !sender) return;

      client.socket.send(
        xmlbuilder
          .create("message")
          .attribute("to", client.jid)
          .attribute("from", sender.jid)
          .attribute("xmlns", "jabber:client")
          .attribute("type", "chat")
          .element("body", body)
          .up()
          .toString({ pretty: true }),
      );
      break;

    case "groupchat":
      const room = clientData.attributes.to.split("@")[0];

      if (!MUCs[room]) return;
      if (!MUCs[room].members.find((member) => member.accountId === socket.data.accountId)) return;

      MUCs[room].members.forEach((member) => {
        const client = Clients.find((client) => client.accountId == member.accountId);

        if (!client) return;

        client.socket.send(
          xmlbuilder
            .create("message")
            .attribute("to", client.jid)
            .attribute(
              "from",
              `${room}@muc.prod.ol.epicgames.com/${encodeURI(
                socket.data.displayName as string,
              )}:${socket.data.accountId}:${socket.data.resource}`,
            )
            .attribute("xmlns", "jabber:client")
            .attribute("type", "groupchat")
            .element("body", body)
            .up()
            .toString({ pretty: true }),
        );
      });
      break;
  }

  let bodyJSON: string = "";

  try {
    bodyJSON = JSON.parse(body);
  } catch (error) {
    logging.error(`Failed to Parse Body Content: ${error}`);
    return;
  }

  if (bodyJSON !== null) {
    await SendMessageToClient(socket.data.jid as string, body, clientData);
  }
}
