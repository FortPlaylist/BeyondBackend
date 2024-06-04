import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import RefreshAccount from "./RefreshAccount";

export default async function SendBattlePassGiftBox(
  id: string,
  athena: any,
  notifications: any[],
  templateId?: string,
  user?: any,
) {
  const item = {
    templateId,
    attributes: {
      item_seen: false,
      lootList: notifications,
      fromAccountId: "",
    },
    quantity: 1,
  };

  athena.items[id] = item;

  await RefreshAccount(user.accountId, user.username);

  return {
    changeType: "itemAdded",
    itemId: id,
    item,
  };
}
