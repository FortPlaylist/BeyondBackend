import { v4 as uuid } from "uuid";
import { DateTime } from "luxon";
import { Party, SavedContent } from "../../misc/typings/Socket.types";

export default function CreateParty(join_info: any, config: any, meta: any) {
  const partyId = uuid().replace(/-/gi, "");

  Party[partyId] = {
    id: partyId,
    created_at: DateTime.now().toISO(),
    updated_at: DateTime.now().toISO(),
    config,
    members: [
      {
        account_id: join_info.connection.id.split("@prod")[0],
        meta: join_info.meta,
        connections: [
          {
            id: join_info.connection.id,
            connected_at: DateTime.now().toISO(),
            updated_at: DateTime.now().toISO(),
            yield_leadership: join_info.connection.yield_leadership,
            meta: join_info.connection.meta,
          },
        ],
        revision: SavedContent.partyRevision,
        joined_at: DateTime.now().toISO(),
        updated_at: DateTime.now().toISO(),
        role: "CAPTAIN",
      },
    ],
    applicants: [],
    meta,
    invites: [],
    revision: SavedContent.partyRevision,
    intentions: [],
  };

  return Party[partyId];
}
