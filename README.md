# HypeLens — Liquidation & Smart-Money Intel for Hyperliquid

Chrome extension (Manifest V3) that adds free liquidation-wall + smart-money-positioning intelligence to **app.hyperliquid.xyz** — the kind of data usually paywalled on Coinglass / Hyperdash. It renders its own compact candlestick chart with a liq-wall heatmap and a **liq-aware leverage slider** whose liquidation line moves and recolors by volatility as you drag it — so you see where your liq price lands relative to the crowded walls before you enter.

> See the real liquidation walls on Hyperliquid — on-chain, not estimated. A stress map for your position, not a crystal ball.

**Read-only. No wallet access. No execution. No data collection.**
Informational only. Not financial advice. Leveraged trading carries substantial risk — you can lose all funds. No tool can prevent liquidation.

## What it does

A small draggable **chip** sits over Hyperliquid ("◉ BTC 58% SHORT · wall $62k -2.3%"). Click it to open **one compact window** — a self-contained trading HUD:

- **Our own candlestick chart.** Rendered on a canvas from HL's `candleSnapshot` data (we do NOT try to overlay HL's TradingView chart — its canvas-rendered axis is unreachable from an extension). Because it's our chart, `price→pixel` is exact and everything aligns.
- **Liq-wall heat bands.** Each major liquidation cluster drawn as a horizontal band on the chart, thickness/opacity ∝ wall $USD.
- **Volatility-distance risk coloring.** Computed honestly from the candles (log-return stdev → typical daily move %). Every level — each wall and your own liq line — is colored **red** (≤1 typical daily move away) / **orange** (≤2.5) / **green** (beyond). No invented "% chance of liquidation."
- **LIQ-AWARE SIZING slider.** Pick direction / size / leverage (isolated·cross). Your computed liquidation price draws as a bright line that **moves and recolors live** as you drag the leverage slider — the visceral "am I in range of a wall" read. One tiny label: `13x · liq $59.6k · ~0.8 daily moves ⚠`. Optional `reach est ≈X% in 24h` is explicitly a *volatility estimate, not a prediction*.
- **Smart-money split bar + funding chip.** A single red/green bar ("smart money 58% SHORT") and a small funding chip.
- **Place button (stub).** Shaped as the Module-3 order hook — v1 is read-only; clicking it just explains one-click ordering arrives later. No wallet, no signing, no permissions.

Design principle: an on-screen HUD of numbers + bars + color, almost no prose. One chip + one window. It never covers HL's right-side order form.

## Trust posture

- **Open source, no build step** — plain vanilla JS in `extension/`. What you read is what runs.
- **Two hosts only** — content scripts on `app.hyperliquid.xyz`; the only outbound API is `POST https://api.hyperliquid.xyz/info` (Hyperliquid's public, keyless info API) plus, once deployed, one fetch of a precomputed intel JSON.
- **One permission** — `storage`. No `tabs`, no `activeTab`, no `<all_urls>`, no cookies, no scripting-injection permission.
- **No wallet surface** — never touches `window.ethereum`, keys, or signatures. All UI is fixed-position, appended to `<body>`.
- **No telemetry.**
- **Honest data labels** — smart-money + liq data is marked **PREVIEW (sample data)** everywhere until the live wallet cache is connected; funding is always live.

## Data architecture

- **Funding / markets** — live from `metaAndAssetCtxs` + `predictedFundings`, polled 30s, cached in `chrome.storage.session`.
- **Liq walls + smart money** — a thin backend cron (`worker/aggregate-intel.mjs`, **not yet deployed**) fans out the top ~200 leaderboard wallets → `clearinghouseState`, buckets `liquidationPx × positionValue` into price bins per coin (long-liq below / short-liq above) and computes each coin's net profitable-wallet side, writing one compact JSON. The extension fetches only that JSON (`HYPELENS_DATA_URL`, currently unset → PREVIEW placeholder). `clearinghouseState` is also used directly to enrich a single inspected wallet.

## Project layout

```
hypelens/
├── extension/
│   ├── manifest.json        MV3 · storage-only · 2 content scripts (ISOLATED + MAIN)
│   ├── viewmodel.js         data-shape contract + shared math (funding, liq, leverage)
│   ├── background.js        HL public info client + intel-cache fetch + storage
│   ├── content.js           chip + mini-chart window (canvas candles · liq heatmap · vol coloring · sizing slider)
│   ├── content.css
│   ├── popup.html/js/css    headline intel + focus-coin card + share card
│   └── icons/
├── worker/aggregate-intel.mjs   backend liq/smart-money aggregator (STUB — not deployed)
├── PORTING.md · CHANGELOG.md
└── web/, worker/, marketing-auto/   Module-2 scaffolding ported from PolyParlay (not live)
```

Structural port of [PolyParlay](/Users/clawdlawd/polyparlay/) (our shipped Polymarket extension); `PORTING.md` audits kept-vs-swapped.

## Install (load unpacked)

1. `chrome://extensions` → enable **Developer Mode**
2. **Load unpacked** → select `hypelens/extension/`
3. Open `https://app.hyperliquid.xyz/trade/BTC`
4. Liq-wall lines draw on the chart (PREVIEW sample data until the backend is live); a corner badge shows the nearest wall. The hero card (top-right) has the liq-aware leverage tool — drag leverage and watch your liq line move on the chart. The **HypeLens** pill (bottom-right) opens the detail panel; click any coin in the list to load its ladder.

## Roadmap

- **Module 1 (this)** — read-only liq + smart-money intel + liq-aware leverage. Storage-only permission. Build trust first.
- **Module 2 — deployed intel backend + wallet intel** — ship the aggregator (live walls replace PREVIEW), paste-an-address read-only wallet analysis, shareable cards.
- **Module 3 — one-click actions** — opt-in order routing via an HL **builder code** (protocol-native fee/referral). Separate explicit permission escalation; Modules 1–2 stay usable without it.
