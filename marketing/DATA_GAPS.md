# DATA_GAPS.md — verified data-availability landscape

Compiled 2026-07-06. Question this doc answers: **for each data type HypeLens could surface, does it already exist somewhere free — and if so, why would anyone install us?** Verdicts: EXISTS-FREE / EXISTS-PAID / SCATTERED / DOESN'T-EXIST. Every verdict sourced; unverified items flagged. The punchline is at the bottom: our moat is **placement and assembly**, not data exclusivity — except hyperps, where we'd be first.

---

## 1. Funding data

| Item | Verdict | Detail |
|---|---|---|
| Current funding, all assets, one table | **EXISTS-FREE, several places** | HL's own orderbook header (per-asset, hourly); [CoinGlass HL exchange page](https://www.coinglass.com/exchanges/Hyperliquid) (verified: per-pair funding + OI + liq columns); ASXN's [funding dashboard](https://data.asxn.xyz/dashboard/hl-funding-rate) (free; JS-heavy, depth unverified); Hyperdash terminal. |
| **Predicted / next-stamp funding** | **EXISTS-FREE — natively, incl. cross-venue** | ⚠️ Assumption reversal: HL's keyless API `predictedFundings` returns predicted rates for HL **and Binance and Bybit** in one response ([docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals)); the app reportedly shows predicted next-hour on hover (secondhand — [eco.com](https://eco.com/support/en/articles/15082536); verify in-app). Not supported for HIP-3 markets. **But: no third party charts/surfaces it prominently** — raw availability ≠ visibility. |
| Historical funding charts per asset | **SCATTERED** | Raw: free via API `fundingHistory`. UIs: HL app's chart tab can reportedly overlay funding (secondhand — verify); [Coinalyze](https://coinalyze.net/) supports HL (bot-blocked fetch; known "not real-time" caveat); CoinGlass aggregates HL in its [FundingRate table](https://www.coinglass.com/FundingRate) but HL depth is "minimal compared to CEXs" ([buildix assessment](https://www.buildix.trade/blog/coinglass-alternatives-open-interest-funding-rate-tools-2026)), heatmaps behind Pro ($29-699/mo); [Loris Tools](https://loris.tools) has HL funding history/heatmaps. **No single authoritative free UI.** |
| Cross-venue funding spread (arb signal) | **EXISTS-FREE — natively, twice** | ⚠️ Assumption reversal: HL ships [app.hyperliquid.xyz/fundingComparison](https://app.hyperliquid.xyz/fundingComparison); ASXN's dashboard is literally framed as funding-*arb*; CoinGlass table includes HL. Nuance any comparison must handle: HL settles hourly vs CEX 8h. **Never claim we're first here.** |

## 2. Open interest

- Raw per-asset OI: **EXISTS-FREE** — one `metaAndAssetCtxs` call returns `openInterest`, `funding`, `markPx`, `oraclePx`, `premium`, `dayNtlVlm`, `impactPxs` for every perp, no key.
- OI in UIs: CoinGlass HL page (verified, incl. 5m/30m/1h OI-change columns); Coinalyze aggregate includes HL; deeper history behind CoinGlass Pro.
- **OI-change alerts / OI-volume divergence for HL specifically: DOESN'T-EXIST as a dedicated free product** (as far as searches show — not exhaustive). CoinGlass generic alerts are Pro-gated. Candidate HypeLens v1.x feature: "OI spiked 25% in an hour on X-PERP" is card-engine fuel and in-app badge fuel.
- Hyperdash OI analytics: unconfirmed; their marketing emphasizes liq maps/cohorts/whale flow.

## 3. Liquidation data

- **Hyperdash liq heatmap: EXISTS-FREE** ([legacy liqmap](https://legacy.hyperdash.com/liqmap)) — no pricing page exists (hyperdash.com/pricing 404s); they monetize via a 1.5bp builder fee on trades through their terminal, not data subs. Their claim: HL liq maps are *calculated* from on-chain positions, not estimated (their own marketing; plausible).
- CoinGlass has a free [HL liquidation-map page](https://www.coinglass.com/hyperliquid-liquidation-map); the full heatmap toolkit is Pro.
- Also: Trading Different, Kingfisher. Verdict: **crowded and free — not our wedge.** Don't build liq maps for v1.

## 4. Wallet / trader intel

**EXISTS-FREE but SCATTERED across ~6 destination sites** — and it's the *most crowded* category: HypurrScan (free explorer, exact free-feature list unverified — JS app), Hyperdash (cohorts, whale alerts, proprietary **Copy Score**), [HyperStats](https://hyperstats.org/traders) (grades traders S+ to F on realized PnL/risk/sizing), [Dexly leaderboard](https://dexly.trade/hyperliquid/leaderboard), HyperTracker (1.5M wallets), [CoinGlass /hl](https://www.coinglass.com/hl), Nansen (paid HL leaderboard API).

- HL's native leaderboard is backed by an **unofficial** endpoint (`stats-data.hyperliquid.xyz/Mainnet/leaderboard` — referenced in client libs, not in official docs); native UI lacks win rate, realized/unrealized split, per-trade history at the leaderboard level (high-confidence but SPA-unverified — enumerate columns manually before printing).
- Implication for **Module 2**: differentiation cannot be "wallet stats exist" (they do, six times over). It must be (a) **in-page overlay** while trading, (b) the **funding-paid-vs-earned framing** (uses `userFunding` — no incumbent leads with it), (c) the shareable report-card artifact. Copyability *scoring* is already done twice (Hyperdash, HyperStats) — don't rebuild it.

## 5. Hyperps — the genuine void

**DOESN'T-EXIST.** Targeted searches for hyperp premium/mark-vs-EMA/conversion-catalyst tooling returned only official docs, news about the 10x-EMA mark-cap change (post-sniping incident), and generic funding tools. Closest substitute: a paid Apify scraper that incidentally outputs mark-vs-oracle for all perps. **HypeLens's hyperp flags + premium display would be first-of-kind.** Technical care: HL's hyperp mark formula now blends external pre-launch perp prices where they exist, so "premium vs own EMA" needs the current formula, not the 2024 one.

## 6. "Where do I find X" demand evidence

**UNVERIFIED — tooling limitation.** Reddit results were unreachable across all query shapes, so no direct question-thread URLs. Proxy evidence demand exists: buildix.trade's post is framed entirely around CoinGlass's HL gaps as a "common frustration," and a dense SEO layer of learn-articles (Hyperdash heatmap explainer, eco.com funding guide, Chainstack/Dwellir `fundingHistory` API guides) targets exactly these queries — content farms follow search volume. **Action:** manual Reddit/Google pass before printing any "traders keep asking where to find…" claim; PROBLEM.md carries the complaint-evidence burden.

## 7. HL public API (our supply line) — confirmed

`POST https://api.hyperliquid.xyz/info` — free, keyless ([docs verified](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals)). Exposes everything Module 1 + 2 need raw: `metaAndAssetCtxs`, `predictedFundings` (cross-venue), `fundingHistory`, `clearinghouseState` (any wallet's positions), `userFunding`, `perpsAtOpenInterestCap`, HIP-3 metadata. Leaderboard endpoint is unofficial (fragility risk for any Module-2 leaderboard feature). Rate limits: not captured — check docs before the card engine polls aggressively.

---

## Synthesis — what this means for build & copy

**Real gaps (build/say these):**
1. **Hyperp premium tracking — nothing exists.** Our only first-of-kind data claim; lead "alpha" card (VIRALITY.md type 2).
2. **Annualized + extreme-highlighted funding at the point of trade.** The data is free everywhere; nobody puts signed APR **inside the trade screen**. The gap is placement, not data.
3. **OI-change alerting** — no dedicated free product; cheap to add from data we already poll.
4. **One-glance assembly**: funding APR + premium + OI + hyperp flag currently requires HL app + CoinGlass + ASXN + Coinalyze tabs. SCATTERED is our favorite verdict — assembly inside the app is the product.

**Not gaps (never claim these):**
- Predicted funding (HL API ships it, cross-venue).
- Cross-venue funding comparison (HL has a native page for it).
- Liquidation maps, wallet trackers, copyability scores (crowded, free).

**Honest one-sentence moat:** every number HypeLens shows is freely available *somewhere* — HypeLens's value is showing the four that matter **on the screen where you click Buy**, plus hyperps, which nobody shows anywhere.
