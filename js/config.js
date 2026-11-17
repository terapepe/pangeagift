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

/* ---- hybot sync: CA, token name, symbol, X and Telegram follow the newest token hybot launched for this site ----
   https://hybot.xyz/api/site-token?site=<domain> · values above are the fallback when hybot has none / is unreachable.
   Links in the page that point to the old X / Telegram are updated, or hidden when the launched token has none. */
(function (C) {
  if (!C || typeof window === "undefined") return;
  var DOMAIN = "pangeagift.xyz";
  var host = String(location.hostname || "").replace(/^www\./, "");
  var site = /\./.test(host) && !/(^|\.)(vercel\.app|localhost|127\.0\.0\.1)$/.test(host) ? host : DOMAIN;
  if (!site) return;
  var d = null, key = "hybot:" + site;
  try { var c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 60000) d = c.d; } catch (e) {}
  if (!d) {
    try {
      var x = new XMLHttpRequest();
      x.open("GET", "https://hybot.xyz/api/site-token?site=" + encodeURIComponent(site), false); // sync: config must be ready before the app scripts run
      x.send();
      if (x.status === 200) { d = JSON.parse(x.responseText); try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
    } catch (e) {}
  }
  if (!d || !d.found || !/^0x[0-9a-fA-F]{40}$/.test(d.ca || "")) return;
  var handle = function (u) { var m = String(u || "").match(/(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})|^@?([A-Za-z0-9_]{1,15})$/); return m ? (m[1] || m[2]) : ""; };
  var tgName = function (u) { var m = String(u || "").match(/t\.me\/([\w+/-]+)/); return m ? m[1].replace(/\/+$/, "") : String(u || "").replace(/^@/, ""); };
  var X0 = C.socials && C.socials.x || "", TG0 = C.socials && C.socials.telegram || "";
  var oldX = handle(X0), oldTg = tgName(TG0);
  var X = d.x || "", TG = d.telegram || "", SYM = d.symbol, NAME = d.name, CA = d.ca;
  // no X / Telegram on the launched token → config keeps the old link so the app renders as usual, and the link fixer below hides it
  var XV = X || X0, TGV = TG || TG0, XH = handle(XV);
  // single-network per-chain CA overrides would win over the shared address → clear them
  var net = C.singleNetwork || C.singleChain || (C.token && C.token.singleNetwork);
  [C.networks, C.chains, C.token && C.token.chains].forEach(function (m) { if (m && net && m[net] && "ca" in m[net]) m[net].ca = ""; });
  C.token.name = NAME; C.token.symbol = "$" + SYM;
  C.socials = C.socials || {}; C.socials.x = XV; C.socials.telegram = TGV;
  C.contracts.evm = CA;
  // page links still pointing to the old X / Telegram (hard-coded or rendered later)
  var fix = function (root) {
    var as = root.querySelectorAll ? root.querySelectorAll("a[href]") : [];
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute("href") || "";
      if (oldX && new RegExp("(x|twitter)\\.com/@?" + oldX + "(?![A-Za-z0-9_])", "i").test(h) && !/intent|share/i.test(h)) {
        if (X) { if (h !== X) { a.href = X; if (XH && oldX !== XH) a.innerHTML = a.innerHTML.split("@" + oldX).join("@" + XH); } }
        else a.style.display = "none";
      } else if (oldTg && /t\.me\//i.test(h) && tgName(h).toLowerCase() === oldTg.toLowerCase()) {
        if (TG) { if (h !== TG) a.href = TG; } else a.style.display = "none";
      }
    }
  };
  var start = function () { fix(document); new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { fix(n); if (n.matches && n.matches("a[href]")) fix(n.parentNode || n); } }); }); }).observe(document.documentElement, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(window.PANGEA_CONFIG);
