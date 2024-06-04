import {
  APIEmbed,
  ApplicationCommandOptionType,
  CacheType,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import BaseCommand from "../helpers/BaseCommand";
import Users from "../../../misc/models/Users";
import Accounts from "../../../misc/models/Accounts";

export default class AccountCommand extends BaseCommand {
  data = {
    name: "account",
    description: "View your beyond account information.",
    options: [
      {
        name: "season",
        type: ApplicationCommandOptionType.Number,
        description: "The season you want your beyond information from.",
        choices: [
          {
            name: "12.41",
            value: "12",
          },
          {
            name: "4.2",
            value: "4",
          },
        ],
        required: true,
      },
    ],
  };

  async execute(interaction: CommandInteraction<CacheType>): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const user = await Users.findOne({ discordId: interaction.user.id });
    const season = await interaction.options.get("season", true);

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

    let embed: any;

    const SeasonIndex = account.season.findIndex((s) => s.season_num === season.value);

    if (SeasonIndex !== -1) {
      const SeasonObject = account.season[SeasonIndex];

      const BattlePassArray = SeasonObject.battlepass;

      let seasonIndex: number = 0;

      for (let index = 0; index < BattlePassArray.length; index++) {
        seasonIndex = index;
        break;
      }

      const BattlePassObject = SeasonObject.battlepass[seasonIndex];
      const Stats = SeasonObject.stats;

      embed = new EmbedBuilder()
        .setColor("Blurple")
        .addFields(
          {
            name: "User Information",
            value: `Banned: ${user.banned}\nDiscord: <@${user.discordId}>\nUsername: ${user.username}\nFull Locker: ${user.hasFL}\nAccountId: ${user.accountId}`,
            inline: true,
          },

          {
            name: "Battlepass Details",
            value: `Purchased: ${BattlePassObject.book_purchased}\nTier: ${BattlePassObject.book_level}\nLevel: ${BattlePassObject.level}\nBattlepass XP: ${BattlePassObject.book_xp}\nXP: ${BattlePassObject.xp}`,
            inline: true,
          },
          {
            name: "Seasonal Stats",
            value: `**Solos** - Wins: ${Stats.solos.wins}, Kills: ${Stats.solos.kills}, Matches Played: ${Stats.solos.matchplayed}\n**Duos** - Wins: ${Stats.duos.wins}, Kills: ${Stats.duos.kills}, Matches Played: ${Stats.duos.matchplayed}\n**Squads** - Wins: ${Stats.squads.wins}, Kills: ${Stats.squads.kills}, Matches Played: ${Stats.squads.matchplayed}`,
            inline: true,
          },
        )

        .setTimestamp();
    } else
      embed = new EmbedBuilder()
        .setTitle("Season not found.")
        .setDescription("Failed to find season data.")
        .setColor("Red")
        .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
}
