# Gift Dream World — Pangea Gift ($GIFT) · pangeagift.xyz

Surreal / dreamcore 3D site (Three.js, vendored in `js/vendor/`): floating islands, clouds, gifts, stairs and portals. The camera flies island → island as you scroll.

Each island is its own page (History API routes, `vercel.json` rewrites to `index.html`). Switching pages flies the camera to that island with a cloud-sweep transition. The full contract address bar stays visible on every page.

| Page | URL | Data source |
|---|---|---|
| I · Midnight Gift | `/` | countdown, wallet balances (RPC), `leaderboardUrl` |
| II · Staking Isle | `/staking` | `staking.address` contract |
| III · Mystery Box Isle | `/mystery-box` | `mysteryBox.address` contract |
| IV · Lucky Draw Isle | `/lucky-draw` | `luckyDraw.address` contract |
| V · Vault | `/vault` | config (brands, chains, rules, FAQ) |

An island with an empty contract address shows a "not published yet" state — no fake APR, rewards, prizes or history.

Static frontend (single chain or multi-chain): Top 5 $GIFT holders win a gift card every day; snapshot at 00:00 New York time.

## Edit settings
All settings live in `js/config.js`:
- `mode` — `"single"` = only `singleChain` · `"multi"` = always all 4 chains (Solana, Robinhood, Base, BSC), ordered by `multiOrder`
- `singleChain` — `robinhood` | `solana` | `base` | `bsc` (texts, accent color, tagline, wallets and balances follow it)
- `contracts.evm` — $GIFT CA shared by all EVM chains (Robinhood, Base, BSC)
- `contracts.sol` — $GIFT mint on Solana
- `chains.<key>` — `label`, `short`, `color`, `tagline`, `ca` (empty `ca` → `contracts.evm` / `contracts.sol`)
- Chains with the same CA share one "Copy CA" block (multi: RH/BASE/BSC + SOL)
- `socials.x` — X handle
- `rewards.current` / `rewards.value` — today's gift brand and value
- `chains.robinhood.rpc` — RPC endpoint (use your own for production)
- `leaderboardUrl` — JSON endpoint for the Top 5 (backend, later)

## Deploy on Vercel
Framework Preset: **Other** · Build Command: empty · Output Directory: `.`

## Island contracts (set addresses in `js/config.js`)
Each island: `chain` (EVM chain key), `address`, optional `fromBlock` (deploy block, speeds up history), `historyBlocks`, `logChunk`.
Optional functions are auto-detected from the bytecode (also behind EIP-1967 proxies).

**Staking** (Synthetix StakingRewards-style)
- required: `totalSupply()`, `balanceOf(address)`, `earned(address)`, `stake(uint256)`, `withdraw(uint256)`, `getReward()`
- optional: `stakingToken()`, `rewardsToken()`, `rewardRate()`, `periodFinish()`, `exit()`, `claimDaily()`, `nextClaimTime(address)`
- events: `Staked(address indexed user,uint256)`, `Withdrawn(address indexed user,uint256)`, `RewardPaid(address indexed user,uint256)`, `DailyClaimed(address indexed user,uint256)`
- APR is shown only when reward token = staking token and the reward period is live: `rewardRate × 31,536,000 / totalSupply`.

**Mystery Box**
- `boxPrice()`, `openBox(uint256 count)`; optional `paymentToken()`, `maxPerTx()`, `prizeName(uint256)`
- event `BoxOpened(address indexed user, uint256 indexed boxId, uint256 prizeId, uint256 amount)`

**Lucky Draw**
- `spinCost()`, `segmentCount()`, `segmentReward(uint256)`, `spin()`; optional `paymentToken()`
- event `SpinResult(address indexed user, uint256 indexed spinId, uint256 segment, uint256 reward)`

Payment is in $GIFT (`paymentToken()` or `contracts.evm`); the site asks for an exact-amount approval first.
Results are read from the tx receipt; VRF-style contracts that settle later are polled for ~90 s.
