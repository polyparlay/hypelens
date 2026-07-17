# HypeLens — see the liquidation map Hyperliquid doesn't show you

Free, open-source Chrome extension (Manifest V3) that overlays **real on-chain
liquidation intelligence** on **app.hyperliquid.xyz** — the official app you
already trade on. Because Hyperliquid is fully transparent, HypeLens computes
liquidation walls from **real top-wallet positions, not estimates** — the thing
CEX heatmap tools (which openly admit their maps are modeled guesses) cannot do.

> A stress map for your position, not a crystal ball. Not financial advice.
> Leveraged trading carries substantial risk; no tool can prevent liquidation.

## What you get

- **Real-data liquidation heatmap** on our own exactly-aligned candlestick
  chart — every bright band is real notional that liquidates at that price,
  with a "% of OI covered" credibility badge.
- **Your liq vs the crowd (Guardian)** — connect read-only and see whether
  *your* liquidation price sits on a crowded wall, with a single honest verdict
  line: `⚠ 16× · liq $60,725 · on $17M wall → 20×`.
- **True account-wide cross-margin liquidation** — HL's UI shows per-position
  estimates; cross liq is account-wide. HypeLens computes the real one, plus a
  what-if stress test across your whole book.
- **ADL exposure** — estimated auto-deleverage queue rank from Hyperliquid's
  published priority formula (profit × leverage), including the hedge-leg
  warning for the exact failure mode of Oct 10, 2025. Labeled *estimated* —
  there is no official queue API.
- **Named-whale drill-down** — tap a wall to see which wallets compose it,
  their size, exact liq price, and explorer links.
- **Cluster-aware level placement** — one tap computes SL (cold side of the
  wall, not in the sweep path), TP (front-running the magnet), and the nearest
  leverage whose liq lands in a gap. Drawn as draggable lines, never orders.
- **Optional one-click placement** — entry + SL + TP via Hyperliquid's
  agent-wallet mechanism, monetized by a **1bp builder fee, disclosed loudly
  and pinned in code**. Your keys never touch the extension
  (see [SECURITY.md](SECURITY.md)). Mainnet ships disabled until public
  testnet verification.

## Honesty engineering (why you can trust the numbers)

- **Real vs estimated is labeled everywhere.** Real positions say so; anything
  modeled (ADL rank, cascade impact) is labeled estimated, with the method in
  the tooltip.
- **The model is on trial in public.** `calibration/` contains a frozen,
  hash-guarded pre-registration (`PREREG.md`) that scores our magnet/cascade
  claims against real outcomes on a cron — written *before* data collection.
  If the data refutes a claim, the claim comes out of the product.
- **The launch itself is pre-registered** (`PREREG-LAUNCH.md`): adoption
  thresholds and kill criteria were frozen before the store listing went live.
- **No telemetry.** The extension talks to Hyperliquid's public API and nothing
  else.

## Install

- Chrome Web Store: *(pending review)*
- From source: clone → `chrome://extensions` → Developer mode →
  **Load unpacked** → select `extension/`. The manifest requests `storage` +
  the two Hyperliquid API hosts, nothing else. Plain vanilla JS, no build
  step — what you read is what runs.

## Repo map

| Path | What |
|---|---|
| `extension/` | The extension (content script, heatmap/HUD, risk engine) |
| `extension/exchange/` | Agent-wallet vault, EIP-712 builders, signer (see SECURITY.md) |
| `calibration/` | Pre-registered model-accuracy program (collector + scorer) |
| `worker/` | Liquidation-cascade alert bot (Cloudflare Worker) + intel aggregator |
| `PREREG-LAUNCH.md` | Frozen launch adoption gate |

MIT licensed. Issues and PRs welcome — especially adversarial review of
`extension/exchange/`.
