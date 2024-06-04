import { Hono, HonoRequest, Next } from "hono";
import { Beyond } from "../../utils/errors/errors";
import Accounts from "../../misc/models/Accounts";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";
import GetProfile from "../../utils/profile/GetProfile";
import Users from "../../misc/models/Users";
import RefreshAccount from "../../operations/helpers/RefreshAccount";
import cache from "../../misc/middleware/Cache";
import { v4 as uuidv4 } from "uuid";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Context } from "hono";

export default function initRoute(router: Hono) {
  router.post("/beyond/api/v2/dedicated/rewards/win/:accountId", cache, async (c) => {
    try {
      const accountId = c.req.param("accountId");
      const userAgent = c.req.header("User-Agent");

      const season = ParseUserAgent(userAgent);

      const body = await c.req.json();

      if (!accountId) {
        return c.json(Beyond.basic.badRequest.withMessage("Param 'accountId' is missing."), 400);
      }

      const account = await Accounts.findOne({ accountId });
      const user = await Users.findOne({ accountId });

      if (!account || !user) {
        return c.json(Beyond.account.accountNotFound, 404);
      }

      const athena = await GetProfile(account.accountId, "athena");

      if (!athena) {
        return c.json(Beyond.mcp.profileNotFound, 404);
      }

      const { playlist, placement, secretClientId, kills } = body;

      if (!secretClientId || secretClientId !== BeyondConfiguration.CLIENT_SECRET)
        return c.json(Beyond.basic.badRequest.withMessage("Invalid param 'secretClientId'."), 400);

      const SeasonIndex = account.season.findIndex((s) => s.season_num === season!.season);

      if (SeasonIndex !== -1) {
        const SeasonObject = account.season[SeasonIndex];
        const stats = SeasonObject.stats;

        const umbrellaTemplateId = "AthenaGlider:Umbrella_Season_12";

        const addUmbrella = (umbrellaType: string) => {
          if (!athena.items[umbrellaType]) {
            athena.items[umbrellaType] = {
              templateId: umbrellaType,
              attributes: {
                max_level_bonus: 0,
                level: 1,
                item_seen: false,
                xp: 0,
                variants: [],
                favorite: false,
              },
              quantity: 1,
            };
          }
        };

        switch (true) {
          case playlist.toLowerCase().includes("solo"):
            if (placement === 1) {
              addUmbrella("AthenaGlider:Solo_Umbrella");
              addUmbrella(umbrellaTemplateId);
              stats.solos.wins += 1;
            }
            stats.solos.matchplayed += 1;
            stats.solos.kills += kills;
            break;

          case playlist.toLowerCase().includes("duo"):
            if (placement === 1) {
              addUmbrella("AthenaGlider:Duo_Umbrella");
              addUmbrella(umbrellaTemplateId);
              stats.duos.wins += 1;
            }
            stats.duos.matchplayed += 1;
            stats.duos.kills += kills;
            break;

          case playlist.toLowerCase().includes("squad"):
            if (placement === 1) {
              addUmbrella("AthenaGlider:Squad_Umbrella");
              addUmbrella(umbrellaTemplateId);
              stats.squads.wins += 1;
            }
            stats.squads.matchplayed += 1;
            stats.squads.kills += kills;
            break;
        }

        await account.updateOne({ $set: { season: account.season } });
      }

      await account.updateOne({ $set: { athena } });

      await RefreshAccount(user.accountId, user.username);

      return c.json({ message: "Success!" }, 200);
    } catch (error) {
      console.error("Error occurred:", error);
      return c.json(Beyond.internal.serverError, 500);
    }
  });

  router.post("/beyond/api/v2/dedicated/rewards/vbucks/:accountId", cache, async (c) => {
    const accountId = c.req.param("accountId");
    const userAgent = c.req.header("User-Agent");

    const body = await c.req.json();

    const { amount } = body;

    if (!accountId) {
      return c.json(Beyond.basic.badRequest.withMessage("Param 'accountId' is missing."), 400);
    }

    const account = await Accounts.findOne({ accountId });
    const user = await Users.findOne({ accountId });

    if (!account || !user) {
      return c.json(Beyond.account.accountNotFound, 404);
    }

    const common_core = await GetProfile(account.accountId, "common_core");

    if (!common_core) {
      return c.json(Beyond.mcp.profileNotFound, 404);
    }

    if (userAgent !== BeyondConfiguration.USER_AGENT)
      return c.json(Beyond.internal.invalidUserAgent, 400);

    for (const item in common_core.items) {
      common_core.items[item].quantity += amount;
    }

    await account.updateOne({ $set: { common_core } });

    await RefreshAccount(user.accountId, user.username);

    return c.json({
      message: `Successfully added ${amount} ${amount === 1 ? "vbuck" : "vbucks"} to ${user.username}'s account.`,
    });
  });
}
