import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Hono } from "hono";
import logging from "../../utils/logging/logging";

export default {
  async initializeRoutes(
    app: Hono<{
      Variables: {
        user: any;
        account: any;
        decodedToken: any;
      };
    }>,
  ): Promise<void> {
    try {
      const routesPath = join(__dirname, "..", "..", "services", "gameserver");
      const files = readdirSync(routesPath).filter(
        (file) => file.endsWith(".ts") || file.endsWith(".js"),
      );

      await Promise.all(
        files.map(async (file) => {
          try {
            const RouteModule = await import(
              join(__dirname, "..", "..", "services", "gameserver", file)
            );

            if (RouteModule.default && typeof RouteModule.default === "function") {
              try {
                RouteModule.default(app);
              } catch (error) {
                const err = error as Error;
                logging.error(`Error in route ${file}: ${err.message}`);
              }
            } else {
              logging.error(`${file} does not export a valid route initializer`);
            }
          } catch (error) {
            const err = error as Error;
            logging.error(`Error loading route ${file}: ${err.message}`);
          }
        }),
      );
    } catch (error) {
      const err = error as Error;
      logging.error(`Error initializing routes: ${err.message}`);
      throw error;
    }
  },
};
