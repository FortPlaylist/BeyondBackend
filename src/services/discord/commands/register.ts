import BaseCommand from "../helpers/BaseCommand";
import {
  EmbedBuilder,
  CommandInteraction,
  type CacheType,
  ApplicationCommandOptionType,
  GuildMemberRoleManager,
  Role,
} from "discord.js";
import { v4 as uuid } from "uuid";
import { BeyondConfiguration } from "../../../../config/secure/BeyondConfiguration";
import Logger from "../../../utils/logging/logging";
import Users from "../../../misc/models/Users";
import Accounts from "../../../misc/models/Accounts";
import Friends from "../../../misc/models/Friends";
import { CreateProfile } from "../../../utils/profile/CreateProfile";
import Hashing from "../../../utils/performance/Hashing";
import { Snowflake } from "@sapphire/snowflake";

export default class RegisterCommand extends BaseCommand {
  data = {
    name: "register",
    description: "Register a account for beyond.",
    options: [
      {
        name: "email",
        type: ApplicationCommandOptionType.String,
        description: "The email for your account",
        required: true,
      },
      {
        name: "password",
        type: ApplicationCommandOptionType.String,
        description: "The password for your account",
        required: true,
      },
    ],
  };

  async execute(interaction: CommandInteraction<CacheType>) {
    await interaction.deferReply({ ephemeral: true });

    const display_name = interaction.user.username;
    const email = interaction.options.get("email", true).value;
    const password = interaction.options.get("password", true).value;

    if (interaction.channelId !== BeyondConfiguration.RegisterChannelID) {
      const embed = new EmbedBuilder()
        .setTitle("Invalid Channel")
        .setDescription(
          `This command can only be used in <#${BeyondConfiguration.RegisterChannelID}>`,
        )
        .setColor("#F01414")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (!emailRegex.test(email as string)) {
      const embed = new EmbedBuilder()
        .setTitle("Not a Valid Email")
        .setDescription("The provided email is not valid.")
        .setColor("#F01414")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    const discordId = interaction.user.id;

    const user = await Users.findOne({ discordId });

    if (user) {
      const embed = new EmbedBuilder()
        .setTitle("Account Exists")
        .setDescription("You have already registered an account.")
        .setColor("#F01414")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    const hashedPassword = await Hashing.hashPassword(password as string);
    const accountId = uuid().replace(/-/gi, "");

    const Roles = interaction.member?.roles as GuildMemberRoleManager;
    const roles = Roles.cache.map((role) => role.name);

    try {
      const newUser = new Users({
        email,
        username: interaction.user.username as string,
        password: hashedPassword,
        accountId,
        discordId,
        roles,
        banned: false,
        hasFL: false,
      });

      const profilePromises = [
        CreateProfile(newUser, "athena"),
        CreateProfile(newUser, "common_core"),
        CreateProfile(newUser, "metadata"),
        CreateProfile(newUser, "outpost0"),
        CreateProfile(newUser, "theater0"),
        CreateProfile(newUser, "collection_book_people0"),
        CreateProfile(newUser, "collection_book_schematics0"),
      ];

      const [
        athena,
        common_core,
        metadata,
        outpost0,
        theater0,
        collection_book_people0,
        collection_book_schematics0,
      ] = await Promise.all(profilePromises);

      const account = new Accounts({
        accountId: newUser.accountId,
        discordId,
        athena,
        common_core,
        metadata,
        outpost0,
        theater0,
        season: {},
        collection_book_people0,
        collection_book_schematics0,
      });

      const friends = new Friends({
        accountId: newUser.accountId,
      });

      await Promise.all([newUser.save(), account.save(), friends.save()]);

      const embed = new EmbedBuilder()
        .setTitle("Account Created")
        .setDescription("Your account has been successfully created")
        .setColor("Green")
        .addFields(
          {
            name: "Dispaly Name",
            value: display_name as string,
            inline: false,
          },
          {
            name: "Email",
            value: email as string,
            inline: false,
          },
        )

        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Failed to register account: ${error}`);

      const embed = new EmbedBuilder()
        .setTitle("Account Registration Failed")
        .setDescription("Failed to register account, please try again.")
        .setColor("#F01414")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }
  }
}
