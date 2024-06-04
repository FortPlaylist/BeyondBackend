import { Hono } from "hono";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import Users, { IUser } from "../../misc/models/Users";
import Accounts from "../../misc/models/Accounts";
import logging from "../../utils/logging/logging";
import cache from "../../misc/middleware/Cache";
import { Authorization } from "../../misc/typings/Auth.types";
import { Clients } from "../../misc/typings/Socket.types";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";
import Hashing from "../../utils/performance/Hashing";
import Timing from "../../utils/performance/Timing";
import { Beyond } from "../../utils/errors/errors";
import Encoding from "../../utils/performance/Encoding";
import { Document, Types } from "mongoose";
import { verifyTokenAPI } from "../../utils/token/VerifyToken";
import oauthverify from "../../misc/middleware/oauthverify";

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
      hwid: string;
    };
  }>,
) {
  router.delete("/account/api/oauth/sessions/kill", async (c) => c.sendStatus(200));

  router.delete("/account/api/oauth/sessions/kill/:token", async (c) => {
    const token = c.req.param("token");

    if (!token)
      return c.json(Beyond.basic.badRequest.withMessage("the param 'token' is missing."), 400);

    const authHeader: string = c.req.header("Authorization")?.split("bearer ")[1] as string;
    const accessToken = authHeader.replace("eg1~", "");

    if (!accessToken) return c.json(Beyond.authentication.invalidToken, 400);

    const decodedToken: JwtPayload = jwt.verify(
      accessToken,
      BeyondConfiguration.CLIENT_SECRET,
    ) as JwtPayload;

    if (typeof decodedToken === "string" || !decodedToken)
      return c.json(Beyond.authentication.invalidToken, 400);

    const user = await Users.findOne({ accountId: decodedToken.sub }).saveFromCache();
    const account = await Accounts.findOne({ accountId: decodedToken.sub }).saveFromCache();

    if (!user || !account) return c.json(Beyond.account.accountNotFound, 400);

    const accessTokenIndex = Authorization.accessTokens.findIndex(
      (accessToken) => accessToken.token === token,
    );
    const clientTokenIndex = Authorization.clientTokens.findIndex(
      (clientToken) => clientToken.token === token,
    );

    if (accessTokenIndex !== -1) {
      Authorization.accessTokens.splice(accessTokenIndex, 1);

      const client = Clients.find((client) => client.token === token);

      if (client) return client.socket.close();

      await account.updateOne({ $set: { accessToken: Authorization.accessTokens } });
      return c.sendStatus(200);
    }

    if (clientTokenIndex === -1) {
      Authorization.clientTokens.splice(clientTokenIndex, 1);

      await account.updateOne({ $set: { clientToken: Authorization.clientTokens } });
      return c.sendStatus(200);
    }

    return c.sendStatus(200);
  });

  router.post("/account/api/oauth/token", oauthverify, async (c) => {
    const tokenHeader = c.req.header("Authorization");

    if (!tokenHeader) return c.json(Beyond.authentication.invalidHeader, 400);

    const token = tokenHeader.split(" ");

    if (token.length !== 2 || !Encoding.isValidBase64(token[1]))
      return c.json(
        Beyond.authentication.oauth.invalidClient.withMessage("Base64 is not valid."),
        400,
      );

    const t1 = new Timing("body processing");

    let body;

    try {
      body = await c.req.parseBody();
    } catch (error) {
      return c.json(Beyond.authentication.oauth.invalidBody, 400);
    }

    t1.print();

    let { grant_type, username, password } = body;

    const clientId: string = Buffer.from(token[1], "base64").toString().split(":")[0];

    let refreshToken: string = "";
    let accessToken: string = "";

    if (!clientId) return c.json(Beyond.authentication.oauth.invalidClient, 400);

    let user:
      | (Document<unknown, {}, IUser> &
          IUser & {
            _id: Types.ObjectId;
          })
      | null = null;

    switch (grant_type) {
      case "password":
        if (!password || !username)
          return c.json(
            Beyond.basic.badRequest.withMessage("username or password is missing."),
            400,
          );

        user = await Users.findOne({ email: username as string });

        if (!user) return c.json(Beyond.authentication.oauth.invalidAccountCredentials, 404);

        if (user.banned) return c.json(Beyond.account.inactiveAccount, 400);

        if (await Hashing.verifyPassword(password as string, user.password))
          username = user.username;
        else return c.json(Beyond.authentication.oauth.invalidAccountCredentials, 404);
        break;

      case "refresh_token":
        break;

      case "client_credentials":
        const token = jwt.sign(
          {
            p: crypto.randomBytes(128).toString("base64"),
            clsvc: "fortnite",
            t: "s",
            mver: false,
            clid: clientId,
            ic: true,
            exp: Math.floor(Date.now() / 1000) + 240 * 240,
            am: "client_credentials",
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomBytes(32).toString("hex"),
            token_creation_time: DateTime.now().toISO(),
            expires_in: 1,
          },
          BeyondConfiguration.CLIENT_SECRET,
        );

        const clientTokensIndex = Authorization.clientTokens.findIndex(
          (client) => client.token === token,
        );

        if (clientTokensIndex !== -1) Authorization.clientTokens.splice(clientTokensIndex, 1);

        Authorization.clientTokens.push({
          token: token,
        });

        c.json({
          access_token: `eg1~${token}`,
          expires_in: 3600,
          expires_at: DateTime.utc().plus({ hours: 8 }).toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
          token_type: "bearer",
          client_id: clientId,
          internal_client: true,
          client_service: "fortnite",
        });
        break;

      case "exchange_code":
        const { exchange_code } = body;

        if (!exchange_code) return c.json(Beyond.basic.badRequest, 400);

        const userToken: JwtPayload | null = verifyTokenAPI(exchange_code as string) as JwtPayload;

        if (!userToken) return c.json(Beyond.authentication.oauth.invalidExchange, 400);

        user = await Users.findOne({ password: userToken.accountId });

        if (!user) return c.json(Beyond.account.accountNotFound, 404);

        break;

      default:
        return c.json(Beyond.authentication.oauth.unsupportedGrant, 400);
    }

    refreshToken = jwt.sign(
      {
        sub: user?.accountId as string,
        t: "r",
        clid: clientId,
        exp: Math.floor(Date.now() / 1000) + 1920 * 1920,
        am: grant_type,
        jti: crypto.randomBytes(32).toString("hex"),
      },
      BeyondConfiguration.CLIENT_SECRET,
    );

    accessToken = jwt.sign(
      {
        app: "fortnite",
        sub: user?.accountId as string,
        mver: false,
        clid: clientId,
        dn: username,
        am: grant_type,
        p: crypto.randomBytes(256).toString("base64"),
        iai: user?.accountId as string,
        clsvc: "fortnite",
        t: "s",
        ic: true,
        exp: Math.floor(Date.now() / 1000) + 480 * 480,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(32).toString("hex"),
      },
      BeyondConfiguration.CLIENT_SECRET,
    );

    const account = await Accounts.findOne({ accountId: user?.accountId as string });

    if (!account) return c.json(Beyond.authentication.oauth.invalidAccountCredentials, 400);

    const refreshTokenIndex = Authorization.refreshTokens.findIndex(
      (refresh) => refresh.accountId === (user?.accountId as string),
    );
    const accessTokenIndex = Authorization.accessTokens.findIndex(
      (accessToken) => accessToken.accountId === (user?.accountId as string),
    );

    if (refreshTokenIndex !== -1) Authorization.refreshTokens.splice(refreshTokenIndex, 1);

    if (accessTokenIndex !== -1) Authorization.accessTokens.splice(accessTokenIndex, 1);

    Authorization.refreshTokens.push({
      accountId: user?.accountId as string,
    });
    Authorization.accessTokens.push({
      accountId: user?.accountId as string,
      token: `eg1~${accessToken}`,
    });

    await account.updateOne({
      $set: {
        refreshToken: Authorization.refreshTokens,
        accessToken: Authorization.accessTokens,
        clientToken: Authorization.clientTokens,
      },
    });

    const RawHWID = c.get("hwid");

    if (!RawHWID && BeyondConfiguration.HwidHeaderSecretKey !== "ALLOW_EVERYONE")
      return c.json({ error: "HWID is not valid." });
    else if (RawHWID === "" && BeyondConfiguration.HwidHeaderSecretKey !== "ALLOW_EVEYONE")
      return c.json({ error: "HWID is empty." });

    await account.updateOne({ hwid: RawHWID });

    return c.json({
      access_token: `eg1~${accessToken}`,
      expires_in: 3600,
      expires_at: DateTime.utc().plus({ hours: 8 }).toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      token_type: "bearer",
      account_id: user?.accountId as string,
      client_id: clientId,
      internal_client: true,
      client_service: "fortnite",
      refresh_token: `eg1~${refreshToken}`,
      refresh_expires: 86400,
      refresh_expires_at: DateTime.utc()
        .plus({ hours: 32 })
        .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      displayName: username,
      app: "fortnite",
      in_app_id: user?.accountId as string,
      device_id: uuid().replace(/-/gi, ""),
    });
  });

  router.get("/account/api/oauth/verify", async (c) => {
    const token: string = c.req.header("Authorization")?.split("bearer ")[1] as string;
    const accessToken = token.replace("eg1~", "");

    if (!accessToken) return c.json(Beyond.authentication.invalidToken, 400);

    const decodedToken: JwtPayload = jwt.verify(
      accessToken,
      BeyondConfiguration.CLIENT_SECRET,
    ) as JwtPayload;

    if (typeof decodedToken === "string" || !decodedToken)
      return c.json(Beyond.authentication.invalidToken, 400);

    const user = await Users.findOne({ accountId: decodedToken.sub }).saveFromCache();
    const account = await Accounts.findOne({ accountId: decodedToken.sub }).saveFromCache();

    if (!user || !account) return c.json(Beyond.account.accountNotFound, 404);

    const creationTime = new Date(
      decodedToken.token_creation_time || DateTime.now().toISO(),
    ).toISOString();
    const expiry = DateTime.fromISO(creationTime).plus({ hours: decodedToken.expires_in });

    return c.json(
      {
        token,
        session_id: decodedToken.jti,
        token_type: "bearer",
        client_id: decodedToken.clid,
        internal_client: true,
        client_service: "fortnite",
        account_id: user.accountId,
        expires_in: Math.round(expiry.diffNow("seconds").seconds),
        expires_at: expiry.plus({ hours: 8 }).toISO(),
        auth_method: decodedToken.am,
        display_name: user.username,
        app: "fortnite",
        in_app_id: user.accountId,
        device_id: decodedToken.dvid,
      },
      200,
    );
  });
}
