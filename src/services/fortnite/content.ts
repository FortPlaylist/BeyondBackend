import { Hono } from "hono";

import cache from "../../misc/middleware/Cache";
import ParseUserAgent from "../../utils/useragent/parseUseragent";
import { Beyond } from "../../utils/errors/errors";
import { BeyondConfiguration } from "../../../config/secure/BeyondConfiguration";

interface Background {
  stage: string;
  _type: string;
  key: string;
}

export default function initRoute(
  router: Hono<{
    Variables: {
      user: any;
      account: any;
      decodedToken: any;
    };
  }>,
) {
  router.get("/content/api/pages/fortnite-game", cache, async (c) => {
    const season = ParseUserAgent(c.req.header("User-Agent"));

    if (!season || ![10, 12].includes(season.season))
      return c.json(Beyond.internal.invalidUserAgent, 400);

    const backgrounds: Background[] = [
      {
        stage: BeyondConfiguration.isSummerEvent ? "summer" : `season${season.season}`,
        _type: "DynamicBackground",
        key: "lobby",
      },
      {
        stage: BeyondConfiguration.isSummerEvent ? "summer" : `season${season.season}`,
        _type: "DynamicBackground",
        key: "vault",
      },
    ];

    const vaultBackground: Background = {
      stage: backgrounds[1].stage,
      _type: "DynamicBackground",
      key: "vault",
    };

    const seasonImages = {
      12: {
        solo: "http://backend.beyondfn.xyz:3551/cdn/Solo-C2-S2-Gamemode-Fortnite.png",
        duo: "http://backend.beyondfn.xyz:3551/cdn/ispytaniya.jpg",
        squad: "http://backend.beyondfn.xyz:3551/cdn/Squads-C2-S2-Gamemode-Fortnite.png",
        battle_lab:
          "https://static2.srcdn.com/wordpress/wp-content/uploads/2020/06/Fortnite-Creative-Mode.jpg",
        arena_solo:
          "https://cdn2.unrealengine.com/Fortnite/fortnite-game/tournaments/12BR_Arena_Solo_ModeTile-1024x512-f0ecee555f69c65e8a0eace05372371bebcb050f.jpg",
        arena_duos:
          "https://cdn2.unrealengine.com/Fortnite/fortnite-game/tournaments/12BR_Arena_Duos_ModeTile-1024x512-cbd3591ad3f947abc96302dfa987252838877dd5.jpg",
      },
    };

    const playlists = {
      12: [
        {
          image: seasonImages[12].solo,
          playlist_name: "Playlist_DefaultSolo",
          hidden: false,
          special_border: "None",
          _type: "FortPlaylistInfo",
          display_name: "Solo",
        },
        {
          image: seasonImages[12].duo,
          playlist_name: "Playlist_DefaultDuo",
          hidden: false,
          special_border: "None",
          _type: "FortPlaylistInfo",
        },
        {
          image: seasonImages[12].squad,
          playlist_name: "Playlist_DefaultSquad",
          hidden: false,
          special_border: "None",
          _type: "FortPlaylistInfo",
        },
        {
          image: seasonImages[12].battle_lab,
          playlist_name: "Playlist_BattleLab",
          hidden: false,
          special_border: "None",
          _type: "FortPlaylistInfo",
        },
        {
          image: seasonImages[12].arena_solo,
          playlist_name: "Playlist_ShowdownAlt_Solo",
          hidden: false,
          _type: "FortPlaylistInfo",
          display_name: "Arena",
        },
        {
          image: seasonImages[12].arena_duos,
          playlist_name: "Playlist_ShowdownAlt_Duos",
          hidden: true,
          _type: "FortPlaylistInfo",
          display_name: "Arena",
        },
      ],
    };

    return c.json({
      "jcr:isCheckedOut": true,
      _title: "Fortnite Game",
      "jcr:baseVersion": "a7ca237317f1e74e4b8154-226a-4450-a3cd-c77af841e798",
      _activeDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      _locale: "en-US",

      battleroyalenewsv2: {
        news: {
          _type: "Battle Royale News v2",
          motds: [
            {
              body: "Welcome to Beyond!",
              image: "http://135.148.86.165:8990/newsimg",
              tileImage: "http://135.148.86.165:8990/newstile",
              title: "Welcome to Beyond!",
              _type: "CommonUI Simple Message MOTD",
              websiteURL: "https://discord.gg/beyondmp",
              websiteButtonText: "Join the Beyond Discord",
              entryType: "Website",
              id: "BeyondNewsId",
              sortingPriority: 0,
              hidden: false,
            },
          ],
        },
        _title: "battleroyalenewsv2",
        _noIndex: false,
        alwaysShow: false,
        _activeDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        _locale: "en-US",
        _templateName: "FortniteGameMOTD",
      },
      emergencynoticev2: {
        "jcr:isCheckedOut": true,
        _title: "emergencynoticev2",
        _noIndex: false,
        "jcr:baseVersion": "a7ca237317f1e71fad4bd6-1b21-4008-8758-5c13f080a7eb",
        emergencynotices: {
          _type: "Emergency Notices",
          emergencynotices: [
            {
              hidden: false,
              _type: "CommonUI Emergency Notice Base",
              title: "Beyond",
              body: "Beyond is currently in Beta, if you have any issues please report them in #bug-reports in the discord.",
            },
          ],
        },
        _activeDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        _locale: "en-US",
      },
      emergencynotice: {
        news: {
          platform_messages: [],
          _type: "Battle Royale News",
          messages: [
            {
              hidden: false,
              _type: "CommonUI Simple Message Base",
              subgame: "br",
              title: "Beyond",
              body: "Beyond is currently in Beta, if you have any issues please report them in #bug-reports in the discord.",
              spotlight: true,
            },
          ],
        },
        _title: "emergencynotice",
        _activeDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        _locale: "en-US",
      },
      battleroyalenews: {
        news: {
          _type: "Battle Royale News",
          messages: [
            {
              image: "http://135.148.86.165:8990/newsimg",
              hidden: false,
              messagetype: "normal",
              _type: "CommonUI Simple Message Base",
              title: "Welcome to Beyond!",
              body: "Welcome to Beyond!",
              spotlight: false,
            },
          ],
          motds: [
            {
              entryType: "Website",
              image: "http://135.148.86.165:8990/newsimg",
              tileImage: "http://135.148.86.165:8990/newstile",
              videoMute: false,
              hidden: false,
              tabTitleOverride: "Beyond",
              _type: "CommonUI Simple Message MOTD",
              title: "Beyond",
              body: "Welcome to Beyond!",
              offerAction: "ShowOfferDetails",
              videoLoop: false,
              videoStreamingEnabled: false,
              sortingPriority: 90,
              websiteButtonText: "Discord",
              websiteURL: "https://discord.gg/beyondmp",
              id: "BeyondContentId",
              videoAutoplay: false,
              videoFullscreen: false,
              spotlight: false,
            },
            {
              entryType: "Website",
              image: "http://backend.beyondfn.xyz:3551/cdn/BeyondPlusImg.png",
              tileImage: "http://backend.beyondfn.xyz:3551/cdn/BeyondPlusTile.png",
              videoMute: false,
              hidden: false,
              tabTitleOverride: "Beyond+",
              _type: "CommonUI Simple Message MOTD",
              title: "Beyond+",
              body: "Want access to older seasons? Click on the Button Below!",
              offerAction: "ShowOfferDetails",
              videoLoop: false,
              videoStreamingEnabled: false,
              sortingPriority: 90,
              websiteButtonText: "Click me!",
              websiteURL: "https://beyond-shop.tebex.io/checkout/packages/add/6265379/subscribe",
              id: "BeyondPlusId",
              videoAutoplay: false,
              videoFullscreen: false,
              spotlight: false,
            },
          ],
          platform_messages: [],
        },
        _title: "battleroyalenews",
        header: "",
        style: "None",
        _noIndex: false,
        alwaysShow: false,
        _activeDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        _locale: "en-US",
        _templateName: "FortniteGameMOTD",
      },
      dynamicbackgrounds: {
        "jcr:isCheckedOut": true,
        backgrounds: {
          backgrounds,
          _type: "DynamicBackgroundList",
        },
        _title: "dynamicbackgrounds",
        _noIndex: false,
        "jcr:baseVersion": "a7ca237317f1e74e4b8154-226a-4450-a3cd-c77af841e798",
        _activeDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        _locale: "en-US",
      },
      shopSections: {
        sectionList: {
          sections: [
            {
              bSortOffersByOwnership: false,
              bShowIneligibleOffersIfGiftable: false,
              bEnableToastNotification: true,
              background: vaultBackground,
              _type: "ShopSection",
              landingPriority: 0,
              bHidden: false,
              sectionId: "Featured",
              bShowTimer: true,
              sectionDisplayName: "Featured",
              bShowIneligibleOffers: true,
            },
            {
              bSortOffersByOwnership: false,
              bShowIneligibleOffersIfGiftable: false,
              bEnableToastNotification: true,
              background: vaultBackground,
              _type: "ShopSection",
              landingPriority: 1,
              bHidden: false,
              sectionId: "Daily",
              bShowTimer: true,
              sectionDisplayName: "Daily",
              bShowIneligibleOffers: true,
            },
            {
              bSortOffersByOwnership: false,
              bShowIneligibleOffersIfGiftable: false,
              bEnableToastNotification: false,
              background: vaultBackground,
              _type: "ShopSection",
              landingPriority: 2,
              bHidden: false,
              sectionId: "Battlepass",
              bShowTimer: false,
              sectionDisplayName: "Battle Pass",
              bShowIneligibleOffers: false,
            },
          ],
        },
        lastModified: "9999-12-12T00:00:00.000Z",
      },
      tournamentinformation: {
        tournament_info: {
          tournaments: [
            {
              loading_screen_image:
                "http://backend.beyondfn.xyz:3551/cdn/Arena-Duos-Playlist-Fortnite.png",
              title_color: "0BFFAC",
              background_right_color: "41108C",
              background_text_color: "390087",
              _type: "Tournament Display Info",
              tournament_display_id: "lunar_arena_duos",
              highlight_color: "FFFFFF",
              primary_color: "0BFFAC",
              title_line_1: "ARENA",
              shadow_color: "5000BE",
              background_left_color: "B537FB",
              poster_fade_color: "420793",
              secondary_color: "FF1A40",
              playlist_tile_image:
                "http://backend.beyondfn.xyz:3551/cdn/Arena-Duos-Playlist-Fortnite.png",
              base_color: "FFFFFF",
            },
            {
              loading_screen_image:
                "http://backend.beyondfn.xyz:3551/cdn/Arena-Solo-Playlist-Fortnite.png",
              title_color: "0BFFAC",
              background_right_color: "41108C",
              background_text_color: "390087",
              _type: "Tournament Display Info",
              tournament_display_id: "lunar_arena_solo",
              highlight_color: "FFFFFF",
              primary_color: "0BFFAC",
              title_line_1: "ARENA",
              shadow_color: "5000BE",
              background_left_color: "B537FB",
              poster_fade_color: "420793",
              secondary_color: "FF1A40",
              playlist_tile_image:
                "http://backend.beyondfn.xyz:3551/cdn/Arena-Solo-Playlist-Fortnite.png",
              base_color: "FFFFFF",
            },
          ],
          _type: "Tournaments Info",
        },
        _title: "tournamentinformation",
        _noIndex: false,
        _activeDate: "2018-11-13T22:32:47.734Z",
        lastModified: "2019-11-01T17:33:35.346Z",
        _locale: "en-US",
      },
      playlistinformation: {
        frontend_matchmaking_header_style: "None",
        _title: "playlistinformation",
        frontend_matchmaking_header_text: "",
        playlist_info: {
          _type: "Playlist Information",
          // @ts-ignore
          playlists: playlists[season.season as number],
        },
        _noIndex: false,
        _activeDate: "2018-04-25T15:05:39.956Z",
        lastModified: "2019-10-29T14:05:17.030Z",
        _locale: "en-US",
      },
    });
  });
}
