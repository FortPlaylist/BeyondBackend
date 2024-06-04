import mongoose, { Document, Schema, model } from "mongoose";
import { SpeedGooseCacheAutoCleaner } from "speedgoose";
import NodeCache from "node-cache";

const nodeCache = new NodeCache();

export interface Stats {
  wins: number;
  kills: number;
  matchplayed: number;
}

export interface Season {
  season_num: number;
  battlepass: BattlePassData[];
  quest_manager: QuestsData[];
  quests: Quests;
  creative: CreativeData[];
  events: Events;
  stats: SeasonStats;
  contentpages?: ContentPages[];
}

interface Quests {
  claimedWeeklyQuests: number;
}

export interface SeasonStats {
  solos: Stats;
  duos: Stats;
  squads: Stats;
  ltm: Stats;
}

// not gonna be used currently.
interface ContentPages {
  image: string;
  body: string;
  title: string;
}

interface Events {
  arena: Arena;
  // tournament: Tournament
}

interface Arena {
  persistentScores: PersistentScores;
  tokens: string[];
}

interface PersistentScores {
  Hype: number;
}

export interface BattlePassData {
  book_purchased: boolean;
  book_level: number;
  book_xp: number;
  xp: number;
  season_friend_match_boost: number;
  season_match_boost: number;
  level: number;
  battlestars_currency: number;
  battlestars: number;
  intro_game_played: boolean;
  purchased_battle_pass_tier_offers: PurchasedBattlePassTierOffers[];
  purchased_bp_offers: PurchasedBattlePassOffers[];
}

interface PurchasedBattlePassTierOffers {
  id: string;
  count: number;
}

// i think im missing one ¯\_(ツ)_/¯
type CurrencyType = "MtxCurrency" | "battlestars" | "RealMoney";

interface PurchasedBattlePassOffers {
  offerId: string;
  bIsFreePassReward: boolean;
  purchaseDate: string;
  lootResult: PurchasedBattlePassOffersLootResult[];
  currencyType: CurrencyType;
  totalCurrencyPaid: number;
}

type itemProfile = "athena" | "common_core";

interface PurchasedBattlePassOffersLootResult {
  itemType: string;
  itemGuid: string;
  itemProfile: itemProfile;
  quantity: number;
}

// TODO: (Skies) -> Add DailyQuests and SeasonQuests
export interface QuestsData {
  last_xp_interaction: string;
  dailyLoginInterval: string;
  dailyQuestRerolls: number;
}

interface CreativeData {
  creative_dynamic_xp: CreativeDynamicXp;
}

interface CreativeDynamicXp {
  timespan: number;
  bucketXp: number;
  bankXp: number;
  bankXpMult: number;
  boosterBucketXp: number;
  boosterXpMult: number;
  dailyExcessXpMult: number;
  currentDayXp: number;
  currentDay: number;
}

interface AccountsModel extends Document {
  accountId: string;
  discordId: string;
  athena: any;
  common_core: any;
  metadata: any;
  outpost0: any;
  theater0: any;
  collection_book_schematics0: any;
  collection_book_people0: any;
  accessToken: any;
  refreshToken: any;
  clientToken: any;
  season: Season[];
}

const accountsSchema = new Schema<AccountsModel>({
  accountId: { type: String, required: true, index: true },
  discordId: { type: String, required: true },
  athena: { type: Object, default: {} },
  common_core: { type: Object, default: {} },
  metadata: { type: Object, default: {} },
  theater0: { type: Object, default: {} },
  outpost0: { type: Object, default: {} },
  collection_book_schematics0: { type: Object, default: {} },
  collection_book_people0: { type: Object, default: {} },
  season: [
    {
      type: {
        season_num: { type: Number, default: 14 },
        battlepass: [
          {
            book_purchased: { type: Boolean, default: false },
            book_level: { type: Number, default: 1 },
            book_xp: { type: Number, default: 0 },
            season_friend_match_boost: { type: Number, default: 0 },
            season_match_boost: { type: Number, default: 0 },
            level: { type: Number, default: 1 },
            battlestars_currency: { type: Number, default: 0 },
            battlestars: { type: Number, default: 0 },
            intro_game_played: { type: Boolean, default: false },
            purchased_battle_pass_tier_offers: { type: Array, default: [] },
            purchased_bp_offers: { type: Array, default: [] },
            xp: { type: Number, default: 0 },
          },
        ],
        quest_manager: [
          {
            dailyLoginInterval: {
              type: String,
              default: "9999-99-99T00:00:00.000Z",
            },
            last_xp_interaction: {
              type: String,
              default: "9999-99-99T00:00:00.000Z",
            },
            dailyQuestRerolls: { type: Number, default: 1 },
          },
        ],
        quests: {
          claimedWeeklyQuests: { type: Number, default: 1 },
        },
        creative: [
          {
            creative_dynamic_xp: {
              timespan: { type: Number, default: 0 },
              bucketXp: { type: Number, default: 0 },
              bankXp: { type: Number, default: 0 },
              bankXpMult: { type: Number, default: 0 },
              boosterBucketXp: { type: Number, default: 0 },
              boosterXpMult: { type: Number, default: 0 },
              dailyExcessXpMult: { type: Number, default: 0 },
              currentDayXp: { type: Number, default: 0 },
              currentDay: { type: Number, default: 0 },
            },
          },
        ],
        events: {
          arena: {
            persistentScores: {
              Hype: { type: Number, default: 0 },
            },
            tokens: ["ARENA_S10_Divison1"],
          },
        },
        stats: {
          solos: {
            wins: { type: Number, default: 0 },
            kills: { type: Number, default: 0 },
            matchplayed: { type: Number, default: 0 },
          },
          duos: {
            wins: { type: Number, default: 0 },
            kills: { type: Number, default: 0 },
            matchplayed: { type: Number, default: 0 },
          },
          squads: {
            wins: { type: Number, default: 0 },
            kills: { type: Number, default: 0 },
            matchplayed: { type: Number, default: 0 },
          },
          ltm: {
            wins: { type: Number, default: 0 },
            kills: { type: Number, default: 0 },
            matchplayed: { type: Number, default: 0 },
          },
        },
      },
      default: {},
    },
  ],
  accessToken: { type: Array, default: [] },
  refreshToken: { type: Array, default: [] },
  clientToken: { type: Array, default: [] },
});

accountsSchema.plugin(SpeedGooseCacheAutoCleaner);
accountsSchema.index({ accountId: 1 });

const cache: { [modelName: string]: { [id: string]: any } } = {};
const cacheMap: { [modelName: string]: { [query: string]: string } } = {};

mongoose.Query.prototype.cache = async function () {
  if (!cacheMap[this.model.modelName]) cacheMap[this.model.modelName] = {};
  if (!cache[this.model.modelName]) cache[this.model.modelName] = {};
  var query = this.getQuery();
  var doc;
  if (!cacheMap[this.model.modelName][JSON.stringify(query)] && !query._id) {
    doc = await this.exec();
    if (!doc) return null;
    var id = doc._id;
    cacheMap[this.model.modelName][JSON.stringify(query)] = id;
    cache[this.model.modelName][id] = doc;
  } else {
    var id = query._id ? query._id : cacheMap[this.model.modelName][JSON.stringify(query)];
    doc = cache[this.model.modelName][id];
    if (!doc) return null;
  }
  if (this.op == "updateOne" || this.op == "findOneAndUpdate") {
    var upd: any = this.getUpdate();
    for (var key of Object.keys(upd)) {
      if (!key.startsWith("$")) {
        eval(`doc.${key} = upd["${key}"]`);
      } else if (key == "$set") {
        for (var k2 of Object.keys(upd["$set"])) {
          eval(`doc.${k2} = upd["$set"]["${k2}"]`);
        }
      } else if (key == "$inc") {
        for (var k2 of Object.keys(upd["$inc"])) {
          eval(`doc.${k2} = upd["$inc"]["${k2}"]`);
        }
      }
    }
  }
  return doc;
};
mongoose.Query.prototype.saveFromCache = async function () {
  if (!cacheMap[this.model.modelName]) return null;
  var query = this.getQuery();
  var id = query._id ? query._id : cacheMap[this.model.modelName][JSON.stringify(query)];
  if (!id) return null;
  var doc = cache[this.model.modelName][id];
  if (!doc) return null;
  await (await this.model.findOne(this.getQuery())).replaceOne(doc); // discards unknown vals lol
};

const Accounts = model<AccountsModel>("Accounts", accountsSchema);

export default Accounts;
