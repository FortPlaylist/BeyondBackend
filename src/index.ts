import { Hono } from "hono";
import RouteHandler from "./misc/handlers/RouteHandler";
import Config from "./utils/environment/get_environment";
import DatabaseHandler from "./misc/handlers/DatabaseHandler";
import logging, { getMethodColor, getStatusCodeColor } from "./utils/logging/logging";
import cache from "./misc/middleware/Cache";
import Middleware from "./misc/middleware/Middleware";
import Accounts from "./misc/models/Accounts";
import { Authorization } from "./misc/typings/Auth.types";
import Users from "./misc/models/Users";
import generate from "./services/storefront/generate";
import GameServerServiceHandler from "./misc/handlers/GameServerServiceHandler";

const app = new Hono<{
  Variables: {
    user: any;
    account: any;
    decodedToken: any;
  };
}>({
  strict: true,
});

export default {
  port: 5555,
  fetch: app.fetch,
};

export const env = Config.register();

app.use(async (ctx, next) => await (cache as (ctx: any, next: any) => Promise<void>)(ctx, next));

app.use("*", Middleware.handle());

process.on("exit", async () => {
  var cleanedTokens: any[] = [];
  for (var token of Authorization.accessTokens) {
    if (cleanedTokens.find((c) => c == token.accountId) || token == null) {
      continue;
    }
    await Accounts.findOne({ accountId: token.accountId }).saveFromCache();
    await Users.findOne({ accountId: token.accountId }).saveFromCache();
    cleanedTokens.push(token.accountId);
  }
});

app.use(async (ctx, next) => {
  if (env.ENABLE_LOGS) {
    if (ctx.req.path === "/images/icons/gear.png" || ctx.req.path === "/favicon.ico") await next();
    else {
      await next();

      logging.info(
        `${ctx.req.path} | (${getMethodColor(ctx.req.method)(
          ctx.req.method,
        )}) | Status ${getStatusCodeColor(ctx.res.status)(ctx.res.status)}`,
        "beyond",
      );
    }
  } else await next();
});

Promise.all([
  DatabaseHandler.connect(),
  RouteHandler.initializeRoutes(app),
  GameServerServiceHandler.initializeRoutes(app),
])
  .then(async () => {
    app.use(async (c, next) => {
      const fullUrl = `${c.req.path.split("?")[0]}`;
      const missingUrl: Set<string> = new Set<string>();

      if (!missingUrl.has(fullUrl)) {
        return c.json(
          {
            errorCode: "errors.com.Beyond.common.not_found",
            errorMessage: "Sorry, the resource you were trying to find could not be found.",
            messageVars: [fullUrl],
            numericErrorCode: 1004,
            originatingService: "any",
            intent: "prod",
            error_message: "Sorry, the resource you were trying to find could not be found.",
          },
          404,
        );
      }

      await cache(c, next);
      await next();
    });

    Promise.all([await import("./services/matchmaker/Handlers/Message"), generate.generate()]);

    import("./services/xmpp/main");
    import("./services/discord/deploy");
    import("./services/discord/index");

    logging.startup(`beyond listening on port ${env.PORT}`);
  })
  .catch((error) => {
    logging.error(`Error initializing Beyond: ${error.message}`);
    process.exit(1);
  });
