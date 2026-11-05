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

  // Contract addresses. Leave "" until published — the site shows "Coming soon".
  // Base, Robinhood Chain and BNB Chain share the same EVM address.
  contracts: {
    evm: "0x",
    solana: "",
  },

  // Networks used to read balances. Replace RPCs with your own (Alchemy/QuickNode…) for production.
  chains: {
    base:      { label: "Base",            chainId: 8453, rpc: "https://mainnet.base.org",                 explorer: "https://basescan.org/token/" },
    robinhood: { label: "Robinhood Chain", chainId: 4663, rpc: "https://rpc.mainnet.chain.robinhood.com",  explorer: "https://robinhoodchain.blockscout.com/token/" },
    bsc:       { label: "BNB Chain",       chainId: 56,   rpc: "https://bsc-dataseed.bnbchain.org",         explorer: "https://bscscan.com/token/" },
    solana:    { label: "Solana",                         rpc: "https://api.mainnet-beta.solana.com",       explorer: "https://solscan.io/token/" },
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
  // Expected shape: { "updatedAt": "ISO date", "holders": [{ "address": "0x…", "chain": "base", "balance": "123.45" }] }
  leaderboardUrl: "",
};
