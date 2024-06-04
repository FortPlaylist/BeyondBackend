import { Hono } from "hono";
import { z } from "zod";
import Timing from "../../utils/performance/Timing";
import { SavedContent, sessionId } from "../../misc/typings/Socket.types";
import { v4 } from "uuid";

const GameSessionSchema = z.object({
  ip: z.string(),
  port: z.number(),
  canQueueIntoMatch: z.boolean(),
  region: z.string(),
  playlist: z.string(),
  customKey: z.boolean(),
  sessionId: z.string(),
  matchId: z.string(),
});

export default function (router: Hono) {
  router.post("/beyond/api/v2/dedicated/sessions/gameserver/create", async (c) => {
    const t1 = new Timing("body processing");
    let body;

    try {
      body = GameSessionSchema.parse(await c.req.json());
    } catch (error) {
      return c.json({ error: "Body isn't valid JSON" }, 400);
    }

    if (typeof body !== "object" || body === null) {
      return c.json({ error: "Request body must be a valid JSON object" }, 400);
    }

    t1.print();

    try {
      const sessionExists = SavedContent.GameServerSession.findIndex(
        (server) =>
          server.matchId === server.matchId &&
          server.region === body.region &&
          server.ip === body.ip &&
          server.port === body.port &&
          server.customKey === body.customKey &&
          server.canQueueIntoMatch === body.canQueueIntoMatch &&
          server.playlist === body.playlist,
      );

      if (sessionExists === -1) {
        SavedContent.GameServerSession.push({
          region: body.region,
          ip: body.ip,
          port: body.port,
          customKey: body.customKey,
          canQueueIntoMatch: body.canQueueIntoMatch,
          playlist: body.playlist,
          matchId: v4().replace(/-/gi, ""),
        });
      }

      return c.json({ data: SavedContent.GameServerSession }, 200);
    } catch (error) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });

  router.get("/beyond/api/v2/dedicated/sessions/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");

    const sessionIndex = SavedContent.Session.findIndex(
      (session) => session.sessionId === sessionId,
    );

    if (sessionIndex === -1) return c.json({ error: "Session does not exist." }, 404);

    const gameserverSession = SavedContent.GameServerSession.findIndex(
      (gs) => gs.matchId === SavedContent.Session[sessionIndex].matchId,
    );

    if (gameserverSession === -1) return c.json({ error: "GS Session does not exist." }, 404);

    SavedContent.GameServerSession.splice(sessionIndex, 1);

    return c.json(
      {
        ip: SavedContent.GameServerSession[gameserverSession].ip,
        port: SavedContent.GameServerSession[gameserverSession].port,
      },
      200,
    );
  });

  router.delete("/beyond/api/v2/dedicated/sessions/delete", async (c) => {
    const t1 = new Timing("body processing");
    let body;

    try {
      body = GameSessionSchema.parse(await c.req.json());
    } catch (error) {
      return c.json({ error: "Body isn't valid JSON" }, 400);
    }

    if (typeof body !== "object" || body === null) {
      return c.json({ error: "Request body must be a valid JSON object" }, 400);
    }

    t1.print();

    try {
      const sessionExists = SavedContent.GameServerSession.findIndex(
        (server) =>
          server.matchId === body.matchId &&
          server.region === body.region &&
          server.ip === body.ip &&
          server.port === body.port &&
          server.customKey === body.customKey &&
          server.canQueueIntoMatch === body.canQueueIntoMatch &&
          server.playlist === body.playlist,
      );

      if (sessionExists === -1) return c.json({ error: "Session does not exist." }, 400);

      SavedContent.GameServerSession.splice(sessionExists, 1);

      return c.json({ message: "Deleted Session." }, 200);
    } catch (error) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });
}
