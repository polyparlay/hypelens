# PORTING.md — PolyParlay → HypeLens audit

HypeLens v0.1.0 was created by copying `/Users/clawdlawd/polyparlay/` wholesale (2026-07-06, everything except `*.zip` release artifacts, `.git/`, `.DS_Store`) and transforming in place. This file makes the diff against PolyParlay auditable: one line per file, KEPT (byte-identical copy) vs ADAPTED (structure kept, content retargeted) vs REWRITTEN (new code in the ported file's architectural shape) vs NEW / REMOVED.

## extension/

| File | Status | Notes |
|---|---|---|
| `manifest.json` | REWRITTEN | MV3 skeleton kept (same key order/shape). Matches `polymarket.com` → `https://app.hyperliquid.xyz/*`; host_permissions cut from 6 hosts to `api.hyperliquid.xyz` only; permissions cut from `storage,activeTab,tabs` to `storage` only; `externally_connectable` (polyparlay.app pro-unlock channel) removed; renamed "HypeLens — Hyperliquid Funding & Market Intel" v0.1.0. |
| `background.js` | REWRITTEN | Same structural shape as PolyParlay's worker: API base const → fetch wrapper → `normalize*()` field-mapper → cache layer → `chrome.runtime.onMessage` switch router returning `true` for async. Gamma/data-api client swapped for HL public info client (`POST /info`, `metaAndAssetCtxs` + `predictedFundings`); slip-state CRUD, smart-money, base-rate, pro-unlock listeners removed (Module-1 is stateless read-only). Response field names verified against live API 2026-07-06. |
| `content.js` | REWRITTEN | PolyParlay injection pattern kept: IIFE, `*_ID` element constants, `isExtensionContextValid`/`markContextInvalidated` stale-context guard, floating button appended to `<body>`, slide-out panel. "+ Add to slip" button became the HypeLens pill → funding side panel; slug-from-URL detection became coin-from-URL/title detection; added per-coin badge + sortable table renderer. |
| `content.css` | REWRITTEN | Same UI inventory (floating button, slide-out panel) restyled to HL dark palette (#0f1a1f bg, #50d2c1 mint, green/red funding signs). |
| `popup.html` | ADAPTED | Skeleton kept: header (brand dot/name/tag + ghost actions) → headline-stats 3-cell strip → ticket card with collapsible settings bar (was pm-wallet-bar) → canvas `#card` 1200×630 → actions-group share row (Share to X / PNG) → footer. Slip legs body became the sortable funding table; Pro/upsell/history/execute sections removed; Google Fonts links removed (no external requests). |
| `popup.css` | ADAPTED | PolyParlay's neo-brutalist design system kept: same variable names (`--bg/--surface/--line/--muted/--accent/--green/--amber/--red/--shadow-sm`), hard offset shadows, dot-grid body background, mono numerals; palette swapped cream/ink → HL dark/mint. |
| `popup.js` | REWRITTEN | Architecture kept: helpers → state → renderers → `roundRect()` polyfill (verbatim) → `drawCard()` → `setShareStatus`/`downloadCard`/`copyImageToClipboard` (near-verbatim) → `shareToX()` intent+clipboard flow → DOMContentLoaded boot. Slip math/Monte Carlo/pro-gating removed; `drawCard()` retargeted from parlay slips to "funding extremes" cards (same layout lineage: ticker strip, brand header, ticket rows w/ offset shadows, hero footer, dashed provenance strip). |
| `icons/icon16/48/128.png` | NEW | HypeLens mark (teal square, mint lens ring), pure-Python generated. |
| `icons/*` (SVG explorations, 256/512, previews) | REMOVED | PolyParlay-brand parts bin; originals remain in polyparlay/. |
| `icons/README.md` | REWRITTEN | Documents the new mark. |
| `marketing/**` | KEPT | PolyParlay CWS/social/screenshot assets untouched — parts bin only; every asset must be regenerated for HypeLens before any store submission. |

## Root

| File | Status | Notes |
|---|---|---|
| `README.md` | REWRITTEN | PolyParlay README structure kept (pitch → layout tree → install-unpacked steps → feature explanation → roadmap); content is HypeLens trust-first read-only posture + Modules 2–3 roadmap. |
| `CHANGELOG-v1.0.53.md` | REMOVED | PolyParlay lineage; HypeLens restarts at v0.1.0 in new `CHANGELOG.md`. |
| `CHANGELOG.md` | NEW | v0.1.0 entry. |
| `PORTING.md` | NEW | This file. |
| `.gitignore` | KEPT | Unchanged. |

## web/ (Module-2 scaffolding — not live)

| File | Status | Notes |
|---|---|---|
| `index.html`, `slip.html`, `privacy.html`, `leaderboard.html`, `upgrade.html`, `vercel.json`, `og-default.png` | KEPT | Byte-identical PolyParlay site; still PolyParlay-branded; do not deploy. |
| `MODULE-2-SCAFFOLDING.md` | NEW | Marks intent + planned reuse per page. |

## worker/ (Module-2 scaffolding — not live)

| File | Status | Notes |
|---|---|---|
| `verify.js`, `wrangler.toml`, `README.md`, `TELEGRAM-SETUP.md` | KEPT | Byte-identical PolyParlay payment/Telegram worker; nothing runs for HypeLens Module 1. |
| `MODULE-2-SCAFFOLDING.md` | NEW | Marks intent. |

## marketing-auto/ (kept as-is)

All files KEPT byte-identical (x-poster, dm-packet, templates, plans, plist, `.env` with PolyParlay credentials). Retargets to HL content later; templates/copy still reference PolyParlay and must be rewritten before activation.

## v0.4 pivot additions (new files, not from PolyParlay)

| File | Status | Notes |
|---|---|---|
| `extension/viewmodel.js` | NEW | Shared data-shape contract + math (funding, liq clusters, liq-aware leverage). Loaded into both the content-script world and the popup (`window.HLVM`). |
| `extension/inject.js` | NEW | MAIN-world content script (manifest `world:"MAIN"`). Probes HL's TradingView widget for native `priceToCoordinate`, posts price→Y mappings + `[HypeLens diag]` logs to the isolated content script. |
| `worker/aggregate-intel.mjs` | NEW | Backend liq/smart-money aggregator (leaderboard → `clearinghouseState` → binned walls + net side). Stub, verified vs live APIs, not deployed. |
| `extension/background.js` | EXTENDED | Added `getIntel` (cached-JSON fetch from `HYPELENS_DATA_URL`, unset → PREVIEW) + `getWalletState` (single-wallet `clearinghouseState` enrichment). |
| `extension/content.js`, `content.css`, `popup.*` | REWRITTEN (v0.2→v0.4) | Hero pivoted from funding to liq/smart-money + on-chart overlay + leverage tool; compliance copy + disclaimers; SPA-safe detection; click-to-select nav. Permissions unchanged. |

## Verification performed at port time

- HL info API fetched live before coding: `metaAndAssetCtxs` → `[meta, ctxs]` parallel arrays (231 assets), ctx fields `funding/openInterest/prevDayPx/dayNtlVlm/premium/oraclePx/markPx/midPx/impactPxs/dayBaseVlm` (strings; `premium/midPx/impactPxs` null iff `isDelisted`); `predictedFundings` → `[coin, [[venue, {fundingRate, nextFundingTime, fundingIntervalHours}]]]` with `HlPerp` at 1h interval.
- `node --check` clean on `background.js`, `content.js`, `popup.js`; `manifest.json` + all JSON parse clean.
