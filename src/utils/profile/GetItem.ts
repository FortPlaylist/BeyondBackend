import logging from "../logging/logging";
import Accounts from "../../misc/models/Accounts";

export type ProfileTypes =
  | "athena"
  | "common_core"
  | "metadata"
  | "theater0"
  | "outpost0"
  | "collection_book_schematics0"
  | "collection_book_people0";

export default async function GetItem(
  accountId: string,
  type: ProfileTypes,
  item: string,
): Promise<any> {
  try {
    const profile = await Accounts.findOne({ accountId });

    if (!profile) {
      throw new Error(`Profile with accountId ${accountId} was not found.`);
    }

    if (!profile[type]) {
      throw new Error(`Profile type ${type} was not found for accountId ${accountId}.`);
    }

    return profile[type].items[item];
  } catch (error) {
    logging.error(`Failed to GetProfile -> ${type}: ${error}`);
    throw error;
  }
}
