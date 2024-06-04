import { Context, Hono } from "hono";
import verify from "../../misc/middleware/verify";
import Users from "../../misc/models/Users";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";

export default function initRoute(router: Hono) {
  router.post(
    "/fortnite/api/game/v2/toxicity/account/:reporterId/report/:offenderId",
    verify,
    async (c) => {
      const { reporterId, offenderId } = c.req.param();

      const reporter = await Users.findOne({
        accountId: reporterId,
      });
      const offender = await Users.findOne({
        accountId: offenderId,
      });

      const body = await c.req.json();
      const { reason, playlistName, details, gameSessionId } = body;

      if (!reporter || !offender) return c.json({ error: "Reporter or Offender not found." }, 400);

      const webhook = new WebhookClient({
        id: BeyondConfiguration.reportingWebhookId,
        token: BeyondConfiguration.reportingWebhookToken,
      });

      const embed = new EmbedBuilder()
        .setTitle("New Report")
        .setColor("Blurple")
        .addFields(
          {
            name: "Reason",
            value: reason,
          },
          {
            name: "Details",
            value: details || "no details provided.",
          },
          {
            name: "Playlist",
            value: playlistName,
          },
          {
            name: "Session",
            value: gameSessionId,
          },
          {
            name: "Offender",
            value: offender.username,
          },
          {
            name: "Offender Discord",
            value: `<@${offender.discordId}>`,
          },
        )
        .setFooter({
          text: `Report sent by (<@${reporter.discordId}>) ${reporter.username}`,
        });

      webhook.send({
        username: "Reporter",
        embeds: [embed],
        avatarURL: "",
        content: "",
      });

      return c.sendStatus(200);
    },
  );
}
