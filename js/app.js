(() => {
  const C = window.PANGEA_CONFIG;
  const $ = (id) => document.getElementById(id);
  // ---------- single / multi chain mode ----------
  const SINGLE = C.mode !== "multi";
  const ALL = [...new Set([...(C.multiOrder || []), ...Object.keys(C.chains)])].filter((k) => C.chains[k]);
  const ACTIVE = SINGLE ? [C.chains[C.singleChain] ? C.singleChain : ALL[0]] : ALL; // multi = always every chain
  const isSol = (k) => C.chains[k].type === "solana";
  const EVM_CHAINS = ACTIVE.filter((k) => !isSol(k));
  const SOL_CHAINS = ACTIVE.filter(isSol);
  // One CA for every EVM chain (contracts.evm), Solana uses contracts.sol
  const caOf = (k) => (C.chains[k].ca || (isSol(k) ? C.contracts.sol : C.contracts.evm) || "").trim();
  // Chains sharing the same CA → one Copy block (multi: RH/BASE/BSC + SOL)
  const CA_GROUPS = ACTIVE.reduce((acc, k) => {
    const ca = caOf(k), id = ca ? ca.toLowerCase() : k, g = acc.find((x) => x.id === id);
    g ? g.keys.push(k) : acc.push({ id, ca, keys: [k] });
    return acc;
  }, []);
  // dark text on light chain colors, white on dark ones
  const ink = (hex) => {
    const n = parseInt(hex.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return l > 0.6 ? "#1a0f2e" : "#ffffff";
  };
  const names = (keys) => keys.map((k) => C.chains[k].label).join(", ").replace(/, ([^,]*)$/, " and $1");
  const MAIN = ACTIVE[0];
  const SOL_WALLETS = [
    { name: "Phantom", get: () => window.phantom?.solana?.isPhantom ? window.phantom.solana : (window.solana?.isPhantom ? window.solana : null) },
    { name: "Solflare", get: () => window.solflare?.isSolflare ? window.solflare : null },
    { name: "Backpack", get: () => window.backpack?.solana || null },
  ];
  const state = { kind: null, address: null, provider: null, evmProviders: [] };

  // Multi mode: swap texts that mention a single chain (data-multi / data-multi-html, {chains} = list)
  function applyMode() {
    document.body.dataset.mode = SINGLE ? "single" : "multi";
    const lbl = document.getElementById("evmChainsLabel");
    if (lbl) lbl.textContent = names(EVM_CHAINS);
    $("btnEvm").classList.toggle("hidden", !EVM_CHAINS.length);
    $("btnSol").classList.toggle("hidden", !SOL_CHAINS.length);
    const ch = C.chains[MAIN], sol = isSol(MAIN);
    const fill = (t) => t.replaceAll("{chains}", names(ACTIVE)).replaceAll("{n}", ACTIVE.length)
      .replaceAll("{chain}", ch.label).replaceAll("{short}", ch.short || ch.label)
      .replaceAll("{walletType}", sol ? "Solana" : "EVM")
      .replaceAll("{walletHint}", sol ? "Phantom, Solflare or Backpack" : "any EVM wallet (MetaMask, Rabby, Coinbase Wallet…)");
    const m = SINGLE ? "single" : "multi", mh = SINGLE ? "singleHtml" : "multiHtml";
    document.querySelectorAll(`[data-${m}]`).forEach((el) => (el.textContent = fill(el.dataset[m])));
    document.querySelectorAll(`[data-${m}-html]`).forEach((el) => (el.innerHTML = fill(el.dataset[mh])));
    if (!SINGLE) return;
    // single-chain design: accent color, dot, tagline, page title
    document.body.style.setProperty("--accent", ch.color);
    document.querySelector(".pill").insertAdjacentHTML("afterbegin", '<span class="dot"></span>');
    if (ch.tagline) { $("chainTagline").textContent = ch.tagline; $("chainTagline").classList.remove("hidden"); }
    document.querySelector('meta[name="description"]').content += " Built on " + ch.label + ".";
  }

  // ---------- helpers ----------
  const short = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");
  const fmt = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const toast = (msg) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add("hidden"), 3500);
  };
  const xUrl = "https://x.com/" + C.socials.x;

  // ---------- static content ----------
  function renderStatic() {
    ["xLinkHero", "xLinkFaq", "xLinkCta", "xLinkFoot"].forEach((id) => ($(id).href = xUrl));
    $("xLinkCta").textContent = "@" + C.socials.x;
    $("year").textContent = new Date().getFullYear();
    $("todayGift").textContent = C.rewards.current + (C.rewards.value ? " · " + C.rewards.value : "") + " Gift Card";
    $("winnersCount").textContent = $("statWinners").textContent = C.rewards.winnersPerDay;
    $("statBrands").textContent = C.rewards.brands.length;

    $("heroCas").innerHTML = CA_GROUPS.map(({ ca, keys }) => {
      const color = keys.length === 1 ? C.chains[keys[0]].color : "#ffcf5a";
      const tag = keys.map((k) => C.chains[k].short || C.chains[k].label).join("/");
      const label = keys.length === 1 ? C.chains[keys[0]].label : tag;
      const links = ca ? keys.map((k) => `<a href="${C.chains[k].explorer}${ca}" target="_blank" rel="noopener">${keys.length > 1 ? C.chains[k].short : "Explorer"} ↗</a>`).join("") : "";
      return `<div class="hero-ca${ca ? "" : " off"}" ${ca ? `data-copy="${ca}" title="Click to copy"` : ""} style="--ca:${color};--ca-ink:${ink(color)}">
        <span class="hero-ca-label">CA · ${label}${links}</span>
        <code>${ca || "Contract coming soon"}</code>
        ${ca ? `<span class="hero-ca-btn" data-text="Copy ${tag} CA">Copy ${tag} CA</span>` : ""}
      </div>`;
    }).join("");

    $("brands").innerHTML = C.rewards.brands
      .map((b) => {
        const on = b === C.rewards.current;
        return `<div class="brand-tile${on ? " active" : ""}"><span>${b}</span>${on ? '<em>Today</em>' : ""}</div>`;
      })
      .join("");

    const chainCard = (key) => {
      const ch = C.chains[key];
      const ca = caOf(key);
      const body = ca
        ? `<code class="ca" data-copy="${ca}" title="Click to copy">${short(ca)}</code>
           <a class="link" href="${ch.explorer}${ca}" target="_blank" rel="noopener">Explorer ↗</a>`
        : `<span class="soon">Contract coming soon</span>`;
      return `<div class="chain chain-${key}" style="--ca:${ch.color}"><h4>${ch.label}</h4>${body}</div>`;
    };
    $("chainCards").innerHTML = ACTIVE.map(chainCard).join("");
  }

  // ---------- countdown to next 00:00 in New York ----------
  const tz = C.rewards.timezone;
  const partsIn = (date) => {
    const p = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(date).forEach((x) => (p[x.type] = +x.value || x.value));
    return p;
  };
  const tzOffset = (date) => {
    const p = partsIn(date);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
  };
  const nextMidnight = (now) => {
    const p = partsIn(now);
    const wall = Date.UTC(p.year, p.month - 1, p.day + 1, 0, 0, 0);
    let t = wall - tzOffset(new Date(wall));
    t = wall - tzOffset(new Date(t)); // correct across DST changes
    return t;
  };
  let target = nextMidnight(new Date());
  function tick() {
    const now = Date.now();
    if (now >= target) target = nextMidnight(new Date(now + 1000));
    const s = Math.max(0, Math.floor((target - now) / 1000));
    const pad = (n) => String(n).padStart(2, "0");
    $("cdH").textContent = pad(Math.floor(s / 3600));
    $("cdM").textContent = pad(Math.floor((s % 3600) / 60));
    $("cdS").textContent = pad(s % 60);
    const p = partsIn(new Date(now));
    $("nyNow").textContent = `${pad(p.hour)}:${pad(p.minute)}`;
  }

  // ---------- on-chain reads ----------
  async function rpc(url, method, params) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    return j.result;
  }

  async function solBalance(chainKey, owner) {
    const r = await rpc(C.chains[chainKey].rpc, "getTokenAccountsByOwner", [owner, { mint: caOf(chainKey) }, { encoding: "jsonParsed" }]);
    return (r?.value || []).reduce((s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
  }

  async function evmBalance(chainKey, holder) {
    const { rpc: url } = C.chains[chainKey];
    const ca = caOf(chainKey);
    const data = "0x70a08231" + holder.toLowerCase().replace("0x", "").padStart(64, "0"); // balanceOf(address)
    const [raw, dec] = await Promise.all([
      rpc(url, "eth_call", [{ to: ca, data }, "latest"]),
      rpc(url, "eth_call", [{ to: ca, data: "0x313ce567" }, "latest"]), // decimals()
    ]);
    if (!raw || raw === "0x") return 0; // contract not deployed on this chain
    return Number(BigInt(raw)) / 10 ** Number(BigInt(dec));
  }

  async function loadBalances() {
    const list = $("balList");
    const keys = (state.kind === "sol" ? SOL_CHAINS : EVM_CHAINS).filter((k) => caOf(k));

    if (!keys.length) {
      $("balTotal").textContent = "—";
      list.innerHTML = `<li class="muted">The ${C.token.symbol} contract isn't published yet. Your balance will appear here at launch.</li>`;
      return;
    }
    list.innerHTML = keys.map((k) => `<li id="bal-${k}"><span>${C.chains[k].label}</span><b>…</b></li>`).join("");
    $("balTotal").textContent = "…";

    let total = 0, ok = 0;
    await Promise.all(
      keys.map(async (k) => {
        const el = $("bal-" + k).querySelector("b");
        try {
          const v = await (isSol(k) ? solBalance(k, state.address) : evmBalance(k, state.address));
          total += v; ok++;
          el.textContent = fmt(v);
        } catch (e) {
          el.textContent = "RPC error";
          el.title = e.message;
        }
      })
    );
    $("balTotal").textContent = ok ? fmt(total) + " " + C.token.symbol.replace("$", "") : "Unavailable";
  }

  // ---------- leaderboard (real data only) ----------
  async function loadLeaderboard() {
    if (!C.leaderboardUrl) return;
    try {
      const r = await fetch(C.leaderboardUrl, { cache: "no-store" });
      const data = await r.json();
      if (!data.holders || !data.holders.length) return;
      $("boardEmpty").classList.add("hidden");
      $("boardList").classList.remove("hidden");
      $("boardList").innerHTML = data.holders
        .slice(0, C.rewards.winnersPerDay)
        .map((h, i) => {
          if (!ACTIVE.includes(h.chain)) return "";
          const me = state.address && h.address.toLowerCase() === state.address.toLowerCase();
          const ch = C.chains[h.chain];
          return `<li class="${me ? "me" : ""}"><span class="rank">#${i + 1}</span>
            <code>${short(h.address)}</code><span class="tag">${ch ? ch.label : h.chain}</span>
            <b>${fmt(h.balance)}</b></li>`;
        })
        .join("");
      if (data.updatedAt) {
        $("boardFoot").classList.remove("hidden");
        $("boardFoot").textContent = "Updated " + new Date(data.updatedAt).toLocaleString();
      }
    } catch (e) {
      console.warn("Leaderboard unavailable:", e);
    }
  }

  // ---------- wallets ----------
  window.addEventListener("eip6963:announceProvider", (e) => {
    if (!state.evmProviders.find((p) => p.info.uuid === e.detail.info.uuid)) state.evmProviders.push(e.detail);
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  function openModal() {
    const evm = state.evmProviders.length
      ? state.evmProviders.map((d, i) => ({ label: d.info.name, icon: d.info.icon, tag: "EVM", go: () => connectEvm(d.provider), i }))
      : window.ethereum ? [{ label: "Browser wallet", tag: "EVM", go: () => connectEvm(window.ethereum) }] : [];
    const sol = SOL_CHAINS.length
      ? SOL_WALLETS.filter((w) => w.get()).map((w) => ({ label: w.name, icon: w.get().icon, tag: "Solana", go: () => connectSol(w.get()) }))
      : [];
    const opts = [...(EVM_CHAINS.length ? evm : []), ...sol];

    const box = $("walletOptions");
    if (!opts.length) {
      box.innerHTML = `<p class="muted">No wallet detected. Install <a href="https://metamask.io" target="_blank" rel="noopener">MetaMask</a>,
        <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener">Coinbase Wallet</a> or
        <a href="https://rabby.io" target="_blank" rel="noopener">Rabby</a>, then reload this page.
        On mobile, open this site inside your wallet's built-in browser.</p>`;
    } else {
      box.innerHTML = opts
        .map((o, i) => `<button class="wallet-opt" data-i="${i}">${o.icon ? `<img src="${o.icon}" alt="" />` : '<span class="dot"></span>'}
          <span>${o.label}</span><em>${o.tag}</em></button>`)
        .join("");
      box.querySelectorAll(".wallet-opt").forEach((b) => (b.onclick = () => { closeModal(); opts[+b.dataset.i].go(); }));
    }
    $("walletModal").classList.remove("hidden");
  }
  const closeModal = () => $("walletModal").classList.add("hidden");

  async function connectEvm(provider) {
    try {
      const [addr] = await provider.request({ method: "eth_requestAccounts" });
      setWallet("evm", addr, provider);
      provider.on?.("accountsChanged", (a) => (a[0] ? setWallet("evm", a[0], provider) : disconnect()));
    } catch (e) {
      toast(e.message || "Connection rejected");
    }
  }

  async function connectSol(provider) {
    try {
      const r = await provider.connect();
      setWallet("sol", ((r && r.publicKey) || provider.publicKey).toString(), provider);
      provider.on?.("accountChanged", (pk) => (pk ? setWallet("sol", pk.toString(), provider) : disconnect()));
    } catch (e) {
      toast(e.message || "Connection rejected");
    }
  }

  function setWallet(kind, address, provider) {
    Object.assign(state, { kind, address, provider });
    $("walletButtons").classList.add("hidden");
    $("walletConnected").classList.remove("hidden");
    $("walletAddr").textContent = address;
    $("walletStatus").textContent = "Reading your balance on " + names(kind === "sol" ? SOL_CHAINS : EVM_CHAINS) + ".";
    document.querySelectorAll('[data-action="connect"]').forEach((b) => (b.textContent = short(address)));
    loadBalances();
    loadLeaderboard();
    document.getElementById("check").scrollIntoView({ behavior: "smooth" });
  }

  function disconnect() {
    Object.assign(state, { kind: null, address: null, provider: null });
    $("walletButtons").classList.remove("hidden");
    $("walletConnected").classList.add("hidden");
    $("walletStatus").textContent = "Connect a wallet to read your balance directly from the blockchain.";
    $("balTotal").textContent = "—";
    $("balList").innerHTML = "";
    document.querySelectorAll('[data-action="connect"]').forEach((b) => (b.textContent = b.dataset.label));
  }

  // ---------- events ----------
  document.querySelectorAll('[data-action="connect"]').forEach((b) => (b.dataset.label = b.textContent));
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]")?.dataset.action;
    if (a === "connect") state.address ? document.getElementById("check").scrollIntoView({ behavior: "smooth" }) : openModal();
    else if (a === "connect-evm" || a === "connect-sol") openModal();
    else if (a === "close-modal") closeModal();
    else if (a === "refresh") loadBalances();
    else if (a === "disconnect") disconnect();

    const copy = !e.target.closest("a") && e.target.closest("[data-copy]");
    if (copy) navigator.clipboard.writeText(copy.dataset.copy).then(() => {
      toast("Contract address copied");
      const btn = copy.querySelector(".hero-ca-btn");
      if (btn) { btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = btn.dataset.text), 1800); }
    });
  });
  $("walletModal").addEventListener("click", (e) => e.target.id === "walletModal" && closeModal());

  applyMode();
  renderStatic();
  tick();
  setInterval(tick, 1000);
  loadLeaderboard();
})();
