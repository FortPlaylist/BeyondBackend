import { Hono } from "hono";
import cache from "../../misc/middleware/Cache";
import Accounts, { SeasonStats } from "../../misc/models/Accounts";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Beyond } from "../../utils/errors/errors";

export default function initRoute(router: Hono) {
  router.get("/fortnite/api/receipts/v1/account/:accountId/receipts", cache, async (c) =>
    c.sendStatus(200),
  );

  router.get("/fortnite/api/v2/versioncheck", async (c) =>
    c.json({
      type: "NO_UPDATE",
    }),
  );

  router.get("/fortnite/api/v2/versioncheck/:version", async (c) =>
    c.json({
      type: "NO_UPDATE",
    }),
  );

  router.get("/fortnite/api/version", async (c) =>
    c.json({
      app: "fortnite",
      serverDate: new Date(),
      overridePropertiesVersion: "unknown",
      cln: "17951730",
      build: "444",
      moduleName: "Fortnite-Core",
      buildDate: new Date(2021, 9, 27, 21, 0, 51, 697),
      version: "18.30",
      branch: "Release-18.30",
      modules: {
        EpicLightSwitchAccessControlCore: {
          cln: "17237679",
          build: "b2130",
          buildDate: new Date(2021, 7, 19, 18, 56, 8, 144),
          version: "1.0.0",
          branch: "trunk",
        },
        epicxmppapiv1base: {
          cln: "5131a23c1470acbd9c94fae695ef7d899c1a41d6",
          build: "b3595",
          buildDate: new Date(2019, 6, 30, 9, 11, 6, 587),
          version: "0.0.1",
          branch: "master",
        },
        epiccommoncore: {
          cln: "17909521",
          build: "3217",
          buildDate: new Date(2021, 9, 25, 18, 41, 12, 486),
          version: "3.0",
          branch: "TRUNK",
        },
      },
    }),
  );

  router.get("/fortnite/api/statsv2/account/:accountId", async (c) => {
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
      console.log(error);
      return c.json(Beyond.internal.serverError, 400);
    }
  });
}
