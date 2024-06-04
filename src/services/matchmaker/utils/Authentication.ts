import WebSocket from "ws";
import { IncomingHttpHeaders } from "http";
import { DateTime } from "luxon";
import logging from "../../../utils/logging/logging";
import { Decrypt } from "../../../utils/aes/AESEncryption";
import { BeyondConfiguration } from "../../../../config/secure/BeyondConfiguration";
import Users from "../../../misc/models/Users";
import Accounts from "../../../misc/models/Accounts";

export interface AuthorizationPayload {
  accountId: string;
  timestamp: string;
  accessToken: string;
  playlist: string;
  buildId: string;
  region: string;
  customKey: string;
}

export default {
  async authenticate(headers: any, signature: string): Promise<any> {
    try {
      if (
        !headers.get("Authorization") ||
        !headers.get("Authorization")?.includes("Epic-Signed") ||
        !headers.get("Authorization")?.includes("mms-player")
      )
        return new Response("Unauthorized request", { status: 401 });

      const authorizationHeader = headers.get("Authorization");

      const decodedSignature = Decrypt(signature, BeyondConfiguration.CLIENT_SECRET);

      if (decodedSignature !== undefined || decodedSignature !== null) {
        const payload: AuthorizationPayload = JSON.parse(decodedSignature);

        const user = await Users.findOne({
          accountId: payload.accountId,
        }).cacheQuery();

        const account = await Accounts.findOne({
          accountId: payload.accountId,
        }).cacheQuery();

        if (!user || !account) {
          new Response("Unauthorized request", {
            status: 401,
          });
          return null;
        }
        if (user.banned) {
          new Response("Unauthorized request", {
            status: 401,
          });
          return null;
        }

        const tokenTimestamp: DateTime = DateTime.fromISO(payload.timestamp);

        if (tokenTimestamp.isValid) {
          const currentUtcTime: DateTime = DateTime.utc();
          const tokenLifetimeThreshold: number = 24 * 60 * 60 * 1000;

          if (currentUtcTime.diff(tokenTimestamp).milliseconds <= tokenLifetimeThreshold) {
            if (account.accessToken.includes(payload.accessToken)) {
              return payload;
            }
            return payload;
          }
          logging.info(`${user.username}'s token has expired. Disconnecting...`);
          return new Response("Socket connection terminated!", {
            status: 400,
          });
        }
      }

      return null;
    } catch (error) {
      logging.error(`An error occured when trying to Authentication: ${error}`);
      new Response("Socket connection terminated!", {
        status: 400,
      });
      return null;
    }
  },
};
