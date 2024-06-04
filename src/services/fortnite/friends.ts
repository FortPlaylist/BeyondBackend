import { Hono } from "hono";
import { DateTime } from "luxon";
import Users from "../../misc/models/Users";
import Friends from "../../misc/models/Friends";
import cache from "../../misc/middleware/Cache";
import verify from "../../misc/middleware/verify";
import SendFriendRequest from "../xmpp/functions/SendFriendRequest";
import AcceptFriendRequest from "../xmpp/functions/AcceptFriendRequest";
import GetUserPresence from "../xmpp/functions/GetUserPresence";

export default function initRoute(router: Hono) {
  router.get("/friends/api/public/friends/:accountId", cache, verify, async (c) => {
    const accountId = c.req.param("accountId");

    const friends = await Friends.findOne({ accountId }).cacheQuery();

    if (!friends) {
      c.status(404);
      return c.json({ error: "User not found." });
    }

    const friendsList: any[] = [];
    const acceptedFriends = friends.friends.accepted;
    const incomingFriends = friends.friends.incoming;
    const outgoingFriends = friends.friends.outgoing;

    for (const friend of acceptedFriends) {
      friendsList.push({
        accountId: friend.accountId,
        status: "ACCEPTED",
        direction: "OUTBOUND",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of incomingFriends) {
      friendsList.push({
        accountId: friend.accountId,
        status: "PENDING",
        direction: "INBOUND",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of outgoingFriends) {
      friendsList.push({
        accountId: friend.accountId,
        status: "PENDING",
        direction: "OUTBOUND",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    return c.json(friendsList);
  });

  router.get("/friends/api/v1/:accountId/summary", cache, async (c) => {
    const content: {
      friends: any[];
      incoming: any[];
      outgoing: any[];
      suggested: any[];
      blocklist: any[];
      settings: { acceptInvites: string };
    } = {
      friends: [],
      incoming: [],
      outgoing: [],
      suggested: [],
      blocklist: [],
      settings: {
        acceptInvites: "public",
      },
    };
    const accountId = c.req.param("accountId");
    const friends = await Friends.findOne({ accountId });

    if (!friends) {
      c.status(404);
      return c.json({ error: "Failed to find User." });
    }

    const acceptedFriends = friends.friends.accepted;
    const incomingFriends = friends.friends.incoming;
    const outgoingFriends = friends.friends.outgoing;

    for (const friend of acceptedFriends) {
      content.friends.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of incomingFriends) {
      content.incoming.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    for (const friend of outgoingFriends) {
      content.outgoing.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });

      content.blocklist.push({
        accountId: friend.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        createdAt: DateTime.fromISO(friend.createdAt)
          .toUTC()
          .toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        favorite: false,
      });
    }

    return c.json(content);
  });

  router.get("/friends/api/v1/:accountId/friends/:friendId", cache, verify, async (c) => {
    const friendId = c.req.param("friendId");
    const accountId = c.req.param("accountId");

    const user = await Friends.findOne({ accountId });
    const friend = await Friends.findOne({ accountId: friendId });

    if (!user || !friend) {
      c.status(404);
      return c.json({ error: "User or Friend not found" });
    }

    const accepted = user.friends.accepted.find(
      (accepted) => accepted.accountId === friend.accountId,
    );

    if (accepted !== undefined) {
      return c.json({
        accountId: user.accountId,
        groups: [],
        mutual: 0,
        alias: "",
        note: "",
        favorite: false,
        created: accepted.createdAt,
      });
    } 
      c.status(404);
      return c.json({
        errorCode: "errors.com.epicgames.friends.friendship_not_found",
        errorMessage: `Friendship between ${user.accountId} and ${friend.accountId} does not exist.`,
        messageVars: [`/friends/api/v1/${user.accountId}/friends/${friend.accountId}`],
        numericErrorCode: 14004,
        originatingService: "any",
        intent: "prod",
        error_description: `Friendship between ${user.accountId} and ${friend.accountId} does not exist.`,
        error: "friends",
      });
    
  });

  /* 
    - Chapter 1 Friending
    */
  router.post("/friends/api/v1/:accountId/friends/:friendId", cache, verify, async (c) => {
    const accountId = c.req.param("accountId");
    const friendId = c.req.param("friendId");

    const userFriendsList = await Friends.findOne({ accountId }).cacheQuery();
    const friendFriendsList = await Friends.findOne({
      accountId: friendId,
    }).cacheQuery();

    const user = await Users.findOne({ accountId }).cacheQuery();
    const friend = await Users.findOne({ accountId: friendId }).cacheQuery();

    if (!user || !friend || !userFriendsList || !friendFriendsList) {
      c.status(404);
      return c.json({ error: "User or Friend not found" });
    }

    if (user.banned || friend.banned) {
      c.status(400);
      return c.json({ error: "Friend or User is banned." });
    }

    const acceptedFriends = userFriendsList.friends.accepted.find(
      (accepted) => accepted.accountId === friend.accountId,
    );

    const outgoingFriends = userFriendsList.friends.outgoing.find(
      (outgoing) => outgoing.accountId === friend.accountId,
    );

    const incomingFriendsIndex = userFriendsList.friends.incoming.findIndex(
      (incoming) => incoming.accountId === friend.accountId,
    );

    const outgoingFriendsIndex = userFriendsList.friends.outgoing.findIndex(
      (outgoing) => outgoing.accountId === friend.accountId,
    );

    if (acceptedFriends !== undefined) {
      c.status(409);
      return c.json({
        errorCode: "errors.com.epicgames.friends.friend_request_already_sent",
        errorMessage: `Friendship between ${user.accountId} and ${friend.accountId} already exists.`,
        messageVars: [`/friends/api/v1/${user.accountId}/friends/${friend.accountId}`],
        numericErrorCode: 14014,
        originatingService: "any",
        intent: "prod",
        error_description: `Friendship between ${user.accountId} and ${friend.accountId} already exists.`,
        error: "friends",
      });
    }

    if (outgoingFriends !== undefined) {
      c.status(409);
      return c.json({
        errorCode: "errors.com.epicgames.friends.friend_request_already_sent",
        errorMessage: `Friendship request has already been sent to ${friend.accountId}`,
        messageVars: [`/friends/api/v1/${user.accountId}/friends/${friend.accountId}`],
        numericErrorCode: 14014,
        originatingService: "any",
        intent: "prod",
        error_description: `Friendship request has already been sent to ${friend.accountId}`,
        error: "friends",
      });
    }

    if (user.accountId === friend.accountId) return;

    if (incomingFriendsIndex !== -1) {
      if (
        !(await AcceptFriendRequest(
          user.accountId,
          friend.accountId,
          incomingFriendsIndex,
          outgoingFriendsIndex,
        ))
      ) {
        c.status(400);
        return c.json({
          errorCode: "errors.com.epicgames.friends.failed_to_accept_request",
          errorMessage: "Failed to accept friend request.",
          messageVars: [`/friends/api/v1/${user.accountId}/friends/${friend.accountId}`],
          numericErrorCode: 14015,
          originatingService: "any",
          intent: "prod",
          error_description: "Failed to accept friend request.",
          error: "friends",
        });
      }

      await GetUserPresence(false, user.accountId, friend.accountId);
      await GetUserPresence(false, friend.accountId, user.accountId);
    } else if (!(await SendFriendRequest(user.accountId, friend.accountId))) {
        c.status(400);
        return c.json({
          errorCode: "errors.com.epicgames.friends.failed_to_send_request",
          errorMessage: "Failed to send friend request.",
          messageVars: [`/friends/api/v1/${user.accountId}/friends/${friend.accountId}`],
          numericErrorCode: 14016,
          originatingService: "any",
          intent: "prod",
          error_description: "Failed to send friend request.",
          error: "friends",
        });
      }

    return c.sendStatus(200);
  });

  /* 
  - Set a Nickname
  */
  router.put("/friends/api/v1/:accountId/friends/:friendId/alias", cache, verify, async (c) => {
    const accountId = c.req.param("accountId");
    const friendId = c.req.param("friendId");

    const friends = await Friends.findOne({ accountId }).cacheQuery();
    const accepted = friends?.friends.accepted;

    if (!accepted?.find((friend) => friend.accountId === friendId)) {
      c.status(404);
      return c.json({
        errorCode: "errors.com.epicgames.friends.friendship_not_found",
        errorMessage: `Friendship between ${accountId} and ${friendId} does not exist.`,
        messageVars: undefined,
        numericErrorCode: 14004,
        originatingService: "any",
        intent: "prod",
        error_description: `Friendship between ${accountId} and ${friendId} does not exist.`,
        error: "friends",
      });
    }

    const index = accepted!.findIndex((friend) => friend.accountId === friendId);
    if (index === -1) return;

    accepted![index].alias = (await c.req.raw.clone().json()) as string;

    await friends!.updateOne({ $set: { friends: friends!.friends } });
    return c.sendStatus(200);
  });

  /* 
  - Remove a Nickname
  */
  router.put("/friends/api/v1/:accountId/friends/:friendId/alias", cache, verify, async (c) => {
    const accountId = c.req.param("accountId");
    const friendId = c.req.param("friendId");

    const friends = await Friends.findOne({ accountId }).cacheQuery();
    const accepted = friends?.friends.accepted;

    if (!accepted?.find((friend) => friend.accountId === friendId)) {
      c.status(404);
      return c.json({
        errorCode: "errors.com.epicgames.friends.friendship_not_found",
        errorMessage: `Friendship between ${accountId} and ${friendId} does not exist.`,
        messageVars: undefined,
        numericErrorCode: 14004,
        originatingService: "any",
        intent: "prod",
        error_description: `Friendship between ${accountId} and ${friendId} does not exist.`,
        error: "friends",
      });
    }

    const index = accepted!.findIndex((friend) => friend.accountId === friendId);
    if (index === -1) return;

    accepted![index].alias = "";

    await friends!.updateOne({ $set: { friends: friends!.friends } });
    return c.sendStatus(200);
  });

  router.get("/friends/api/public/blocklist/:accountId", cache, verify, async (c) => {
    const accountId = c.req.param("accountId");
    const friends = await Friends.findOne({ accountId }).cacheQuery();

    if (!friends) {
      c.status(404);
      return c.json({ error: "Friends not found." });
    }

    c.status(200);
    return c.json({
      blockedUsers: friends.friends.blocked.map((user) => user.accountId),
    });
  });
}
