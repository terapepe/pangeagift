// Gift Dream World — wallet, balances, Top 5 countdown, and the island dApps.
// Every number shown comes from config, the blockchain or the leaderboard endpoint. Nothing is simulated.
import { ethers } from "./vendor/ethers.min.js";

const C = window.PANGEA_CONFIG;
const $ = (id) => document.getElementById(id);

// ================= chain mode =================
const SINGLE = C.mode !== "multi";
const ALL = [...new Set([...(C.multiOrder || []), ...Object.keys(C.chains)])].filter((k) => C.chains[k]);
const ACTIVE = SINGLE ? [C.chains[C.singleChain] ? C.singleChain : ALL[0]] : ALL;
const isSol = (k) => C.chains[k].type === "solana";
const EVM_CHAINS = ACTIVE.filter((k) => !isSol(k));
const SOL_CHAINS = ACTIVE.filter(isSol);
const caOf = (k) => (C.chains[k].ca || (isSol(k) ? C.contracts.sol : C.contracts.evm) || "").trim();
const CA_GROUPS = ACTIVE.reduce((acc, k) => {
  const ca = caOf(k), id = ca ? ca.toLowerCase() : k, g = acc.find((x) => x.id === id);
  g ? g.keys.push(k) : acc.push({ id, ca, keys: [k] });
  return acc;
}, []);
const names = (keys) => keys.map((k) => C.chains[k].label).join(", ").replace(/, ([^,]*)$/, " and $1");
const MAIN = ACTIVE[0];
const SOL_WALLETS = [
  { name: "Phantom", get: () => window.phantom?.solana?.isPhantom ? window.phantom.solana : (window.solana?.isPhantom ? window.solana : null) },
  { name: "Solflare", get: () => window.solflare?.isSolflare ? window.solflare : null },
  { name: "Backpack", get: () => window.backpack?.solana || null },
];
const state = { kind: null, address: null, provider: null, evmProviders: [] };
const PASTEL = ["#ffd1e8", "#d9ccff", "#c9efff", "#fff1b8", "#ffc4df", "#cbbcff", "#d3f6ea", "#ffe6c7"];

// ================= helpers =================
const short = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");
const fmt = (n, d = 2) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function toast(msg, link) {
  const t = $("toast");
  t.innerHTML = esc(msg) + (link ? ` <a href="${link}" target="_blank" rel="noopener">View tx ↗</a>` : "");
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 5000);
}
const errMsg = (e) => e?.shortMessage || e?.info?.error?.message || e?.reason || e?.message || "Something went wrong";
const xRaw = String(C.socials.x || "").trim();
const xIsUrl = /^(https?:\/\/)?(www\.|mobile\.)?(x|twitter)\.com\//i.test(xRaw);
const xHandle = xIsUrl ? (xRaw.replace(/^(https?:\/\/)?(www\.|mobile\.)?(x|twitter)\.com\//i, "").split(/[/?#]/)[0] || "") : xRaw.replace(/^@/, "");
const xUrl = xIsUrl ? (/^https?:\/\//i.test(xRaw) ? xRaw : "https://" + xRaw) : "https://x.com/" + xHandle;

// ================= texts depending on mode =================
function applyMode() {
  document.body.dataset.mode = SINGLE ? "single" : "multi";
  $("evmChainsLabel").textContent = names(EVM_CHAINS);
  $("btnEvm").classList.toggle("hidden", !EVM_CHAINS.length);
  $("btnSol").classList.toggle("hidden", !SOL_CHAINS.length);
  const ch = C.chains[MAIN], sol = isSol(MAIN);
  const fill = (t) => t.replaceAll("{chains}", names(ACTIVE)).replaceAll("{n}", ACTIVE.length)
    .replaceAll("{chain}", ch.label).replaceAll("{short}", ch.short || ch.label)
    .replaceAll("{walletType}", sol ? "Solana" : "EVM")
    .replaceAll("{walletHint}", sol ? "Phantom, Solflare or Backpack" : "any EVM wallet (MetaMask, Rabby, Coinbase Wallet…)");
  const m = SINGLE ? "single" : "multi";
  document.querySelectorAll(`[data-${m}]`).forEach((el) => (el.textContent = fill(el.dataset[m])));
  if (SINGLE && ch.tagline) { $("chainTagline").textContent = ch.tagline; $("chainTagline").classList.remove("hidden"); }
}

function renderStatic() {
  ["xLinkHero", "xLinkFaq", "xLinkCta", "xLinkFoot"].forEach((id) => ($(id).href = xUrl));
  $("xLinkCta").textContent = xHandle ? "@" + xHandle : "Follow on X";
  $("year").textContent = new Date().getFullYear();
  $("todayGift").textContent = C.rewards.current + (C.rewards.value ? " · " + C.rewards.value : "") + " Gift Card";
  $("winnersCount").textContent = $("statWinners").textContent = C.rewards.winnersPerDay;
  $("statBrands").textContent = C.rewards.brands.length;

  $("heroCas").innerHTML = CA_GROUPS.map(({ ca, keys }) => {
    const tag = keys.map((k) => C.chains[k].short || C.chains[k].label).join(" · ");
    const links = ca ? keys.map((k) => `<a href="${C.chains[k].explorer}${ca}" target="_blank" rel="noopener">${C.chains[k].short} ↗</a>`).join("") : "";
    return `<div class="ca${ca ? "" : " off"}" ${ca ? `data-copy="${ca}" title="Click to copy"` : ""}>
      <span class="ca-tag">${tag}</span><code>${ca ? short(ca) : "coming soon"}</code>
      ${ca ? `<span class="ca-copy" data-text="Copy">Copy</span>` : ""}<span class="ca-links">${links}</span></div>`;
  }).join("");

  $("brands").innerHTML = C.rewards.brands.map((b) => {
    const on = b === C.rewards.current;
    return `<div class="brand-bubble${on ? " on" : ""}"><span>${esc(b)}</span>${on ? "<em>tonight</em>" : ""}</div>`;
  }).join("");

  $("chainCards").innerHTML = ACTIVE.map((key) => {
    const ch = C.chains[key], ca = caOf(key);
    return `<div class="chain" style="--c:${ch.color}"><i></i><h4>${ch.label}</h4>${ca
      ? `<code data-copy="${ca}" title="Click to copy">${short(ca)}</code><a href="${ch.explorer}${ca}" target="_blank" rel="noopener">Explorer ↗</a>`
      : `<span class="muted">Contract coming soon</span>`}</div>`;
  }).join("");
}

// ================= countdown to 00:00 New York =================
const tz = C.rewards.timezone;
const partsIn = (date) => {
  const p = {};
  new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(date).forEach((x) => (p[x.type] = +x.value || x.value));
  return p;
};
const tzOffset = (date) => { const p = partsIn(date); return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000; };
const nextMidnight = (now) => {
  const p = partsIn(now);
  const wall = Date.UTC(p.year, p.month - 1, p.day + 1, 0, 0, 0);
  let t = wall - tzOffset(new Date(wall));
  return wall - tzOffset(new Date(t));
};
let target = nextMidnight(new Date());
const pad = (n) => String(n).padStart(2, "0");
function tick() {
  const now = Date.now();
  if (now >= target) target = nextMidnight(new Date(now + 1000));
  const s = Math.max(0, Math.floor((target - now) / 1000));
  $("cdH").textContent = pad(Math.floor(s / 3600));
  $("cdM").textContent = pad(Math.floor((s % 3600) / 60));
  $("cdS").textContent = pad(s % 60);
  const p = partsIn(new Date(now));
  $("nyNow").textContent = `${pad(p.hour)}:${pad(p.minute)}`;
  ISLANDS.forEach((i) => i.tick?.());
}

// ================= token balances (read-only RPC) =================
async function rpc(url, method, params) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}
async function solBalance(k, owner) {
  const r = await rpc(C.chains[k].rpc, "getTokenAccountsByOwner", [owner, { mint: caOf(k) }, { encoding: "jsonParsed" }]);
  return (r?.value || []).reduce((s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
}
async function evmBalance(k, holder) {
  const url = C.chains[k].rpc, ca = caOf(k);
  const data = "0x70a08231" + holder.toLowerCase().replace("0x", "").padStart(64, "0");
  const [raw, dec] = await Promise.all([rpc(url, "eth_call", [{ to: ca, data }, "latest"]), rpc(url, "eth_call", [{ to: ca, data: "0x313ce567" }, "latest"])]);
  if (!raw || raw === "0x") return 0;
  return Number(BigInt(raw)) / 10 ** Number(BigInt(dec));
}
async function loadBalances() {
  const list = $("balList");
  const keys = (state.kind === "sol" ? SOL_CHAINS : EVM_CHAINS).filter((k) => caOf(k));
  if (!keys.length) {
    $("balTotal").textContent = "—";
    list.innerHTML = `<li class="muted">The ${C.token.symbol} contract isn't published on this network yet.</li>`;
    return;
  }
  list.innerHTML = keys.map((k) => `<li id="bal-${k}"><span>${C.chains[k].label}</span><b>…</b></li>`).join("");
  $("balTotal").textContent = "…";
  let total = 0, ok = 0;
  await Promise.all(keys.map(async (k) => {
    const el = $("bal-" + k).querySelector("b");
    try { const v = await (isSol(k) ? solBalance(k, state.address) : evmBalance(k, state.address)); total += v; ok++; el.textContent = fmt(v); }
    catch (e) { el.textContent = "RPC error"; el.title = e.message; }
  }));
  const txt = ok ? fmt(total) + " GIFT" : "Unavailable";
  $("balTotal").textContent = txt;
  $("navBal").textContent = ok ? fmt(total, 0) + " GIFT" : "";
  $("navBal").classList.toggle("hidden", !ok);
}

// ================= Top 5 leaderboard (real endpoint only) =================
async function loadLeaderboard() {
  if (!C.leaderboardUrl) return;
  try {
    const data = await (await fetch(C.leaderboardUrl, { cache: "no-store" })).json();
    if (!data.holders?.length) return;
    $("boardEmpty").classList.add("hidden");
    $("boardList").classList.remove("hidden");
    $("boardList").innerHTML = data.holders.slice(0, C.rewards.winnersPerDay).map((h, i) => {
      if (!ACTIVE.includes(h.chain)) return "";
      const me = state.address && h.address.toLowerCase() === state.address.toLowerCase();
      return `<li class="${me ? "me" : ""}"><span class="rank">${i + 1}</span><code>${short(h.address)}</code><em>${C.chains[h.chain]?.short || h.chain}</em><b>${fmt(h.balance)}</b></li>`;
    }).join("");
    if (data.updatedAt) { $("boardFoot").classList.remove("hidden"); $("boardFoot").textContent = "Updated " + new Date(data.updatedAt).toLocaleString(); }
  } catch (e) { console.warn("Leaderboard unavailable:", e); }
}

// ================= EVM contract plumbing =================
const ERC20 = [
  "function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)", "function symbol() view returns (string)",
  "function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)",
];
const readers = {};
const reader = (k) => (readers[k] ||= new ethers.JsonRpcProvider(C.chains[k].rpc, C.chains[k].chainId, { staticNetwork: true }));
const EIP1967 = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

// "Does this contract implement fn?" — look for the selector in the bytecode (and behind an EIP-1967 proxy).
const codeCache = {};
async function contractCode(k, addr) {
  if (codeCache[addr]) return codeCache[addr];
  const p = reader(k);
  let code = (await p.getCode(addr)).toLowerCase();
  try {
    const slot = await p.getStorage(addr, EIP1967);
    const impl = "0x" + slot.slice(26);
    if (!/^0x0+$/.test(impl)) code += (await p.getCode(impl)).toLowerCase();
  } catch {}
  return (codeCache[addr] = code);
}
const supports = (code, sig) => code.includes(ethers.id(sig).slice(2, 10));

async function walletSigner(k) {
  if (state.kind !== "evm") throw new Error("Connect an EVM wallet to use the islands");
  const ch = C.chains[k], hex = "0x" + ch.chainId.toString(16);
  const cur = await state.provider.request({ method: "eth_chainId" });
  if (parseInt(cur, 16) !== ch.chainId) {
    try { await state.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] }); }
    catch (e) {
      if (e.code !== 4902 && e?.data?.originalError?.code !== 4902) throw e;
      await state.provider.request({ method: "wallet_addEthereumChain", params: [{
        chainId: hex, chainName: ch.label, rpcUrls: [ch.rpc],
        nativeCurrency: { name: ch.nativeSymbol || "ETH", symbol: ch.nativeSymbol || "ETH", decimals: 18 },
        blockExplorerUrls: ch.txExplorer ? [ch.txExplorer.replace(/tx\/$/, "")] : undefined,
      }] });
    }
  }
  return new ethers.BrowserProvider(state.provider).getSigner();
}

async function send(k, label, fn, btn) {
  const old = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = "Confirm in wallet…"; }
  try {
    const tx = await fn();
    if (btn) btn.textContent = "Waiting for the chain…";
    const link = C.chains[k].txExplorer ? C.chains[k].txExplorer + tx.hash : null;
    toast(label + " submitted", link);
    const rc = await tx.wait();
    toast(label + " confirmed ✓", link);
    return rc;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = old; }
  }
}

// approve exactly `amount` if allowance is short
async function ensureAllowance(k, token, spender, amount, btn) {
  const signer = await walletSigner(k);
  const t = new ethers.Contract(token, ERC20, signer);
  const cur = await t.allowance(state.address, spender);
  if (cur >= amount) return signer;
  await send(k, "Approval", () => t.approve(spender, amount), btn);
  return signer;
}

// scan user events newest → oldest in chunks, shrinking the range when the RPC refuses it
async function userLogs(k, cfg, iface, eventNames, user, want = 25) {
  const p = reader(k);
  const latest = await p.getBlockNumber();
  const floor = cfg.fromBlock ?? Math.max(0, latest - (cfg.historyBlocks || 2000000));
  const topics = [eventNames.map((n) => iface.getEvent(n).topicHash), ethers.zeroPadValue(user, 32)];
  let chunk = cfg.logChunk || 50000, to = latest, out = [];
  while (to >= floor && out.length < want) {
    const from = Math.max(floor, to - chunk + 1);
    try {
      const logs = await p.getLogs({ address: cfg.address, topics, fromBlock: from, toBlock: to });
      out = out.concat(logs.reverse());
      to = from - 1;
    } catch (e) {
      if (chunk <= 1000) throw e;
      chunk = Math.floor(chunk / 4);
    }
  }
  const parsed = out.slice(0, want).map((l) => ({ log: l, ev: iface.parseLog(l) }));
  const blocks = {};
  await Promise.all([...new Set(parsed.map((x) => x.log.blockNumber))].map(async (b) => (blocks[b] = (await p.getBlock(b))?.timestamp)));
  parsed.forEach((x) => (x.time = blocks[x.log.blockNumber]));
  return parsed;
}
const when = (ts) => (ts ? new Date(ts * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const txLink = (k, h) => (C.chains[k].txExplorer ? `<a href="${C.chains[k].txExplorer}${h}" target="_blank" rel="noopener">tx ↗</a>` : "");

async function tokenMeta(k, addr) {
  const t = new ethers.Contract(addr, ERC20, reader(k));
  const [decimals, symbol] = await Promise.all([t.decimals().then(Number), t.symbol().catch(() => "GIFT")]);
  return { addr, decimals, symbol, contract: t };
}
const amt = (v, meta, d = 4) => fmt(ethers.formatUnits(v, meta.decimals), d) + " " + meta.symbol;

// ================= Island base =================
class Island {
  constructor(name, cfg) {
    this.cfg = cfg || {};
    this.k = this.cfg.chain || EVM_CHAINS[0];
    this.root = document.querySelector(`[data-app="${name}"]`);
    this.el = {};
    this.root.querySelectorAll("[data-el]").forEach((e) => (this.el[e.dataset.el] = e));
    this.ready = !!(this.cfg.address && ethers.isAddress(this.cfg.address) && C.chains[this.k]?.chainId);
    this.root.classList.toggle("dormant", !this.ready);
    this.el.notReady.classList.toggle("hidden", this.ready);
    this.el.historyBtn?.addEventListener("click", () => this.history());
  }
  canAct() { return this.ready && state.kind === "evm" && this.meta; }
  async walletBal() {
    if (!this.meta || !state.address || state.kind !== "evm") return (this.el.wallet.textContent = "—");
    this.balance = await this.meta.contract.balanceOf(state.address);
    this.el.wallet.textContent = amt(this.balance, this.meta, 2);
  }
  fail(e) { console.warn(e); toast(errMsg(e)); }
}

// ================= Staking Isle =================
const STAKING_ABI = [
  "function stakingToken() view returns (address)", "function rewardsToken() view returns (address)",
  "function totalSupply() view returns (uint256)", "function balanceOf(address) view returns (uint256)",
  "function earned(address) view returns (uint256)", "function rewardRate() view returns (uint256)",
  "function periodFinish() view returns (uint256)",
  "function stake(uint256)", "function withdraw(uint256)", "function getReward()", "function exit()",
  "function claimDaily()", "function nextClaimTime(address) view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)", "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardPaid(address indexed user, uint256 reward)", "event DailyClaimed(address indexed user, uint256 amount)",
];
class StakingIsle extends Island {
  constructor() {
    super("staking", C.staking);
    this.tab = "stake";
    this.iface = new ethers.Interface(STAKING_ABI);
    this.root.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
      this.tab = b.dataset.tab;
      this.root.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("on", x === b));
      this.syncForm();
    }));
    this.el.amount.addEventListener("input", () => this.syncForm());
    this.el.max.addEventListener("click", () => {
      const v = this.tab === "stake" ? this.balance : this.staked;
      if (v != null && this.meta) { this.el.amount.value = ethers.formatUnits(v, this.meta.decimals); this.syncForm(); }
    });
    this.el.form.addEventListener("submit", (e) => { e.preventDefault(); this.submit(); });
    this.el.claim.addEventListener("click", () => this.act("Claim rewards", (c) => c.getReward(), this.el.claim));
    this.el.daily.addEventListener("click", () => this.act("Daily claim", (c) => c.claimDaily(), this.el.daily));
    this.el.exit.addEventListener("click", () => this.act("Exit", (c) => c.exit(), this.el.exit));
    this.syncForm();
    if (this.ready) this.init().catch((e) => this.fail(e));
  }
  async init() {
    this.read = new ethers.Contract(this.cfg.address, STAKING_ABI, reader(this.k));
    this.code = await contractCode(this.k, this.cfg.address);
    if (this.code === "0x") { this.ready = false; this.el.notReady.classList.remove("hidden"); return; }
    const has = (s) => supports(this.code, s);
    this.can = {
      stakingToken: has("stakingToken()"), rewardsToken: has("rewardsToken()"), rewardRate: has("rewardRate()"),
      periodFinish: has("periodFinish()"), exit: has("exit()"), daily: has("claimDaily()"), nextClaim: has("nextClaimTime(address)"),
    };
    const stakeTok = this.can.stakingToken ? await this.read.stakingToken() : caOf(this.k);
    this.meta = await tokenMeta(this.k, stakeTok);
    const rewardTok = this.can.rewardsToken ? await this.read.rewardsToken() : stakeTok;
    this.rmeta = rewardTok.toLowerCase() === stakeTok.toLowerCase() ? this.meta : await tokenMeta(this.k, rewardTok);
    this.el.exit.classList.toggle("hidden", !this.can.exit);
    this.el.daily.classList.toggle("hidden", !this.can.daily);
    await this.refresh();
    clearInterval(this._t);
    this._t = setInterval(() => !document.hidden && this.refresh().catch(() => {}), 15000);
  }
  async refresh() {
    if (!this.meta) return;
    const [total, rate, finish] = await Promise.all([
      this.read.totalSupply(),
      this.can.rewardRate ? this.read.rewardRate() : null,
      this.can.periodFinish ? this.read.periodFinish() : null,
    ]);
    this.el.total.textContent = amt(total, this.meta, 0);
    const live = rate != null && (finish == null || Number(finish) > Date.now() / 1000);
    if (live && rate > 0n) {
      this.el.emission.textContent = amt(rate * 86400n, this.rmeta, 2) + "/day";
      this.el.emission.title = finish ? "Reward period ends " + new Date(Number(finish) * 1000).toLocaleString() : "";
      if (this.rmeta === this.meta && total > 0n) {
        const apr = Number((rate * 31536000n * 1000000n) / total) / 10000;
        this.el.apr.textContent = fmt(apr, 2) + "%";
      } else this.el.apr.textContent = "—";
    } else {
      this.el.emission.textContent = rate != null ? "Not emitting" : "—";
      this.el.apr.textContent = "—";
    }
    if (state.kind === "evm" && state.address) {
      const [mine, earned] = await Promise.all([this.read.balanceOf(state.address), this.read.earned(state.address)]);
      this.staked = mine;
      this.earned = earned;
      this.el.mine.textContent = amt(mine, this.meta, 2);
      this.el.earned.textContent = amt(earned, this.rmeta, 4);
      this.el.claim.disabled = earned === 0n;
      this.el.exit.disabled = mine === 0n;
      await this.walletBal();
      await this.dailyState();
    } else {
      ["mine", "earned", "wallet"].forEach((x) => (this.el[x].textContent = "—"));
      this.el.claim.disabled = this.el.exit.disabled = this.el.daily.disabled = true;
    }
    this.syncForm();
  }
  async dailyState() {
    if (!this.can.daily) return;
    this.el.daily.disabled = false;
    this.nextClaim = this.can.nextClaim ? Number(await this.read.nextClaimTime(state.address)) : null;
    this.tick();
  }
  tick() {
    if (!this.can?.daily || this.nextClaim == null || !state.address) return;
    const s = this.nextClaim - Math.floor(Date.now() / 1000);
    this.el.daily.disabled = s > 0;
    this.el.dailyNote.textContent = s > 0 ? `Next daily claim in ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : "Daily reward is ready to claim.";
  }
  parsed() {
    try { const v = this.el.amount.value.trim(); return v ? ethers.parseUnits(v, this.meta.decimals) : 0n; } catch { return null; }
  }
  syncForm() {
    const s = this.el.submit, h = this.el.hint;
    s.textContent = this.tab === "stake" ? "Stake $GIFT" : "Unstake $GIFT";
    if (!this.ready) { s.disabled = true; h.textContent = "Staking contract not published yet."; return; }
    if (state.kind !== "evm") { s.disabled = true; h.textContent = state.kind === "sol" ? "Staking runs on " + C.chains[this.k].label + " — connect an EVM wallet." : "Connect a wallet to stake."; return; }
    if (!this.meta) { s.disabled = true; h.textContent = "Reading the contract…"; return; }
    const v = this.parsed(), max = this.tab === "stake" ? this.balance : this.staked;
    if (v === null) { s.disabled = true; h.textContent = "Invalid amount."; return; }
    if (v === 0n) { s.disabled = true; h.textContent = this.tab === "stake" ? "Enter how much $GIFT to lock." : "Enter how much $GIFT to release."; return; }
    if (max != null && v > max) { s.disabled = true; h.textContent = "Amount exceeds your " + (this.tab === "stake" ? "wallet balance." : "staked balance."); return; }
    s.disabled = false;
    h.textContent = this.tab === "stake" ? "Your wallet asks for an approval first if needed, then the stake." : "Unstaked $GIFT returns to your wallet.";
  }
  async submit() {
    const v = this.parsed();
    if (!v) return;
    try {
      if (this.tab === "stake") {
        const signer = await ensureAllowance(this.k, this.meta.addr, this.cfg.address, v, this.el.submit);
        const c = new ethers.Contract(this.cfg.address, STAKING_ABI, signer);
        await send(this.k, "Stake", () => c.stake(v), this.el.submit);
      } else {
        const c = new ethers.Contract(this.cfg.address, STAKING_ABI, await walletSigner(this.k));
        await send(this.k, "Unstake", () => c.withdraw(v), this.el.submit);
      }
      this.el.amount.value = "";
      await this.refresh();
      this.history();
      loadBalances();
    } catch (e) { this.fail(e); }
  }
  async act(label, fn, btn) {
    try {
      const c = new ethers.Contract(this.cfg.address, STAKING_ABI, await walletSigner(this.k));
      await send(this.k, label, () => fn(c), btn);
      await this.refresh();
      this.history();
      loadBalances();
    } catch (e) { this.fail(e); }
  }
  async history() {
    const ul = this.el.history;
    if (!this.ready || !this.meta) return (ul.innerHTML = `<li class="muted">No contract, no history.</li>`);
    if (state.kind !== "evm") return (ul.innerHTML = `<li class="muted">Connect an EVM wallet to see your history.</li>`);
    ul.innerHTML = `<li class="muted">Reading events from the chain…</li>`;
    try {
      const evs = ["Staked", "Withdrawn", "RewardPaid"].concat(supports(this.code, "claimDaily()") ? ["DailyClaimed"] : []);
      const rows = await userLogs(this.k, this.cfg, this.iface, evs, state.address);
      const label = { Staked: "Staked", Withdrawn: "Unstaked", RewardPaid: "Reward claimed", DailyClaimed: "Daily reward" };
      ul.innerHTML = rows.length ? rows.map(({ ev, log, time }) => {
        const m = ev.name === "RewardPaid" || ev.name === "DailyClaimed" ? this.rmeta : this.meta;
        return `<li class="ev-${ev.name}"><span>${label[ev.name]}</span><b>${amt(ev.args[1], m, 4)}</b><small>${when(time)} ${txLink(this.k, log.transactionHash)}</small></li>`;
      }).join("") : `<li class="muted">No staking activity for this wallet in the scanned range.</li>`;
    } catch (e) { ul.innerHTML = `<li class="muted">Couldn't read history: ${esc(errMsg(e))}</li>`; }
  }
  onWallet() { this.ready && this.meta ? this.refresh().then(() => this.history()).catch((e) => this.fail(e)) : this.syncForm(); }
}

// ================= Mystery Box Isle =================
const BOX_ABI = [
  "function boxPrice() view returns (uint256)", "function paymentToken() view returns (address)",
  "function maxPerTx() view returns (uint256)", "function prizeName(uint256) view returns (string)",
  "function openBox(uint256 count)",
  "event BoxOpened(address indexed user, uint256 indexed boxId, uint256 prizeId, uint256 amount)",
];
class MysteryIsle extends Island {
  constructor() {
    super("mystery", C.mysteryBox);
    this.qty = 1;
    this.iface = new ethers.Interface(BOX_ABI);
    this.el.minus.addEventListener("click", () => this.setQty(this.qty - 1));
    this.el.plus.addEventListener("click", () => this.setQty(this.qty + 1));
    this.el.open.addEventListener("click", () => this.open());
    this.el.box.addEventListener("click", () => !this.el.open.disabled && this.open());
    this.setQty(1);
    if (this.ready) this.init().catch((e) => this.fail(e));
  }
  async init() {
    this.read = new ethers.Contract(this.cfg.address, BOX_ABI, reader(this.k));
    this.code = await contractCode(this.k, this.cfg.address);
    if (this.code === "0x") { this.ready = false; this.el.notReady.classList.remove("hidden"); return; }
    const pay = supports(this.code, "paymentToken()") ? await this.read.paymentToken() : caOf(this.k);
    this.meta = await tokenMeta(this.k, pay);
    this.price = await this.read.boxPrice();
    this.max = supports(this.code, "maxPerTx()") ? Number(await this.read.maxPerTx()) : 1;
    this.named = supports(this.code, "prizeName(uint256)");
    this.el.price.textContent = amt(this.price, this.meta, 2);
    this.setQty(1);
    await this.refresh();
  }
  setQty(n) {
    this.qty = Math.max(1, Math.min(this.max || 1, n));
    this.el.qty.textContent = this.qty;
    this.el.cost.textContent = this.price != null ? "Total " + amt(this.price * BigInt(this.qty), this.meta, 2) : "";
    this.sync();
  }
  sync() {
    const b = this.el.open;
    b.disabled = !this.canAct() || (this.balance != null && this.price * BigInt(this.qty) > this.balance);
    b.textContent = !this.ready ? "Contract not published" : state.kind !== "evm" ? "Connect an EVM wallet" : `Open ${this.qty} mystery box${this.qty > 1 ? "es" : ""}`;
  }
  async refresh() { if (this.meta) await this.walletBal(); this.sync(); }
  async prizeText(ev) {
    const [, , prizeId, amount] = ev.args;
    let name = "";
    if (this.named) try { name = await this.read.prizeName(prizeId); } catch {}
    if (amount > 0n) return (name ? name + " · " : "") + amt(amount, this.meta, 4);
    return name || "Empty box — the dream was elsewhere";
  }
  async open() {
    const box = this.el.box, rv = this.el.reveal;
    try {
      const signer = await ensureAllowance(this.k, this.meta.addr, this.cfg.address, this.price * BigInt(this.qty), this.el.open);
      const c = new ethers.Contract(this.cfg.address, BOX_ABI, signer);
      box.classList.add("shake"); rv.classList.add("hidden");
      const rc = await send(this.k, "Open box", () => c.openBox(this.qty), this.el.open);
      let evs = rc.logs.filter((l) => l.address.toLowerCase() === this.cfg.address.toLowerCase()).map((l) => { try { return this.iface.parseLog(l); } catch { return null; } }).filter((e) => e?.name === "BoxOpened");
      if (!evs.length) evs = await waitForEvents(this.k, this.cfg.address, this.iface, "BoxOpened", rc.blockNumber, this.qty);
      box.classList.remove("shake");
      if (evs.length) {
        box.classList.add("opened");
        dispatchEvent(new Event("dream:box"));
        const texts = await Promise.all(evs.map((e) => this.prizeText(e)));
        rv.innerHTML = texts.map((t) => `<div class="prize">✦ ${esc(t)}</div>`).join("");
        rv.classList.remove("hidden");
        setTimeout(() => box.classList.remove("opened"), 4000);
      } else toast("Box request confirmed — the result will appear in your history once the contract reveals it.");
      await this.refresh();
      this.history();
      loadBalances();
    } catch (e) { box.classList.remove("shake"); this.fail(e); }
  }
  async history() {
    const ul = this.el.history;
    if (!this.ready || !this.meta) return (ul.innerHTML = `<li class="muted">No contract, no history.</li>`);
    if (state.kind !== "evm") return (ul.innerHTML = `<li class="muted">Connect an EVM wallet to see your history.</li>`);
    ul.innerHTML = `<li class="muted">Reading events from the chain…</li>`;
    try {
      const rows = await userLogs(this.k, this.cfg, this.iface, ["BoxOpened"], state.address, 30);
      this.el.opened.textContent = rows.length >= 30 ? "30+" : rows.length;
      const texts = await Promise.all(rows.map((r) => this.prizeText(r.ev)));
      ul.innerHTML = rows.length ? rows.map((r, i) => `<li><span>Box #${r.ev.args[1]}</span><b>${esc(texts[i])}</b><small>${when(r.time)} ${txLink(this.k, r.log.transactionHash)}</small></li>`).join("")
        : `<li class="muted">No boxes opened by this wallet in the scanned range.</li>`;
    } catch (e) { ul.innerHTML = `<li class="muted">Couldn't read history: ${esc(errMsg(e))}</li>`; }
  }
  onWallet() { this.ready && this.meta ? this.refresh().then(() => this.history()).catch((e) => this.fail(e)) : this.sync(); }
}

// poll for result events (VRF-style contracts settle in a later block)
async function waitForEvents(k, address, iface, name, fromBlock, want, ms = 90000) {
  const p = reader(k), end = Date.now() + ms;
  const topics = [iface.getEvent(name).topicHash, ethers.zeroPadValue(state.address, 32)];
  while (Date.now() < end) {
    await new Promise((r) => setTimeout(r, 3000));
    const logs = await p.getLogs({ address, topics, fromBlock, toBlock: "latest" }).catch(() => []);
    if (logs.length) return logs.slice(-want).map((l) => iface.parseLog(l));
  }
  return [];
}

// ================= Lucky Draw Isle =================
const WHEEL_ABI = [
  "function spinCost() view returns (uint256)", "function paymentToken() view returns (address)",
  "function segmentCount() view returns (uint256)", "function segmentReward(uint256) view returns (uint256)",
  "function spin()",
  "event SpinResult(address indexed user, uint256 indexed spinId, uint256 segment, uint256 reward)",
];
class LuckyIsle extends Island {
  constructor() {
    super("lucky", C.luckyDraw);
    this.iface = new ethers.Interface(WHEEL_ABI);
    this.rot = 0;
    this.drawWheel(null);
    this.el.spin.addEventListener("click", () => this.spin());
    if (this.ready) this.init().catch((e) => this.fail(e));
  }
  async init() {
    this.read = new ethers.Contract(this.cfg.address, WHEEL_ABI, reader(this.k));
    this.code = await contractCode(this.k, this.cfg.address);
    if (this.code === "0x") { this.ready = false; this.el.notReady.classList.remove("hidden"); return; }
    const pay = supports(this.code, "paymentToken()") ? await this.read.paymentToken() : caOf(this.k);
    this.meta = await tokenMeta(this.k, pay);
    const [cost, n] = await Promise.all([this.read.spinCost(), this.read.segmentCount()]);
    this.cost = cost;
    this.segments = await Promise.all([...Array(Number(n)).keys()].map((i) => this.read.segmentReward(i)));
    this.el.cost.textContent = amt(cost, this.meta, 2);
    this.drawWheel(this.segments);
    await this.refresh();
  }
  label(r) { return r > 0n ? "+" + fmt(ethers.formatUnits(r, this.meta.decimals), 2) : "Try again"; }
  drawWheel(segs) {
    const n = segs?.length || 8, svg = this.el.wheel, R = 100;
    let html = "";
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      html += `<path d="M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 ${large} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z" fill="${PASTEL[i % PASTEL.length]}" stroke="#fff" stroke-width="2"/>`;
      const am = (a0 + a1) / 2, deg = (am * 180) / Math.PI;
      html += `<text x="${62 * Math.cos(am)}" y="${62 * Math.sin(am)}" transform="rotate(${deg + 90} ${62 * Math.cos(am)} ${62 * Math.sin(am)})">${segs ? esc(this.label(segs[i])) : "?"}</text>`;
    }
    html += `<circle r="${R}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="5"/>`;
    svg.innerHTML = `<g data-rot>${html}</g>`;
    this.g = svg.querySelector("[data-rot]");
  }
  setRot(deg, ms) {
    this.g.style.transition = ms ? `transform ${ms}ms cubic-bezier(.12,.75,.12,1)` : "none";
    this.g.style.transform = `rotate(${deg}deg)`;
    this.rot = deg;
  }
  sync() {
    const b = this.el.spin;
    b.disabled = !this.canAct() || this.spinning || (this.balance != null && this.cost > this.balance);
  }
  async refresh() { if (this.meta) await this.walletBal(); this.sync(); }
  async spin() {
    const rv = this.el.reveal;
    try {
      const signer = await ensureAllowance(this.k, this.meta.addr, this.cfg.address, this.cost, null);
      const c = new ethers.Contract(this.cfg.address, WHEEL_ABI, signer);
      const tx = await c.spin();
      this.spinning = true; this.sync(); rv.classList.add("hidden");
      const link = C.chains[this.k].txExplorer ? C.chains[this.k].txExplorer + tx.hash : null;
      toast("Spin submitted", link);
      dispatchEvent(new Event("dream:spin"));
      // idle spin while the chain decides
      this.root.classList.add("spinning");
      const rc = await tx.wait();
      let ev = rc.logs.filter((l) => l.address.toLowerCase() === this.cfg.address.toLowerCase()).map((l) => { try { return this.iface.parseLog(l); } catch { return null; } }).find((e) => e?.name === "SpinResult");
      if (!ev) ev = (await waitForEvents(this.k, this.cfg.address, this.iface, "SpinResult", rc.blockNumber, 1))[0];
      this.root.classList.remove("spinning");
      if (ev) {
        const n = this.segments.length, seg = Number(ev.args[2]);
        const center = ((seg + 0.5) / n) * 360;
        const base = this.rot - (this.rot % 360);
        this.setRot(base + 360 * 5 + (360 - center), 4200);
        setTimeout(() => {
          rv.innerHTML = `<div class="prize">${ev.args[3] > 0n ? "✦ You won " + amt(ev.args[3], this.meta, 4) : "The wheel smiled, but not this time."}</div>`;
          rv.classList.remove("hidden");
        }, 4300);
      } else toast("Spin confirmed — the result appears in your history once the contract reveals it.", link);
      this.spinning = false;
      await this.refresh();
      setTimeout(() => this.history(), 4400);
      loadBalances();
    } catch (e) { this.root.classList.remove("spinning"); this.spinning = false; this.sync(); this.fail(e); }
  }
  async history() {
    const ul = this.el.history;
    if (!this.ready || !this.meta) return (ul.innerHTML = `<li class="muted">No contract, no history.</li>`);
    if (state.kind !== "evm") return (ul.innerHTML = `<li class="muted">Connect an EVM wallet to see your history.</li>`);
    ul.innerHTML = `<li class="muted">Reading events from the chain…</li>`;
    try {
      const rows = await userLogs(this.k, this.cfg, this.iface, ["SpinResult"], state.address, 30);
      this.el.spins.textContent = rows.length >= 30 ? "30+" : rows.length;
      ul.innerHTML = rows.length ? rows.map(({ ev, log, time }) => `<li><span>Spin #${ev.args[1]}</span><b>${ev.args[3] > 0n ? amt(ev.args[3], this.meta, 4) : "No prize"}</b><small>${when(time)} ${txLink(this.k, log.transactionHash)}</small></li>`).join("")
        : `<li class="muted">No spins by this wallet in the scanned range.</li>`;
    } catch (e) { ul.innerHTML = `<li class="muted">Couldn't read history: ${esc(errMsg(e))}</li>`; }
  }
  onWallet() { this.ready && this.meta ? this.refresh().then(() => this.history()).catch((e) => this.fail(e)) : this.sync(); }
}

let ISLANDS = [];

// ================= wallets =================
addEventListener("eip6963:announceProvider", (e) => {
  if (!state.evmProviders.find((p) => p.info.uuid === e.detail.info.uuid)) state.evmProviders.push(e.detail);
});
dispatchEvent(new Event("eip6963:requestProvider"));

function openModal() {
  const evm = state.evmProviders.length
    ? state.evmProviders.map((d) => ({ label: d.info.name, icon: d.info.icon, tag: "EVM", go: () => connectEvm(d.provider) }))
    : window.ethereum ? [{ label: "Browser wallet", tag: "EVM", go: () => connectEvm(window.ethereum) }] : [];
  const sol = SOL_CHAINS.length ? SOL_WALLETS.filter((w) => w.get()).map((w) => ({ label: w.name, icon: w.get().icon, tag: "Solana", go: () => connectSol(w.get()) })) : [];
  const opts = [...(EVM_CHAINS.length ? evm : []), ...sol];
  const box = $("walletOptions");
  if (!opts.length) {
    box.innerHTML = `<p class="muted">No wallet detected. Install <a href="https://metamask.io" target="_blank" rel="noopener">MetaMask</a>,
      <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener">Coinbase Wallet</a> or <a href="https://rabby.io" target="_blank" rel="noopener">Rabby</a>, then reload.
      On mobile, open this site inside your wallet's built-in browser.</p>`;
  } else {
    box.innerHTML = opts.map((o, i) => `<button class="wallet-opt" data-i="${i}">${o.icon ? `<img src="${o.icon}" alt="" />` : '<span class="dot"></span>'}<span>${esc(o.label)}</span><em>${o.tag}</em></button>`).join("");
    box.querySelectorAll(".wallet-opt").forEach((b) => (b.onclick = () => { closeModal(); opts[+b.dataset.i].go(); }));
  }
  $("walletModal").classList.remove("hidden");
}
const closeModal = () => $("walletModal").classList.add("hidden");

async function connectEvm(provider) {
  try {
    const [addr] = await provider.request({ method: "eth_requestAccounts" });
    setWallet("evm", ethers.getAddress(addr), provider);
    provider.on?.("accountsChanged", (a) => (a[0] ? setWallet("evm", ethers.getAddress(a[0]), provider) : disconnect()));
  } catch (e) { toast(errMsg(e) || "Connection rejected"); }
}
async function connectSol(provider) {
  try {
    const r = await provider.connect();
    setWallet("sol", ((r && r.publicKey) || provider.publicKey).toString(), provider);
    provider.on?.("accountChanged", (pk) => (pk ? setWallet("sol", pk.toString(), provider) : disconnect()));
  } catch (e) { toast(errMsg(e) || "Connection rejected"); }
}
function setWallet(kind, address, provider) {
  Object.assign(state, { kind, address, provider });
  $("walletButtons").classList.add("hidden");
  $("walletConnected").classList.remove("hidden");
  $("walletAddr").textContent = address;
  $("walletStatus").textContent = "Reading your balance on " + names(kind === "sol" ? SOL_CHAINS : EVM_CHAINS) + ".";
  $("navWalletText").textContent = short(address);
  document.body.classList.add("connected");
  loadBalances();
  loadLeaderboard();
  ISLANDS.forEach((i) => i.onWallet());
}
function disconnect() {
  Object.assign(state, { kind: null, address: null, provider: null });
  $("walletButtons").classList.remove("hidden");
  $("walletConnected").classList.add("hidden");
  $("walletStatus").textContent = "Connect a wallet to read your balance directly from the blockchain.";
  $("balTotal").textContent = "—";
  $("balList").innerHTML = "";
  $("navWalletText").textContent = "Connect Wallet";
  $("navBal").classList.add("hidden");
  document.body.classList.remove("connected");
  ISLANDS.forEach((i) => { i.balance = i.staked = null; i.onWallet(); });
}

// ================= events =================
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-action]")?.dataset.action;
  if (a === "connect") state.address ? $("midnight").scrollIntoView({ behavior: "smooth" }) : openModal();
  else if (a === "connect-evm" || a === "connect-sol") openModal();
  else if (a === "close-modal") closeModal();
  else if (a === "refresh") { loadBalances(); ISLANDS.forEach((i) => i.onWallet()); }
  else if (a === "disconnect") disconnect();
  const copy = !e.target.closest("a") && e.target.closest("[data-copy]");
  if (copy) navigator.clipboard.writeText(copy.dataset.copy).then(() => {
    toast("Contract address copied");
    const btn = copy.querySelector(".ca-copy");
    if (btn) { btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = btn.dataset.text), 1600); }
  });
});
$("walletModal").addEventListener("click", (e) => e.target.id === "walletModal" && closeModal());

// active island in the nav + reveal cards
const navLinks = [...document.querySelectorAll("[data-nav]")];
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  en.target.classList.add("seen");
  const i = en.target.dataset.island;
  navLinks.forEach((l) => l.classList.toggle("on", l.dataset.nav === i));
}), { threshold: 0.35 });
document.querySelectorAll("[data-island]").forEach((s) => io.observe(s));

// loader: hide when the 3D world draws its first frame (or after a short wait)
const hideLoader = () => $("loader").classList.add("gone");
new MutationObserver(() => document.body.classList.contains("world-ready") && hideLoader()).observe(document.body, { attributes: true, attributeFilter: ["class"] });
setTimeout(hideLoader, 3500);

applyMode();
renderStatic();
ISLANDS = [new StakingIsle(), new MysteryIsle(), new LuckyIsle()];
tick();
setInterval(tick, 1000);
loadLeaderboard();
