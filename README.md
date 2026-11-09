# Pangea Gift ($GIFT) — pangeagift.xyz

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
