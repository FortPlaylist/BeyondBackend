import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import logging from "../utils/logging/logging";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";

export default async function RefundMtxPurchase(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/RefundMtxPurchase",
    BlankInput
  >,
) {
  const accountId = c.req.param("accountId");
  const profileId = c.req.query("profileId");

  const account = await Accounts.findOne({ accountId }).cacheQuery();

  if (!account) return c.json(Beyond.account.accountNotFound, 404);

  const [athena, common_core] = await Promise.all([
    GetProfile(account.accountId, "athena"),
    GetProfile(account.accountId, "common_core"),
  ]);

  if (!athena || !common_core) return c.json(Beyond.mcp.profileNotFound, 404);

  const applyProfileChanges: any[] = [];
  const multiUpdate: any[] = [];

  const t1 = new Timing("body processing");
  let body;

  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: "Body isn't valid JSON" }, 400);
  }

  t1.print();

  const { purchaseId } = body;

  const BaseRevision = common_core.rvn || 0;

  const { mtx_purchase_history, current_mtx_platform } = common_core.stats.attributes;

  mtx_purchase_history.refundsUsed += 1;
  mtx_purchase_history.refundCredits -= 1;

  const items: string[] = [];

  const specificPurchase = mtx_purchase_history.purchases.find(
    (purchase: { purchaseId: string }) => purchase.purchaseId === purchaseId,
  );

  if (specificPurchase) {
    for (const lootResult of specificPurchase.lootResult) {
      items.push(lootResult.itemGuid);
    }

    specificPurchase.refundDate = DateTime.now().toISO();

    for (const key in common_core.items) {
      const item = common_core.items[key];
      const { templateId } = item;

      if (templateId.startsWith("Currency:Mtx")) {
        item.quantity += specificPurchase.totalMtxPaid;

        applyProfileChanges.push({
          changeType: "itemQuantityChanged",
          itemId: key,
          quantity: item.quantity,
        });

        break;
      }
    }
  }

  for (const ok in items) {
    delete athena.items[items[ok]];

    multiUpdate.push({
      changeType: "itemRemoved",
      itemId: items[ok],
    });
  }

  applyProfileChanges.push({
    changeType: "statModified",
    name: "mtx_purchase_history",
    value: mtx_purchase_history,
  });

  if (applyProfileChanges.length > 0) {
    common_core.rvn += 1;
    common_core.commandRevision += 1;
    common_core.updatedAt = DateTime.now().toISO();
  }

  if (multiUpdate.length > 0) {
    athena.rvn += 1;
    athena.commandRevision += 1;
    athena.updatedAt = DateTime.now().toISO();
  }

  await account.updateOne({ $set: { common_core, athena } });

  return c.json({
    profileRevision: common_core.rvn,
    profileId,
    profileChangesBaseRevision: BaseRevision,
    profileChanges: applyProfileChanges,
    profileCommandRevision: common_core.commandRevision,
    serverTime: DateTime.now().toISO(),
    multiUpdate: [
      {
        profileRevision: athena.rvn,
        profileId: "athena",
        profileChangesBaseRevision: athena.rvn,
        profileChanges: multiUpdate,
        profileCommandRevision: athena.commandRevision,
      },
    ],
    responseVersion: 1,
  });
}
