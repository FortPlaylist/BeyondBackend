import { Context } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import ParseUserAgent from "../utils/useragent/parseUseragent";
import RefreshAccount from "./helpers/RefreshAccount";
import Users from "../misc/models/Users";
import CommonCoreProfile from "../utils/profile/query/CommonCoreProfile";
import { Beyond } from "../utils/errors/errors";
import { GenerateQuestResponse, StoredAthenaItems } from "../utils/quests/ProfileTypes";
import GrantChallengeBundleSchedule from "../utils/quests/GrantChallengeBundleSchedule";
import GenerateResponse from "../utils/quests/GenerateResponse";
import { env } from "..";
import GrantCurrentQuestWeekChallengeBundles from "../utils/quests/GrantCurrentQuestWeekChallengeBundles";
import GenerateQuestBundleResponse from "../utils/quests/GenerateQuestBundleResponse";

interface ChallengeBundleSchedules {
  [key: string]: any;
}

interface ChallengeBundle {
  [key: string]: any;
}

export interface ObjectivesDef {
  backendName: string;
  count: number;
}

interface ChallengeRewards {
  [key: string]: {
    rewards: string[];
    objectives: ObjectivesDef[];
  };
}

export interface Quests {
  ChallengeBundleSchedules: ChallengeBundleSchedules;
  ChallengeBundle: ChallengeBundle;
  ChallengeRewards: ChallengeRewards;
}

export default async function ClientQuestLogin(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/ClientQuestLogin",
    BlankInput
  >,
) {
  const profileId = c.req.query("profileId");
  const accountId = c.req.param("accountId");

  const account = await Accounts.findOne({ accountId });
  const user = await Users.findOne({ accountId });

  if (!account || !user) return c.json(Beyond.account.accountNotFound, 404);

  const athena = await GetProfile(accountId, "athena");

  if (!athena) return c.json(Beyond.mcp.profileNotFound, 404);

  const common_core = await GetProfile(accountId, "common_core");

  if (!common_core) return c.json(Beyond.mcp.profileNotFound, 404);

  const BaseRevision = athena.rvn || 0;

  const applyProfileChanges: any[] = [];
  let multiUpdates: any = [];

  const season = ParseUserAgent(c.req.header("User-Agent"));

  const existingSeason = account.season.find((s) => s.season_num === season!.season);

  if (existingSeason) {
    const quests = existingSeason.quests;
    const BundleSchedule = StoredAthenaItems.get("Season12_Mission_Schedule");

    if (!BundleSchedule || !athena.items["ChallengeBundleSchedule:Season12_Mission_Schedule"]) {
      await GrantChallengeBundleSchedule("Season12_Mission_Schedule", true, user.accountId);
      const response = await GenerateResponse(
        "ChallengeBundleSchedule:Season12_Mission_Schedule",
        user.accountId,
      );
      if (!response) return;

      multiUpdates = response.concat(multiUpdates);
    }

    if (quests.claimedWeeklyQuests < env.CURRENT_QUEST_WEEK) {
      await GrantChallengeBundleSchedule("Season12_Mission_Schedule", false, account.accountId);

      for (let i = quests.claimedWeeklyQuests + 1; i <= env.CURRENT_QUEST_WEEK; i++) {
        await GrantCurrentQuestWeekChallengeBundles(i, account.accountId);

        const missionIds = [`MissionBundle_S12_Week_0${i}`];
        for (const id of missionIds) {
          const response = await GenerateQuestBundleResponse(id, multiUpdates, account.accountId);
          if (!response) {
            console.log(id);
            continue;
          }

          multiUpdates = response.concat(multiUpdates);
        }
      }

      const bundle = StoredAthenaItems.get("ChallengeBundleSchedule:Season12_Mission_Schedule");
      if (bundle) {
        multiUpdates.push({
          changeType: "itemAdded",
          itemId: bundle.templateId,
          item: GenerateQuestResponse(bundle),
        });
      }
    }

    for (const items of multiUpdates) {
      if (items.itemId.startsWith("Quest:")) console.log(items.itemId);

      athena.items[items.itemId] = items.item;
    }
  }

  if (multiUpdates.length > 0) {
    athena.rvn += 1;
    athena.commandRevision += 1;
    athena.updatedAt = DateTime.now().toISO();
  }

  await account.updateOne({ $set: { athena, common_core } });

  if (season!.buildUpdate >= "12.20") {
    const CommonCoreChanges = await CommonCoreProfile(c);
    applyProfileChanges.push(await CommonCoreChanges.clone().json());
  }

  await RefreshAccount(user.accountId, user.username);

  return c.json({
    profileRevision: athena.rvn,
    profileId: "athena",
    profileChangesBaseRevision: BaseRevision,
    profileChanges: multiUpdates,
    profileCommandRevision: athena.rvn,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });
}
