import { Hono } from "hono";
import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import cache from "../../misc/middleware/Cache";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import TimelineEventBuilder from "../../utils/builders/TimelineEventBuilder";

export default function initRoute(router: Hono) {
  router.get("/fortnite/api/calendar/v1/timeline", async (c) => {
    const season = ParseUserAgent(c.req.header("User-Agent"));

    if (!season) {
      c.status(400);
      return c.json({
        error: "Season is not Valid.",
      });
    }

    const activeEvents = TimelineEventBuilder.createTimeline(c.req.header("User-Agent"));

    const date = DateTime.utc().setZone("GMT");
    const expiration = date.startOf("day").plus({ days: 1 }).toISO();

    c.status(200);
    return c.json({
      channels: {
        "client-matchmaking": {
          states: [
            {
              validForm: DateTime.now().toISO(),
              activeEvents: [],
              state: {
                region: {
                  BR: {
                    eventFlagsForcedOff: ["Playlist_DefaultDuo", "Playlist_DefaultSolo"],
                  },
                  NAW: {
                    eventFlagsForcedOff: ["Playlist_DefaultDuo", "Playlist_DefaultSolo"],
                  },
                  OCE: {
                    eventFlagsForcedOff: ["Playlist_DefaultDuo", "Playlist_DefaultSolo"],
                  },
                  ME: {
                    eventFlagsForcedOff: ["Playlist_DefaultDuo", "Playlist_DefaultSolo"],
                  },
                  ASIA: {
                    eventFlagsForcedOff: ["Playlist_DefaultDuo", "Playlist_DefaultSolo"],
                  },
                },
              },
            },
          ],
          cacheExpire: expiration,
        },
        "featured-islands": {
          states: [
            {
              validFrom: DateTime.now().toISO(),
              activeEvents: [],
              state: {
                islandCodes: [],
                playlistCuratedContent: {},
                playlistCuratedHub: {},
                islandTemplates: [],
              },
            },
          ],
          cacheExpire: expiration,
        },
        "community-votes": {},
        "client-events": {
          states: [
            {
              validFrom: "0001-01-01T00:00:00.000Z",
              activeEvents,
              state: {
                activeStorefronts: [],
                eventNamedWeights: {},
                seasonNumber: season.season,
                seasonTemplateId: `AthenaSeason:athenaseason${season.season}`,
                matchXpBonusPoints: 0,
                seasonBegin: "9999-01-01T00:00:00Z",
                seasonEnd: "9999-01-01T00:00:00Z",
                seasonDisplayedEnd: "9999-01-01T00:00:00Z",
                weeklyStoreEnd: expiration,
                stwEventStoreEnd: "9999-01-01T00:00:00.000Z",
                stwWeeklyStoreEnd: "9999-01-01T00:00:00.000Z",
                dailyStoreEnd: expiration,
                sectionStoreEnds: {
                  Featured: expiration,
                },
              },
            },
          ],
          cacheExpire: expiration,
        },
      },
      eventsTimeOffsetHrs: 0,
      cacheIntervalMins: 10,
      currentTime: DateTime.utc().toISO(),
    });
  });
}
