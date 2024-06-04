import { Hono } from "hono";
import Accounts, { SeasonStats } from "../../misc/models/Accounts";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Beyond } from "../../utils/errors/errors";

export default function initRoute(router: Hono) {
  router.get("/statsproxy/api/statsv2/leaderboards/:leaderboardName", async (c) => {
    const leaderboardName = c.req.param("leaderboardName");
    const season = ParseUserAgent(c.req.header("User-Agent"));

    if (!season) return c.json(Beyond.internal.invalidUserAgent, 400);

    try {
      const leaderboardTypeToMode: { [key: string]: any } = {
        br_placetop1_keyboardmouse_m0_playlist_defaultduo: "duos",
        br_placetop1_keyboardmouse_m0_playlist_defaultsquad: "squads",
        br_placetop1_keyboardmouse_m0_playlist_defaultsolo: "solos",
        default: "solos",
      };

      console.log(leaderboardName);

      const mode = leaderboardTypeToMode[leaderboardName] || leaderboardTypeToMode.default;

      const account = await Accounts.findOne();
      const entries: any[] = [];

      if (!account) return c.json(Beyond.account.accountNotFound, 400);

      for (const currentSeasonObj of account.season) {
        const existingSeasonIndex = account.season.findIndex(
          (s) => s.season_num === season!.season,
        );

        if (existingSeasonIndex !== -1) {
          const seasonObj = account.season[existingSeasonIndex];

          const statsObj: SeasonStats = seasonObj.stats;

          entries.push({
            account: account.accountId,
            // @ts-ignore
            value: statsObj[mode].wins,
          });
        }
      }

      return c.json({
        entries,
        maxSize: 1000,
      });
    } catch (error) {
      return c.json(Beyond.internal.serverError, 400);
    }
  });

  router.get("/statsproxy/api/statsv2/account/:accountId", async (c) => {
    const accountId = c.req.param("accountId");
    const startTime = c.req.query("startTime");
    const endTime = c.req.query("endTime");

    const account = await Accounts.findOne({ accountId });
    const season = ParseUserAgent(c.req.header("User-Agent"));

    try {
      if (!season) return c.json(Beyond.internal.invalidUserAgent, 400);

      if (!account) return c.json(Beyond.account.accountNotFound, 400);

      let stats;

      for (const currentSeasonObj of account.season) {
        const existingSeasonIndex = account.season.findIndex(
          (s) => s.season_num === season!.season,
        );

        if (existingSeasonIndex !== -1) {
          const seasonObj = account.season[existingSeasonIndex];

          const statsObj: SeasonStats = seasonObj.stats;

          stats = {
            br_score_keyboardmouse_m0_playlist_DefaultSolo: 859,
            br_kills_keyboardmouse_m0_playlist_DefaultSolo: statsObj.solos.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_DefaultSolo: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_DefaultSolo: statsObj.solos.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_DefaultSolo: 0,
            br_placetop1_keyboardmouse_m0_playlist_DefaultSolo: statsObj.solos.wins,

            br_score_keyboardmouse_m0_playlist_DefaultDuo: 0,
            br_kills_keyboardmouse_m0_playlist_DefaultDuo: statsObj.duos.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_DefaultDuo: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_DefaultDuo: statsObj.duos.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_DefaultDuo: 0,
            br_placetop1_keyboardmouse_m0_playlist_DefaultDuo: statsObj.duos.wins,

            br_score_keyboardmouse_m0_playlist_DefaultSquad: 0,
            br_kills_keyboardmouse_m0_playlist_DefaultSquad: statsObj.squads.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_DefaultSquad: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_DefaultSquad: statsObj.squads.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_DefaultSquad: 0,
            br_placetop1_keyboardmouse_m0_playlist_DefaultSquad: statsObj.squads.wins,

            br_score_keyboardmouse_m0_playlist_50v50: 0,
            br_kills_keyboardmouse_m0_playlist_50v50: statsObj.ltm.kills,
            br_playersoutlived_keyboardmouse_m0_playlist_50v50: 0,
            br_matchesplayed_keyboardmouse_m0_playlist_50v50: statsObj.ltm.matchplayed,
            br_placetop25_keyboardmouse_m0_playlist_50v50: 0,
            br_placetop1_keyboardmouse_m0_playlist_50v50: statsObj.ltm.wins,
          };
        }
      }

      return c.json({
        startTime,
        endTime,
        stats,
        maxSize: 1000,
        accountId: account.accountId,
      });
    } catch (error) {
      return c.json(Beyond.internal.serverError, 400);
    }
  });
}
