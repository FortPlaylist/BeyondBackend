import { MetaInfoItem } from "../../types/MetaInfoItem";

export enum TileSize {
  Small = "Small",
  Normal = "Normal",
}

export enum Section {
  Featured = "Featured",
  Daily = "Daily",
  Weekly = "Weekly",
}

export default class MetaInfoBuilder {
  private meta: MetaInfoItem[] = [];
  private newDisplayAssetPath: string = "";
  private displayAssetPath: string = "";
  private bannerOverrideText: string = "";

  addMetaInfo(key: string, value: string): MetaInfoBuilder {
    this.meta.push({ key, value });
    return this;
  }

  setTileSize(size: TileSize): MetaInfoBuilder {
    return this.addMetaInfo("TileSize", size);
  }

  setDisplayAsset(asset: string): MetaInfoBuilder {
    this.displayAssetPath = asset;
    return this.addMetaInfo("DisplayAssetPath", asset);
  }

  setNewDisplayAsset(asset: string): MetaInfoBuilder {
    this.newDisplayAssetPath = asset;
    return this.addMetaInfo("NewDisplayAssetPath", asset);
  }

  setBannerOverride(text: string): MetaInfoBuilder {
    this.bannerOverrideText = text;
    return this.addMetaInfo("BannerOverride", text);
  }

  setSection(section: Section): MetaInfoBuilder {
    return this.addMetaInfo("SectionId", section);
  }

  setMetaInfo(info: Record<string, string>): MetaInfoBuilder {
    for (const [key, value] of Object.entries(info)) {
      this.addMetaInfo(key, value);
    }
    return this;
  }

  getMetaInfo(): MetaInfoItem[] {
    return this.meta;
  }

  createDailyInfo() {
    return [
      {
        Key: "SectionId",
        Value: "Daily",
      },
      {
        Key: "TileSize",
        Value: "Small",
      },
    ];
  }

  createMetaInfo(): MetaInfoItem[] {
    const isDaily = this.meta.some((data) => data.value === Section.Daily);

    return [
      {
        key: "NewDisplayAssetPath",
        value: this.newDisplayAssetPath,
      },
      {
        key: "DisplayAssetPath",
        value: this.displayAssetPath,
      },
      {
        key: "SectionId",
        value: isDaily ? Section.Daily : Section.Featured,
      },
      {
        key: "BannerOverride",
        value: this.bannerOverrideText,
      },
      {
        key: "TileSize",
        value: isDaily ? TileSize.Small : TileSize.Normal,
      },
    ];
  }
}
