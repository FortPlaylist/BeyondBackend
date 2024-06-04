export interface DailyQuestData {
  templateId: string;
  attributes: DailyQuestAttributesData;
}

interface DailyQuestAttributesData {
  quest_rarity: string;
  xp: number;
  bAthenaMustCompleteInSingleMatch: boolean;
  count: number;
  objectives: string[];
}
