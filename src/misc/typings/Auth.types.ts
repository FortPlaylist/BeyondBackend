interface AccessToken {
  accountId: string;
  token: string;
}

interface RefreshToken {
  accountId: string;
}

interface ClientToken {
  token: string;
}

const accessTokens: AccessToken[] = [];
const refreshTokens: RefreshToken[] = [];
const clientTokens: ClientToken[] = [];

export const Authorization = {
  accessTokens,
  refreshTokens,
  clientTokens,
};
