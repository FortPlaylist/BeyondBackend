import { CacheType, CommandInteraction, EmbedBuilder } from "discord.js";
import BaseCommand from "../helpers/BaseCommand";
import { Clients } from "../../../misc/typings/Socket.types";
import { BeyondConfiguration } from "../../../../config/secure/BeyondConfiguration";
import Users from "../../../misc/models/Users";

export default class PlayersCommand extends BaseCommand {
  data = {
    name: "players",
    description: "Show's the current playercount for beyond.",
  };

  async execute(interaction: CommandInteraction<CacheType>): Promise<any> {
    await interaction.deferReply({ ephemeral: false });

    const playerCount = Clients.filter((count) => count).length;
    let embed;

    if (playerCount !== 0) {
      embed = new EmbedBuilder()
        .setTitle("Amount of Players Online.")
        .setDescription(
          `There ${playerCount === 1 ? "is" : "are"} currently ${playerCount} ${playerCount === 1 ? "player" : "players"} online.`,
        )
        .setColor("Blurple")
        .setTimestamp();
    } else {
      embed = new EmbedBuilder()
        .setTitle("Amount of Players Online.")
        .setDescription("There is currently 0 players online.")
        .setColor("Blurple")
        .setTimestamp();
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
