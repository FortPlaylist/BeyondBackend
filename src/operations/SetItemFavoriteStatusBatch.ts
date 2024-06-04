import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";

export default async function SetItemFavoriteStatusBatch(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/SetItemFavoriteStatusBatch",
    BlankInput
  >,
) {
  const accountId = c.req.param("accountId");
  const profileId = c.req.query("profileId");

  const account = await Accounts.findOne({ accountId });

  if (!account) return c.json(Beyond.account.accountNotFound, 404);

  const [athena] = await Promise.all([GetProfile(account.accountId, "athena")]);

  if (!athena) return c.json(Beyond.mcp.profileNotFound, 404);

  const applyProfileChanges: any[] = [];

  const t1 = new Timing("body processing");
  let body;

  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: "Body isn't valid JSON" }, 400);
  }

  t1.print();

  const { itemIds, itemFavStatus } = body;

  const BaseRevision = athena.rvn || 0;

  for (const item in itemIds) {
    if (!athena.items[itemIds[item]]) continue;
    if (typeof itemFavStatus[item] !== "boolean") return;

    athena.items[itemIds[item]].attributes.favorite = itemFavStatus[item];

    applyProfileChanges.push({
      changeType: "itemAttrChanged",
      itemId: itemIds[item],
      attributeName: "favorite",
      attributeValue: athena.items[itemIds[item]].attributes.favorite,
    });
  }

  if (applyProfileChanges.length > 0) {
    athena.rvn += 1;
    athena.commandRevision += 1;
    athena.updatedAt = DateTime.now().toISO();
  }

  await account.updateOne({ $set: { athena } });

  return c.json({
    profileRevision: athena.rvn,
    profileId,
    profileChangesBaseRevision: BaseRevision,
    profileChanges: applyProfileChanges,
    profileCommandRevision: athena.commandRevision,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });
}
