import { Variant } from "../../local/interfaces";
import Accounts from "../../misc/models/Accounts";
import GetProfile from "../profile/GetProfile";
import GetCosmeticVariantTokenReward from "./GetCosmeticVariantTokenReward";

export default async function ClaimCosmeticVariantTokenReward(VTID: string, accountId: string) {
  const tokens = await GetCosmeticVariantTokenReward();

  const reward = tokens[VTID];
  if (!reward) return;

  const account = await Accounts.findOne({ accountId });
  if (!account) return;

  const athena = await GetProfile(account.accountId, "athena");
  if (!athena) return;

  const item = athena.items[reward.templateId];
  if (item) {
    if (!item.attributes.variants.find((variant: Variant) => variant.channel === reward.channel)) {
      item.attributes.variants.push({
        channel: reward.channel,
        owned: [],
      });
    }

    const variant = item.attributes.variants.find(
      (variant: Variant) => variant.channel === reward.channel,
    );
    if (!variant.owned.includes(reward.value)) {
      variant.owned.push(reward.value);
    }
  }

  await Accounts.updateOne({ athena });

  return reward;
}
