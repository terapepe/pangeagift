window.PANGEA_CONFIG = {
  // Site : "single" · "multi"
  mode: "multi",
  singleChain: "robinhood", // robinhood | solana | base | bsc
  multiOrder: ["solana", "robinhood", "base", "bsc"],

  token: {
    name: "Pangea Gift",
    symbol: "$GIFT",
  },

  socials: {
    x: "https://x.com/dropperdeals/status/2119840152423968781", // X handle without "@"
  },

  contracts: {
    evm: "",
    sol: "",
  },

  chains: {
    robinhood: { label: "Robinhood Chain", short: "RH", color: "#c8ff3d", tagline: "Fast, low-fee L2 built for trading", chainId: 4663, rpc: "https://rpc.mainnet.chain.robinhood.com", explorer: "https://robinhoodchain.blockscout.com/token/", ca: "" },
    solana:    { label: "Solana", short: "SOL", color: "#9945ff", tagline: "Lightning-fast and meme-native", type: "solana", rpc: "https://api.mainnet-beta.solana.com", explorer: "https://solscan.io/token/", ca: "" },
    base:      { label: "Base", short: "BASE", color: "#0052ff", tagline: "Onchain with the Base community", chainId: 8453, rpc: "https://mainnet.base.org", explorer: "https://basescan.org/token/", ca: "" },
    bsc:       { label: "BNB Smart Chain", short: "BSC", color: "#f0b90b", tagline: "Degen energy on BNB Smart Chain", chainId: 56, rpc: "https://bsc-dataseed.bnbchain.org", explorer: "https://bscscan.com/token/", ca: "" },
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
