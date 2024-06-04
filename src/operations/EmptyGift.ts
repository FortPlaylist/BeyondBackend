import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile, { ProfileTypes } from "../utils/profile/GetProfile";
import Users from "../misc/models/Users";
import Friends from "../misc/models/Friends";
import Accounts from "../misc/models/Accounts";
import { GiftReceived } from "../misc/typings/Gift.types";
import SendMessageToId from "../services/xmpp/functions/SendMessageToId";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";
import CommonCoreProfile from "../utils/profile/query/CommonCoreProfile";
import ParseUserAgent from "../utils/useragent/parseUseragent";
import AthenaProfile from "../utils/profile/query/AthenaProfile";
import GenerateProfileChange from "../utils/profile/query/GenerateProfileChange";

export default async function EmptyGift(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/emptygift",
    BlankInput
  >,
) {
  const { playerName } = await c.req.json();
  const user = await Users.findOne({ username: playerName });

  if (!user) return c.json(Beyond.account.accountNotFound, 404);

  const senderAccountId = user.accountId;

  const account = await Accounts.findOne({ accountId: senderAccountId });

  if (!account) return c.json(Beyond.account.accountNotFound, 404);

  const [athena, common_core] = await Promise.all([
    GetProfile(account.accountId, "athena"),
    GetProfile(account.accountId, "common_core"),
  ]);

  if (!athena || !common_core) return c.json(Beyond.mcp.profileNotFound, 404);

  const season = ParseUserAgent(c.req.header("User-Agent"));

  if (!season) return c.json(Beyond.internal.invalidUserAgent, 400);

  let notifications: any[] = [];
  let applyProfileChanges: any[] = [];
  let BaseRevision = common_core.rvn;

  const { receiverPlayerName } = await c.req.json();

  const receiverUser = await Users.findOne({
    username: receiverPlayerName,
  });
  if (!receiverUser) return c.json(Beyond.account.accountNotFound, 404);
  const receiverAccountId = senderAccountId;
  let receiverProfile = await Accounts.findOne({
    accountId: receiverAccountId,
  });
  if (!receiverProfile) return c.json(Beyond.account.accountNotFound, 404);

  athena.rvn += 1;
  athena.commandRevision += 1;
  athena.updatedAt = DateTime.now().toISO();

  common_core.rvn += 1;
  common_core.commandRevision += 1;
  common_core.updatedAt = DateTime.now().toISO();

  await receiverProfile.updateOne({
    $set: {
      athena,
      common_core,
    },
  });

  // GiftReceived[receiverAccountId] = true;

  SendMessageToId(
    JSON.stringify({
      type: "com.epicgames.gift.received",
      payload: {},
      timestamp: DateTime.now().toISO(),
    }),
    receiverUser.accountId,
  );

  const rvn = season.buildUpdate >= "12.20" ? common_core.commandRevision : common_core.rvn;
  const query = c.req.header("rvn") || -1;

  if (query !== rvn) {
    applyProfileChanges.push(await GenerateProfileChange("fullProfileUpdate", common_core));
  }

  const profilePerVer = season.season <= 11 ? "common_core" : "athena";

  return c.json({
    profileRevision: athena.rvn || 0,
    profileId: profilePerVer,
    profileChangesBaseRevision: BaseRevision,
    profileChanges: applyProfileChanges
      ? await GenerateProfileChange("fullProfileUpdate", athena)
      : await GenerateProfileChange("fullProfileUpdate", common_core),
    notifications: notifications,
    profileCommandRevision: athena.commandRevision || 0,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });
}
