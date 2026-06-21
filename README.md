# skinapi-js

Tiny zero-dependency JavaScript/Node client for [SkinAPI](https://skinapi.skinvaults.online) - real-time **CS2 / Dota 2 / Rust / TF2** skin prices, **float values**, Steam **inventories & profiles**, and multi-marketplace data through one REST API.

- Real-time prices aggregated across marketplaces
- CS2 float values, paint seed and wear
- Steam inventories, profiles and price history
- Free tier - get a key in ~2 minutes

## Install

```bash
npm install skinapi-js
```

Requires Node 18+ (uses the built-in `fetch`).

## Get a key

1. Sign in with Steam: https://skinapi.skinvaults.online/api/auth/steam
2. Create a key in your [dashboard](https://skinapi.skinvaults.online/dashboard)

## Usage

```js
import { SkinAPI } from "skinapi-js";

const api = new SkinAPI("sk_live_your_key");

// Aggregated price for one item
const price = await api.itemPrice("AK-47 | Redline (Field-Tested)", { game: "cs2", currency: "USD" });

// Compare price across marketplaces
const markets = await api.markets("AK-47 | Redline (Field-Tested)", { game: "cs2" });

// Float value, paint seed and wear from a Steam inspect link
const float = await api.float("STEAM_INSPECT_LINK");

// Steam profile and bans
const profile = await api.profile("STEAM_ID_OR_VANITY");

// Priced Steam inventory
const inventory = await api.inventory("STEAM_ID", { game: "cs2", prices: true });
```

Errors throw a `SkinAPIError` with `.status` and `.code`:

```js
import { SkinAPIError } from "skinapi-js";

try {
  await api.itemPrice("Nonexistent Item");
} catch (e) {
  if (e instanceof SkinAPIError) console.error(e.status, e.code, e.message);
}
```

## Methods

| Method | Endpoint |
| --- | --- |
| `itemPrice(name, opts)` | `GET /items` |
| `itemMeta(name)` | `GET /items/meta` |
| `search(q, opts)` | `GET /items/search` |
| `catalog(opts)` | `GET /catalog` |
| `history(name, opts)` | `GET /history` |
| `markets(name, opts)` | `GET /markets` |
| `marketsBatch(names, opts)` | `POST /markets/batch` |
| `deals(opts)` | `GET /deals` |
| `float(inspectUrl)` | `GET /float` |
| `floatLeaderboard(name, opts)` | `GET /float/leaderboard` |
| `profile(idOrVanity)` | `GET /profile` |
| `friendlist(steamId)` | `GET /friendlist` |
| `inventory(steamId, opts)` | `GET /inventory` |
| `inventoryHistory(steamId, opts)` | `GET /inventory/history` |
| `inventoryBatch(steamIds, opts)` | `POST /inventory/batch` |
| `tradeup(items)` | `POST /tradeup` |
| `status()` | `GET /status` |

Authentication uses the `x-api-key` header. Games: `cs2`, `dota2`, `rust`, `tf2`.

## Batch & tools

```js
// Price many items in one call
const many = await api.marketsBatch([
  "AK-47 | Redline (Field-Tested)",
  "AWP | Asiimov (Field-Tested)",
], { game: "cs2" });

// Trade-up calculator (exactly 10 inputs)
const result = await api.tradeup([
  { name: "...", float: 0.12 }, /* x10 */
]);

// Search + catalog
const hits = await api.search("asiimov", { limit: 10 });
const page = await api.catalog({ game: "cs2", limit: 50, sort: "price", prices: true });
```

## Advanced options

```js
const api = new SkinAPI("sk_live_...", {
  timeoutMs: 10000,   // per-request timeout (default 15000)
  maxRetries: 3,      // retries on 429/5xx/network with backoff (default 2)
  baseUrl: "https://skinapi.skinvaults.online/api/v1",
});

await api.itemPrice("AK-47 | Redline (Field-Tested)");

// Inspect your remaining quota after any call
console.log(api.rateLimit); // { remainingMinute, remainingDay, reset }
```

The client automatically retries rate-limited (`429`) and server (`5xx`) responses with
exponential backoff, honoring `Retry-After` / `X-RateLimit-Reset`.

## Links

- Docs: https://skinapi.skinvaults.online/docs
- OpenAPI spec: https://skinapi.skinvaults.online/api/v1/openapi.json
- Pricing: https://skinapi.skinvaults.online/pricing
- Discord: https://discord.gg/CqVnGdGc4Q

## License

MIT
