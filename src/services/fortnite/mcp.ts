import { Hono } from "hono";
import { DateTime } from "luxon";
import cache from "../../misc/middleware/Cache";
import AthenaProfile from "../../utils/profile/query/AthenaProfile";
import CommonCoreProfile from "../../utils/profile/query/CommonCoreProfile";
import EquipBattleRoyaleCustomization from "../../operations/EquipBattleRoyaleCustomization";
import verify from "../../misc/middleware/verify";
import ClaimMfaEnabled from "../../operations/ClaimMfaEnabled";
import RemoveGiftBox from "../../operations/RemoveGiftBox";
import PurchaseCatalogEntry from "../../operations/PurchaseCatalogEntry";
import RefundMtxPurchase from "../../operations/RefundMtxPurchase";
import MarkItemSeen from "../../operations/MarkItemSeen";
import GetProfile, { ProfileTypes } from "../../utils/profile/GetProfile";
import SetMtxPlatform from "../../operations/SetMtxPlatform";
import BulkEquipBattleRoyaleCustomization from "../../operations/BulkEquipBattleRoyaleCustomization";
import SetBattleRoyaleBanner from "../../operations/SetBattleRoyaleBanner";
import EmptyGift from "../../operations/EmptyGift";
import ClientQuestLogin from "../../operations/ClientQuestLogin";
import SetItemFavoriteStatusBatch from "../../operations/SetItemFavoriteStatusBatch";
import GiftCatalogEntry from "../../operations/GiftCatalogEntry";
import SetCosmeticLockerSlot from "../../operations/SetCosmeticLockerSlot";
import DedicatedServer from "../../operations/DedicatedServer";

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.post(
    "/fortnite/api/game/v2/profile/:accountId/client/QueryProfile",
    verify,
    cache,
    async (c) => {
      const profileId = c.req.query("profileId");
      const rvn = c.req.query("rvn");
      const accountId = c.req.param("accountId");

      switch (profileId) {
        case "athena":
        case "profile0":
          return await AthenaProfile(c);

        case "common_core":
          return await CommonCoreProfile(c);
        case "creative":
          c.status(200);
          return c.json({
            profileRevision: Number(rvn) ? Number(rvn) - 0 + (1 - 0) : 1,
            profileId: "creative",
            profileChangesBaseRevision: Number(rvn) || 1,
            profileChanges: [],
            profileCommandRevision: Number(rvn) ? Number(rvn) - 0 + (1 - 0) : 1,
            serverTime: DateTime.now().toISO(),
            responseVersion: 1,
          });

        case "common_public":
          c.status(200);
          return c.json({
            profileRevision: Number(rvn) ? Number(rvn) - 0 + (1 - 0) : 1,
            profileId: "common_public",
            profileChangesBaseRevision: Number(rvn) || 1,
            profileChanges: [],
            profileCommandRevision: Number(rvn) ? Number(rvn) - 0 + (1 - 0) : 1,
            serverTime: DateTime.now().toISO(),
            responseVersion: 1,
          });

        default:
          c.status(400);
          return c.json({
            errorCode: "errors.com.epicgames.modules.profiles.operation_forbidden",
            errorMessage: `Unable to find template configuration for profile ${profileId}`,
            messageVars: undefined,
            numericErrorCode: 12813,
            originatingService: "fortnite",
            intent: "prod-live",
            error_description: `Unable to find template configuration for profile ${profileId}`,
            error: "invalid_client",
          });
      }
    },
  );

  router.post(
    "/fortnite/api/game/v3/profile/:accountId/client/emptygift",
    async (c) => await EmptyGift(c),
  );

  // TODO(Skiesuwu): Add RateLimtiing to prevent random kids from abusing this.
  router.post(
    "/fortnite/api/game/v2/profile/:accountId/dedicated_server/:operation",
    verify,
    cache,
    async (c) => await DedicatedServer(c),
  );

  router.post(
    "/fortnite/api/game/v2/profile/:accountId/client/:operation",
    verify,
    cache,
    async (c, next) => {
      const profileId = c.req.query("profileId");
      const accountId = c.req.param("accountId");
      const operation = c.req.param("operation");

      const profileCommandRevision = JSON.parse(
        c.req.header("X-EpicGames-ProfileRevisions") || "[]",
      ).find((data: { profileId: string }) => data.profileId === profileId).clientCommandRevision;

      const [profile] = await Promise.resolve([
        await GetProfile(accountId, profileId as ProfileTypes),
      ]);

      const BaseRevision = profile.rvn || 0;
      switch (operation) {
        case "EquipBattleRoyaleCustomization":
          return await EquipBattleRoyaleCustomization(c, next);

        case "ClaimMfaEnabled":
          return await ClaimMfaEnabled(c);

        case "RemoveGiftBox":
          return await RemoveGiftBox(c);

        case "PurchaseCatalogEntry":
          return await PurchaseCatalogEntry(c, next);

        case "RefundMtxPurchase":
          return await RefundMtxPurchase(c);

        case "MarkItemSeen":
          return await MarkItemSeen(c);

        case "SetMtxPlatform":
          return await SetMtxPlatform(c);

        case "BulkEquipBattleRoyaleCustomization":
          return await BulkEquipBattleRoyaleCustomization(c);

        case "SetBattleRoyaleBanner":
          return await SetBattleRoyaleBanner(c);

        case "ClientQuestLogin":
          return await ClientQuestLogin(c);

        case "SetItemFavoriteStatusBatch":
          return await SetItemFavoriteStatusBatch(c);

        case "GiftCatalogEntry":
          return await GiftCatalogEntry(c);

        case "SetCosmeticLockerSlot":
          return await SetCosmeticLockerSlot(c);

        default:
          return c.json({
            profileRevision: profile.rvn,
            profileId,
            profileChangesBaseRevision: BaseRevision,
            profileChanges: [],
            profileCommandRevision: profileCommandRevision || profile.commandRevision,
            serverTime: DateTime.now().toISO(),
            responseVersion: 1,
          });
      }
    },
  );
}
