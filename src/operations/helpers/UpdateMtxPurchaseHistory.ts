import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";

export interface Purchase {
  purchaseId: string;
  offerId: string;
  purchaseDate: string;
  undoTimeout: string;
  freeRefundEligible: boolean;
  fulfillments: any[];
  lootResult: LootResult[];
  totalMtxPaid: number;
  metadata: any;
  gameContext: string;
}

interface LootResult {
  itemType: string;
  itemGuid: string;
  bundledItems: string[];
  itemProfile: string;
  quantity: number;
}

export default function UpdateMtxPurchaseHistory(
  commonCore: any,
  offerId: string,
  currentStorefront: any,
  purchaseId: string,
  price: number,
  bundledItems: string[],
) {
  const { purchases } = commonCore.stats.attributes.mtx_purchase_history;
  const existingPurchaseIndex = purchases.findIndex(
    (purchase: Purchase) => purchase.lootResult[0].itemType === currentStorefront.item,
  );

  if (existingPurchaseIndex !== -1) {
    purchases.splice(existingPurchaseIndex, 1);
  }

  const newPurchase: Purchase = {
    purchaseId,
    offerId: `v2:/${offerId}`,
    purchaseDate: DateTime.now().toISO(),
    undoTimeout: "9999-12-12T00:00:00.000Z",
    freeRefundEligible: false,
    fulfillments: [],
    lootResult: [
      {
        itemType: purchaseId,
        itemGuid: purchaseId,
        bundledItems: bundledItems || [],
        itemProfile: "athena",
        quantity: 1,
      },
    ],
    totalMtxPaid: price,
    metadata: {},
    gameContext: "",
  };

  commonCore.stats.attributes.mtx_purchase_history.purchases.push(newPurchase);
}
