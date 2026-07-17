# HypeLens — the risk layer Hyperliquid's UI doesn't have
*Core pitch. Adapt per audience: GRANT skin stresses ecosystem safety + open source;
PARTNER/ACQUIRER skin stresses retention economics + shipped tech. One page each.*

## The problem (evidenced, not vibed)
- Oct 10, 2025: ~$10.3B liquidated on HL; first cross-margin ADL force-closed
  profitable positions of ~20,000 users (~$45–52M, arXiv:2512.01112). Traders'
  explicit ask afterward: **ADL queue visibility**. Jan 2026 repeated it ($1.68B).
- HL's own docs concede the displayed liquidation price "may not be the actual
  liquidation price." Cross-margin liq is account-wide; the UI shows per-position.
- An entire content industry exists explaining HL liquidation mechanics —
  confusion at scale, unserved at the point of trade.

## The product (shipped, v0.21.0, open source)
Chrome extension overlaying the **official** app.hyperliquid.xyz:
1. **Real-data liquidation heatmap** — from real top-wallet on-chain positions
   (possible only on a transparent venue; CEX tools admit theirs are estimates).
2. **True account-wide cross-margin liquidation** + whole-book stress test —
   the number HL's UI doesn't show.
3. **ADL exposure rank** (HL's published priority formula) + hedge-leg-amputation
   warning — the exact Oct-10 failure mode, packaged by nobody else.
4. **Named-whale liq drill-down** — the walls, by wallet ("democratized whale
   hunting" is already viral content; we put it on the chart you trade from).
5. **Cluster-aware SL/TP/leverage placement** + optional one-click execution
   (agent wallet; keys never touch the extension; 1bp builder fee, pinned).

## Why trust it (differentiated posture)
- **Open source** (github.com/polyparlay/hypelens), MIT, no build step, minimal
  permissions, SECURITY.md with full key architecture.
- **Pre-registered honesty**: our predictive claims are being scored against
  real outcomes under a frozen, hash-guarded pre-registration (calibration/) —
  written before data collection. If the data refutes a claim, the claim comes
  out of the product. Nobody in this category does this.
- **Signing pipeline verified against the live testnet API** (signature
  recovery confirmed end-to-end; builder fee pinned inside the signed action).

## The economics
- Builder codes are the proven HL model: top-10 = $63.5M cumulative; ~40% of HL
  DAU already trade through third-party frontends; Insilico = $1,116/user
  lifetime on 3k users. HypeLens executes at **1bp vs Hyperdash's 1.5bp**.
- Liquidated users churn. A risk layer that keeps traders alive keeps them
  paying fees — retention economics, not just tooling.

## The ask
*(grant skin)* Fund the free public-good layer: open-source risk
infrastructure that makes HL's radical transparency legible to its own
traders — and reduces the blowup→churn→bad-press cycle.
*(partner skin)* Embed the guardian/risk engine in your HL surface (white-label
or SDK), split the builder fee. Your users stop dying; your fee line compounds.
*(acquirer skin)* The full stack — heatmap, risk engine, ADL/cross-liq math,
signing module, calibration program — shipped, reviewed, open-source clean.
