import { getBaseItemId } from "./getBaseItemId";

export function setDisplayAsset(item: string): string {
  const baseItemId = getBaseItemId(item);
  return `/Game/Catalog/DisplayAssets/${baseItemId}.${baseItemId}`;
}

export function setNewDisplayAssetPath(item: string): string {
  const baseItemId = getBaseItemId(item);
  const newDisplayAsset = `DAv2_Featured_${baseItemId}`;
  return `/Game/Catalog/NewDisplayAssets/${newDisplayAsset}.${newDisplayAsset}`;
}

export function getDisplayAsset(item: string): string {
  const baseItemId = getBaseItemId(item);
  return `/Game/Catalog/DisplayAssets/${baseItemId}.${baseItemId}`;
}
