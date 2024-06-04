import mongoose from "mongoose";
import { applySpeedGooseCacheLayer, SharedCacheStrategies } from "speedgoose";
import log from "../../utils/logging/logging";
import { Database } from "../../../config/secure/BeyondConfiguration";

const DB_URL = Database.isProd ? Database.PROD : Database.DEV;

const connectToDatabase = async () => {
  for (let i = 0; i < 3; i++) {
    try {
      mongoose.connect(DB_URL, { maxPoolSize: 10, maxIdleTimeMS: 30000 }).then(async () => {
        await applySpeedGooseCacheLayer(mongoose, {
          sharedCacheStrategy: SharedCacheStrategies.IN_MEMORY,
          debugConfig: {
            enabled: false,
          },
          defaultTtl: 3600,
        });
      });
      log.info("Connected to MongoDB");
      break;
    } catch (error) {
      const err = error as Error;
      log.error(`MongoDB Connection Error: ${err.message}`);
      if (i < 2) {
        log.info(`Retrying connection (${i + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
};

export default {
  connect: connectToDatabase,
};
