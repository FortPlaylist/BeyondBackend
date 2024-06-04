import Logger from "../../utils/logging/logging";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Item } from "./types/shop.types";
import { Context } from "hono";
import { BlankInput } from "hono/types";

export default function GenerateStorefrontResponse(
  storefrontName: string,
  items: Item[],
  priority: number,
  storefront: any,
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/storefront/v2/catalog",
    BlankInput
  >,
) {
  items.forEach((item: Item) => {
    const entryPriority = ++priority;

    const requirements: {
      requirementType: string;
      requiredId: string;
      minQuantity: number;
    }[] = [];

    const itemGrants: { templateId: string; quantity: number }[] = [];
    const season = ParseUserAgent(c.req.header("User-Agent"));

    if (!season) {
      c.status(400);
      return c.json({ error: "Failed to get Valid Season UserAgent." });
    }

    try {
      if (typeof item === "object" && item !== null) {
        if (!item.item || item.item === "") {
          if (item.name.toLowerCase().includes("bundle") && Array.isArray(item.items)) {
            for (const i of item.items) {
              itemGrants.push({ templateId: i.item, quantity: 1 });
              requirements.push({
                requirementType: "DenyOnItemOwnership",
                requiredId: i.item,
                minQuantity: 1,
              });
            }
          }
        } else {
          itemGrants.push({ templateId: item.item, quantity: 1 });
          requirements.push({
            requirementType: "DenyOnItemOwnership",
            requiredId: item.item,
            minQuantity: 1,
          });

          if (Array.isArray(item.items)) {
            for (const i of item.items) {
              if (typeof i === "object" && i !== null && i.item) {
                itemGrants.push({ templateId: i.item, quantity: 1 });
                requirements.push({
                  requirementType: "DenyOnItemOwnership",
                  requiredId: i.item,
                  minQuantity: 1,
                });
              }
            }
          }
        }
      }
      let parsedItems: any = [];
      let actual: any[] = [];

      if (typeof item === "object" && item !== null) {
        if (item.items.length > 0) {
          for (const i of item.items) {
            if (typeof i === "object" && i !== null) {
              parsedItems = i;

              for (const test of parsedItems.categories) {
                for (const test2 of item.categories) {
                  actual = [test];
                }
              }
            }
          }
        }
      }

      let entry = {
        devName: `[VIRTUAL]1 x ${item.item} for ${item.price} MtxCurrency`,
        offerId: `item://${item.offerId}`,
        fulfillmentIds: [],
        dailyLimit: -1,
        weeklyLimit: -1,
        monthlyLimit: -1,
        categories: actual || [],
        prices: [
          {
            currencyType: "MtxCurrency",
            currencySubType: "Currency",
            dynamicRegularPrice: parseInt(item.price.toString()) || 0,
            regularPrice: parseInt(item.price.toString()) || 0,
            finalPrice: parseInt(item.price.toString()) || 0,
            saleExpiration: "9999-12-31T23:59:59.999Z",
            basePrice: parseInt(item.price.toString()) || 0,
          },
        ],
        matchFilter: "",
        filterWeight: 0,
        appStoreId: [],
        requirements,
        offerType: "StaticPrice",
        giftInfo: {
          bIsEnabled: true,
          forcedGiftBoxTemplateId: "",
          purchaseRequirements: requirements,
          giftRecordIds: [],
        },
        refundable: true,
        metaInfo: item.metaInfo,
        meta: item.meta,
        displayAssetPath: item.displayAssetPath,
        newDisplayAssetPath: item.newDisplayAssetPath,
        itemGrants,
        title: "",
        sortPriority: entryPriority,
        catalogGroupPriority: entryPriority,
        shortDescription: "",
      };

      return storefront.storefronts[
        storefrontName.toLowerCase().includes("brweeklystorefront") ? 1 : 0
      ].catalogEntries.push(entry);
    } catch (error) {
      Logger.error(`Failed to GenerateStorefrontResponse: ${error}`, "GenerateStorefrontResponse");
      c.status(500);
      return c.json({ error: "Internal Server Error" });
    }
  });
}
