import { Hono } from "hono";
import crypto from "node:crypto";
import cache from "../../misc/middleware/Cache";
import verify from "../../misc/middleware/verify";
import {
  GetDefaultEngine,
  GetDefaultGame,
  GetDefaultRuntimeOptions,
} from "../../utils/cloudstorage/GetHotfixFiles";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Beyond } from "../../utils/errors/errors";
import { DateTime } from "luxon";
import Hashing from "../../utils/performance/Hashing";
import Logger from "../../utils/logging/logging";
import ParseUserAgent from "../../utils/useragent/parseUseragent";

interface CloudStorageFile {
  [key: string]: any;
}

interface CloudStorage {
  files: CloudStorageFile[];
}

const client = new S3Client({
  region: "auto",
  endpoint: "https://49087a29eb8ea5c3ba8b374453ae22fb.eu.r2.cloudflarestorage.com/lunartt",
  credentials: {
    accessKeyId: "40e4d066c719fee4c4d4327a0b7e3522",
    secretAccessKey: "e07bf00799f8300cba51b287c027196151d22cd3c00988c88ddeccf87e60df38",
  },
});

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.get("/fortnite/api/cloudstorage/system", cache, async (c) => {
    const UA = ParseUserAgent(c.req.header("User-Agent"));

    if (!UA) return c.json(Beyond.internal.invalidUserAgent, 400);

    const fileContents: { [key: string]: string } = {
      "DefaultEngine.ini": GetDefaultEngine(),
      "DefaultGame.ini": GetDefaultGame(UA.season),
      "DefaultRuntimeOptions.ini": GetDefaultRuntimeOptions(),
    };

    const CloudStorage: CloudStorage = { files: [] };

    for (const [file, content] of Object.entries(fileContents)) {
      CloudStorage.files.push({
        uniqueFilename: file,
        filename: file,
        hash: crypto.createHash("sha1").update(content).digest("hex"),
        hash256: crypto.createHash("sha256").update(content).digest("hex"),
        length: content.length,
        contentType: "application/octet-stream",
        uploaded: "2024-03-03T21:56:36.209-05:00",
        storageType: "S3",
        doNotCache: false,
      });
    }

    c.status(200);
    return c.json(CloudStorage.files);
  });

  router.get("/fortnite/api/cloudstorage/system/:filename", async (c) => {
    const filename = c.req.param("filename");

    const UA = ParseUserAgent(c.req.header("User-Agent"));

    if (!UA) return c.json(Beyond.internal.invalidUserAgent, 400);

    switch (filename) {
      case "DefaultEngine.ini":
        c.status(200);
        return c.text(GetDefaultEngine());

      case "DefaultGame.ini":
        c.status(200);
        return c.text(GetDefaultGame(UA.season));

      case "DefaultRuntimeOptions.ini":
        c.status(200);
        return c.text(GetDefaultRuntimeOptions());

      default:
        c.status(400);
        return c.json({
          errorCode: "errors.com.epicgames.bad_request",
          errorMessage: "Hotfix File not found!",
          numericErrorCode: 1001,
          originatingService: "fortnite",
          intent: "prod-live",
        });
    }
  });

  router.get("/fortnite/api/cloudstorage/user/:accountId/:file", verify, async (c) => {
    const file = c.req.param("file");
    const accountId = c.req.param("accountId");

    if (file !== "ClientSettings.Sav") {
      return c.json(
        Beyond.cloudstorage.fileNotFound.originatingService(import.meta.file.replace(".ts", "")),
        404,
      );
    }

    try {
      const getObj = await client.send(
        new GetObjectCommand({
          Bucket: "lunartt",
          Key: `user/${accountId}/ClientSettings.Sav`,
        }),
      );

      if (!getObj.Body) {
        return c.json(
          Beyond.cloudstorage.fileNotFound.originatingService(import.meta.file.replace(".ts", "")),
          404,
        );
      }

      return c.body(await getObj.Body.transformToString());
    } catch (err) {
      const buffer = Buffer.alloc(1);
      buffer.write(c.var.user, 0);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
      return c.body(arrayBuffer as ArrayBuffer);
    }
  });

  router.get("/fortnite/api/cloudstorage/user/:accountId", verify, async (c) => {
    let data, uploaded;
    const accountId = c.req.param("accountId");

    try {
      const getObj = await client.send(
        new GetObjectCommand({ Bucket: "lunartt", Key: `user/${accountId}/ClientSettings.Sav` }),
      );

      if (!getObj.Body) {
        return c.json(
          Beyond.cloudstorage.fileNotFound.originatingService(import.meta.file.replace(".ts", "")),
          400,
        );
      }

      data = await getObj.Body.transformToString();
      uploaded = getObj.LastModified;
    } catch (error) {
      data = DateTime.now().toISO();
      uploaded = DateTime.now();
    }

    return c.json([
      {
        uniqueFilename: "ClientSettings.Sav",
        filename: "ClientSettings.Sav",
        hash: Hashing.sha1(data),
        hash256: Hashing.sha256(data),
        length: Buffer.byteLength(data),
        contentType: "application/octet-stream",
        uploaded,
        storageType: "S3",
        storageIds: {},
        accountId,
        doNotCache: false,
      },
    ]);
  });

  router.put("/fortnite/api/cloudstorage/user/:accountId/:file", verify, async (c) => {
    if (c.req.param("file") !== "ClientSettings.Sav") {
      return c.json(
        Beyond.cloudstorage.fileNotFound.originatingService(import.meta.file.replace(".ts", "")),
        404,
      );
    }

    if (!c.var.user) {
      return c.json(Beyond.authentication.authenticationFailed.variable(["token"]));
    }

    const accountId = c.req.param("accountId");

    try {
      const rawBody = await c.req.arrayBuffer();
      const buf = Buffer.from(rawBody);

      await client.send(
        new PutObjectCommand({
          Bucket: "lunartt",
          Key: `user/${accountId}/ClientSettings.Sav`,
          Body: buf,
        }),
      );

      return c.sendStatus(200);
    } catch (error) {
      Logger.error(`Failed to save ClientSettings: ${error}`);
      return c.sendStatus(500);
    }
  });
}
