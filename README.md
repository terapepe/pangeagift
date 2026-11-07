# Pangea Gift ($GIFT) — pangeagift.xyz

Static frontend on **Robinhood Chain**: Top 5 $GIFT holders win a gift card every day; snapshot at 00:00 New York time.

## Edit settings
All settings live in `js/config.js`:
- `contracts.evm` — $GIFT CA on Robinhood Chain
- `socials.x` — X handle
- `rewards.current` / `rewards.value` — today's gift brand and value
- `chains.robinhood.rpc` — RPC endpoint (use your own for production)
- `leaderboardUrl` — JSON endpoint for the Top 5 (backend, later)

## Deploy on Vercel
Framework Preset: **Other** · Build Command: empty · Output Directory: `.`
