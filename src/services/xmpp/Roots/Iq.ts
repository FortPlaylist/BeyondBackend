import xmlbuilder from "xmlbuilder";
import xmlparser from "xml-parser";
import { Clients, beyondSocket, clientId } from "../../../misc/typings/Socket.types";
import { ServerWebSocket } from "bun";

export default function Iq(socket: ServerWebSocket<beyondSocket>, clientData: xmlparser.Node) {
  if (!clientId) return socket.close();

  const attributeId = clientData.attributes.id;

  switch (attributeId) {
    case "_xmpp_bind1":
      const binder = clientData.children.find((value) => value.name === "bind");

      const clientAlreadyExists = Clients.find(
        (client) => client.accountId === socket.data.accountId,
      );

      if (socket.data.resource || !socket.data.accountId) return;
      if (!binder) return;

      if (clientAlreadyExists) {
        socket.send(
          xmlbuilder
            .create("close")
            .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing")
            .toString({ pretty: true }),
        );
        socket.close();
        return;
      }

      const resource = clientData.children
        .find((value) => value.name === "bind")
        ?.children.find((value) => value.name === "resource");

      if (!resource) return;

      socket.data.resource = resource.content;
      socket.data.jid = `${socket.data.accountId}@prod.ol.epicgames.com/${socket.data.resource}`;

      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", socket.data.jid)
          .attribute("id", "_xmpp_bind1")
          .attribute("xmlns", "jabber:client")
          .attribute("type", "result")
          .element("bind")
          .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind")
          .element("jid", socket.data.jid)
          .up()
          .up()
          .toString({ pretty: true }),
      );
      break;

    default:
      socket.send(
        xmlbuilder
          .create("iq")
          .attribute("to", socket.data.jid)
          .attribute("from", "prod.ol.epicgames.com")
          .attribute("id", attributeId)
          .attribute("type", "result")
          .toString({ pretty: true }),
      );
  }
}
