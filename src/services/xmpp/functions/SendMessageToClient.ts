import xmlparser from "xml-parser";
import xmlbuilder from "xmlbuilder";
import { Clients } from "../../../misc/typings/Socket.types";

export default async function SendMessageToClient(
  jid: string,
  body: string,
  clientData: xmlparser.Node,
) {
  const receiverIndex = Clients.findIndex(
    (client) =>
      client.jid.split("/")[0] === clientData.attributes.to ||
      client.accountId === clientData.attributes.to,
  );

  const receiver = Clients[receiverIndex];

  if (receiverIndex === -1) return;

  receiver.socket.send(
    xmlbuilder
      .create("message")
      .attribute("from", jid)
      .attribute("xmlns", "jabber:client")
      .attribute("to", receiver.jid)
      .attribute("id", clientData.attributes.id)
      .element("body", body)
      .up()
      .toString({ pretty: true }),
  );
}
