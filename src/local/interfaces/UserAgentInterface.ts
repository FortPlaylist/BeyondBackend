export interface UserAgentInfo {
  buildId: string;
  buildString: string;
}

export interface SeasonInfo {
  season: number;
  build?: number;
  netcl?: string | undefined;
  buildUpdate: number | string;
  lobby: string;
  SeasonX: string;
}
