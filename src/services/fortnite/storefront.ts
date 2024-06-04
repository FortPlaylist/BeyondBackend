import { Hono } from "hono";
import { readFile, exists } from "node:fs/promises";
import path from "node:path";
import cache from "../../misc/middleware/Cache";
import logging from "../../utils/logging/logging";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import verify from "../../misc/middleware/verify";
import Friends from "../../misc/models/Friends";
import GetProfile from "../../utils/profile/GetProfile";
import getOfferId from "../../utils/storefront/getOfferId";
import GenerateStorefrontResponse from "../storefront/GenerateStorefrontResponse";

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.get("/fortnite/api/storefront/v2/keychain", cache, async (c) => {
    const keychain = JSON.parse(
      await readFile(
        path.join(__dirname, "..", "..", "local", "storefront", "keychain.json"),
        "utf-8",
      ),
    );

    c.status(200);
    return c.json(keychain);
  });

  router.get("/fortnite/api/storefront/v2/catalog", async (c) => {
    try {
      const shop = path.join(__dirname, "..", "..", "local", "storefront", "shop.json");
      const shopData = JSON.parse(await readFile(shop, "utf-8"));

      const season = ParseUserAgent(c.req.header("User-Agent"));

      if (!season) {
        c.status(400);
        return c.json({ error: "Failed to get Valid Season UserAgent." });
      }

      const storefront = {
        refreshIntervalHrs: 24,
        dailyPurchaseHrs: 24,
        expiration: shopData.expiration,
        storefronts: [
          { name: "BRDailyStorefront", catalogEntries: [] },
          { name: "BRWeeklyStorefront", catalogEntries: [] },
        ],
      };

      const weeklyPriority: number = 0;
      const dailyPriority: number = 0;
      let filePath: any = path.join(
        __dirname,
        "..",
        "..",
        "local",
        "storefront",
        "battlepasses",
        `Season12.json`,
      );

      const BattlePassData = JSON.parse(await readFile(filePath, "utf8"));
      const { name, catalogEntries } = BattlePassData;

      storefront.storefronts.push({
        name,
        catalogEntries,
      });

      GenerateStorefrontResponse(
        "BRDailyStorefront",
        shopData.catalogItems.BRDailyStorefront,
        dailyPriority,
        storefront,
        c,
      );

      GenerateStorefrontResponse(
        "BRWeeklyStorefront",
        shopData.catalogItems.BRWeeklyStorefront,
        weeklyPriority,
        storefront,
        c,
      );

      return c.json(storefront);

      return c.json(shopData);
    } catch (error) {
      logging.error(`Failed to Get Catalog: ${error}`);
      c.status(500);
      return c.json({ error: "Internal Server Error" });
    }
  });

  router.get(
    "/fortnite/api/storefront/v2/gift/check_eligibility/recipient/:friendId/offer/:offerId",
    verify,
    async (c, next) => {
      const friendId = c.req.param("friendId");
      const offerId = c.req.param("offerId");

      const shop = path.join(__dirname, "..", "..", "local", "storefront", "shop.json");
      const shopData = JSON.parse(await readFile(shop, "utf-8"));

      const item = getOfferId(shopData, offerId);

      if (!item) {
        c.status(400);
        return c.json({
          errorCode: "errors.com.epicgames.fortnite.id_invalid",
          errorMessage: `Offer ID (${offerId}) not found.`,
          messageVars: [
            `/api/storefront/v2/gift/check_eligibility/recipient/${friendId}/offer/${offerId}`,
          ],
          numericErrorCode: 1040,
          originatingService: "any",
          intent: "prod",
          error_description: `Offer ID (${offerId}) not found.`,
          error: undefined,
        });
      }

      const friend = await Friends.findOne({
        accountId: c.get("user").accountId,
      });

      if (!friend) {
        c.status(400);
        return c.json({
          errorCode: "errors.com.epicgames.common.authentication.authentication_failed",
          errorMessage: `Authentication failed for /api/storefront/v2/gift/check_eligibility/recipient/${friendId}/offer/${offerId}`,
          messageVars: [
            `/api/storefront/v2/gift/check_eligibility/recipient/${friendId}/offer/${offerId}`,
          ],
          numericErrorCode: 1032,
          originatingService: "any",
          intent: "prod",
          error_description: `Authentication failed for /api/storefront/v2/gift/check_eligibility/recipient/${friendId}/offer/${offerId}`,
        });
      }

      const accepted = friend.friends.accepted.find((f) => f.accountId === friendId);

      let accountId: string;

      if (!accepted && friendId !== c.get("user").accountId) {
        c.status(400);
        return c.json({
          errorCode: "errors.com.epicgames.friends.no_relationship",
          errorMessage: `User ${friend.accountId} is not friends with ${friendId}`,
          messageVars: [
            `/api/storefront/v2/gift/check_eligibility/recipient/${friendId}/offer/${offerId}`,
          ],
          numericErrorCode: 28004,
          originatingService: "any",
          intent: "prod",
          error_description: `User ${friend.accountId} is not friends with ${friendId}`,
          error: undefined,
        });
      }

      if (accepted) accountId = accepted.accountId!;
      else accountId = c.get("user").accountId;

      const [athena] = await Promise.all([GetProfile(accountId, "athena")]);

      const items = { id: item.item, items: item.items };

      if (item.items.length > 0) {
        const itemsArray = item.items.map((item: { item: string }) => item.item);

        for (const i of item.items) {
          if (athena.items[i.item]) {
            c.status(400);
            return c.json({
              errorCode: "errors.com.epicgames.modules.gamesubcatalog.purchase_not_allowed",
              errorMessage: `User with accountId ${accountId} already owns this item.`,
              messageVars: [
                `/api/storefront/v2/gift/check_eligibility/recipient/${friendId}/offer/${offerId}`,
              ],
              numericErrorCode: 28004,
              originatingService: "any",
              intent: "prod",
              error_description: `User with accountId ${accountId} already owns this item.`,
              error: undefined,
            });
          }
        }

        itemsArray.push(items.id);
        items.items = itemsArray;
      } else {
        items.items = [items.id];

        if (athena.items[items.id]) {
          c.status(400);
          return c.json({
            errorCode: "errors.com.epicgames.modules.gamesubcatalog.purchase_not_allowed",
            errorMessage: `User with accountId ${accountId} already owns this item.`,
            messageVars: [
              `/api/storefront/v2/gift/check_eligibility/recipient/${friendId}/offer/${offerId}`,
            ],
            numericErrorCode: 28004,
            originatingService: "any",
            intent: "prod",
            error_description: `User with accountId ${accountId} already owns this item.`,
            error: undefined,
          });
        }
      }

      return c.json({
        price: item.price,
        items: items.items,
      });
    },
  );
}
