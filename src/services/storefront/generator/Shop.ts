import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SavedData, Item, ItemField } from "../types/shop.types";
import { v4 as uuid } from "uuid";
import Prices from "./prices/Prices";
import MetaInfoBuilder, { Section, TileSize } from "./meta/createMetaInfo";
import { setDisplayAsset, setNewDisplayAssetPath } from "./displayAssets/getDisplayAsset";
import crypto from "node:crypto";
import Logger from "../../../utils/logging/logging";
import { CosmeticSet, VariantJSON } from "../../../local/interfaces/VariantJSON";
import { Variant } from "../../../local/interfaces";

export default class shop {
  public static readonly itemTypes = ["characters", "dances", "pickaxes", "gliders", "wraps"];

  public static readonly itemTypeProbabilities = shop.generateRandomProbabilities(5);
  public static readonly rarityProbabilities = shop.generateRandomProbabilities(5);

  public static readonly shopPath: string = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "local",
    "storefront",
    "shop.json",
  );

  private static generateRandomProbabilities(length: number): number[] {
    const probabilities = [];
    for (let i = 0; i < length; i++) {
      probabilities.push(Math.random());
    }
    return probabilities;
  }

  public async initialize(expiration: string, cacheExpire: string): Promise<void> {
    try {
      const weeklyItems: Item[] = await this.generateItems(3, "BRWeeklyStorefront");
      const dailyItems: Item[] = await this.generateItems(6, "BRDailyStorefront");

      await this.generateShop({
        expiration,
        cacheExpire,
        catalogItems: {
          BRWeeklyStorefront: weeklyItems,
          BRDailyStorefront: dailyItems,
        },
      } as SavedData);
    } catch (error) {
      Logger.error(`Error generating shop data: ${error}`);
    }
  }

  public async generateItems(amount: number, type: string): Promise<Item[]> {
    const items: Item[] = [];
    const selectedItems: { [key: string]: number } = {};

    while (items.length < amount) {
      let item: Item = await this.generateItem(type, selectedItems);

      if (!item) continue;

      if (type === "BRDailyStorefront" && items.length >= 6) break;

      items.push(item);
    }

    return items;
  }

  private getRandomWeightedIndex(probabilities: number[]): number {
    const totalProbability = probabilities.reduce((acc, prob) => acc + prob, 0);
    const threshold = Math.random() * totalProbability;
    let sum = 0;
    for (let i = 0; i < probabilities.length; i++) {
      sum += probabilities[i];
      if (threshold < sum) {
        return i;
      }
    }
    return probabilities.length - 1;
  }

  public async generateItem(type: string, selectedItems: { [key: string]: any }): Promise<Item> {
    let randomIndex: number;
    const dailyEmoteLimit = 2;
    const weeklyEmoteLimit = 1;

    if (type === "BRWeeklyStorefront") {
      randomIndex = this.getRandomWeightedIndex(
        shop.itemTypeProbabilities.filter((_, index) => [0, 1].includes(index)),
      );
    } else {
      randomIndex = this.getRandomWeightedIndex(shop.itemTypeProbabilities);
    }

    randomIndex = this.getRandomWeightedIndex(shop.itemTypeProbabilities);
    const itemType: string = shop.itemTypes[randomIndex];

    randomIndex = this.getRandomWeightedIndex(shop.rarityProbabilities);
    // const rarity: string = ["Common", "Uncommon", "Rare", "Epic", "Legendary"][randomIndex];

    if (type === "BRWeeklyStorefront" && selectedItems["dances"] >= 2) {
      randomIndex = this.getRandomWeightedIndex(
        shop.itemTypeProbabilities.filter((_, index) => index !== 1),
      );
    } else {
      randomIndex = this.getRandomWeightedIndex(shop.itemTypeProbabilities);
    }

    if (type === "BRDailyStorefront" && selectedItems[itemType] >= 2) {
      selectedItems[itemType] = 0;
    }

    if (
      (type === "BRDailyStorefront" && selectedItems[itemType] >= dailyEmoteLimit) ||
      (type === "BRWeeklyStorefront" && selectedItems[itemType] >= weeklyEmoteLimit)
    ) {
      return await this.generateItem(type, selectedItems);
    } else {
      selectedItems[itemType] = (selectedItems[itemType] || 0) + 1;
    }

    const cosmeticPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "local",
      "storefront",
      "cosmetics",
      `${itemType}.json`,
    );

    const items = await Bun.file(cosmeticPath).json();

    const randomItemIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomItemIndex];

    selectedItems[itemType] = (selectedItems[itemType] || 0) + 1;

    const meta = new MetaInfoBuilder();
    randomItem.categories = [];

    if (!randomItem.displayAssetPath) {
      const displayAssetKey =
        type === "BRWeeklyStorefront"
          ? `DA_Featured_${randomItem.item}`
          : `DA_Daily_${randomItem.item}`;
      randomItem.displayAssetPath = setDisplayAsset(displayAssetKey);
      meta.addMetaInfo("DisplayAssetPath", randomItem.displayAssetPath);
    }

    if (!randomItem.newDisplayAssetPath) {
      randomItem.newDisplayAssetPath = setNewDisplayAssetPath(`DAv2_${randomItem.item}`);
      meta.addMetaInfo("NewDisplayAssetPath", randomItem.newDisplayAssetPath);
    }

    if (!randomItem.metaInfo) {
      randomItem.metaInfo = [];

      meta.setTileSize(type === "BRWeeklyStorefront" ? TileSize.Small : TileSize.Normal);
      meta.setSection(type === "BRWeeklyStorefront" ? Section.Featured : Section.Daily);
      meta.setDisplayAsset(randomItem.displayAssetPath);
      meta.setNewDisplayAsset(randomItem.newDisplayAssetPath);

      randomItem.metaInfo = meta.createMetaInfo();
    }

    if (!randomItem.meta) {
      randomItem.meta = {
        DisplayAssetPath: randomItem.displayAssetPath,
        NewDisplayAssetPath: randomItem.newDisplayAssetPath,
        SectionId: randomItem.metaInfo.find((data: { key: string }) => data.key === "SectionId")
          .value,
        TileSize: randomItem.metaInfo.find((data: { key: string }) => data.key === "TileSize")
          .value,
      };
    }

    let itemPrice = "0";

    const categoryPrices = Prices[itemType as keyof Prices] as {
      [key: string]: number;
    };

    if (categoryPrices && categoryPrices[randomItem.rarity]) {
      itemPrice = categoryPrices[randomItem.rarity].toString();
    } else {
      Logger.error(
        `Failed to get price for the item ${randomItem.name} with the rarity ${randomItem.rarity}`,
      );
    }

    const cosmetic_sets = await Bun.file(
      path.join(__dirname, "..", "..", "..", "local", "storefront", "cosmetic_sets.json"),
    ).json();

    const variants = await Bun.file(
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "utils",
        "profile",
        "profiles",
        "other",
        "variants.json",
      ),
    ).json();

    if (randomItem.items.length > 0) {
      for (const item of randomItem.items) {
        const processItem = (itemId: string): string => {
          const idWithoutAthena = itemId.replace("Athena", "");
          const idWithoutType = idWithoutAthena.replace(
            /(Character|ItemWrap|Dance|Pickaxe|Glider)/g,
            "",
          );
          const idWithoutColon = idWithoutType.replace(":", "");
          return idWithoutColon;
        };

        const idWithoutColon: string = processItem(randomItem.item);
        const idWithoutColon2: string = processItem(item.item);

        const matchingSet: CosmeticSet | undefined = cosmetic_sets.find(
          (set: { id: string }) => set.id === idWithoutColon,
        );

        if (matchingSet) {
          randomItem.categories = [matchingSet.value];
          item.categories = [matchingSet.value];
        } else {
          randomItem.categories = [];
          item.categories = [];
        }

        const findVariant = (id: string): VariantJSON | undefined =>
          variants.find((v: { id: string }) => v.id === id);

        const matchingVariant: VariantJSON | undefined = findVariant(idWithoutColon);
        const matchingBundledItemVariant: VariantJSON | undefined = findVariant(idWithoutColon2);

        const processVariant = (variant: VariantJSON | undefined): Variant | undefined => {
          if (!variant) return;

          const innerVariant = variant.variants[0];
          return {
            channel: innerVariant.channel,
            active: innerVariant.active,
            owned: innerVariant.owned,
          };
        };

        randomItem.variants = processVariant(matchingVariant);
        item.variants = processVariant(matchingBundledItemVariant);
      }
    }

    return {
      offerId: this.generateID(),
      item: randomItem.item,
      name: randomItem.name || "Failed to generate item name",
      items: randomItem.items || "Failed to generate bundle items",
      price: parseInt(itemPrice || "100000000000", 10),
      rarity: randomItem.rarity || "Failed to generate item rarity",
      displayAssetPath: randomItem.displayAssetPath || "Failed to generate displayAssetPath",
      newDisplayAssetPath:
        randomItem.newDisplayAssetPath || "Failed to generate newDisplayAssetPath",
      metaInfo: randomItem.metaInfo || [],
      meta: randomItem.meta || {},
      variants: randomItem.variants || [],
      categories: randomItem.categories || [],
    };
  }

  generateID(): string {
    const finalUUID = crypto
      .createHash("sha256")
      .update(uuid().replace(/-/g, "") + uuid().replace(/-/g, ""))
      .digest("hex")
      .slice(0, 64);

    return finalUUID;
  }

  private async generateShop(data: SavedData): Promise<void> {
    const shopdata = JSON.stringify(data, null, 2);

    return new Promise<void>(async (resolve, reject) => {
      await writeFile(shop.shopPath, shopdata, "utf8").catch((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}
