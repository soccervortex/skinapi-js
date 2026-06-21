// Run: SKINAPI_KEY=sk_live_... node examples/price.mjs
import { SkinAPI } from "../src/index.mjs";

const api = new SkinAPI(process.env.SKINAPI_KEY);

// Aggregated price for one item
const price = await api.itemPrice("AK-47 | Redline (Field-Tested)", { game: "cs2", currency: "USD" });
console.log("Price:", price);

// Compare across marketplaces
const markets = await api.markets("AK-47 | Redline (Field-Tested)", { game: "cs2" });
console.log("Lowest:", markets.lowest, "from", markets.lowestSource);

// Float from a Steam inspect link
// const float = await api.float("steam://rungame/730/.../+csgo_econ_action_preview ...");
// console.log("Float:", float);
