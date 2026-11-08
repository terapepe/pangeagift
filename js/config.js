// ============================================================
//  Pangea Gift — site configuration
//  Edit this file to update contract addresses, socials and rewards.
// ============================================================
window.PANGEA_CONFIG = {
  // Site mode: "single" = only singleChain (Robinhood) · "multi" = all chains below
  mode: "single",
  singleChain: "robinhood",

  token: {
    name: "Pangea Gift",
    symbol: "$GIFT",
  },

  socials: {
    x: "PangeaGift", // X handle without "@"
  },

  // $GIFT contract addresses — edit ONLY here. Leave "" until published → "Contract coming soon".
  //   evm = one CA shared by every EVM chain (Robinhood, Base, BSC) · sol = Solana mint
  contracts: {
    evm: "0x407f21dca54cf094cf913371e1ffd61805fe9a07",
    sol: "",
  },

  // Network used to read balances. Replace RPC with your own for production.
  // Order = display order. CA comes from contracts.evm (EVM chains) / contracts.sol (Solana).
  chains: {
    robinhood: { label: "Robinhood Chain", chainId: 4663, rpc: "https://rpc.mainnet.chain.robinhood.com", explorer: "https://robinhoodchain.blockscout.com/token/" },
    solana:    { label: "Solana", type: "solana", rpc: "https://api.mainnet-beta.solana.com", explorer: "https://solscan.io/token/" },
    base:      { label: "Base", chainId: 8453, rpc: "https://mainnet.base.org", explorer: "https://basescan.org/token/" },
    bsc:       { label: "BNB Smart Chain", chainId: 56, rpc: "https://bsc-dataseed.bnbchain.org", explorer: "https://bscscan.com/token/" },
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
