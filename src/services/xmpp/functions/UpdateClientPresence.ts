import xmlbuilder from "xmlbuilder";
import { Clients, beyondSocket } from "../../../misc/typings/Socket.types";
import logging from "../../../utils/logging/logging";
import Friends from "../../../misc/models/Friends";
import { ServerWebSocket } from "bun";

// export interface Status {
//   Status: string;
//   bIsPlaying: boolean;
//   bIsJoimable: boolean;
//   SessionId: string;
//   Properties: StatusProperties;
// }

// interface StatusProperties {
//   KairosProfile_s: string;
//   FortBasicInfo_j: FortBasicInfo_j;
//   FortLFG_I: string;
//   FortPartySize_i: number;
//   InUnjoinableMatch_b: boolean;
//   FortGameplayStats_j: FortGameplayStats_j;
// }

// interface FortBasicInfo_j {
//   homeBaseRating: number;
// }

// interface FortGameplayStats_j {
//   state: string;
//   playlist: string;
//   numKills: number;
//   bFellToDeath: boolean;
// }

/* 
{
  Status: "Battle Royale Lobby - 1 / 16",
  bIsPlaying: false,
  bIsJoinable: false,
  bHasVoiceSupport: false,
  SessionId: "",
  Properties: {
    KairosProfile_s: "{\r\n}",
    FortBasicInfo_j: {
      homeBaseRating: 0,
    },
    FortLFG_I: "0",
    FortPartySize_i: 1,
    FortSubGame_i: 1,
    InUnjoinableMatch_b: false,
    FortGameplayStats_j: {
      state: "",
      playlist: "None",
      numKills: 0,
      bFellToDeath: false,
    },
  },
}
*/

export default async function UpdateClientPresence(
  socket: ServerWebSocket<beyondSocket>,
  status: string,
  offline: boolean,
  away: boolean,
) {
  const senderIndex = Clients.findIndex((client) => client.socket === socket);
  const sender = Clients[senderIndex];

  if (senderIndex === -1) return;

  Clients[senderIndex].lastPresenceUpdate.status = status;
  Clients[senderIndex].lastPresenceUpdate.away = away;

  const friends = await Friends.findOne({
    accountId: sender.accountId,
  }).cacheQuery();

  if (!friends) return;

  friends.friends.accepted.forEach((friend) => {
    const clientIndex = Clients.findIndex((client) => client.accountId === friend.accountId);
    const client = Clients[clientIndex];

    if (clientIndex === -1) return;

    let xmlMessage = xmlbuilder
      .create("presence")
      .attribute("to", client.jid)
      .attribute("xmlns", "jabber:client")
      .attribute("from", sender.jid)
      .attribute("type", offline ? "unavailable" : "available");

    if (sender.lastPresenceUpdate.away)
      xmlMessage = xmlMessage
        .element("show", "away")
        .element("status", sender.lastPresenceUpdate.status)
        .up();
    else xmlMessage = xmlMessage.element("status", sender.lastPresenceUpdate.status).up();

    client.socket.send(xmlMessage.toString({ pretty: true }));
  });
}
