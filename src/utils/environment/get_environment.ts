import { resolve } from "path";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import logging from "../logging/logging";

export const configSchema = z.object({
  PORT: z.number(),
  XMPP_PORT: z.number(),
  ENABLE_LOGS: z.boolean(),
  EMAIL_VERIFICATION_ENABLED: z.boolean(),
  HEARTBEAT: z.boolean(),
  MATCHMAKER_PORT: z.number(),
  ENABLE_TLS: z.boolean(),
  AutoRotate: z.boolean(),
  CURRENT_QUEST_WEEK: z.number(),
  EMERGENCY_NOTICE_TITLE: z.string(),
  EMERGENCY_NOTICE_BODY: z.string(),
});

class Config {
  private static validatedConfig: z.infer<typeof configSchema>;

  public static config: z.infer<typeof configSchema>;

  /**
   * Validates the config file
   * @returns {Promise<z.infer<typeof configSchema>>}
   */
  public static validate(): z.infer<typeof configSchema> {
    const configFile = Bun.env.NODE_ENV === "development" ? ".development.env" : ".production.env";

    dotenv.config({ path: resolve(process.cwd(), "config", configFile) });

    const PORT = parseInt(Bun.env.PORT as string, 10);
    const XMPP_PORT = parseInt(Bun.env.XMPP_PORT as string, 10);
    const CURRENT_QUEST_WEEK = parseInt(Bun.env.CURRENT_QUEST_WEEK as string, 10);
    const ENABLE_LOGS = Bun.env.ENABLE_LOGS === "true";
    const EMAIL_VERIFICATION_ENABLED = Bun.env.EMAIL_VERIFICATION_ENABLED === "true";
    const HEARTBEAT = Bun.env.HEARTBEAT === "true";
    const MATCHMAKER_PORT = parseInt(Bun.env.MATCHMAKER_PORT as string, 10);
    const ENABLE_TLS = Bun.env.ENABLE_TLS === "true";
    const AutoRotate = Bun.env.AutoRotate === "true";
    const { EMERGENCY_NOTICE_TITLE } = Bun.env;
    const { EMERGENCY_NOTICE_BODY } = Bun.env;

    const unsafeConfig = configSchema.safeParse({
      PORT,
      XMPP_PORT,
      ENABLE_LOGS,
      EMAIL_VERIFICATION_ENABLED,
      HEARTBEAT,
      MATCHMAKER_PORT,
      ENABLE_TLS,
      AutoRotate,
      EMERGENCY_NOTICE_BODY,
      EMERGENCY_NOTICE_TITLE,
      CURRENT_QUEST_WEEK,
    });

    if (!unsafeConfig.success) throw new Error(unsafeConfig.error.message);

    this.validatedConfig = unsafeConfig.data;

    return unsafeConfig.data;
  }

  /**
   * Registers the config file and returns it
   * @returns {z.infer<typeof configSchema>}
   */
  public static register(): z.infer<typeof configSchema> {
    this.validate();

    logging.info("Config registered 👌");
    this.config = this.validatedConfig;
    return this.config;
  }
}

export default Config;
