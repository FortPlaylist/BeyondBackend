import { DateTime } from "luxon";
import Friends from "../../../misc/models/Friends";
import Users from "../../../misc/models/Users";
import SendMessageToId from "./SendMessageToId";

export default async function SendFriendRequest(
  accountId: string,
  friendId: string,
): Promise<boolean> {
  const userFriendsList = await Friends.findOne({
    accountId,
  }).cacheQuery();
  const friendFriendsList = await Friends.findOne({
    accountId: friendId,
  }).cacheQuery();

  const user = await Users.findOne({ accountId }).cacheQuery();
  const friend = await Users.findOne({
    accountId: friendId,
  }).cacheQuery();

  if (!user || !friend || !userFriendsList || !friendFriendsList) return false;
  if (user.banned || friend.banned) return false;

  userFriendsList.friends.outgoing.push({
    accountId: friend.accountId,
    createdAt: DateTime.now().toISO(),
    alias: "",
  });

  SendMessageToId(
    JSON.stringify({
      payload: {
        accountId: friend.accountId,
        status: "PENDING",
        direction: "OUTBOUND",
        created: DateTime.now().toISO(),
        favorite: false,
      },
      type: "com.epicgames.friends.core.apiobjects.Friend",
      timestamp: DateTime.now().toISO(),
    }),
    user.accountId,
  );

  friendFriendsList.friends.incoming.push({
    accountId: user.accountId,
    createdAt: DateTime.now().toISO(),
    alias: "",
  });

  SendMessageToId(
    JSON.stringify({
      payload: {
        accountId: user.accountId,
        status: "PENDING",
        direction: "INBOUND",
        created: DateTime.now().toISO(),
        favorite: false,
      },
      type: "com.epicgames.friends.core.apiobjects.Friend",
      timestamp: DateTime.now().toISO(),
    }),
    friend.accountId,
  );

  await userFriendsList.updateOne({
    $set: { friends: userFriendsList.friends },
  });
  await friendFriendsList.updateOne({
    $set: { friends: friendFriendsList.friends },
  });

  return true;
}
