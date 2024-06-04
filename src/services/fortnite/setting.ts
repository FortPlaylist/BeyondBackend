import { Hono } from "hono";

export default function initRoute(router: Hono) {
  router.post("/api/v1/user/setting", async (c) => c.sendStatus(200));
}
