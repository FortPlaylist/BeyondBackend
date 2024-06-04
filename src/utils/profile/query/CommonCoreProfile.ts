import { v4 as uuid } from "uuid";
import { Hono, Context } from "hono";
import { DateTime } from "luxon";
import { BlankInput } from "hono/types";
import logging from "../../logging/logging";
import Users from "../../../misc/models/Users";
import Accounts from "../../../misc/models/Accounts";
import GetProfile from "../GetProfile";
import GenerateProfileChange from "./GenerateProfileChange";
import ParseUserAgent from "../../useragent/parseUseragent";
import { Beyond } from "../../errors/errors";
import path from "node:path";

export default async function CommonCoreProfile(c: Context) {
  try {
    const accountId = c.req.param("accountId");

    const [User, Account] = await Promise.all([
      await Users.findOne({ accountId }),
      await Accounts.findOne({ accountId }),
    ]);

    if (!User || !Account) return c.json(Beyond.account.accountNotFound, 404);

    const common_core = await GetProfile(User.accountId, "common_core");

    const BaseRevision = common_core.rvn || 0;

    const season = ParseUserAgent(c.req.header("User-Agent"));

    if (!season) return c.json(Beyond.internal.invalidUserAgent, 400);

    await Account.updateOne({ $set: { common_core } });

    return c.json(
      {
        profileRevision: common_core.rvn,
        profileId: "common_core",
        profileChangesBaseRevision: BaseRevision,
        profileChanges: await GenerateProfileChange("fullProfileUpdate", common_core),
        profileCommandRevision: common_core.commandRevision,
        serverTime: DateTime.now().toISO(),
        responseVersion: 1,
      },
      200,
    );
  } catch (error) {
    logging.error(`Error in QueryProfile:CommonCore -> ${error}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
