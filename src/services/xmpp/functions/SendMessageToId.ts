import xmlbuilder from "xmlbuilder";
import { Clients } from "../../../misc/typings/Socket.types";

export default function SendMessageToId(body: string, receiverId: string) {
  const receiver = Clients.find((client) => client.accountId === receiverId);

  if (typeof body === "object") body = JSON.stringify(body);

  if (!receiver) return;

  receiver.socket.send(
    xmlbuilder
      .create("message")
      .attribute("from", "xmpp-admin@prod.ol.epicgames.com")
      .attribute("to", receiver.jid)
      .attribute("xmlns", "jabber:client")
      .element("body", `${body}`)
      .up()
      .toString({ pretty: true }),
  );
}
