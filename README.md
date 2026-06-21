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
| `markets(name, opts)` | `GET /markets` |
| `float(inspectUrl)` | `GET /float` |
| `floatLeaderboard(name, opts)` | `GET /float/leaderboard` |
| `profile(idOrVanity)` | `GET /profile` |
| `inventory(steamId, opts)` | `GET /inventory` |

Authentication uses the `x-api-key` header. Games: `cs2`, `dota2`, `rust`, `tf2`.

## Links

- Docs: https://skinapi.skinvaults.online/docs
- OpenAPI spec: https://skinapi.skinvaults.online/api/v1/openapi.json
- Pricing: https://skinapi.skinvaults.online/pricing
- Discord: https://discord.gg/CqVnGdGc4Q

## License

MIT
