import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile, { ProfileTypes } from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";

export default async function DedicatedServer(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/dedicated_server/:operation",
    BlankInput
  >,
) {
  const accountId = c.req.param("accountId");
  const profileId = c.req.query("profileId");
  const operation = c.req.param("operation");

  const account = await Accounts.findOne({ accountId });

  if (!account) {
    return c.json(
      {
        errorCode: "errors.com.epicgames.common.authentication.authentication_failed",
        errorMessage: `Authentication failed for /api/game/v2/profile/${accountId}/dedicated_server/${operation}`,
        messageVars: [`/api/game/v2/profile/${accountId}/dedicated_server/${operation}`],
        numericErrorCode: 1032,
        originatingService: "any",
        intent: "prod",
        error_description: `Authentication failed for /api/game/v2/profile/${accountId}/dedicated_server/${operation}`,
      },
      400,
    );
  }

  const [certainProfile] = await Promise.all([
    GetProfile(account.accountId, profileId as ProfileTypes),
  ]);

  const applyProfileChanges: any[] = [];

  const t1 = new Timing("body processing");
  let body;

  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: "Body isn't valid JSON" }, 400);
  }

  t1.print();

  const BaseRevision = certainProfile.rvn || 0;

  applyProfileChanges.push({
    changeType: "fullProfileUpdate",
    profile: certainProfile,
  });

  if (applyProfileChanges.length > 0) {
    certainProfile.rvn += 1;
    certainProfile.commandRevision += 1;
    certainProfile.updatedAt = DateTime.now().toISO();
  }

  await account.updateOne({ $set: { certainProfile } });

  const profileCommandRevision = JSON.parse(
    c.req.header("X-EpicGames-ProfileRevisions") || "[]",
  ).find((data: { profileId: string }) => data.profileId === profileId).clientCommandRevision;

  if (!profileCommandRevision)
    return c.json(
      Beyond.mcp.invalidPayload.withMessage(
        "the header 'X-EpicGames-ProfileRevisions' was not found.",
      ),
      400,
    );

  return c.json({
    profileRevision: certainProfile.rvn,
    profileId,
    profileChangesBaseRevision: BaseRevision,
    profileChanges: applyProfileChanges,
    profileCommandRevision: profileCommandRevision || certainProfile.commandRevision,
    serverTime: DateTime.now().toISO(),
    responseVersion: 1,
  });
}
