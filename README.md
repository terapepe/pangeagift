# Pangea Gift ($GIFT) — pangeagift.xyz

Static frontend: Top 5 $GIFT holders win a gift card every day; snapshot at 00:00 New York time.

## Edit settings
All settings live in `js/config.js`:
- `contracts.evm` — CA for Base / Robinhood Chain / BNB Chain (same address)
- `contracts.solana` — Solana mint address
- `socials.x` — X handle
- `rewards.current` / `rewards.value` — today's gift brand and value
- `chains.*.rpc` — RPC endpoints (use your own for production)
- `leaderboardUrl` — JSON endpoint for the Top 5 (backend, later)

## Deploy on Vercel
Framework Preset: **Other** · Build Command: empty · Output Directory: `.`
