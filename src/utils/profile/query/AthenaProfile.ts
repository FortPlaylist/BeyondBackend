import { Context } from "hono";
import { DateTime } from "luxon";
import Accounts, { BattlePassData } from "../../../misc/models/Accounts";
import Users from "../../../misc/models/Users";
import GetProfile from "../GetProfile";
import GenerateProfileChange from "./GenerateProfileChange";
import ParseUserAgent from "../../useragent/parseUseragent";
import path from "node:path";
import { Beyond } from "../../errors/errors";
import Logger from "../../logging/logging";
export default async function AthenaProfile(c: Context) {
  try {
    const accountId = c.req.param("accountId");
    const AgentInfo = ParseUserAgent(c.req.header("User-Agent"));

    const [user, account] = await Promise.all([
      Users.findOne({ accountId }),
      Accounts.findOne({ accountId }),
    ]);

    if (!user || !account) return c.json(Beyond.account.accountNotFound, 404);

    if (!AgentInfo) return c.json(Beyond.internal.invalidUserAgent, 400);

    const athenaProfile = await GetProfile(accountId, "athena");
    const baseRevision = athenaProfile.rvn || 0;

    const { season } = AgentInfo;

    let isSeasonExistent = false;
    const seasonObj = account.season;

    const existingSeasonIndex = seasonObj.findIndex(
      (s: { season_num: number }) => s.season_num === season,
    );

    if (existingSeasonIndex !== -1) {
      const existingSeason = seasonObj[existingSeasonIndex];
      const lastBattlePassData = existingSeason.battlepass[existingSeason.battlepass.length - 1];

      const seasonAttributes = {
        season_num: existingSeason.season_num,
        xp: lastBattlePassData.xp,
        book_purchased: lastBattlePassData.book_purchased,
        book_level: lastBattlePassData.book_level,
        book_xp: lastBattlePassData.book_xp,
        season_friend_match_boost: lastBattlePassData.season_friend_match_boost,
        season_match_boost: lastBattlePassData.season_match_boost,
        accountLevel: lastBattlePassData.level,
        level: lastBattlePassData.level,
        battlestars: lastBattlePassData.battlestars_currency,
        battlestars_season_total: lastBattlePassData.battlestars_currency,
        purchased_bp_offers: lastBattlePassData.purchased_bp_offers,
        purchased_battle_pass_tier_offers: lastBattlePassData.purchased_battle_pass_tier_offers,
        intro_game_played: lastBattlePassData.intro_game_played,
      };

      athenaProfile.stats.attributes = { ...athenaProfile.stats.attributes, ...seasonAttributes };

      isSeasonExistent = true;
    } else {
      const newBattlePassData: BattlePassData = {
        book_purchased: false,
        book_level: 1,
        book_xp: 0,
        xp: 0,
        season_friend_match_boost: 0,
        season_match_boost: 0,
        level: 1,
        battlestars_currency: 0,
        battlestars: 0,
        intro_game_played: true,
        purchased_battle_pass_tier_offers: [],
        purchased_bp_offers: [],
      };

      const newSeasonObj = {
        season_num: season,
        battlepass: [newBattlePassData],
        quest_manager: [
          {
            dailyLoginInterval: "9999-99-99T00:00:00.000Z",
            last_xp_interaction: "9999-99-99T00:00:00.000Z",
            dailyQuestRerolls: 1,
          },
        ],
        creative: [
          {
            creative_dynamic_xp: {
              timespan: 0,
              bucketXp: 0,
              bankXp: 0,
              bankXpMult: 0,
              boosterBucketXp: 0,
              boosterXpMult: 0,
              dailyExcessXpMult: 0,
              currentDayXp: 0,
              currentDay: 0,
            },
          },
        ],
        events: { arena: { persistentScores: { Hype: 0 }, tokens: ["ARENA_S10_Divison1"] } },
        quests: { claimedWeeklyQuests: 1 },
        stats: {
          solos: { wins: 0, kills: 0, matchplayed: 0 },
          duos: { wins: 0, kills: 0, matchplayed: 0 },
          squads: { wins: 0, kills: 0, matchplayed: 0 },
          ltm: { wins: 0, kills: 0, matchplayed: 0 },
        },
      };

      seasonObj.push(newSeasonObj);
      await account.updateOne({ $set: { season: seasonObj } });

      athenaProfile.stats.attributes.season_num = newSeasonObj.season_num;
    }

    await account.updateOne({ $set: { athena: athenaProfile } });

    return c.json(
      {
        profileRevision: athenaProfile.rvn,
        profileId: "athena",
        profileChangesBaseRevision: baseRevision,
        profileChanges: await GenerateProfileChange("fullProfileUpdate", athenaProfile),
        profileCommandRevision: athenaProfile.commandRevision,
        serverTime: DateTime.now().toISO(),
        responseVersion: 1,
      },
      200,
    );
  } catch (error) {
    Logger.error(`Error in QueryProfile:Athena -> ${error}`);
    c.status(500);
    return c.json({ error: "Internal Server Error" });
  }
}
