import { REST, Routes, type APIUser } from "discord.js";
import fs from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "./botinterfaces/ExtendedClient";
import Logger from "../../utils/logging/logging";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";

const commandsDir = await fs.readdir(join(__dirname, "commands"));
const commands = commandsDir.filter((cmd) => cmd.endsWith(".ts"));

try {
  const commandData = await Promise.all(
    commands.map(async (cmd) => {
      try {
        const CommandModule = await import(join(__dirname, "commands", cmd));
        const CommandClass = CommandModule.default;
        const commandInstance = new CommandClass();
        return commandInstance.data;
      } catch (error) {
        Logger.error(`Error loading command ${cmd}: ${error}`);
      }
    }),
  );

  const rest = new REST({ version: "10" }).setToken(BeyondConfiguration.BOT_TOKEN);

  Logger.info("Started refreshing application (/) commands.");

  try {
    const currentUser = (await rest.get(Routes.user())) as APIUser;

    const endpoint = Routes.applicationGuildCommands(currentUser.id, "1242573833718988971");
    await rest.put(endpoint, { body: commandData });

    Logger.info("Successfully reloaded application (/) commands.");
  } catch (error) {
    Logger.error(`Error refreshing commands: ${error}`);
  }
} catch (error) {
  Logger.error(`Error reading commands: ${error}`);
}
