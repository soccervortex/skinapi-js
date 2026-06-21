export type Game = "cs2" | "dota2" | "rust" | "tf2" | (string & {});

export interface SkinAPIOptions {
  /** Override the base URL (default: https://skinapi.skinvaults.online/api/v1). */
  baseUrl?: string;
  /** Custom fetch implementation (for older Node or testing). */
  fetch?: typeof fetch;
  /** Per-request timeout in ms (default 15000). */
  timeoutMs?: number;
  /** Retries on 429/5xx/network errors (default 2). */
  maxRetries?: number;
}

export interface RateLimit {
  remainingMinute?: number;
  remainingDay?: number;
  reset?: number;
}

export class SkinAPIError extends Error {
  status: number;
  code?: string;
  retryable: boolean;
}

export interface PriceOptions { game?: Game; currency?: string }
export interface SearchOptions { limit?: number }
export interface CatalogOptions {
  game?: Game; limit?: number; offset?: number; q?: string;
  type?: string; rarity?: string; prices?: boolean; sort?: string; currency?: string;
}
export interface HistoryOptions { game?: Game; days?: number; currency?: string }
export interface DealsOptions { game?: Game; minDiscount?: number; currency?: string }
export interface FloatLeaderboardOptions { order?: "asc" | "desc"; limit?: number }
export interface InventoryOptions { game?: Game; prices?: boolean; currency?: string }
export interface TradeupItem { name: string; float: number }

export class SkinAPI {
  constructor(apiKey: string, opts?: SkinAPIOptions);

  /** Rate-limit info from the most recent response, or null. */
  rateLimit: RateLimit | null;

  get<T = any>(path: string, params?: Record<string, unknown>): Promise<T>;
  post<T = any>(path: string, body?: unknown): Promise<T>;

  itemPrice<T = any>(name: string, opts?: PriceOptions): Promise<T>;
  itemMeta<T = any>(name: string): Promise<T>;
  search<T = any>(q: string, opts?: SearchOptions): Promise<T>;
  catalog<T = any>(opts?: CatalogOptions): Promise<T>;
  history<T = any>(name: string, opts?: HistoryOptions): Promise<T>;

  markets<T = any>(name: string, opts?: PriceOptions): Promise<T>;
  marketsBatch<T = any>(names: string[], opts?: PriceOptions): Promise<T>;
  deals<T = any>(opts?: DealsOptions): Promise<T>;

  float<T = any>(inspectUrl: string): Promise<T>;
  floatLeaderboard<T = any>(name: string, opts?: FloatLeaderboardOptions): Promise<T>;

  profile<T = any>(idOrVanity: string): Promise<T>;
  friendlist<T = any>(steamId: string): Promise<T>;
  inventory<T = any>(steamId: string, opts?: InventoryOptions): Promise<T>;
  inventoryHistory<T = any>(steamId: string, opts?: HistoryOptions): Promise<T>;
  inventoryBatch<T = any>(steamIds: string[], opts?: { game?: Game }): Promise<T>;

  tradeup<T = any>(items: TradeupItem[]): Promise<T>;
  status<T = any>(): Promise<T>;
}

export default SkinAPI;
