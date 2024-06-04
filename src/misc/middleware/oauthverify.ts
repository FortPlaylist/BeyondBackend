import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { Context, Hono, Next } from "hono";
import Users from "../models/Users";
import Accounts from "../models/Accounts";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Beyond } from "../../utils/errors/errors";

export default async function oauthverify(c: Context, next: Next) {
  const hwid = c.req.header("SecretVersionTotally");

  if (!hwid) return c.json({ error: "Invalid HWID!" }, 400);
  if (hwid === "") return c.json({ error: "HWID cannot be empty." }, 400);

  c.set("hwid", hwid);
  await next();
}
