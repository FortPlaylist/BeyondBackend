import { Client } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import type { Event } from "../botinterfaces/Event";

export default async function EventHandler(client: Client) {
  const events = readdirSync(join(__dirname, "..", "events")).filter((event) =>
    event.endsWith(".ts"),
  );

  for (const event of events) {
    const EventClass = require(join(__dirname, "..", "events", event)).default;
    const EventInstance = new EventClass() as Event;

    if (EventInstance.once)
      await client.once(EventInstance.name, (...args) => EventInstance.execute(...args, client));
    else await client.on(EventInstance.name, (...args) => EventInstance.execute(...args, client));
  }
}
