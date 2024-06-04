import {
  ApplicationCommandOptionType,
  CacheType,
  CommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import BaseCommand from "../helpers/BaseCommand";
import Users from "../../../misc/models/Users";

export default class UnbanCommand extends BaseCommand {
  data = {
    name: "unban",
    description: "Unban a user from beyond",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        description: "The user you want to unban.",
        required: true,
      },
    ],
    defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
    dmPermission: false,
  };

  async execute(interaction: CommandInteraction<CacheType>): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const user_data = await interaction.options.get("user", true);

    if (!interaction.memberPermissions?.has("BanMembers"))
      return await interaction.editReply({
        content: "You do not have permission to use this command.",
      });

    const user = await Users.findOne({ discordId: user_data.user?.id });

    if (!user) {
      const embed = new EmbedBuilder()
        .setTitle("User not found.")
        .setDescription("Failed to find user, please try again.")
        .setColor("Red")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    if (!user.banned) {
      const embed = new EmbedBuilder()
        .setTitle("User is Unbanned")
        .setDescription("This user is already unbanned.")
        .setColor("Red")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    await user.updateOne({ $set: { banned: false } });

    const embed = new EmbedBuilder()
      .setTitle("User Successfully Unbanned")
      .setDescription(`Successfully unbanned user with the username ${user.username}.`)
      .setColor("Blurple")
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
}
