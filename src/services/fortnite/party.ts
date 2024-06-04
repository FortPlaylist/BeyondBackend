import { Hono } from "hono";
import xmlbuilder from "xmlbuilder";
import { DateTime } from "luxon";
import cache from "../../misc/middleware/Cache";
import verify from "../../misc/middleware/verify";
import CreateParty from "../../utils/party/CreateParty";
import { Party } from "../../misc/typings/Socket.types";

export default function initRoute(router: Hono) {
  router.post("/party/api/v1/Fortnite/parties", cache, async (c) => {
    const { join_info, config, meta } = await c.req.json();

    const party = CreateParty(join_info, config, meta);

    return c.json(party, 200);
  });
}
