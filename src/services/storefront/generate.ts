import { DateTime } from "luxon";
import { SavedData } from "./types/shop.types";
import { env } from "../..";
import shop from "./generator/Shop";
import Logger from "../../utils/logging/logging";

export default {
  async generate(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (env.AutoRotate) {
      const now = DateTime.utc();
      const targetTime = DateTime.utc().startOf("day").plus({ days: 1 });

      targetTime.set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      if (now > targetTime) {
        targetTime.plus({ days: 1 });
      }

      const delayMilliseconds = targetTime.diff(now).as("milliseconds");

      await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));

      const date = DateTime.utc().setZone("GMT").startOf("day").plus({ days: 1 }).toISO();

      const newshop = new shop();
      await newshop.initialize(date as string, date as string);

      Logger.info(`Next shop Generates at ${DateTime.utc().toISO()} UTC.`, "Shop", "green");
    } else {
      const date = DateTime.utc().setZone("GMT").startOf("day").plus({ days: 1 }).toISO();

      const newshop = new shop();
      await newshop.initialize(date as string, date as string);
    }
  },
};
