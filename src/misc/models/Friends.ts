import { DateTime } from "luxon";
import { SpeedGooseCacheAutoCleaner } from "speedgoose";
import { Schema, model, Document } from "mongoose";

interface Friend {
  accountId: string;
  createdAt: string;
  alias: string;
}

interface Friends {
  accepted: Friend[];
  incoming: Friend[];
  outgoing: Friend[];
  blocked: Friend[];
}

export interface IFriends extends Document {
  accountId: string;
  friends: Friends;
}

const FriendsSchema = new Schema<IFriends>({
  accountId: { type: String, default: "" },
  friends: {
    accepted: {
      type: Array,
      default: [],
    },
    incoming: {
      type: Array,
      default: [],
    },
    outgoing: {
      type: Array,
      default: [],
    },
    blocked: {
      type: Array,
      default: [],
    },
  },
});

FriendsSchema.plugin(SpeedGooseCacheAutoCleaner);

export default model<IFriends>("Friends", FriendsSchema);
