import { Hono } from "hono";
import verify from "../../misc/middleware/verify";
import { env } from "../..";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";
import Users from "../../misc/models/Users";
import { Beyond } from "../../utils/errors/errors";
import VivoxTokenGenerator from "../../utils/vivox/Vivox";

export default function initRoute(router: Hono) {
  router.all("/fortnite/api/game/v2/voice/:accountId/login", verify, async (c) => {
    const accountId = c.req.param("accountId");

    const [user] = await Promise.all([Users.findOne({ accountId })]);

    if (!user) return c.json(Beyond.authentication.oauth.invalidAccountCredentials, 404);

    const userUrl = `sip:.${BeyondConfiguration.VIVOX_APP_NAME}.${user.accountId}.@mtu1xp.vivox.com`;

    const token = await new VivoxTokenGenerator(BeyondConfiguration.CLIENT_SECRET).generateToken(
      BeyondConfiguration.VIVOX_APP_NAME,
      user.accountId,
      userUrl,
      "login",
    );

    return c.json({ token: `e30.${token}` }, 200);
  });

  router.all("/fortnite/api/game/v2/voice/:accountId/createLoginToken", verify, async (c) => {
    const accountId = c.req.param("accountId");

    const [user] = await Promise.all([Users.findOne({ accountId })]);

    if (!user) return c.json(Beyond.authentication.oauth.invalidAccountCredentials, 404);

    const userUrl = `sip:.${BeyondConfiguration.VIVOX_APP_NAME}.${user.accountId}.@mtu1xp.vivox.com`;

    const token = await new VivoxTokenGenerator(BeyondConfiguration.CLIENT_SECRET).generateToken(
      BeyondConfiguration.VIVOX_APP_NAME,
      user.accountId,
      userUrl,
      "login",
    );

    return c.json({ token: `e30.${token}` }, 200);
  });

  router.get("/fortnite/api/game/v2/voice/:accountId/join/:partyId", verify, async (c) => {
    const accountId = c.req.param("accountId");
    const partyId = c.req.param("partyId");

    const [user] = await Promise.all([Users.findOne({ accountId })]);

    if (!user) return c.json(Beyond.authentication.oauth.invalidAccountCredentials, 404);

    const channelUrl = `sip:confctl-g-${BeyondConfiguration.VIVOX_APP_NAME}.p-${partyId}@mtu1xp.vivox.com`;
    const userUrl = `sip:.${BeyondConfiguration.VIVOX_APP_NAME}.${user.accountId}.@mtu1xp.vivox.com`;

    const token = await new VivoxTokenGenerator(BeyondConfiguration.CLIENT_SECRET).generateToken(
      BeyondConfiguration.VIVOX_APP_NAME,
      user.accountId,
      channelUrl,
      userUrl,
      "join",
    );

    return c.json({ token: `e30.${token}` }, 200);
  });
}
