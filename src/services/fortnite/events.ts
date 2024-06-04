import { Hono } from "hono";
import { readFile } from "fs/promises";
import path from "path";
import cache from "../../misc/middleware/Cache";
import Users from "../../misc/models/Users";
import Accounts from "../../misc/models/Accounts";
import verify from "../../misc/middleware/verify";
import logging from "../../utils/logging/logging";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Beyond } from "../../utils/errors/errors";

interface ArenaTemplate {
  eventTemplateId: string;
}

interface EventWindow {
  eventTemplateId: string;
  eventWindowId: string;
  requireAllTokens: string[];
  requireNoneTokensCaller: string[];
}

interface Event {
  eventId: string;
  eventWindows: EventWindow[];
}

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.get("/api/v1/events/Fortnite/download/:accountId", verify, async (c) => {
    try {
      const accountId = c.req.param("accountId");

      if (!accountId) {
        c.status(400);
        return c.json({
          status: 400,
          errorCode: "errors.com.Beyond.common.bad_request",
          errorMessage: "Bad request: accountId parameter is missing.",
          numericErrorCode: 1001,
          originatingService: "router",
          intent: "prod",
        });
      }

      const [user, account, season] = await Promise.all([
        Users.findOne({ accountId }).cacheQuery(),
        Accounts.findOne({ accountId }).cacheQuery(),
        ParseUserAgent(c.req.header("User-Agent")),
      ]);

      if (!user || !account) {
        c.status(404);
        return c.json({
          status: 404,
          errorCode: "errors.com.Beyond.common.no_access",
          errorMessage: "Account or User could not be found",
          numericErrorCode: 1001,
          originatingService: "router",
          intent: "prod",
        });
      }

      if (!season) {
        c.status(400);
        return c.json({
          status: 400,
          errorCode: "errors.com.Beyond.common.bad_request",
          errorMessage: "Bad request: Invalid user agent.",
          numericErrorCode: 1002,
          originatingService: "router",
          intent: "prod",
        });
      }

      const eventsData = await readFile(
        path.join(__dirname, "..", "..", "local", "events", "events.json"),
        "utf-8",
      );
      const events: Event[] = JSON.parse(eventsData);

      const arenaTemplatesData = await readFile(
        path.join(__dirname, "..", "..", "local", "events", "templates", "arena_templates.json"),
        "utf-8",
      );
      const arenaTemplates: ArenaTemplate[] = JSON.parse(arenaTemplatesData);

      const currentSeason = `S${season.season}`;

      events.forEach((event) => {
        event.eventId = event.eventId.replace(/S10/g, currentSeason);
        event.eventWindows.forEach((window) => {
          window.eventTemplateId = window.eventTemplateId.replace(/S10/g, currentSeason);
          window.eventWindowId = window.eventWindowId.replace(/S10/g, currentSeason);
          window.requireAllTokens = window.requireAllTokens.map((token) =>
            token.replace(/S10/g, currentSeason),
          );
          window.requireNoneTokensCaller = window.requireNoneTokensCaller.map((token) =>
            token.replace(/S10/g, currentSeason),
          );
        });
      });

      arenaTemplates.forEach((template) => {
        template.eventTemplateId = template.eventTemplateId.replace(/S10/g, currentSeason);
      });

      const existingSeasonIndex = account.season.findIndex((s) => s.season_num === season.season);

      let response: any = {
        events,
        player: {
          accountId: user.accountId,
          gameId: "Fortnite",
          groupIdentity: {},
          pendingPayouts: [],
          pendingPenalties: {},
          persistentScores: {
            Hype: 0,
          },
          teams: {},
          tokens: ["ARENA_S10_Division1", `ARENA_${currentSeason}_Division1`],
        },
        templates: arenaTemplates,
      };

      if (existingSeasonIndex !== -1) {
        const seasonData = account.season[existingSeasonIndex];
        const PersistentScores = {
          ...seasonData.events.arena.persistentScores,
          [`Hype_${currentSeason}`]: seasonData.events.arena.persistentScores.Hype,
        };

        seasonData.events.arena.tokens = [`ARENA_${seasonData.season_num}_Division1`];
        seasonData.events.arena.persistentScores.Hype = PersistentScores.Hype;

        response.player.persistentScores = PersistentScores;

        await Accounts.updateOne({ $set: { season: account.season } });

        return c.json(response);
      }

      return c.json(response);
    } catch (error) {
      logging.error(`An Error occurred -> ${error}`);
      c.status(500);
      return c.json({
        status: 500,
        errorCode: "errors.com.Beyond.common.internal_server_error",
        errorMessage: "Internal server error occurred.",
        numericErrorCode: 1000,
        originatingService: "router",
        intent: "prod",
      });
    }
  });
}
