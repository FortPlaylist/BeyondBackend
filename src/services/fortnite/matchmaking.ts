import { Hono } from "hono";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import { getCookie, getSignedCookie, setCookie } from "hono/cookie";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import cache from "../../misc/middleware/Cache";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import verify from "../../misc/middleware/verify";
import Accounts from "../../misc/models/Accounts";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";
import { Encrypt } from "../../utils/aes/AESEncryption";
import { env } from "../..";
import Users from "../../misc/models/Users";
import { Beyond } from "../../utils/errors/errors";
import { SavedContent } from "../../misc/typings/Socket.types";
import { MatchmakingData } from "../../misc/typings/Matchmaking.types";

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.get(
    "/fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId",
    cache,
    verify,
    async (c) => {
      const accountId = c.req.param("accountId");
      const bucketId = c.req.query("bucketId");

      const account = await Accounts.findOne({ accountId });
      const user = await Users.findOne({ accountId });
      const userAgent = ParseUserAgent(c.req.header("User-Agent"));

      const accessToken = c.req.header("Authorization")?.split("bearer ")[1].replace("eg1~", "");

      if (!accessToken || !account || !user) return c.json(Beyond.account.accountNotFound, 404);

      if (accountId !== user.accountId) return c.json(Beyond.authentication.notYourAccount, 400);

      if (user.banned) return c.json(Beyond.account.inactiveAccount, 400);

      const bucketIds = bucketId?.split(":");

      if (bucketIds!.length < 4 || bucketIds!.length !== 4 || typeof bucketId !== "string")
        return c.json(Beyond.matchmaking.invalidBucketId);

      if (!bucketIds![2] || !bucketIds) return c.json(Beyond.matchmaking.invalidBucketId, 400);

      if (!userAgent) return c.json(Beyond.internal.invalidUserAgent, 400);

      const currentBuildUniqueId = bucketIds![0];
      const playlist = bucketIds![3];
      const region = bucketIds![2];

      MatchmakingData.Region = region;
      MatchmakingData.Playlist = playlist;
      MatchmakingData.BucketId = currentBuildUniqueId;

      let mode;

      if (region === "NAELG" || region === "EULG") mode = "Battle Royale Lategame";
      else if (playlist.toLowerCase() === "playlist_playground" && user.roles.includes("Beyond+"))
        mode = "Sandbox";
      else mode = "Battle Royale";

      const customKey = c.req.query("player.option.customKey");
      const subRegions = c.req.query("player.subregions");
      const platform = c.req.query("player.platform");
      const inputType = c.req.query("player.inputTypes");
      const input = c.req.query("player.input");
      const partyPlayerIds = c.req.query("partyPlayerIds");

      if (customKey !== undefined && typeof customKey === "string") {
        // TODO: Do custom key
      }

      return c.json({
        serviceUrl: `ws://127.0.0.1:${env.MATCHMAKER_PORT}`,
        ticketType: "mms-player",
        payload: JSON.stringify({
          playerId: account.accountId,
          partyPlayerId: partyPlayerIds,
          bucketId: `${bucketIds}:PC:public:1`,
          attributes: {
            "player.userAgent": c.req.header("User-Agent"),
            "player.preferredSubregion": subRegions!.split(",")[0],
            "player.option.spectator": "false",
            "player.inputTypes": inputType,
            "player.revision": "1",
            "player.teamFormat": "fun",
            "player.subregions": region,
            "player.season": userAgent.season,
            "player.option.partyId": "partyId",
            "player.platform": platform,
            "player.option.linkType": "DEFAULT",
            "player.input": input,
            "playlist.revision": 1,
            "player.option.fillTeam": false,
            "player.option.linkCode": customKey ? customKey : "none",
            "player.option.uiLanguage": "en",
            "player.privateMMS": customKey ? true : false,
            "player.option.groupBy": customKey ? customKey : "none",
            "player.option.microphoneEnabled": true,

            ...(customKey && { customKey: customKey }),
          },
          expiresAt: new Date(new Date().getTime() + 32 * 60 * 60 * 1000).toISOString(),
          none: uuid().replace(/-/, ""),
        }),
        signature: Encrypt(
          JSON.stringify({
            region,
            accountId: account.accountId,
            buildId: currentBuildUniqueId,
            accessToken,
            sessionId: uuid().replace(/-/gi, ""),
            matchId: uuid().replace(/-/gi, ""),
            timestamp: DateTime.now().toISO(),
            userAgent: c.req.header("User-Agent"),
            playlist,
            modeType: mode,
            customKey: typeof customKey === "string" ? customKey : undefined,
          }),
          BeyondConfiguration.CLIENT_SECRET,
        ),
      });
    },
  );

  router.get("/fortnite/api/matchmaking/session/:sessionId", verify, async (c) => {
    const sessionId = c.req.param("sessionId");

    console.log(MatchmakingData);

    const currentBuildUniqueId = MatchmakingData.BucketId;
    const region = MatchmakingData.Region;
    const playlist = MatchmakingData.Playlist;

    if (!currentBuildUniqueId) return c.json(Beyond.matchmaking.invalidBucketId, 400);
    if (!region || !playlist) return c.json(Beyond.matchmaking.missingCookie, 400);

    const Session = SavedContent.GameServerSession.find(
      (session) =>
        session.region.toLowerCase() === region.toLowerCase() &&
        session.playlist.toLowerCase() === playlist.toLowerCase(),
    );

    if (!Session) return c.json({ error: "Failed to get session." }, 400);

    const user = c.get("user");

    if (Session.playlist === "playlist_playground" && !user.roles.includes("Beyond+"))
      return c.json(
        Beyond.matchmaking.notAllowedIngame.withMessage(
          "Player not allowed ingame due to not having the required roles to play this playlist.",
        ),
        400,
      );

    return c.json({
      id: sessionId,
      ownerId: uuid().replace(/-/gi, "").toUpperCase(),
      ownerName: "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
      serverName: "[DS]fortnite-liveeugcec1c2e30ubrcore0a-z8hj-1968",
      serverAddress: Session.ip,
      serverPort: Session.port,
      maxPublicPlayers: 220,
      openPublicPlayers: 175,
      maxPrivatePlayers: 0,
      openPrivatePlayers: 0,
      attributes: {
        REGION_s: "EU",
        GAMEMODE_s: "FORTATHENA",
        ALLOWBROADCASTING_b: true,
        SUBREGION_s: "GB",
        DCID_s: "FORTNITE-LIVEEUGCEC1C2E30UBRCORE0A-14840880",
        tenant_s: "Fortnite",
        MATCHMAKINGPOOL_s: "Any",
        STORMSHIELDDEFENSETYPE_i: 0,
        HOTFIXVERSION_i: 0,
        PLAYLISTNAME_s: "Playlist_DefaultSolo",
        SESSIONKEY_s: uuid().replace(/-/gi, "").toUpperCase(),
        TENANT_s: "Fortnite",
        BEACONPORT_i: 15009,
      },
      publicPlayers: [],
      privatePlayers: [],
      totalPlayers: 45,
      allowJoinInProgress: false,
      shouldAdvertise: false,
      isDedicated: false,
      usesStats: false,
      allowInvites: false,
      usesPresence: false,
      allowJoinViaPresence: true,
      allowJoinViaPresenceFriendsOnly: false,
      buildUniqueId: currentBuildUniqueId || "11373304",
      lastUpdated: DateTime.now().toISO(),
      started: false,
    });
  });
}
