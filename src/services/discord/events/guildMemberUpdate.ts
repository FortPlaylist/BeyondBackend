import { GuildMember } from "discord.js";
import { Client } from "undici-types";
import Users from "../../../misc/models/Users";

export default class GuildMemberUpdateEvent {
  name = "guildMemberUpdate";
  once = false;

  async hasRole(member: GuildMember, roleId: string): Promise<boolean> {
    try {
      return member.roles.cache.has(roleId);
    } catch (error) {
      return false;
    }
  }

  async execute(oldMember: GuildMember, newMember: GuildMember) {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    const isInGuild = newMember.guild.members.cache.has(newMember.id);
    if (!isInGuild) return;

    const user = await Users.findOne({ discordId: newMember.id });
    if (!user) return;

    const hasSpecificRole = await this.hasRole(newMember, "1239354043646607370");
    if (!hasSpecificRole) return;

    await user.updateOne({ roles: [...newRoles.values()].map((role) => role.name) });
  }
}
