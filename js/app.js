(() => {
  const C = window.PANGEA_CONFIG;
  const $ = (id) => document.getElementById(id);
  const EVM_CHAINS = ["base", "robinhood", "bsc"];
  const state = { kind: null, address: null, provider: null, evmProviders: [] };

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

    $("brands").innerHTML = C.rewards.brands
      .map((b) => {
        const on = b === C.rewards.current;
        return `<div class="brand-tile${on ? " active" : ""}"><span>${b}</span>${on ? '<em>Today</em>' : ""}</div>`;
      })
      .join("");

    const chainCard = (key) => {
      const ch = C.chains[key];
      const ca = key === "solana" ? C.contracts.solana : C.contracts.evm;
      const body = ca
        ? `<code class="ca" data-copy="${ca}" title="Click to copy">${short(ca)}</code>
           <a class="link" href="${ch.explorer}${ca}" target="_blank" rel="noopener">Explorer ↗</a>`
        : `<span class="soon">Contract coming soon</span>`;
      return `<div class="chain chain-${key}"><h4>${ch.label}</h4>${body}</div>`;
    };
    $("chainCards").innerHTML = ["base", "robinhood", "bsc", "solana"].map(chainCard).join("");
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

  async function evmBalance(chainKey, holder) {
    const { rpc: url } = C.chains[chainKey];
    const ca = C.contracts.evm;
    const data = "0x70a08231" + holder.toLowerCase().replace("0x", "").padStart(64, "0"); // balanceOf(address)
    const [raw, dec] = await Promise.all([
      rpc(url, "eth_call", [{ to: ca, data }, "latest"]),
      rpc(url, "eth_call", [{ to: ca, data: "0x313ce567" }, "latest"]), // decimals()
    ]);
    if (!raw || raw === "0x") return 0; // contract not deployed on this chain
    return Number(BigInt(raw)) / 10 ** Number(BigInt(dec));
  }

  async function solBalance(owner) {
    const res = await rpc(C.chains.solana.rpc, "getTokenAccountsByOwner", [
      owner, { mint: C.contracts.solana }, { encoding: "jsonParsed" },
    ]);
    return res.value.reduce((sum, a) => sum + (a.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
  }

  async function loadBalances() {
    const list = $("balList");
    const keys = state.kind === "evm" ? EVM_CHAINS : ["solana"];
    const ca = state.kind === "evm" ? C.contracts.evm : C.contracts.solana;

    if (!ca) {
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
          const v = k === "solana" ? await solBalance(state.address) : await evmBalance(k, state.address);
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

  const solProviders = () => {
    const out = [];
    if (window.phantom?.solana?.isPhantom) out.push({ name: "Phantom", p: window.phantom.solana });
    if (window.solflare?.isSolflare) out.push({ name: "Solflare", p: window.solflare });
    if (!out.length && window.solana) out.push({ name: "Solana wallet", p: window.solana });
    return out;
  };

  function openModal(filter) {
    const evm = state.evmProviders.length
      ? state.evmProviders.map((d, i) => ({ label: d.info.name, icon: d.info.icon, tag: "EVM", go: () => connectEvm(d.provider), i }))
      : window.ethereum ? [{ label: "Browser wallet", tag: "EVM", go: () => connectEvm(window.ethereum) }] : [];
    const sol = solProviders().map((s) => ({ label: s.name, tag: "Solana", go: () => connectSol(s.p) }));
    let opts = filter === "evm" ? evm : filter === "sol" ? sol : [...evm, ...sol];

    const box = $("walletOptions");
    if (!opts.length) {
      box.innerHTML = `<p class="muted">No wallet detected. Install <a href="https://metamask.io" target="_blank" rel="noopener">MetaMask</a>,
        <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener">Coinbase Wallet</a> or
        <a href="https://phantom.com" target="_blank" rel="noopener">Phantom</a>, then reload this page.
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
      const res = await provider.connect();
      setWallet("sol", (res?.publicKey || provider.publicKey).toString(), provider);
    } catch (e) {
      toast(e.message || "Connection rejected");
    }
  }

  function setWallet(kind, address, provider) {
    Object.assign(state, { kind: kind === "evm" ? "evm" : "sol", address, provider });
    $("walletButtons").classList.add("hidden");
    $("walletConnected").classList.remove("hidden");
    $("walletAddr").textContent = address;
    $("walletStatus").textContent = kind === "evm"
      ? "Reading your balance on Base, Robinhood Chain and BNB Chain."
      : "Reading your balance on Solana.";
    document.querySelectorAll('[data-action="connect"]').forEach((b) => (b.textContent = short(address)));
    loadBalances();
    loadLeaderboard();
    document.getElementById("check").scrollIntoView({ behavior: "smooth" });
  }

  function disconnect() {
    try { state.kind === "sol" && state.provider?.disconnect?.(); } catch {}
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
    else if (a === "connect-evm") openModal("evm");
    else if (a === "connect-sol") openModal("sol");
    else if (a === "close-modal") closeModal();
    else if (a === "refresh") loadBalances();
    else if (a === "disconnect") disconnect();

    const copy = e.target.closest("[data-copy]");
    if (copy) navigator.clipboard.writeText(copy.dataset.copy).then(() => toast("Address copied"));
  });
  $("walletModal").addEventListener("click", (e) => e.target.id === "walletModal" && closeModal());

  renderStatic();
  tick();
  setInterval(tick, 1000);
  loadLeaderboard();
})();
