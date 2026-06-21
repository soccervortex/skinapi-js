/**
 * skinapi-js - zero-dependency client for SkinAPI.
 * Real-time CS2/Dota2/Rust/TF2 skin prices, float values, inventories,
 * profiles and marketplace data.
 *
 * Docs: https://skinapi.skinvaults.online/docs
 */

const DEFAULT_BASE = "https://skinapi.skinvaults.online/api/v1";

const num = (v) => (v == null || v === "" ? undefined : Number(v));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class SkinAPIError extends Error {
  constructor(status, code, message, { retryable = false } = {}) {
    super(message || `SkinAPI error ${status}`);
    this.name = "SkinAPIError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export class SkinAPI {
  /**
   * @param {string} apiKey  Your key (sk_live_...), created in the dashboard.
   * @param {{ baseUrl?: string, fetch?: typeof fetch, timeoutMs?: number, maxRetries?: number }} [opts]
   */
  constructor(apiKey, opts = {}) {
    if (!apiKey) throw new Error("SkinAPI: apiKey is required");
    this.apiKey = apiKey;
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE).replace(/\/+$/, "");
    this._fetch = opts.fetch || globalThis.fetch;
    if (!this._fetch) throw new Error("SkinAPI: no global fetch - upgrade to Node 18+ or pass opts.fetch");
    this.timeoutMs = opts.timeoutMs ?? 15000;
    this.maxRetries = opts.maxRetries ?? 2;
    /** Rate-limit info from the most recent response, or null. */
    this.rateLimit = null;
  }

  /** Backoff with jitter: 0.5s, 1s, 2s ... */
  _backoffMs(attempt) {
    return Math.round((2 ** attempt) * 500 * (0.8 + Math.random() * 0.4));
  }

  _retryAfterMs(res) {
    const ra = res.headers.get("retry-after");
    if (ra && !Number.isNaN(Number(ra))) return Number(ra) * 1000;
    const reset = num(res.headers.get("X-RateLimit-Reset"));
    if (reset) {
      const ms = reset > 1e12 ? reset - Date.now() : reset * 1000 - Date.now();
      if (ms > 0 && ms < 60_000) return ms;
    }
    return null;
  }

  async _request(method, path, { params, body } = {}) {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    const headers = { "x-api-key": this.apiKey };
    if (body !== undefined) headers["content-type"] = "application/json";
    const payload = body !== undefined ? JSON.stringify(body) : undefined;

    for (let attempt = 0; ; attempt++) {
      const ctrl = new AbortController();
      const timer = this.timeoutMs ? setTimeout(() => ctrl.abort(), this.timeoutMs) : null;
      let res;
      try {
        res = await this._fetch(url, { method, headers, body: payload, signal: ctrl.signal });
      } catch (err) {
        if (timer) clearTimeout(timer);
        if (attempt < this.maxRetries) { await sleep(this._backoffMs(attempt)); continue; }
        throw new SkinAPIError(0, "network_error", err?.message || "Network error", { retryable: true });
      } finally {
        if (timer) clearTimeout(timer);
      }

      this.rateLimit = {
        remainingMinute: num(res.headers.get("X-RateLimit-Remaining-Minute")),
        remainingDay: num(res.headers.get("X-RateLimit-Remaining-Day")),
        reset: num(res.headers.get("X-RateLimit-Reset")),
      };

      if ((res.status === 429 || res.status >= 500) && attempt < this.maxRetries) {
        await sleep(this._retryAfterMs(res) ?? this._backoffMs(attempt));
        continue;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const e = data?.error ?? {};
        throw new SkinAPIError(res.status, e.code, e.message, {
          retryable: res.status === 429 || res.status >= 500,
        });
      }
      return data.data ?? data;
    }
  }

  /** Raw GET returning the response `data`. */
  get(path, params) { return this._request("GET", path, { params }); }
  /** Raw POST returning the response `data`. */
  post(path, body) { return this._request("POST", path, { body }); }

  // --- Prices ---
  /** Aggregated price for one item. */
  itemPrice(name, { game = "cs2", currency = "USD" } = {}) {
    return this.get("/items", { name, game, currency });
  }
  /** Metadata for one item (image, rarity, type, ...). */
  itemMeta(name) {
    return this.get("/items/meta", { name });
  }
  /** Search items by free-text query. */
  search(q, { limit = 20 } = {}) {
    return this.get("/items/search", { q, limit });
  }
  /** Browse/paginate the item catalog with filters. */
  catalog({ game = "cs2", limit, offset, q, type, rarity, prices, sort, currency = "USD" } = {}) {
    return this.get("/catalog", { game, limit, offset, q, type, rarity, prices, sort, currency });
  }
  /** Price history for an item (last N days). */
  history(name, { game = "cs2", days = 30, currency = "USD" } = {}) {
    return this.get("/history", { name, game, days, currency });
  }

  // --- Marketplaces ---
  /** Compare an item's price across marketplaces. */
  markets(name, { game = "cs2", currency = "USD" } = {}) {
    return this.get("/markets", { name, game, currency });
  }
  /** Compare many items at once (max per request applies). */
  marketsBatch(names, { game = "cs2", currency = "USD" } = {}) {
    return this.post("/markets/batch", { names, game, currency });
  }
  /** Current deals (discounted listings). */
  deals({ game = "cs2", minDiscount, currency = "USD" } = {}) {
    return this.get("/deals", { game, min_discount: minDiscount, currency });
  }

  // --- Floats ---
  /** Float value, paint seed and wear from a Steam inspect link. */
  float(inspectUrl) {
    return this.get("/float", { url: inspectUrl });
  }
  /** Lowest/highest floats of an item. */
  floatLeaderboard(name, { order = "asc", limit = 10 } = {}) {
    return this.get("/float/leaderboard", { name, order, limit });
  }

  // --- Steam ---
  /** Steam profile, level, CS2 stats and bans. */
  profile(idOrVanity) {
    return this.get("/profile", { id: idOrVanity });
  }
  /** A Steam user's friend list. */
  friendlist(steamId) {
    return this.get("/friendlist", { steam_id: steamId });
  }
  /** Steam inventory, optionally priced. */
  inventory(steamId, { game = "cs2", prices = true, currency = "USD" } = {}) {
    return this.get("/inventory", { steam_id: steamId, game, prices, currency });
  }
  /** Inventory value history (last N days). */
  inventoryHistory(steamId, { game = "cs2", days = 30, currency = "USD" } = {}) {
    return this.get("/inventory/history", { steam_id: steamId, game, days, currency });
  }
  /** Multiple inventories at once. */
  inventoryBatch(steamIds, { game = "cs2" } = {}) {
    return this.post("/inventory/batch", { steam_ids: steamIds, game });
  }

  // --- Tools ---
  /** Trade-up contract calculator. Pass exactly 10 { name, float } inputs. */
  tradeup(items) {
    return this.post("/tradeup", { items });
  }
  /** Public API status (no key required). */
  status() {
    return this.get("/status");
  }
}

export default SkinAPI;
