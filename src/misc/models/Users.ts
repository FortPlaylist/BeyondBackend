import { Schema, model, Document } from "mongoose";
import { SpeedGooseCacheAutoCleaner } from "speedgoose";

export interface IUser extends Document {
  accountId: string;
  discordId: string;
  roles: string[];
  email: string;
  username: string;
  password: string;
  banned: boolean;
  hasFL: boolean;
  hwid: string;
}

const UserSchema = new Schema<IUser>({
  accountId: { type: String, required: true },
  discordId: { type: String, required: true },
  roles: [{ type: String, required: true }],
  email: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  banned: { type: Boolean, default: false },
  hasFL: { type: Boolean, default: false },
  hwid: { type: String, default: "" },
});

UserSchema.plugin(SpeedGooseCacheAutoCleaner);
const Users = model<IUser>("Users", UserSchema);

export default Users;
