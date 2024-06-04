import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile, { ProfileTypes } from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import AthenaProfile from "../utils/profile/query/AthenaProfile";
import ParseUserAgent from "../utils/useragent/parseUseragent";
import logging from "../utils/logging/logging";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";

export default async function BulkEquipBattleRoyaleCustomization(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/BulkEquipBattleRoyaleCustomization",
    BlankInput
  >,
) {
  try {
    const applyProfileChanges: any[] = [];
    const accountId = c.req.param("accountId");

    const [athena, account] = await Promise.all([
      await GetProfile(accountId, "athena"),
      await Accounts.findOne({ accountId }).cacheQuery(),
    ]);

    const BaseRevision = athena.rvn || 0;

    const t1 = new Timing("body processing");
    let body;

    try {
      body = await c.req.json();
    } catch (error) {
      return c.json({ error: "Body isn't valid JSON" }, 400);
    }

    t1.print();

    const { loadoutData } = body;

    if (!account) return c.json(Beyond.account.accountNotFound, 404);

    if (loadoutData.length > 20)
      return c.json(
        Beyond.mcp.invalidPayload.withMessage("loadData can only be a maximum of 20 items."),
        400,
      );

    for (let i = 0; i < loadoutData.length; i++) {
      const body = loadoutData[i];

      const { slotName } = body;
      const { indexWithinSlot } = body;
      const { itemToSlot } = body;

      const cosmeticTemplateId = athena.items[itemToSlot]?.templateId || itemToSlot;
      const activeLoadoutId =
        athena.stats.attributes.loadouts[athena.stats.attributes.active_loadout_index];

      if (slotName === "ItemWrap") {
        athena.stats.attributes.favorite_itemwraps[indexWithinSlot] = itemToSlot;
        athena.items.sandbox_loadout.attributes.locker_slots_data.slots.ItemWrap.items[
          indexWithinSlot
        ] = cosmeticTemplateId;

        applyProfileChanges.push({
          changeType: "statModified",
          name: "favorite_itemwraps",
          value: athena.stats.attributes.favorite_itemwraps,
        });
      } else if (slotName === "Dance") {
        athena.stats.attributes.favorite_dance[indexWithinSlot] = itemToSlot;
        const activeLoadout = athena.items[activeLoadoutId];

        if (activeLoadout && activeLoadout.attributes.locker_slots_data) {
          const lockerSlotsData = activeLoadout.attributes.locker_slots_data;

          if (lockerSlotsData.slots[slotName]) {
            const slot_items = lockerSlotsData.slots[slotName].items;

            if (Array.isArray(slot_items)) {
              if (indexWithinSlot >= 0 && indexWithinSlot <= slot_items.length) {
                slot_items[indexWithinSlot] = cosmeticTemplateId;
              }
            }
          }
        }

        athena.items[itemToSlot].attributes.item_seen = true;

        applyProfileChanges.push({
          changeType: "statModified",
          name: `favorite_${slotName.toLowerCase()}`,
          value: athena.stats.attributes.favorite_dance,
        });
      } else if (indexWithinSlot === -1) {
        for (let i = 0; i < 7; i++) {
          athena.stats.attributes.favorite_itemwraps[i] = itemToSlot;
          athena.items.sandbox_loadout.attributes.locker_slots_data.slots.ItemWrap.items[i] =
            cosmeticTemplateId;

          athena.items[itemToSlot].attributes.item_seen = true;
        }
        applyProfileChanges.push({
          changeType: "statModified",
          name: `favorite_itemwraps`,
          value: athena.stats.attributes.favorite_itemwraps,
        });
      } else {
        athena.stats.attributes[`favorite_${slotName.toLowerCase()}`] = itemToSlot;
        athena.items.sandbox_loadout.attributes.locker_slots_data.slots[slotName].items =
          cosmeticTemplateId;

        athena.items[itemToSlot].attributes.item_seen = true;

        applyProfileChanges.push({
          changeType: "statModified",
          name: `favorite_${slotName.toLowerCase()}`,
          value: athena.stats.attributes[`favorite_${slotName.toLowerCase()}`],
        });
      }
    }

    if (applyProfileChanges.length > 0) {
      athena.rvn += 1;
      athena.commandRevision += 1;
      athena.updatedAt = DateTime.now().toISO();
    }

    const season = ParseUserAgent(c.req.header("User-Agent"));

    if (season!.buildUpdate >= "12.20") {
      const athenaChanges = await AthenaProfile(c);
      applyProfileChanges.push(await athenaChanges.clone().json());
    }

    await Accounts.bulkWrite([
      {
        updateOne: {
          filter: { accountId },
          update: { $set: { athena } },
          upsert: true,
        },
      },
    ]);

    return c.json({
      profileRevision: athena.rvn || 0,
      profileId: "athena",
      profileChangesBaseRevision: BaseRevision,
      profileChanges: applyProfileChanges,
      profileCommandRevision: athena.commandRevision || 0,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });
  } catch (error) {
    logging.error(`Error: ${error}`);
    c.status(500);
    return c.json({ error: "Internal Server Error" });
  }
}
