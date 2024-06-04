import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile, { ProfileTypes } from "../utils/profile/GetProfile";
import { Beyond } from "../utils/errors/errors";

export default async function ClaimMfaEnabled(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/ClaimMfaEnabled",
    BlankInput
  >,
) {
  const rvn = c.req.query("rvn");
  const profileId = c.req.query("profileId");

  const accountId = c.req.param("accountId");

  const [profile] = await Promise.all([await GetProfile(accountId, profileId as ProfileTypes)]);

  if (!profile) return c.json(Beyond.mcp.profileNotFound, 404);

  const BaseRevision = profile.rvn || 0;

  return c.json({
    profileRevision: profile.rvn,
    profileId,
    profileChangesBaseRevision: BaseRevision,
    profileChanges: [],
    profileCommandRevision: profile.rvn,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });
}
