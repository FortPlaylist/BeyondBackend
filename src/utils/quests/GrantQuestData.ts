import path from "node:path";
import { Quests } from "../../operations/ClientQuestLogin";

export default async function GrantQuestData(): Promise<Quests | null> {
  const questData: Quests = await Bun.file(
    path.join(__dirname, "..", "..", "local", "quests", "Quests.json"),
  ).json();

  if (!questData) return null;

  return questData;
}
