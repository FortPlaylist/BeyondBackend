import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import GetProfile from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import Friends from "../misc/models/Friends";
import { GiftReceived, randomGiftboxUUID } from "../misc/typings/Gift.types";
import RefreshAccount from "./helpers/RefreshAccount";
import Users from "../misc/models/Users";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";
import getOfferId from "../utils/storefront/getOfferId";

export default async function GiftCatalogEntry(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/GiftCatalogEntry",
    BlankInput
  >,
) {
  const accountId = c.req.param("accountId");
  const profileId = c.req.query("profileId");

  const account = await Accounts.findOne({ accountId }).cacheQuery();

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

  const { offerId, receiverAccountIds, personalMessage, giftWrapTemplateId } = body;

  const shopPath = path.join(__dirname, "..", "local", "storefront", "shop.json");
  const shop = JSON.parse(await readFile(shopPath, "utf-8"));

  const item = getOfferId(shop, offerId);

  if (personalMessage.length >= 100) {
    c.status(400);
    return c.json({
      errorCode: "errors.com.epicgames.string.length_check",
      errorMessage: "Personal message is longer than 100 characters.",
      messageVars: [`/api/game/v2/profile/${accountId}/client/GiftCatalogEntry`],
      numericErrorCode: undefined,
      originatingService: "any",
      intent: "prod",
      error_description: "Personal message is longer than 100 characters.",
      error: undefined,
    });
  }

  if (!item) {
    c.status(400);
    return c.json({
      errorCode: "errors.com.epicgames.fortnite.id_invalid",
      errorMessage: `Offer ID (${offerId}) not found.`,
      messageVars: [`/api/game/v2/profile/${accountId}/client/GiftCatalogEntry`],
      numericErrorCode: 1040,
      originatingService: "any",
      intent: "prod",
      error_description: `Offer ID (${offerId}) not found.`,
      error: undefined,
    });
  }

  let receiverAccountId: string = "";

  for (const id of receiverAccountIds) {
    receiverAccountId = id;
  }

  const friend = await Friends.findOne({
    accountId: c.get("user").accountId,
  });

  if (!friend) {
    c.status(400);
    return c.json({
      errorCode: "errors.com.epicgames.common.authentication.authentication_failed",
      errorMessage: `Authentication failed for /api/game/v2/profile/${accountId}/client/GiftCatalogEntry`,
      messageVars: [`/api/game/v2/profile/${accountId}/client/GiftCatalogEntry`],
      numericErrorCode: 1032,
      originatingService: "any",
      intent: "prod",
      error_description: `Authentication failed for /api/game/v2/profile/${accountId}/client/GiftCatalogEntry`,
    });
  }

  const accepted = friend.friends.accepted.find((f) => f.accountId === receiverAccountId);

  if (!accepted && receiverAccountId !== accountId) {
    c.status(400);
    return c.json({
      errorCode: "errors.com.epicgames.friends.no_relationship",
      errorMessage: `User ${friend.accountId} is not friends with ${receiverAccountId}`,
      messageVars: [`/api/game/v2/profile/${accountId}/client/GiftCatalogEntry`],
      numericErrorCode: 28004,
      originatingService: "any",
      intent: "prod",
      error_description: `User ${friend.accountId} is not friends with ${receiverAccountId}`,
      error: undefined,
    });
  }

  const common_core = await GetProfile(accountId, "common_core");

  const price = item.price * receiverAccountIds.length;

  for (const id in common_core.items) {
    common_core.items[id].quantity -= price;

    applyProfileChanges.push({
      changeType: "itemQuantityChanged",
      itemId: id,
      quantity: common_core.items[id].quantity,
    });
  }

  const receiver = await Accounts.findOne({
    accountId: receiverAccountId,
  }).cacheQuery();

  const receiverAthena = await GetProfile(receiverAccountId, "athena");
  const receiverCommonCore = await GetProfile(receiverAccountId, "common_core");

  const receiverUser = await Users.findOne({
    accountId: account.accountId,
  }).cacheQuery();

  if (!receiver || !receiverUser) {
    c.status(400);
    return c.json({
      errorCode: "errors.com.epicgames.common.authentication.authentication_failed",
      errorMessage: `Authentication failed for /api/game/v2/profile/${accountId}/client/GiftCatalogEntry`,
      messageVars: [`/api/game/v2/profile/${accountId}/client/GiftCatalogEntry`],
      numericErrorCode: 1032,
      originatingService: "any",
      intent: "prod",
      error_description: `Authentication failed for /api/game/v2/profile/${accountId}/client/GiftCatalogEntry`,
    });
  }

  if (!receiverCommonCore.stats.attributes.allowed_to_receive_gifts) {
    c.status(400);
    return c.json({
      errorCode: "errors.com.epicgames.user.gift_disabled",
      errorMessage: `User with the accountId ${receiverAccountId} currently has receiving gifts disabled.`,
      messageVars: [`/api/game/v2/profile/${accountId}/client/GiftCatalogEntry`],
      numericErrorCode: 28004,
      originatingService: "any",
      intent: "prod",
      error_description: `User with the accountId ${receiverAccountId} currently has receiving gifts disabled.`,
    });
  }

  for (const cosmetic in receiverAthena.items) {
    if (receiverAthena.items[cosmetic]) {
      const giftedItem = receiverAthena.items[cosmetic];
      const lootList: any[] = [];

      receiverAthena.items[item.item] = {
        templateId: item.item,
        attributes: {
          item_seen: false,
          variants: [],
        },
        quantity: 1,
      };

      lootList.push({
        itemType: item.item,
        itemGuid: item.item,
        itemProfile: "athena",
        quantity: 1,
      });

      for (const shopItem of item.items) {
        if (shopItem.item === giftedItem.templateId) {
          c.status(400);
          return c.json({
            errorCode: "errors.com.epicgames.modules.gamesubcatalog.purchase_not_allowed",
            errorMessage: `User with the accountId ${receiverAccountId} already owns this item.`,
            messageVars: [`/api/game/v2/profile/${accountId}/client/GiftCatalogEntry`],
            numericErrorCode: 28004,
            originatingService: "any",
            intent: "prod",
            error_description: `User with the accountId ${receiverAccountId} already owns this item.`,
          });
        }

        receiverAthena.items[shopItem.item] = {
          templateId: shopItem.item,
          attributes: {
            item_seen: false,
            variants: [],
          },
          quantity: 1,
        };

        lootList.push({
          itemType: shopItem.item,
          itemGuid: shopItem.item,
          itemProfile: "athena",
          quantity: 1,
        });
      }

      receiverAthena.items[randomGiftboxUUID] = {
        templateId: giftWrapTemplateId,
        attributes: {
          fromAccountId: accountId,
          lootList,
          params: {
            userMessage: personalMessage,
          },
          level: 1,
          giftedOn: DateTime.now().toISO(),
        },
        quantity: 1,
      };

      if (lootList.length > 0) {
        receiverAthena.rvn += 1;
        receiverAthena.commandRevision += 1;
        receiverAthena.updatedAt = DateTime.now().toISO();

        receiverCommonCore.rvn += 1;
        receiverCommonCore.commandRevision += 1;
        receiverCommonCore.updatedAt = DateTime.now().toISO();
      }

      await receiver.updateOne({
        $set: { athena: receiverAthena, common_core: receiverCommonCore },
      });

      GiftReceived[receiverAccountId] = true;

      await RefreshAccount(receiverAccountId, receiverUser.username);
    }
  }

  const BaseRevision = athena.rvn || 0;

  if (applyProfileChanges.length > 0) {
    athena.rvn += 1;
    athena.commandRevision += 1;
    athena.updatedAt = DateTime.now().toISO();
  }

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
