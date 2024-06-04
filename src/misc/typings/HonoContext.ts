import { StatusCode } from "hono/utils/http-status";

interface Matchmaking {
  Region: string;
  IP: string;
  Playlist: string;
  Port: number;
  BucketId: string;
}

declare module "hono" {
  interface Context {
    created: boolean;
    sendHotfix: (hotfix: string) => Response;
    sendClientSettings: (file: string) => Response;
    sendStatus: (status: StatusCode) => Response;
    matchmaking: Matchmaking;
  }
}
