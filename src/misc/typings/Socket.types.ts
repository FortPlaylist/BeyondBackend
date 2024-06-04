import WebSocket from "ws";
import { v4 as uuid } from "uuid";
import { ServerWebSocket } from "bun";
import { AuthorizationPayload } from "../../services/matchmaker/utils/Authentication";

interface Client {
  socket: ServerWebSocket<beyondSocket>;
  accountId: string;
  displayName: string;
  token: string;
  jid: string;
  resource: string;
  lastPresenceUpdate: LastPresenceUpdate;
}

interface LastPresenceUpdate {
  away: boolean;
  status: string;
}

export interface Payload {
  accountId: string;
  timestamp: string;
  accessToken: string;
  playlist: string;
  buildId: string;
  region: string;
  customKey: string;
  userAgent: string;
  modeType: string;
  sessionId: string;
  matchId: string;
}

export type SocketData = {
  socketKey: string;
  rawBody: string;
  payload: Payload;
};

export interface beyondSocket extends ServerWebSocket {
  isAuthenticated?: boolean;
  accountId?: string;
  token?: string;
  displayName?: string;
  jid?: string;
  resource?: string;
  key?: string;
  socket?: ServerWebSocket<beyondSocket> | null;
}

interface MUCMembers {
  accountId: string;
}

export const Clients: Client[] = [];
export const accountId: string = "";
export const jid: string = "";
export const MUCs: { [key: string]: { members: MUCMembers[] } } = {};
export const clientId: string = uuid().replace(/-/gi, "");
export const Party: { [key: string]: any } = [];

export const matchId: string = uuid().replace(/-/gi, "");
export const sessionId: string = uuid().replace(/-/gi, "");

export interface Clients {
  accountId: string;
  socket: ServerWebSocket<SocketData>;
  ticketId: string;
  matchId: string;
  sessionId: string;
  isUpdated?: boolean;
}

export interface Queues extends Payload {
  clients: Clients[];
}

export interface GameServerSession {
  ip: string;
  canQueueIntoMatch: boolean;
  port: number;
  region: string;
  playlist: string;
  customKey: boolean;
  matchId: string;
}

export interface Session {
  sessionId: string;
  matchId: string;
}

const ticketId = uuid().replace(/-/gi, "");
const partyRevision: number = 0;

const activeConnection: boolean = false;
const JoinedMUCs: any[] = [];
const playerCount: { [key: string]: any } = {};
const Queues: Queues[] = [];
const client: Clients[] = [];

const GameServerSession: GameServerSession[] = [];
const Session: Session[] = [];

export const SavedContent = {
  activeConnection,
  JoinedMUCs,
  partyRevision,
  ticketId,
  sessionId,
  playerCount,
  client,
  Queues,
  GameServerSession,
  Session,
};
