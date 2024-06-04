import { v4 as uuid } from "uuid";

interface GiftStatus {
  [accountId: string]: boolean;
}

export const randomGiftboxUUID: string = uuid();
export const GiftReceived: GiftStatus = {};
export const claimedBetaRewards: boolean = false;
