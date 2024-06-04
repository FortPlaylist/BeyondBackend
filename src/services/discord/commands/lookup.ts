import {
  ApplicationCommandOptionType,
  CacheType,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import BaseCommand from "../helpers/BaseCommand";
import Users from "../../../misc/models/Users";

export default class PlayersCommand extends BaseCommand {
  data = {
    name: "lookup",
    description: "Find a beyond user by their discord.",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        description: "The user you want to lookup.",
        required: true,
      },
    ],
  };

  async execute(interaction: CommandInteraction<CacheType>): Promise<any> {
    // await interaction.deferReply({ ephemeral: true });

    const user_data = await interaction.options.get("user", true);

    const user = await Users.findOne({ discordId: user_data.user?.id });

    if (!user) {
      const embed = new EmbedBuilder()
        .setTitle("User not found.")
        .setDescription("Failed to find user, please try again.")
        .setColor("Red")
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`User info for ${user.username}`)
      .setColor("Blurple")
      .addFields(
        {
          name: "Banned",
          value: `${user.banned}`,
          inline: true,
        },
        {
          name: "Discord",
          value: `<@${user.discordId}>`,
          inline: true,
        },
        {
          name: "Username",
          value: `${user.username}`,
          inline: true,
        },
        {
          name: "Full Locker",
          value: `${user.hasFL}`,
          inline: true,
        },
      )
      .setTimestamp();

    return await interaction.reply({ embeds: [embed] });
  }
}
