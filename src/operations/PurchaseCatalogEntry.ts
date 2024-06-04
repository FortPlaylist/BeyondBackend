import { Context, Hono } from "hono";
import { BlankInput, Next } from "hono/types";
import { DateTime } from "luxon";
import path from "node:path";
import Accounts from "../misc/models/Accounts";
import Users from "../misc/models/Users";
import GetProfile from "../utils/profile/GetProfile";
import { readFile } from "node:fs/promises";
import { v4 as uuid } from "uuid";
import ParseUserAgent from "../utils/useragent/parseUseragent";
import CommonCoreProfile from "../utils/profile/query/CommonCoreProfile";
import { Beyond } from "../utils/errors/errors";
import { isIterationStatement } from "typescript";
import GrantChallengeBundleSchedule from "../utils/quests/GrantChallengeBundleSchedule";
import Logger from "../utils/logging/logging";
import RefreshAccount from "./helpers/RefreshAccount";
import { randomUUID } from "node:crypto";
import ClaimCosmeticVariantTokenReward from "../utils/variants/ClaimCosmeticVariantTokenReward";

export default async function PurchaseCatalogEntry(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/PurchaseCatalogEntry",
    BlankInput
  >,
  next: Next,
) {
  const profileId = c.req.query("profileId");
  const accountId = c.req.param("accountId");

  const { currency, offerId, purchaseQuantity } = await c.req.json();

  const shopPath = path.join(__dirname, "..", "local", "storefront", "shop.json");

  let applyProfileChanges: any[] = [];
  const notifications: any[] = [];
  const multiUpdates: any[] = [];

  const account = await Accounts.findOne({ accountId });
  const user = await Users.findOne({ accountId });

  if (!account || !user) {
    c.status(400);
    return c.json({
      errorCode: "errors.com.epicgames.common.authentication.authentication_failed",
      errorMessage: `Authentication failed for /api/game/v2/profile/${accountId}/client/PurchaseCatalogEntry`,
      messageVars: [`/api/game/v2/profile/${accountId}/client/PurchaseCatalogEntry`],
      numericErrorCode: 1032,
      originatingService: "any",
      intent: "prod",
      error_description: `Authentication failed for /api/game/v2/profile/${accountId}/client/PurchaseCatalogEntry`,
    });
  }

  const shop = JSON.parse(await readFile(shopPath, "utf-8"));

  const [athena, common_core] = await Promise.all([
    GetProfile(user.accountId, "athena"),
    GetProfile(user.accountId, "common_core"),
  ]);

  const season = ParseUserAgent(c.req.header("User-Agent"));

  const BaseRevision = common_core.rvn;
  const AthenaBaseRevision = athena.rvn;

  if (
    currency === "MtxCurrency" &&
    profileId === "common_core" &&
    offerId &&
    offerId.startsWith("item://")
  ) {
    const id: string = offerId.split("://")[1];
    let currentStorefront: any = null;
    let isItemOwned: boolean = false;
    let purchaseId: string = "";

    for (const storefront of [
      ...shop.catalogItems.BRDailyStorefront,
      ...shop.catalogItems.BRWeeklyStorefront,
    ]) {
      if (storefront.offerId === id) {
        currentStorefront = storefront;
        break;
      }
    }

    if (!currentStorefront) return c.json(Beyond.storefront.invalidItem);

    if (purchaseQuantity < 1) {
      c.status(400);
      return c.json({
        errorCode: "errors.com.epicgames.validation.validation_failed",
        errorMessage: "Validation Failed. 'purchaseQuantity' is less than 1.",
        messageVars: [`/api/game/v2/profile/${accountId}/client/PurchaseCatalogEntry`],
        numericErrorCode: 1040,
        originatingService: "any",
        intent: "prod",
        error_description: "Validation Failed. 'purchaseQuantity' is less than 1.",
        error: undefined,
      });
    }

    if (
      !isItemOwned &&
      currentStorefront.price > common_core.items["Currency:MtxPurchased"].quantity
    )
      return c.json(Beyond.storefront.currencyInsufficient, 400);

    const itemUUID = uuid();

    const alreadyOwnedItems = currentStorefront.items.filter(
      (item: { item: string }) => athena.items[item.item],
    );
    if (alreadyOwnedItems.length > 0) return c.json(Beyond.storefront.alreadyOwned, 400);

    purchaseId = currentStorefront.item;

    athena.items[currentStorefront.item] = {
      templateId: currentStorefront.item,
      attributes: {
        level: 1,
        item_seen: false,
        xp: 0,
        variants: currentStorefront.variants || [],
        favorite: false,
      },
      quantity: 1,
    };

    multiUpdates.push({
      changeType: "itemAdded",
      itemId: currentStorefront.item,
      item: athena.items[currentStorefront.item],
    });

    notifications.push({
      itemType: currentStorefront.item,
      itemGuid: currentStorefront.item,
      itemProfile: "athena",
      quantity: 1,
    });

    for (const bundledItem of currentStorefront.items) {
      athena.items[bundledItem.item] = {
        templateId: bundledItem.item,
        attributes: {
          max_level_bonus: 0,
          level: 1,
          item_seen: false,
          xp: 0,
          variants: bundledItem.variants || [],
          favorite: false,
        },
        quantity: 1,
      };

      notifications.push({
        itemType: bundledItem.item,
        itemGuid: bundledItem.item,
        itemProfile: "athena",
      });

      multiUpdates.push({
        changeType: "itemAdded",
        itemId: bundledItem.item,
        item: athena.items[bundledItem.item],
        quantity: 1,
      });
    }

    for (const item in common_core.items) {
      common_core.items[item].quantity -= currentStorefront.price;

      applyProfileChanges.push({
        changeType: "itemQuantityChanged",
        itemId: item,
        quantity: common_core.items[item].quantity,
      });

      let bundledItems: any[] = [];

      currentStorefront.items.forEach(
        (groupedItem: { item: string; name: string; variants: any[]; categories: string[] }) => {
          bundledItems.push([
            {
              itemType: groupedItem.item || "",
              itemGuid: groupedItem.item || "",
              itemProfile: "athena",
              quantity: 1,
            },
          ]);
        },
      );

      isItemOwned = true;
      break;
    }
  }

  let isBattlePassOwned: boolean = false;

  const AthenaSeason = await Bun.file(
    path.join(__dirname, "..", "local", "storefront", "battlepasses", "Season12.json"),
  ).json();

  const AthenaRewards = await Bun.file(
    path.join(__dirname, "..", "local", "athena", "AthenaRewards.json"),
  ).json();

  const SeasonXpCurve = await Bun.file(
    path.join(__dirname, "..", "local", "athena", "SeasonXpCurve.json"),
  ).json();

  for (const storefrontEntries of AthenaSeason.catalogEntries) {
    if (storefrontEntries.offerId === offerId) {
      const SeasonIndex = account.season.findIndex((s) => s.season_num === season!.season);

      if (SeasonIndex !== -1) {
        if (user.hasFL) return c.json(Beyond.storefront.hasAllItems, 400);

        const SeasonObject = account.season[SeasonIndex];
        const BattlePassArray = SeasonObject.battlepass;
        let seasonIndex: number = 0;

        for (let index = 0; index < BattlePassArray.length; index++) {
          seasonIndex = index;
          break;
        }

        const BattlePassData = SeasonObject.battlepass[seasonIndex];

        const isBattleBundle = storefrontEntries.devName === "BR.Season12.BattleBundle.01";
        const isPurchasingBattlePass = storefrontEntries.devName === "BR.Season12.BattlePass.01";
        const isSingleTier = storefrontEntries.devName === "BR.Season12.SingleTier.01";

        const bookLevel = BattlePassData.book_level;

        if (BattlePassData.book_purchased && !isSingleTier)
          return c.json(Beyond.storefront.currencyInsufficient, 400);

        let price = storefrontEntries.prices[0].finalPrice;

        if (!isSingleTier) {
          for (const itemId in common_core.items) {
            if (common_core.items[itemId].quantity >= price) {
              common_core.items[itemId].quantity -= price;
            } else {
              common_core.items[itemId].quantity = 0;
            }

            applyProfileChanges.push({
              changeType: "itemQuantityChanged",
              itemId: itemId,
              quantity: common_core.items[itemId].quantity,
            });

            isBattlePassOwned = true;
            break;
          }

          Logger.debug(`${user.username} has purchased the battle pass for ${price} vbucks.`);

          BattlePassData.book_purchased = true;
          multiUpdates.push({
            changeType: "statModified",
            name: "book_purchased",
            value: BattlePassData.book_purchased,
          });
        }

        let newTierLevel: number = 0;

        if (isBattleBundle) {
          newTierLevel = Math.min(BattlePassData.book_level + 25, 100);
          // TODO(Skye): Add purchased_battle_pass_tier_offers
        } else if (isSingleTier) {
          newTierLevel = Math.min(BattlePassData.book_level + purchaseQuantity, 100);
        } else {
          const tierCount = isBattleBundle ? 25 : 1;
          const paidTier = AthenaRewards.BookXpSchedulePaid.filter(
            (tier: { Tier: number }) => tier.Tier <= tierCount,
          );

          for (const itemGrants of paidTier) {
            const item = itemGrants.Item;
            const quantity = itemGrants.Quantity;

            if (item.startsWith("ChallengeBundleSchedule")) {
              if (item.includes("season12_donut_schedule"))
                await GrantChallengeBundleSchedule(
                  "ChallengeBundleSchedule:Season12_Donut_Schedule",
                  false,
                  user.accountId,
                );
              else await GrantChallengeBundleSchedule(itemGrants.Item, true, user.accountId);
            }

            if (item.toLowerCase().startsWith("athena")) {
              let itemExists: boolean = false;

              for (const item in athena.items) {
                if (
                  athena.items[item].templateId !== undefined &&
                  athena.items[item].templateId.toLowerCase() === item
                ) {
                  itemExists = true;
                  break;
                }
              }

              if (!itemExists) {
                athena.items[item] = {
                  templateId: item,
                  attributes: {
                    max_level_bonus: 0,
                    level: 1,
                    item_seen: false,
                    xp: 0,
                    variants: [],
                    favorite: false,
                  },
                  quantity,
                };

                multiUpdates.push({
                  changeType: "itemAdded",
                  itemId: item,
                  item: athena.items[item],
                });
              }

              notifications.push({
                itemType: item,
                itemGuid: item,
                quantity,
              });
            }

            if (item.toLowerCase().startsWith("token:athenaseasonxpboost")) {
              if (Number.isNaN(BattlePassData.season_match_boost))
                BattlePassData.season_match_boost = 0;

              BattlePassData.season_match_boost += quantity;

              multiUpdates.push({
                changeType: "statModified",
                itemId: "season_match_boost",
                item: BattlePassData.season_match_boost,
              });

              notifications.push({
                itemType: item,
                itemGuid: item,
                quantity,
              });
            }

            if (item.toLowerCase().startsWith("token:athenaseasonfriendxpboost")) {
              if (Number.isNaN(BattlePassData.season_friend_match_boost))
                BattlePassData.season_friend_match_boost = 0;

              BattlePassData.season_friend_match_boost += quantity;

              multiUpdates.push({
                changeType: "statModified",
                itemId: "season_friend_match_boost",
                item: BattlePassData.season_friend_match_boost,
              });

              notifications.push({
                itemType: item,
                itemGuid: item,
                quantity,
              });
            }

            newTierLevel = isBattleBundle ? 25 : 1;
            break;
          }

          newTierLevel = tierCount;
        }

        let book_level = (BattlePassData.book_level = newTierLevel);

        const handleTiers = async (tier: any) => {
          const AddTier = async (entry: { Item: string; Quantity: number }) => {
            const { Item: item, Quantity: quantity } = entry;
            const lowercaseItem = item.toLowerCase();

            const attributes = {
              max_level_bonus: 0,
              level: 1,
              item_seen: false,
              xp: 0,
              variants: [],
              favorite: false,
            };

            switch (true) {
              case lowercaseItem.startsWith("homebasebanner"):
              case lowercaseItem.startsWith("bannertoken"):
                common_core.items[item] = {
                  templateId: item,
                  attributes,
                  quantity,
                };
                break;

              case lowercaseItem.startsWith("athena"):
                athena.items[item] = {
                  templateId: item,
                  attributes,
                  quantity,
                };
                break;
              case lowercaseItem.startsWith("challengebundleschedule"):
                if (item.includes("Season12_Mission_Schedule"))
                  await GrantChallengeBundleSchedule(item, false, user.accountId);
                else await GrantChallengeBundleSchedule(item, true, user.accountId);
                break;
              case lowercaseItem.startsWith("cosmeticvarianttoken"):
                await ClaimCosmeticVariantTokenReward(item, user.accountId);
                break;
              case lowercaseItem.startsWith("token:athenaseasonxpboost"):
                BattlePassData.season_match_boost =
                  (BattlePassData.season_match_boost || 0) + quantity;
                break;
              case lowercaseItem.startsWith("token:athenaseasonfriendxpboost"):
                BattlePassData.season_friend_match_boost =
                  (BattlePassData.season_friend_match_boost || 0) + quantity;
                break;
              case lowercaseItem.startsWith("currency:mtxgiveaway"):
                for (const itemId in common_core.items) {
                  common_core.items[itemId].quantity += entry.Quantity;
                  break;
                }
                break;
            }

            multiUpdates.push({ changeType: "itemAdded", itemId: item, item: athena.items[item] });
            notifications.push({ itemType: item, itemGuid: item, quantity });
          };

          for (const itemGrants of tier) {
            await AddTier(itemGrants);
          }
        };

        for (let i = bookLevel; i < book_level; i++) {
          const paidTier = AthenaRewards.BookXpSchedulePaid.filter(
            (tier: { Tier: number }) => tier.Tier === (isBattleBundle ? i : i + 1),
          );
          const freeTier = AthenaRewards.BookXpScheduleFree.filter(
            (tier: { Tier: number }) => tier.Tier === (isBattleBundle ? i : i + 1),
          );

          await handleTiers(paidTier);
          await handleTiers(freeTier);
        }

        if (isSingleTier) common_core.items["Currency:MtxPurchased"].quantity -= price;

        applyProfileChanges.push({
          changeType: "itemAttrChanged",
          itemId: "Currency:MtxPurchased",
          quantity: common_core.items["Currency:MtxPurchased"].quantity,
        });

        book_level = Math.min(book_level, 100);

        multiUpdates.push(
          { changeType: "statModified", name: "book_level", value: book_level },
          { changeType: "statModified", name: "level", value: book_level },
        );

        const giftboxId = randomUUID();

        const giftBoxTemplate = {
          templateId: "Giftbox:GB_BattlePassPurchased",
          attributes: {
            max_level_bonus: 0,
            fromAccountId: "",
            lootList: notifications,
            time: DateTime.now().toISO(),
            userMessage: "Thank you for playing Beyond!",
            templateIdHashed: uuid(),
          },
        };

        athena.items[giftboxId] = giftBoxTemplate;

        applyProfileChanges.push({
          changeType: "itemAdded",
          itemId: giftboxId,
          item: giftBoxTemplate,
        });

        await account.updateOne({
          season: account.season,
        });
      }
    }
  }

  if (multiUpdates.length > 0) {
    athena.rvn += 1;
    athena.commandRevision += 1;
    athena.updatedAt = DateTime.utc().toISO();
  }

  if (applyProfileChanges.length > 0) {
    common_core.rvn += 1;
    common_core.commandRevision += 1;
    common_core.updatedAt = DateTime.utc().toISO();
  }

  await account.updateOne({ $set: { athena, common_core } });
  await RefreshAccount(user.accountId, user.username);

  const profileRevision = season!.buildUpdate >= "12.20" ? athena.commandRevision : athena.rvn;
  const queryRevision = c.req.query("rvn") || 0;

  if (queryRevision !== profileRevision) {
    applyProfileChanges = [
      {
        changeType: "fullProfileUpdate",
        profile: common_core,
      },
    ];
  }

  return c.json({
    profiileRevision: common_core.rvn,
    profileId,
    profileChangesBaseRevision: BaseRevision,
    profileChanges: applyProfileChanges,
    notifications: [
      {
        type: "CatalogPurchase",
        primary: true,
        lootResult: {
          items: notifications,
        },
      },
    ],
    profileCommandRevision: common_core.commandRevision,
    serverTime: DateTime.now().toISO(),
    multiUpdate: [
      {
        profileRevision: athena.rvn,
        profileId: "athena",
        profileChangesBaseRevision: AthenaBaseRevision,
        profileChanges: multiUpdates,
        profileCommandRevision: athena.commandRevision,
      },
    ],
    responseVersion: 1,
  });
}
