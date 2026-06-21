/**
 * skinapi-js - tiny zero-dependency client for SkinAPI.
 * Docs: https://skinapi.skinvaults.online/docs
 */

const DEFAULT_BASE = "https://skinapi.skinvaults.online/api/v1";

export class SkinAPIError extends Error {
  constructor(status, code, message) {
    super(message || `SkinAPI error ${status}`);
    this.name = "SkinAPIError";
    this.status = status;
    this.code = code;
  }
}

export class SkinAPI {
  /**
   * @param {string} apiKey  Your key (sk_live_...), created in the dashboard.
   * @param {{ baseUrl?: string, fetch?: typeof fetch }} [opts]
   */
  constructor(apiKey, opts = {}) {
    if (!apiKey) throw new Error("SkinAPI: apiKey is required");
    this.apiKey = apiKey;
    this.baseUrl = opts.baseUrl || DEFAULT_BASE;
    this._fetch = opts.fetch || globalThis.fetch;
    if (!this._fetch) throw new Error("SkinAPI: no fetch available - pass opts.fetch on older Node");
  }

  /** Low-level GET against an endpoint with query params. Returns the `data` field. */
  async get(path, params = {}) {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    const res = await this._fetch(url, { headers: { "x-api-key": this.apiKey } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = body?.error ?? {};
      throw new SkinAPIError(res.status, e.code, e.message);
    }
    return body.data ?? body;
  }

  /** Aggregated price for one item. */
  itemPrice(name, { game = "cs2", currency = "USD" } = {}) {
    return this.get("/items", { name, game, currency });
  }

  /** Compare an item's price across marketplaces. */
  markets(name, { game = "cs2", currency = "USD" } = {}) {
    return this.get("/markets", { name, game, currency });
  }

  /** Float value, paint seed and wear from a Steam inspect link. */
  float(inspectUrl) {
    return this.get("/float", { url: inspectUrl });
  }

  /** Lowest/highest floats of an item. */
  floatLeaderboard(name, { order = "asc", limit = 10 } = {}) {
    return this.get("/float/leaderboard", { name, order, limit });
  }

  /** Steam profile, level, CS2 stats and bans. */
  profile(idOrVanity) {
    return this.get("/profile", { id: idOrVanity });
  }

  /** Steam inventory, optionally priced. */
  inventory(steamId, { game = "cs2", prices = true, currency = "USD" } = {}) {
    return this.get("/inventory", { steam_id: steamId, game, prices, currency });
  }
}

export default SkinAPI;
