import { DateTime } from "luxon";
import Logger from "../logging/logging";
import { ItemScheme, QuestScheme } from "./GrantChallengeBundleSchedule";
import GrantQuestData from "./GrantQuestData";
import { QuestItems, StoredAthenaItems } from "./ProfileTypes";
import GetProfile from "../profile/GetProfile";

export default async function GrantCurrentQuestWeekChallengeBundles(
  currentWeek: number,
  accountId: string,
) {
  const questData = await GrantQuestData();
  const athena = await GetProfile(accountId, "athena");

  if (!questData) return null;
  if (!athena) return null;

  const missionIds: string[] = [`MissionBundle_S12_Week_0${currentWeek}`];

  for (const missionId of missionIds) {
    const quests = questData.ChallengeBundle[missionId];

    if (!quests) {
      Logger.error(`Failed to find ChallengeBundle ${missionId}`);
      continue;
    }

    quests.forEach((quest: any) => {
      let id = quest;
      const parsedId = quest.split(":");

      if (parsedId.length === 2) {
        id = parsedId[1];
      }

      const bundleQuest = quests.ChallengeRewards[id];

      if (!bundleQuest) {
        Logger.error(`Quest not found in ChallengeRewards: ${id}`);
        return;
      }

      const newQuest: QuestScheme = {
        accountId,
        profileId: "athena",
        templateId: quest,
        favorite: false,
        item_seen: true,
        objectives: [] as any,
        count: 0,
        grantedAt: DateTime.now().toISO(),
        isDaily: false,
        completion_value: 0,
      };

      for (const objectives of newQuest.objectives) {
        newQuest.objectives.push({
          backendName: objectives.backendName,
          count: objectives.count,
        });

        newQuest.count += objectives.count;
        newQuest.completion_value++;
      }

      QuestItems.set(quest, newQuest);
    });

    const itemScheme: ItemScheme = {
      accountId,
      profileId: "athena",
      templateId: `ChallengeBundle:${missionId}`,
      favorite: false,
      item_seen: true,
      quantity: 1,
    };

    // athena.items[itemScheme.templateId] = {
    //   templateId: itemScheme.templateId,
    //   attributes: {
    //     favorite: itemScheme.favorite,
    //     item_seen: itemScheme.item_seen,
    //   },
    //   quantity: itemScheme.quantity,
    // };

    StoredAthenaItems.set(`ChallengeBundle:${missionId}`, itemScheme);
  }
}
