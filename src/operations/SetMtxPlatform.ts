import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile, { ProfileTypes } from "../utils/profile/GetProfile";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";
import Accounts from "../misc/models/Accounts";

export default async function SetMtxPlatform(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/SetMtxPlatform",
    BlankInput
  >,
) {
  const accountId = c.req.param("accountId");

  const [profile] = await Promise.all([await GetProfile(accountId, "common_core")]);

  if (!profile) return c.json(Beyond.mcp.profileNotFound, 404);

  const [account] = await Promise.all([await Accounts.findOne({ accountId })]);
  if (!account) return c.json(Beyond.authentication.oauth.invalidAccountCredentials, 400);

  const t1 = new Timing("body processing");
  let body;

  try {
    body = await c.req.json();
  } catch (error) {
    return c.json(Beyond.proxy.invalidBody, 400);
  }

  t1.print();

  const BaseRevision = profile.rvn || 0;
  const { newPlatform } = body;

  if (!newPlatform)
    return c.json(Beyond.basic.badRequest.withMessage("the param 'newPlatform' is missing."), 400);

  for (const items in profile.items) {
    profile.items[items].attributes.platform = newPlatform;
    profile.stats.attributes.current_mtx_platform = newPlatform;
  }

  const applyProfileChanges: any[] = [];

  // if (typeof newPlatform === "string" && newPlatform !== null || undefined) {
  //   applyProfileChanges.push({})
  // }

  applyProfileChanges.push({
    changeType: "statModified",
    name: "current_mtx_platform",
    value: newPlatform,
  });

  if (applyProfileChanges.length > 0) {
    profile.rvn += 1;
    profile.commandRevision += 1;
    profile.updatedAt = DateTime.now().toISO();
  }

  await account.updateOne({ $set: { common_core: profile } });

  return c.json({
    profileRevision: profile.rvn,
    profileId: "common_core",
    profileChangesBaseRevision: BaseRevision,
    profileChanges: applyProfileChanges,
    profileCommandRevision: profile.rvn,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });
}
