import { Context, Hono } from "hono";
import { BlankInput } from "hono/types";
import { DateTime } from "luxon";
import GetProfile from "../utils/profile/GetProfile";
import Accounts from "../misc/models/Accounts";
import logging from "../utils/logging/logging";
import Timing from "../utils/performance/Timing";
import { Beyond } from "../utils/errors/errors";

export default async function SetBattleRoyaleBanner(
  c: Context<
    {
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    },
    "/fortnite/api/game/v2/profile/:accountId/client/SetBattleRoyaleBanner",
    BlankInput
  >,
) {
  try {
    const accountId = c.req.param("accountId");
    const profileId = c.req.query("profileId");

    const account = await Accounts.findOne({ accountId });

    if (!account) return c.json(Beyond.account.accountNotFound, 404);

    const [athena] = await Promise.all([GetProfile(account.accountId, "athena")]);

    if (!athena) return c.json(Beyond.mcp.profileNotFound, 404);

    const applyProfileChanges: any[] = [];

    const BaseRevision = athena.rvn || 0;

    const t1 = new Timing("body processing");
    let body;

    try {
      body = await c.req.json();
    } catch (error) {
      return c.json({ error: "Body isn't valid JSON" }, 400);
    }

    t1.print();

    const { homebaseBannerIconId, homebaseBannerColorId } = body;

    if (homebaseBannerColorId !== null || homebaseBannerIconId !== null) {
      athena.items.sandbox_loadout.attributes.banner_icon_template = homebaseBannerIconId;
      athena.items.sandbox_loadout.attributes.banner_color_template = homebaseBannerColorId;

      athena.stats.attributes.banner_icon = homebaseBannerIconId;
      athena.stats.attributes.banner_color = homebaseBannerColorId;

      applyProfileChanges.push({
        changeType: "statModified",
        name: "banner_icon",
        value: athena.stats.attributes.banner_icon,
      });

      applyProfileChanges.push({
        changeType: "statModified",
        name: "banner_color",
        value: athena.stats.attributes.banner_color,
      });
    }

    if (applyProfileChanges.length > 0) {
      athena.rvn += 1;
      athena.commandRevision += 1;
      athena.updatedAt = DateTime.now().toISO();
    }

    await account.updateOne({ $set: { athena } });

    return c.json({
      profileRevision: athena.rvn,
      profileId,
      profileChangesBaseRevision: BaseRevision,
      profileChanges: applyProfileChanges,
      profileCommandRevision: athena.commandRevision,
      serverTime: DateTime.now().toISO(),
      responseVersion: 1,
    });
  } catch (error) {
    logging.error(`Error: ${error}`);
    c.status(500);
    return c.json({ error: "Internal Server Error" });
  }
}
