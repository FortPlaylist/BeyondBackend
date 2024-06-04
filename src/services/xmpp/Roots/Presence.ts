import xmlparser from "xml-parser";
import xmlbuilder from "xmlbuilder";
import { Clients, beyondSocket, MUCs, SavedContent } from "../../../misc/typings/Socket.types";
import logging from "../../../utils/logging/logging";
import UpdateClientPresence from "../functions/UpdateClientPresence";
import GetUserPresence from "../functions/GetUserPresence";
import { ServerWebSocket } from "bun";

export default async function Presence(
  socket: ServerWebSocket<beyondSocket>,
  clientData: xmlparser.Node,
): Promise<void> {
  const { type } = clientData.attributes;
  const { to } = clientData.attributes;
  const { children } = clientData;

  if (!SavedContent.activeConnection) return socket.close();

  switch (type) {
    case "unavailable":
      // TODO: (Skies) -> Effort smh
      break;

    default:
      if (
        children.find((value) => value.name === "muc:x") ||
        children.find((value) => value.name === "x")
      ) {
        const room = to.split("@")[0];

        if (!MUCs[room]) MUCs[room] = { members: [] };
        if (!MUCs[room].members) MUCs[room].members = [];

        if (MUCs[room].members.find((member) => member.accountId === socket.data.accountId)) return;

        if (MUCs) MUCs[room].members = MUCs[room].members || [];
        else logging.error(`MUC with the roomName ${room} does not exist`);

        MUCs[room].members.push({
          accountId: socket.data.accountId as string,
        });

        SavedContent.JoinedMUCs.push(room);

        socket.send(
          xmlbuilder
            .create("presence")
            .attribute("to", socket.data.jid)
            .attribute(
              "from",
              `${room}@muc.prod.ol.epicgames.com/${encodeURI(
                socket.data.displayName as string,
              )}:${socket.data.accountId}:${socket.data.resource}`,
            )
            .attribute("xmlns", "jabber:client")
            .attribute("type", "unavailable")
            .element("x")
            .attribute("xmlns", "http://jabber.org/protocol/muc#user")
            .element("item")
            .attribute(
              "nick",
              `${room}@muc.prod.ol.epicgames.com/${encodeURI(
                socket.data.displayName as string,
              )}:${socket.data.accountId}:${socket.data.resource}`.replace(
                `${room}@muc.prod.ol.epicgames.com/`,
                "",
              ),
            )
            .attribute("jid", socket.data.jid)
            .attribute("role", "participant")
            .attribute("affiliation", "none")
            .up()
            .element("status")
            .attribute("code", "110")
            .up()
            .element("status")
            .attribute("code", "100")
            .up()
            .element("status")
            .attribute("code", "170")
            .up()
            .element("status")
            .attribute("code", "201")
            .up()
            .up()
            .toString({ pretty: true }),
        );

        MUCs[room].members.forEach(async (member) => {
          const client = Clients.find((client) => client.accountId === member.accountId);

          if (!client) return;
          if (socket.data.accountId === client.accountId) return;

          socket.send(
            xmlbuilder
              .create("presence")
              .attribute(
                "from",
                `${room}@muc.prod.ol.epicgames.com/${encodeURI(
                  client.displayName as string,
                )}:${client.accountId}:${client.resource}`,
              )
              .attribute("to", socket.data.jid)
              .attribute("xmlns", "jabber:client")
              .element("x")
              .attribute("xmlns", "http://jabber.org/protocol/muc#user")
              .element("item")
              .attribute(
                "nick",
                `${room}@muc.prod.ol.epicgames.com/${encodeURI(
                  socket.data.displayName as string,
                )}:${socket.data.accountId}:${socket.data.resource}`.replace(
                  `${room}@muc.prod.ol.epicgames.com/`,
                  "",
                ),
              )
              .attribute("jid", client?.jid)
              .attribute("role", "participant")
              .attribute("affiliation", "none")
              .up()
              .up()
              .toString({ pretty: true }),
          );

          client.socket.send(
            xmlbuilder
              .create("presence")
              .attribute(
                "from",
                `${room}@muc.prod.ol.epicgames.com/${encodeURI(
                  socket.data.displayName as string,
                )}:${socket.data.accountId}:${socket.data.resource}`,
              )
              .attribute("to", client.jid)
              .attribute("xmlns", "jabber:client")
              .element("x")
              .attribute("xmlns", "http://jabber.org/protocol/muc#user")
              .element("item")
              .attribute(
                "nick",
                `${room}@muc.prod.ol.epicgames.com/${encodeURI(
                  socket.data.displayName as string,
                )}:${socket.data.accountId}:${socket.data.resource}`.replace(
                  `${room}@muc.prod.ol.epicgames.com/`,
                  "",
                ),
              )
              .attribute("jid", socket.data.jid)
              .attribute("role", "participant")
              .attribute("affiliation", "none")
              .up()
              .up()
              .toString({ pretty: true }),
          );
        });
      }
      break;
  }

  const findStatus = clientData.children.find((value) => value.name === "status");

  if (!findStatus || !findStatus.content) {
    logging.error("Status is not valid!");
    return;
  }

  let statusData: string = "";

  try {
    statusData = JSON.parse(findStatus.content);
  } catch (error) {
    logging.error(`Failed to Parse Status Content: ${error}`);
    return;
  }

  if (statusData !== null) {
    const status: string = findStatus.content;
    const away: boolean = !!clientData.children.find((value) => value.name === "show");

    const sender = Clients.find((client: any) => client.accountId === socket.data.accountId);
    const receiver = Clients.find((client: any) => client.accountId === socket.data.accountId);

    if (!sender || !receiver) return socket.close();

    await UpdateClientPresence(socket, status, false, away);
    await GetUserPresence(false, sender.accountId, receiver.accountId);
  }
}
