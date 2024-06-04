import fetch from "node-fetch";
import https from "https";
import Logger from "../../utils/logging/logging";

export default async function RefreshAccount(accountId: string, username: string) {
  try {
    const response = await fetch(
      `http://127.0.0.1:5555/fortnite/api/game/v3/profile/${accountId}/client/emptygift`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "FortniteGame/++Fortnite+Release-12.10-CL-11883027 Windows/10.0.22631.1.256.64bit",
        },
        body: JSON.stringify({
          offerId: "e406693aa12adbc8b04ba7e6409c8ab3d598e8c3",
          currency: "MtxCurrency",
          currencySubType: "",
          expectedTotalPrice: "0",
          gameContext: "",
          receiverAccountIds: [accountId],
          giftWrapTemplateId: "GiftBox:gb_makegood",
          personalMessage: "Thank you for playing Fortnite",
          accountId: accountId,
          playerName: username,
          receiverPlayerName: username,
        }),
      },
    );

    if (!response.ok) {
      Logger.error(`HTTP Error: ${response.status} - ${response.statusText}`);
      return;
    }
  } catch (error) {
    Logger.error(`Error: ${error}`);
  }
}
