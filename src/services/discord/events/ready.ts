import { ActivityType, type Client } from "discord.js";
import Logger from "../../../utils/logging/logging";

export default class ReadyEvent {
  name = "ready";
  once = false;

  execute(client: Client) {
    Logger.info(`Logged in as ${client.user?.username}`);
    client.user?.setActivity({
      name: "Beyond",
      type: ActivityType.Playing,
    });
  }
}
