import { DateTime } from "luxon";
import parseUserAgent from "../useragent/parseUseragent";

interface Event {
  eventType: string;
  activeUntil: string;
  activeSince: string;
}

interface SeasonEvent {
  seasonNumber: number;
  events: Event[];
}

export default class TimelineEventBuilder {
  private static readonly INDEFINITE_DATE = "9999-01-01T00:00:00.000Z";

  private static readonly SEASON_EVENTS: SeasonEvent[] = [
    {
      seasonNumber: 3,
      events: [
        {
          eventType: "Spring2018Phase1",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ],
    },
    {
      seasonNumber: 4,
      events: [
        {
          eventType: "Blockbuster2018",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "Blockbuster2018Phase1",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ],
    },
    {
      seasonNumber: 10,
      events: [
        {
          eventType: "EventFlag.Mayday",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Season10.Phase2",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Season10.Phase3",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_BlackMonday",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.S10_Oak",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.S10_Mystery",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ],
    },
    {
      seasonNumber: 11,
      events: [
        {
          eventType: "Winterfest.Tree",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "LTE_WinterFest",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "LTE_WinterFest2019",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ],
    },
    {
      seasonNumber: 12,
      events: [
        {
          eventType: "EventFlag.LTE_SpyGames",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_JerkyChallenges",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_Oro",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_StormTheAgency",
          activeUntil: this.INDEFINITE_DATE,
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ],
    },
  ];

  public static createTimeline(userAgent: string | undefined) {
    const parsedUserAgent = parseUserAgent(userAgent);
    const currentISODate = DateTime.now().toISO();

    const events: Event[] = [
      {
        eventType: `EventFlag.LobbySeason${parsedUserAgent?.season}`,
        activeUntil: this.INDEFINITE_DATE,
        activeSince: currentISODate,
      },
      //   ...(parsedUserAgent?.lobby
      //     ? [
      //         {
      //           eventType: parsedUserAgent.lobby,
      //           activeUntil: this.INDEFINITE_DATE,
      //           activeSince: currentISODate,
      //         },
      //       ]
      //     : []),
    ];
    this.addSeasonEvents(parsedUserAgent?.season, events);

    return events;
  }

  private static addSeasonEvents(seasonNumber: number | undefined, events: Event[]) {
    if (seasonNumber) {
      for (const { seasonNumber: s, events: seasonEvents } of this.SEASON_EVENTS) {
        if (seasonNumber >= s) {
          events.push(
            ...seasonEvents.map(({ eventType, activeUntil, activeSince }) => ({
              eventType,
              activeUntil,
              activeSince,
            })),
          );
        }
      }
    }
  }
}
