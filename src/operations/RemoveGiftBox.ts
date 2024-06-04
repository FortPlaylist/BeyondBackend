import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import Accounts from "../misc/models/Accounts";
import GetProfile from "../utils/profile/GetProfile";
import { randomGiftboxUUID } from "../misc/typings/Gift.types";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";

export default async function RemoveGiftBox(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/RemoveGiftBox",
    BlankInput
  >,
) {
  const rvn = c.req.query("rvn");
  const profileId = c.req.query("profileId");
  const accountId = c.req.param("accountId");

  const t1 = new Timing("body processing");
  let body;

  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: "Body isn't valid JSON" }, 400);
  }

  t1.print();

  const { giftBoxItemId, giftBoxItemIds } = body;

  // if (!giftBoxItemId && !giftBoxItemIds) {
  //   console.log("bruh");
  // }

  const account = await Accounts.findOne({ accountId });

  if (!account) return c.json(Beyond.account.accountNotFound, 404);

  const [athena, common_core] = await Promise.all([
    GetProfile(account.accountId, "athena"),
    GetProfile(account.accountId, "common_core"),
  ]);

  if (!athena || !common_core) return c.json(Beyond.mcp.profileNotFound, 404);

  const BaseRevision = common_core.rvn;
  const applyProfileChanges: any[] = [];

  if (giftBoxItemId && typeof giftBoxItemId === "string") {
    delete common_core.items[giftBoxItemId];

    delete athena.items[giftBoxItemId];

    applyProfileChanges.push({
      changeType: "itemRemoved",
      itemId: giftBoxItemId,
    });
  }

  if (giftBoxItemIds && Array.isArray(giftBoxItemIds)) {
    giftBoxItemIds.forEach((itemId) => {
      delete common_core.items[itemId];
      delete athena.items[itemId];

      applyProfileChanges.push({
        changeType: "itemRemoved",
        itemId,
      });
    });
  }

  if (applyProfileChanges.length > 0) {
    common_core.rvn += 1;
    common_core.commandRevision += 1;
    common_core.updatedAt = DateTime.now().toISO();

    athena.rvn += 1;
    athena.commandRevision += 1;
    athena.updatedAt = DateTime.now().toISO();
  }

  await account.updateOne({ athena, common_core });

  return c.json({
    profileRevision: common_core.rvn,
    profileId,
    profileChangesBaseRevision: BaseRevision,
    profileChanges: applyProfileChanges,
    profileCommandRevision: common_core.commandRevision,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });
}
