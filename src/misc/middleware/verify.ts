import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { Context, Hono, Next } from "hono";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Beyond } from "../../utils/errors/errors";

export default async function verify(c: Context, next: Next) {
  const authorization = c.req.header("Authorization");
  const originalUrl = c.req.url;

  const servicePath = originalUrl.split("/")[1];
  const reqService = ["account", "com.epicgames.account.public"].includes(servicePath)
    ? undefined
    : servicePath;

  try {
    if (
      !authorization ||
      !(authorization.startsWith("bearer ") || authorization.startsWith("bearer eg1~"))
    )
      return c.json(Beyond.authentication.invalidToken, 400);

    // const decodedToken = jwt.verify(token);
    const token = authorization.replace("bearer eg1~", "");
    const decodedToken = jwt.verify(token, BeyondConfiguration.CLIENT_SECRET);

    if (!decodedToken) return c.json(Beyond.authentication.invalidToken, 400);

    const [user, account] = await Promise.all([
      Users.findOne({ accountId: decodedToken.sub as string }),
      Accounts.findOne({ accountId: decodedToken.sub as string }),
    ]);

    if (!user || !account) return c.json(Beyond.account.accountNotFound, 404);

    if (user.banned) return c.json(Beyond.account.inactiveAccount, 400);

    const userAgent = ParseUserAgent(c.req.header("User-Agent"));

    if (!userAgent) return c.json(Beyond.internal.invalidUserAgent, 400);

    c.set("user", user);
    c.set("account", account);
    c.set("decodedToken", decodedToken);

    await next();
  } catch (error) {
    const isTokenError = error instanceof JsonWebTokenError;
    const errorCode = isTokenError
      ? "errors.com.epicgames.common.authentication.token_verification_failed"
      : "errors.com.epicgames.common.authentication.authentication_failed";

    const errorMessage = isTokenError
      ? "Sorry, we couldn't validate your token. Please try again with a new token."
      : `Authentication failed for ${originalUrl.replace("/account", "")}`;

    const numericErrorCode = isTokenError ? 1014 : 1032;
    const messageVars = isTokenError ? [null] : [originalUrl.replace("/account", "")];

    c.status(401);
    return c.json({
      errorCode,
      errorMessage,
      messageVars,
      numericErrorCode,
      originatingService: reqService,
      intent: "prod",
    });
  }
}
