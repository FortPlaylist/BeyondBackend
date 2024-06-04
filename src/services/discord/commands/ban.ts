import {
  ApplicationCommandOptionType,
  CacheType,
  CommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import BaseCommand from "../helpers/BaseCommand";
import Users from "../../../misc/models/Users";
import Accounts from "../../../misc/models/Accounts";
import GetProfile from "../../../utils/profile/GetProfile";
import { DateTime } from "luxon";
import RefreshAccount from "../../../operations/helpers/RefreshAccount";

export default class BanCommand extends BaseCommand {
  data = {
    name: "ban",
    description: "Bans a user from playing beyond.",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        description: "The user you want to ban.",
        required: true,
      },
      {
        name: "reason",
        type: ApplicationCommandOptionType.String,
        description: "The reason you want to ban the user for.",
        choices: [
          {
            name: "Exploiting",
            value: "Exploiting",
          },
          {
            name: "Teaming",
            value: "Teaming",
          },
        ],
        required: true,
      },
      {
        name: "duration",
        description: "The duration you want to ban the user for.",
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: "24 Hours",
            value: "1",
          },
          {
            name: "3 Days",
            value: "3",
          },
          {
            name: "7 Days",
            value: "7",
          },
          {
            name: "14 Days",
            value: "14",
          },
          {
            name: "30 Days",
            value: "30",
          },
          {
            name: "90 Days",
            value: "90",
          },
          {
            name: "Permanent",
            value: "91",
          },
        ],
        required: true,
      },
    ],
    defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
    dmPermission: false,
  };

  async execute(interaction: CommandInteraction<CacheType>): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const user_data = await interaction.options.get("user", true);
    const reason = await interaction.options.get("reason", true);
    const duration = await interaction.options.get("duration", true);

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

    const account = await Accounts.findOne({ discordId: user.discordId });

    if (!account) {
      const embed = new EmbedBuilder()
        .setTitle("Account not found.")
        .setDescription("Failed to find account, please try again.")
        .setColor("Red")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    if (user.banned) {
      const embed = new EmbedBuilder()
        .setTitle("User is Banned")
        .setDescription("This user is already banned.")
        .setColor("Red")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    const common_core = await GetProfile(user.accountId, "common_core");

    common_core.stats.attributes.ban_status.banReasons.push(reason.value);
    common_core.stats.attributes.ban_status.bRequiresUserAck = true;
    common_core.stats.attributes.ban_status.bBanHasStarted = DateTime.now().toISO();

    const durationMap: { [key: string]: number } = {
      "1": 1.0,
      "3": 3.0,
      "7": 7.0,
      "14": 14.0,
      "30": 30.0,
      "90": 90.0,
    };

    const selectedDuration: string = duration.value as string;
    if (durationMap.hasOwnProperty(selectedDuration))
      common_core.stats.attributes.ban_status.banDurationDays = durationMap[selectedDuration];
    else if (duration.value === "91") await user.updateOne({ banned: true });

    // TODO(Skye): Add Ban to BanHistory

    await account.updateOne({ common_core });

    await RefreshAccount(user.accountId, user.username);

    const embed = new EmbedBuilder()
      .setTitle("User Successfully Banned")
      .setDescription(`Successfully banned user with the username ${user.username}.`)
      .setColor("Blurple")
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
}
