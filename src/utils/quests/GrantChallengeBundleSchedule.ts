import { DateTime } from "luxon";
import Logger from "../logging/logging";
import GetProfile, { ProfileTypes } from "../profile/GetProfile";
import GrantQuestData from "./GrantQuestData";
import { StoredAthenaItems, QuestItems } from "./ProfileTypes";
import { ObjectivesDef } from "../../operations/ClientQuestLogin";

export interface QuestScheme {
  accountId: string;
  profileId: string;
  templateId: string;
  favorite: boolean;
  item_seen: boolean;
  objectives: ObjectivesDef[];
  count: number;
  grantedAt: string;
  isDaily: boolean;
  completion_value: number;
}

export interface ItemScheme {
  accountId: string;
  profileId: ProfileTypes;
  templateId: string;
  favorite: boolean;
  item_seen: boolean;
  quantity: number;
}

export default async function GrantChallengeBundleSchedule(
  questId: string,
  grantAllQuests: boolean,
  accountId: string,
) {
  const quests = await GrantQuestData();

  if (!quests) return;

  const questScheduleId = questId.includes(":") ? questId.split(":")[1] : questId;
  const challengeBundles = quests.ChallengeBundleSchedules[questScheduleId];

  if (!challengeBundles) {
    Logger.error("Failed to find schedule.");
    return;
  }

  const storeItemScheme = (bundleId: string) => {
    const itemScheme: ItemScheme = {
      accountId,
      profileId: "athena",
      templateId: `ChallengeBundle:${bundleId}`,
      favorite: false,
      item_seen: true,
      quantity: 1,
    };
    StoredAthenaItems.set(`ChallengeBundle:${bundleId}`, itemScheme);
  };

  if (grantAllQuests) {
    const bundles = quests.ChallengeBundleSchedules[questScheduleId];

    if (!bundles) {
      Logger.error(`ChallengeBundleSchedule with the id ${questScheduleId} was not found.`);
      return;
    }

    for (let i = 0; i < bundles.length; i++) {
      const bundle = bundles[i];

      let id = bundle;
      const parsedId = bundle.split(":");

      if (parsedId.length === 2) {
        id = parsedId[2];
        Logger.error(`Id was too short ${id}`);
      }

      const challengeBundleQuest = quests.ChallengeBundle[id];

      if (!challengeBundleQuest) {
        Logger.error(`ChallengeBundleQuest with the id ${id} was not found.`);
        continue;
      }

      challengeBundleQuest.forEach((quest: any) => {
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

      storeItemScheme(id);
    }
  }

  const itemScheme: ItemScheme = {
    accountId,
    profileId: "athena",
    templateId: `ChallengeBundleSchedule:${questScheduleId}`,
    favorite: false,
    item_seen: true,
    quantity: 1,
  };

  StoredAthenaItems.set(`ChallengeBundleSchedule:${questScheduleId}`, itemScheme);
}
