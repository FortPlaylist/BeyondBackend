import { createMiddleware } from "hono/factory";
import { StatusCode } from "hono/utils/http-status";

export default class Middleware {
  public static handle() {
    return createMiddleware(async (c, next) => {
      if (c.created) {
        return next();
      }

      c.sendHotfix = (hotfix: string) => {
        c.res.headers.set("Content-Type", "text/plain");
        return c.body(hotfix);
      };

      c.sendClientSettings = (file: string) => {
        c.res.headers.set("Content-Type", "application/octet-stream");
        return c.body(file);
      };

      c.sendStatus = (status: StatusCode) => {
        c.status(status);
        return c.body(null);
      };

      c.created = true;
      await next();
    });
  }
}
