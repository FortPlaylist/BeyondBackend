import path from "node:path";

const rewards: {
  [token: string]: {
    templateId: string;
    channel: string;
    value: string;
  };
} = {};

export default async function GetCosmeticVariantTokenReward() {
  const tokens = await Bun.file(
    path.join(__dirname, "..", "..", "local", "athena", "VariantTokens.json"),
  ).json();

  for (const id in tokens) {
    const data = tokens[id];

    rewards[id] = {
      templateId: data.templateId,
      channel: data.channel,
      value: data.value,
    };
  }

  return rewards;
}
