window.PANGEA_CONFIG = {
  mode: "single",
  singleChain: "robinhood", // robinhood | solana | base | bsc
  multiOrder: ["solana", "robinhood", "base", "bsc"],

  token: {
    name: "Pangea Gift",
    symbol: "$GIFT",
  },

  socials: {
    x: "https://x.com/dropperdeals/", 
  },

  contracts: {
    evm: "",
    sol: "",
  },

  chains: {
    robinhood: { label: "Robinhood Chain", short: "RH", color: "#c8ff3d", tagline: "Fast, low-fee L2 built for trading", chainId: 4663, rpc: "https://rpc.mainnet.chain.robinhood.com", explorer: "https://robinhoodchain.blockscout.com/token/", txExplorer: "https://robinhoodchain.blockscout.com/tx/", nativeSymbol: "ETH", ca: "" },
    solana:    { label: "Solana", short: "SOL", color: "#9945ff", tagline: "Lightning-fast and meme-native", type: "solana", rpc: "https://api.mainnet-beta.solana.com", explorer: "https://solscan.io/token/", ca: "" },
    base:      { label: "Base", short: "BASE", color: "#0052ff", tagline: "Onchain with the Base community", chainId: 8453, rpc: "https://mainnet.base.org", explorer: "https://basescan.org/token/", txExplorer: "https://basescan.org/tx/", nativeSymbol: "ETH", ca: "" },
    bsc:       { label: "BNB Smart Chain", short: "BSC", color: "#f0b90b", tagline: "Degen energy on BNB Smart Chain", chainId: 56, rpc: "https://bsc-dataseed.bnbchain.org", explorer: "https://bscscan.com/token/", txExplorer: "https://bscscan.com/tx/", nativeSymbol: "BNB", ca: "" },
  },

  rewards: {
    winnersPerDay: 5,
    current: "PlayStation",
    value: "",
    timezone: "America/New_York",
    brands: [
      "Amazon", "Visa", "Walmart", "Apple", "Target", "Starbucks", "Steam",
      "PlayStation", "Xbox", "Google Play", "Roblox", "Nintendo", "DoorDash",
      "Uber Eats", "Netflix", "Sephora", "Disney", "Chipotle", "Chick-fil-A",
    ],
  },

  staking: {
    chain: "robinhood",         // EVM chain key from `chains`
    address: "",                // staking contract address
    historyBlocks: 2000000,     // how far back to scan RewardPaid / Staked / Withdrawn events
    logChunk: 50000,            // eth_getLogs block range per request
  },

  mysteryBox: {
    chain: "robinhood",
    address: "",
    historyBlocks: 2000000,
    logChunk: 50000,
  },

  // Lucky Draw Isle — spin(), cost paid in $GIFT, wheel segments read from the contract
  luckyDraw: {
    chain: "robinhood",
    address: "",
    historyBlocks: 2000000,
    logChunk: 50000,
  },
};
