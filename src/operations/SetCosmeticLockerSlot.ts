import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";

export default async function SetCosmeticLockerSlot(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/SetCosmeticLockerSlot",
    BlankInput
  >,
) {
  const accountId = c.req.param("accountId");
  const profileId = c.req.query("profileId");

  const account = await Accounts.findOne({ accountId });

  if (!account) return c.json(Beyond.account.accountNotFound);

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

  const { variantUpdates, itemToSlot, lockerItem, slotIndex, category } = body;

  const itemToSlotExists = athena.items[itemToSlot];

  if (itemToSlotExists) {
    if (variantUpdates.length > 0) {
      variantUpdates.forEach((variant: any) => {
        const { channel, active, owned } = variant;

        if (!athena.items[itemToSlot]) {
          athena.items[itemToSlot] = {
            attributes: {
              variants: [],
            },
            templateId: itemToSlot,
          };
        }

        const existingIndex: number = athena.items[itemToSlot].attributes.variants.findIndex(
          (x: { channel: string }) => x.channel === channel,
        );

        if (existingIndex === -1) {
          athena.items[itemToSlot].attributes.variants.push({
            channel,
            active,
            owned,
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
  } else {
    if (variantUpdates.length > 0) {
      variantUpdates.forEach((variant: any) => {
        const { channel, active, owned } = variant;

        if (!athena.items[itemToSlot]) {
          athena.items[itemToSlot] = {
            attributes: {
              variants: [],
            },
            templateId: itemToSlot,
          };
        }

        const existingIndex: number = athena.items[itemToSlot].attributes.variants.findIndex(
          (x: { channel: string }) => x.channel === channel,
        );

        if (existingIndex === -1) {
          athena.items[itemToSlot].attributes.variants.push({
            channel,
            active,
            owned,
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

  const updateFavoriteSlot = (slotName: string, items: any[]) => {
    const slotData = athena.items[lockerItem].attributes.locker_slots_data;
    if (slotData && slotData.slots[slotName]) {
      slotData.slots[slotName].items = items;
      athena.stats.attributes[`favorite_${slotName.toLowerCase()}`] = itemToSlot;
      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: lockerItem,
        attributeName: "locker_slots_data",
        attributeValue: slotData,
      });
    }
  };

  const updateItemWrapSlot = () => {
    const slotData = athena.items[lockerItem].attributes.locker_slots_data;
    const items = slotData.slots.ItemWrap.items.fill(itemToSlot);
    athena.stats.attributes.favorite_itemwraps = items.map(() => itemToSlot);
    applyProfileChanges.push({
      changeType: "itemAttrChanged",
      itemId: lockerItem,
      attributeName: "locker_slots_data",
      attributeValue: slotData,
    });
  };

  if (category === "Dance" && slotIndex >= 0 && slotIndex <= 5) {
    const slotData = athena.items[lockerItem].attributes.locker_slots_data;
    if (slotData && slotData.slots.Dance) {
      slotData.slots.Dance.items[slotIndex] = itemToSlot;
      athena.stats.attributes.favorite_dance[slotIndex] = itemToSlot;
      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: lockerItem,
        attributeName: "locker_slots_data",
        attributeValue: slotData,
      });
    }
  } else if (category === "ItemWrap" && slotIndex >= 0 && slotIndex <= 7) {
    const slotData = athena.items[lockerItem].attributes.locker_slots_data;
    if (slotData && slotData.slots.ItemWrap) {
      slotData.slots.ItemWrap.items[slotIndex] = itemToSlot;
      athena.stats.attributes.favorite_itemwraps[slotIndex] = itemToSlot;
      applyProfileChanges.push({
        changeType: "itemAttrChanged",
        itemId: lockerItem,
        attributeName: "locker_slots_data",
        attributeValue: slotData,
      });
    }
  } else if (slotIndex === -1) {
    updateItemWrapSlot();
  } else {
    updateFavoriteSlot(category, [itemToSlot]);
  }

  const BaseRevision = athena.rvn || 0;

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
