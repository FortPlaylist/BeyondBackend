import Accounts from "../../misc/models/Accounts";
import Logger from "../logging/logging";
import GetProfile from "../profile/GetProfile";
import { ProfileChange } from "./GenerateResponse";
import GrantQuestData from "./GrantQuestData";
import { GenerateQuestResponse, QuestItems, StoredAthenaItems } from "./ProfileTypes";

export default async function GenerateQuestBundleResponse(
  challengeBundleId: string,
  multiUpdates: any[],
  accountId: string,
): Promise<any[] | null | undefined> {
  const questData = await GrantQuestData();
  const account = await Accounts.findOne({ accountId });
  const athena = await GetProfile(accountId, "athena");

  if (!questData) return null;
  if (!account) return null;
  if (!athena) return null;

  let bundleId: string = challengeBundleId.replace("ChallengeBundleSchedule:", "");

  const challengeBundles = questData.ChallengeBundleSchedules[bundleId];

  if (!challengeBundles) {
    Logger.error(`Failed to find schedule with the id: ${bundleId} in questData.`);
    return undefined;
  }

  const challengeBundlesItem = StoredAthenaItems.get(`ChallengeBundleSchedule:${bundleId}`);

  if (!challengeBundlesItem) {
    Logger.error(`Failed to find schedule with the id: ${bundleId}`);
    return undefined;
  }

  multiUpdates.push({
    changeType: "itemAdded",
    itemId: challengeBundlesItem.templateId,
    item: await GenerateQuestResponse(challengeBundlesItem),
  });

  for (const bundleIdS in challengeBundles) {
    const bundle = challengeBundles[bundleIdS];
    const challengeBundleItem = StoredAthenaItems.get(`ChallengeBundle:${bundle}`);
    if (!challengeBundleItem) {
      Logger.error(`Failed to find ChallengeBundle with the id: ${bundle}`);
      return null;
    }

    multiUpdates.push({
      changeType: "itemAdded",
      itemId: challengeBundleItem.templateId,
      item: await GenerateQuestResponse(challengeBundleItem),
    });

    if (!questData.ChallengeBundle[bundle]) {
      Logger.error(`ChallengeBundle ${bundle} was not found.`);
      continue;
    }

    for (const quest in questData.ChallengeBundle[bundleIdS]) {
      const questItem = QuestItems.get(quest);

      if (!questItem) {
        Logger.error(`Quest with the id ${quest} was not found in QuestItem`);
        continue;
      }

      const ProfileChange: ProfileChange = {
        templateId: `Quest:${questItem.templateId}`,
        attributes: {
          quesst_state: "Active",
          quest_rarity: "uncommon",
          item_seen: true,
          favorite: false,
          xp_reward_scalar: 1,
          level: -1,
        },
        quantity: 1,
      };

      for (let objective = 0; questItem.objectives; objective++) {
        const objectiveValue = questItem.count[objective];
        ProfileChange.attributes[`completion_${objective}`] = objectiveValue;
      }

      ProfileChange.attributes["challenge_bundle_id"] = `ChallengeBundle:${bundle}`;

      athena.items[questItem.templateId] = ProfileChange;

      multiUpdates.push({
        changeType: "itemAdded",
        itemId: questItem.templateId,
        item: ProfileChange,
      });
    }
  }

  return multiUpdates;
}
