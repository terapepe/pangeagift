// ============================================================
//  Pangea Gift — site configuration
//  Edit this file to update contract addresses, socials and rewards.
// ============================================================
window.PANGEA_CONFIG = {
  token: {
    name: "Pangea Gift",
    symbol: "$GIFT",
  },

  socials: {
    x: "PangeaGift", // X handle without "@"
  },

  // Contract address on Robinhood Chain. Leave "" until published — the site shows "Coming soon".
  contracts: {
    evm: "0x167b40dab3f334d0445e07f4ec00cef89e50a7c0",
  },

  // Network used to read balances. Replace RPC with your own for production.
  chains: {
    robinhood: { label: "Robinhood Chain", chainId: 4663, rpc: "https://rpc.mainnet.chain.robinhood.com", explorer: "https://robinhoodchain.blockscout.com/token/" },
  },

  rewards: {
    winnersPerDay: 5,
    current: "PlayStation",   // today's gift card brand (must match a name in `brands`)
    value: "",                // optional, e.g. "$50" — hidden when empty
    timezone: "America/New_York",
    brands: [
      "Amazon", "Visa", "Walmart", "Apple", "Target", "Starbucks", "Steam",
      "PlayStation", "Xbox", "Google Play", "Roblox", "Nintendo", "DoorDash",
      "Uber Eats", "Netflix", "Sephora", "Disney", "Chipotle", "Chick-fil-A",
    ],
  },

  // JSON endpoint for the daily Top 5 (added later with the backend). Leave "" until ready.
  // Expected shape: { "updatedAt": "ISO date", "holders": [{ "address": "0x…", "chain": "robinhood", "balance": "123.45" }] }
  leaderboardUrl: "",
};
