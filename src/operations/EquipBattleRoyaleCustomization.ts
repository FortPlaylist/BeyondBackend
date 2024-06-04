import { DateTime } from "luxon";
import { Hono, Context } from "hono";
import { BlankInput, Next } from "hono/types";
import Account from "../misc/models/Accounts";
import GetProfile from "../utils/profile/GetProfile";
import ParseUserAgent from "../utils/useragent/parseUseragent";
import AthenaProfile from "../utils/profile/query/AthenaProfile";
import { Variant } from "../local/interfaces";
import RefreshAccount from "./helpers/RefreshAccount";
import Users from "../misc/models/Users";
import { Clients } from "../misc/typings/Socket.types";
import Timing from "../utils/performance/Timing";
import cache from "../misc/middleware/Cache";
import { Beyond } from "../utils/errors/errors";

export default async function EquipBattleRoyaleCustomization(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/EquipBattleRoyaleCustomization",
    BlankInput
  >,
  next: Next,
) {
  try {
    const accountId = c.req.param("accountId");

    const [account, user] = await Promise.all([
      await Account.findOne({ accountId }),
      await Users.findOne({ accountId }),
    ]);

    const [athena] = await Promise.all([GetProfile(accountId, "athena")]);

    const BaseRevision = athena.rvn || 0;

    if (!account || !user) return c.json(Beyond.account.accountNotFound, 404);
    const t1 = new Timing("body processing");
    let body;

    try {
      body = await c.req.json();
    } catch (error) {
      return c.json({ error: "Body isn't valid JSON" }, 400);
    }

    t1.print();

    const { itemToSlot, indexWithinSlot, slotName, variantUpdates } = body;

    const applyProfileChanges: any[] = [];

    if (athena.items[itemToSlot]) {
      if (variantUpdates.length > 0) {
        variantUpdates.forEach((variant: Variant) => {
          const { channel, active, owned } = variant;

          const existingIndex: number = athena.items[itemToSlot].attributes.variants.findIndex(
            (x: { channel: string }) => x.channel === channel,
          );

          if (existingIndex === -1) {
            athena.items[itemToSlot].attributes.variants.push({
              channel,
              active,
            });
          } else {
            athena.items[itemToSlot].attributes.variants[existingIndex].active = active;
          }
        });

        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: itemToSlot,
          attributeName: "variants",
          attributeValue: athena.items[itemToSlot].attributes.variants,
        });
      }
    }

    const activeLoadoutId =
      athena.stats.attributes.loadouts[athena.stats.attributes.active_loadout_index];
    const cosmeticTemplateId = athena.items[itemToSlot]
      ? athena.items[itemToSlot].templateId
      : itemToSlot;

    const isDanceSlot = slotName === "Dance" && indexWithinSlot >= 0 && indexWithinSlot <= 5;
    const isItemWrapSlot = slotName === "ItemWrap" && indexWithinSlot >= 0 && indexWithinSlot <= 7;
    const isInvalidIndex = indexWithinSlot === -1;

    const promises: Promise<void>[] = [];

    if (isDanceSlot) {
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

      applyProfileChanges.push({
        changeType: "statModified",
        name: `favorite_${slotName.toLowerCase()}`,
        value: athena.stats.attributes.favorite_dance,
      });
    } else if (isItemWrapSlot) {
      athena.stats.attributes.favorite_itemwraps[indexWithinSlot] = itemToSlot;
      athena.items.sandbox_loadout.attributes.locker_slots_data.slots.ItemWrap.items[
        indexWithinSlot
      ] = cosmeticTemplateId;

      applyProfileChanges.push({
        changeType: "statModified",
        name: `favorite_itemwraps`,
        value: athena.stats.attributes.favorite_itemwraps,
      });
    } else if (isInvalidIndex) {
      for (let i = 0; i < 7; i++) {
        athena.stats.attributes.favorite_itemwraps[i] = itemToSlot;
        athena.items.sandbox_loadout.attributes.locker_slots_data.slots.ItemWrap.items[i] =
          cosmeticTemplateId;
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

      applyProfileChanges.push({
        changeType: "statModified",
        name: `favorite_${isInvalidIndex ? "itemwraps" : slotName.toLowerCase()}`,
        value:
          athena.stats.attributes[
            `favorite_${isInvalidIndex ? "itemwraps" : slotName.toLowerCase()}`
          ],
      });
    }

    // if (!isItemWrapSlot) {
    //   applyProfileChanges.push({
    //     changeType: "statModified",
    //     name: `favorite_${isInvalidIndex ? "itemwraps" : slotName.toLowerCase()}`,
    //     value:
    //       athena.stats.attributes[
    //         `favorite_${isInvalidIndex ? "itemwraps" : slotName.toLowerCase()}`
    //       ],
    //   });
    // }

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

    await account.updateOne({ $set: { athena } });

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
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
