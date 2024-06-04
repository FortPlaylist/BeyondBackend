import { MetaInfoItem } from "./metaInfoItem";

export interface Item {
  offerId: string;
  item: string;
  name: string;
  items: string;
  price: number;
  rarity: number;
  displayAssetPath: string;
  newDisplayAssetPath: string;
  meta?: MetaInfoItem[];
  metaInfo?: MetaInfoItem[];
  variants: any[];
  categories: string[];
}

export interface ItemField {
  name: string;
  value: string | number;
}

export interface SavedData {
  expiration: string;
  cacheExpire: string;
  catalogItems: CatalogItems;
}

export interface CatalogItems {
  BRWeeklyStorefront: Item[];
  BRDailyStorefront: Item[];
}
