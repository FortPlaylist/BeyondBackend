import xmlbuilder from "xmlbuilder";
import { Clients } from "../../../misc/typings/Socket.types";

export default async function GetUserPresence(
  offline: boolean,
  senderId: string,
  receiverId: string,
) {
  const sender = Clients.find((client) => client.accountId === senderId);
  const receiver = Clients.find((client) => client.accountId === receiverId);

  if (!receiver || !sender) return;

  let xmlMessage = xmlbuilder
    .create("presence")
    .attribute("to", receiver.jid)
    .attribute("xmlns", "jabber:client")
    .attribute("from", sender.jid)
    .attribute("type", "available");

  if (sender.lastPresenceUpdate.away)
    xmlMessage = xmlMessage
      .element("show", "away")
      .element("status", sender.lastPresenceUpdate.status)
      .up();
  else xmlMessage = xmlMessage.element("status", sender.lastPresenceUpdate.status).up();

  receiver.socket.send(xmlMessage.toString({ pretty: true }));
}
