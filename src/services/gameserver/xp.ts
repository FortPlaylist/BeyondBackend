import { Hono } from "hono";
import verify from "../../misc/middleware/verify";
import Accounts, { BattlePassData } from "../../misc/models/Accounts";
import fs from "node:fs/promises";
import path from "node:path";
import GetProfile from "../../utils/profile/GetProfile";
import Timing from "../../utils/performance/Timing";
import { Beyond } from "../../utils/errors/errors";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";

interface XP {
  Level: number;
  XpToNextLevel: number;
  XpTotal: number;
  RowId: string;
}

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.post("/beyond/api/v2/dedicated/xp/level/add/:amount", verify, async (c) => {
    const userAgent = c.req.header("User-Agent");
    const amount = parseInt(c.req.param("amount"));
    const t1 = new Timing("body processing");

    try {
      if (userAgent !== BeyondConfiguration.USER_AGENT)
        return c.json({ error: "header 'User-Agent' is not valid." }, 400);

      if (typeof amount !== "number")
        return c.json({ error: "parameter 'amount' must be a int." }, 400);

      const account = await Accounts.findOne({
        accountId: c.get("user").accountId as string,
      });

      let body;

      try {
        body = await c.req.json();
      } catch (error) {
        return c.json({ error: "Body is not valid" }, 400);
      }

      t1.print();

      if (typeof body.season !== "number")
        return c.json({ error: "Season must be a number." }, 400);

      const SeasonXP: XP[] = JSON.parse(
        await fs.readFile(
          path.join(__dirname, "..", "..", "..", "local", "xp", `Season${body.season}XP.json`),
          "utf8",
        ),
      );

      if (!account) return c.json(Beyond.account.accountNotFound, 400);

      const [athena] = await Promise.all([GetProfile(account.accountId, "athena")]);

      if (!athena) return c.json(Beyond.mcp.profileNotFound, 400);

      let newBookXp: number = 0;
      let newLevel: number = 0;
      let newXp: number = 0;
      let newBookLevel: number = 0;

      for (const currentSeasonObj of account.season) {
        const existingSeasonIndex = account.season.findIndex((s) => s.season_num === body.season);

        if (existingSeasonIndex !== -1) {
          const seasonObj = account.season[existingSeasonIndex];

          const battlePassArray: BattlePassData[] = seasonObj.battlepass;
          let objNum: number = 0;

          for (let index = 0; index < battlePassArray.length; ++index) {
            objNum = index;
            break;
          }

          newBookXp = seasonObj.battlepass[objNum].book_xp;
          newLevel = seasonObj.battlepass[objNum].level;
          newXp = seasonObj.battlepass[objNum].xp;
          newBookLevel = seasonObj.battlepass[objNum].book_level;

          if (isNaN(newBookXp)) newBookXp = 1;
          if (isNaN(newXp)) newXp = 1;

          for (const level of SeasonXP) {
            if (newBookXp >= level.XpToNextLevel) {
              newLevel += level.Level;
              newBookLevel += level.Level;
              newBookXp -= level.XpToNextLevel;
              newXp -= level.XpToNextLevel;

              if (newBookLevel >= 100) newBookLevel = 100;
            } else {
              newBookXp += amount;
              newXp += amount;

              break;
            }
          }

          // TODO(Skye): Grant Level Rewards.

          await account.updateOne({
            season: account.season,
          });
          break;
        }
      }

      return c.json({ success: true, newBookXp, newLevel, newXp }, 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Failed to grant XP." }, 500);
    }
  });
}
