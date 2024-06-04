import { DateTime } from "luxon";
import Logger from "../logging/logging";
import { ProfileTypes } from "../profile/GetProfile";
import GrantQuestData from "./GrantQuestData";

export interface AthenaItems {
  accountId: string;
  profileId: ProfileTypes;
  templateId: string;
  favorite: boolean;
  item_seen: boolean;
  quantity: number;
}

interface QuestAttributes {
  max_level_bonus: number;
  level: number;
  item_seen: boolean;
  xp: number;
  favorite: boolean;
  unlock_epoch?: string;
  granted_bundles?: string[];
  has_unlock_by_completion?: boolean;
  num_quests_completed?: number;
  num_progress_quests_completed?: number;
  max_allowed_bundle_level?: number;
  num_granted_bundle_quests?: number;
  grantedquestinstanceids?: string[];
  challenge_bundle_schedule_id?: string;
}

export const StoredAthenaItems: Map<any, AthenaItems> = new Map();
export const QuestItems: Map<any, any> = new Map();

export async function GenerateQuestResponse(
  items: AthenaItems,
): Promise<{ templateId: string; attributes: QuestAttributes; quantity: number } | null> {
  const response: { templateId: string; attributes: QuestAttributes; quantity: number } = {
    templateId: items.templateId,
    attributes: {
      max_level_bonus: 0,
      level: 1,
      item_seen: items.item_seen,
      xp: 0,
      favorite: items.favorite,
    },
    quantity: items.quantity,
  };

  const questData = await GrantQuestData();
  if (!questData) return null;

  if (items.templateId.includes("ChallengeBundleSchedule:")) {
    const id = items.templateId.replace("ChallengeBundleSchedule:", "");
    const bundles = questData.ChallengeBundleSchedules[id];

    if (!bundles) {
      Logger.error(`Failed to find ChallengeBundleSchedule: ${items.templateId}`);
      return response;
    }

    const questIds = bundles.map((bundleSchedule: string) => `ChallengeBundle:${bundleSchedule}`);
    response.attributes.unlock_epoch = DateTime.now().toISO();
    response.attributes.granted_bundles = questIds;
  }

  if (items.templateId.includes("ChallengeBundle:")) {
    const id = items.templateId.replace("ChallengeBundle:", "");
    const bundles = questData.ChallengeBundle[id];

    if (!bundles) {
      Logger.error(`Failed to find ChallengeBundle: ${items.templateId}`);
      return response;
    }

    // let userSchedule: string | undefined = "";

    // for (const scheduleId in questData.ChallengeBundleSchedules) {
    //   const schedule: string[] = questData.ChallengeBundleSchedules[scheduleId];

    //   if (schedule.some((bundleId) => bundleId === id)) {
    //     userSchedule = scheduleId;
    //     break;
    //   }
    // }

    // if (!userSchedule) {
    //   Logger.error(`Schedule was not found in ChallengeBundle: ${items.templateId}`);
    //   return null;
    // }

    const userSchedule = Object.keys(questData.ChallengeBundleSchedules).find((scheduleId) => {
      return questData.ChallengeBundleSchedules[scheduleId].includes(id);
    });

    if (!userSchedule) {
      Logger.error(`Schedule was not found in ChallengeBundle: ${items.templateId}`);
      return response;
    }

    response.attributes.has_unlock_by_completion = false;
    response.attributes.num_quests_completed = 0;
    response.attributes.num_progress_quests_completed = 0;
    response.attributes.max_allowed_bundle_level = 0;
    response.attributes.grantedquestinstanceids = bundles;
    response.attributes.num_granted_bundle_quests = bundles.length;
    response.attributes.challenge_bundle_schedule_id = `ChallengeBundleSchedule:${userSchedule}`;
  }

  return response;
}
