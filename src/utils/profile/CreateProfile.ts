import { DateTime } from "luxon";
import { v4 as uuid } from "uuid";
import fs from "node:fs/promises";
import path from "node:path";

export async function CreateProfile(account: any, profile: string) {
  const profile_template = JSON.parse(
    await fs.readFile(path.join(__dirname, "profiles", `${profile}.json`), "utf-8"),
  );

  profile_template.accountId = account.accountId;
  profile_template.createdAt = DateTime.now().toISO();
  profile_template.updatedAt = DateTime.now().toISO();
  profile_template._id = uuid().replace(/-/gi, "");
  profile_template.version = "Beyond";

  return profile_template;
}
