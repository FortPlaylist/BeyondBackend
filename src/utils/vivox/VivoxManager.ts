import { Context, Hono } from "hono";
import {
  RTCPProvider,
  Participant,
  PartyInfo,
  OAuthTokenResponse,
  VivoxProvider,
} from "../../local/interfaces";
import { Beyond } from "../errors/errors";
import Logger from "../logging/logging";

export default class VivoxManager {
  private static participants: Record<string, Participant[]> = {};
  private static info: Record<string, PartyInfo> = {};

  public static async HandleConnection(c: Context): Promise<void> {
    try {
    } catch (error) {
      Logger.error(`Error in HandleConnection: ${error}`);
      c.json(Beyond.basic.badRequest.withMessage("Failed to handle vc connection."));
    }
  }
}
