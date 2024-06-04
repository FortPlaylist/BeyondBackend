import { Hono } from "hono";
import { DateTime } from "luxon";
import cache from "../../misc/middleware/Cache";
import Users from "../../misc/models/Users";
import logging from "../../utils/logging/logging";
import verify from "../../misc/middleware/verify";
import { Beyond } from "../../utils/errors/errors";

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.post("/fortnite/api/game/v2/tryPlayOnPlatform/account/:accountId", cache, async (c) => {
    c.res.headers.append("Content-Type", "text/plain");
    return c.body("true");
  });

  router.get("/account/api/public/account/:accountId/externalAuths", cache, async (c) =>
    c.sendStatus(200),
  );

  router.get("/fortnite/api/game/v2/enabled_features", cache, async (c) => c.sendStatus(200));

  router.get("/account/api/public/account/:accountId", verify, cache, async (c) => {
    const accountId = c.req.param("accountId");
    const user = await Users.findOne({ accountId }).cacheQuery();

    try {
      if (!user) return c.json(Beyond.account.accountNotFound, 404);
      if (user.banned) return c.json(Beyond.account.disabledAccount, 400);

      return c.json({
        id: user.accountId,
        displayName: user.username,
        name: user.username,
        email: user.email,
        failedLoginAttempts: 0,
        lastLogin: DateTime.utc().toFormat("yyyy-MM-ddTHH:mm:ss.SSS'Z'"),
        numberOfDisplayNameChanges: 0,
        ageGroup: "UNKNOWN",
        headless: false,
        country: "US",
        lastName: "User",
        links: {},
        preferredLanguage: "en",
        canUpdateDisplayName: false,
        tfaEnabled: true,
        emailVerified: true,
        minorVerified: true,
        minorExpected: true,
        minorStatus: "UNKNOWN",
      });
    } catch (error) {
      const err: Error = error as Error;
      logging.error(`Error while fetching public account information:  ${err.message}`);
      c.status(500);
      return c.json({ error: "Internal Server Error" });
    }
  });

  router.get("/account/api/public/account", verify, cache, async (c) => {
    try {
      const accountIdQuery = c.req.query("accountId");

      if (!accountIdQuery) {
        c.status(404);
        return c.sendStatus(200);
      }

      const response: any[] = [];

      if (accountIdQuery!.includes(",")) {
        const accountIds: string[] = accountIdQuery.split(",");

        for (const accountId of accountIds) {
          const user = await Users.findOne({ accountId }).cacheQuery();

          if (!user) {
            c.status(404);
            return c.json({ error: "User not found." });
          }

          response.push({
            id: user.accountId,
            displayName: user.username,
            externalAuth: {},
          });
        }
      } else {
        const user = await Users.findOne({
          accountId: accountIdQuery,
        }).cacheQuery();

        if (!user) {
          c.status(404);
          return c.json({ error: "User not found." });
        }

        response.push({
          id: user.accountId,
          links: {},
          displayName: user.username,
          cabinedMode: false,
          externalAuth: {},
        });
      }

      return c.json(response);
    } catch (error) {
      const err: Error = error as Error;
      logging.error(`Error while fetching public account information: ${err.message}`);
      c.status(500);
      return c.json({ error: "Internal Server Error" });
    }
  });

  router.get("/account/api/public/account/displayName/:displayName", verify, async (c) => {
    const username = c.req.param("displayName");

    const user = await Users.findOne({
      username,
    }).cacheQuery();

    if (!user) {
      c.status(404);
      return c.json({
        errorCode: "errors.com.epicgames.account.account_not_found",
        errorMessage: `Sorry, we couldn't find an account for ${username}`,
        messageVars: undefined,
        numericErrorCode: 18007,
        originatingService: "any",
        intent: "prod",
        error_description: `Sorry, we couldn't find an account for ${username}`,
        error: "account_not_found",
      });
    }

    c.status(200);
    return c.json({
      id: user.accountId,
      displayName: user.username,
      externalAuths: {},
    });
  });
}
