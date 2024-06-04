import { Hono } from "hono";
import jwt from "jsonwebtoken";
import Accounts from "../../misc/models/Accounts";
import log from "../../utils/logging/logging";
import Users from "../../misc/models/Users";
import { Beyond } from "../../utils/errors/errors";
import verifyNoBan from "../../misc/middleware/verify_without_ban";

export default function initRoute(router: Hono): void {
  router.get("/lightswitch/api/service/bulk/status", verifyNoBan, async (c) => {
    let isbanned: boolean = false;

    let authorization;
    let accountId: string;

    try {
      authorization = c.req.header("Authorization")?.replace("bearer eg1~", "");

      const decodedToken = jwt.decode(authorization as string);

      accountId = decodedToken?.sub as string;
    } catch (error) {
      c.status(500);
      return c.json({ error: "Internal Server Error." });
    }

    const user = await Users.findOne({ accountId }).cacheQuery();

    if (!user) return c.json(Beyond.account.accountNotFound, 404);

    const account = await Accounts.findOne({
      accountId: user.accountId,
    }).cacheQuery();

    if (!account) return c.json(Beyond.account.accountNotFound, 404);

    if (user.banned) isbanned = true;

    return c.json([
      {
        serviceInstanceId: "fortnite",
        status: "UP",
        message: "Beyond Servers are UP!",
        maintenanceUri: null,
        overrideCatalogIds: ["a7f138b2e51945ffbfdacc1af0541053"],
        allowedActions: ["PLAY", "DOWNLOAD"],
        banned: isbanned,
        launcherInfoDTO: {
          appName: "Fortnite",
          catalogItemId: "4fe75bbc5a674f4f9b356b5c90567da5",
          namespace: "fn",
        },
      },
    ]);
  });
}
