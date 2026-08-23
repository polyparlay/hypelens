# PREREG — MAGNET-V1 mechanical strategy shadow (frozen 2026-08-24)

Derived from the PASSED calibration result (H1, n=749, report 2026-08-21: magnet-wall
touch within 24h 73-80% Wilson vs 48-55% control) and the preliminary H3 profile
(sweep-reverse ≥50% of approach within 4h, 21/21, below its n=100 gate). This file is
hash-frozen; any edit invalidates the run (same guard as calibration PREREG.md).

## Signal (identical to calibration H1 arm)
A snapshot (calibration/data/snapshots.jsonl, method 2) carries a magnet: largest
real-position wall ≥ $10M within 1.5% of mark. Tradeable arm additionally requires
approach distance ≥ 0.40% (magnet.distFrac ≥ 0.004) so an approach exists outside the
touch band (BAND = 0.35%). Dedup: one intent per (coin, wall-price 0.4% bucket) per
24h. Both variants fire on every armed intent. Paper notional: $1,000 per variant.

## Variant A — "approach" (trades H1)
Enter at arm, at snapshot mark, toward the wall (wall below mark → SHORT; above → LONG).
- TP: near edge of wall touch band (wall×(1+BAND) when approaching from above,
  wall×(1−BAND) from below).
- SL: symmetric — arm mark ± approach distance, opposite side (1:1).
- Time-stop: 24h after arm → exit at last candle close.
- Same-candle TP+SL ambiguity resolves to SL (conservative).

## Variant B — "fade" (trades H3)
Wait for first touch of the wall band within 24h of arm. No touch → no trade (skip).
On touch: enter AGAINST the approach at the wall price.
- TP: 50% retrace of the approach (halfway back to arm mark).
- SL: 50% of approach distance beyond the wall (1:1).
- Time-stop: 4h after touch → exit at last candle close.

## Cost model (fixed, conservative, applied to every simulated fill)
- Taker fee 4.5 bps per side (HL tier-0, no discounts assumed) — both sides.
- Slippage 1.5 bps per side adverse.
- Funding: actual hourly HL fundingHistory over the hold, signed (long pays positive).
- Fills only at TP/SL/time-stop prices with the above haircuts; candle-walk on 5m
  candles from the public API at resolution time. No mark-to-market counts as a win.

## Gates (evaluated per variant, independently)
- G1 sample: ≥ 30 resolved fires.
- G2 economics: net ROI (net P&L ÷ gross notional deployed) ≥ +0.10% per fire.
- G3 statistics: Wilson 95% lower bound of win rate > realized breakeven WR
  (breakeven = avgLoss ÷ (avgWin + avgLoss) on resolved fires).
- PASS = G1 ∧ G2 ∧ G3 at the deadline report. Early stop only for the kill side
  (net ROI ≤ −1.0% per fire at n ≥ 20 → variant dead).

## Deadline & go/no-go
Report date: **2026-10-05** (6 weeks). PASS does NOT authorize live fire. Live
requires, in order: (1) PASS at deadline; (2) operator testnet money-path proof through
agent-rail; (3) explicit operator flip of MAINNET_PLACEMENT_ENABLED + halt-lift
sign-off. Execution path on go: agent-rail placeOrder (risk-gated, builder code
attached) against the operator's connected Hyperliquid account. Until all three:
shadow only; the strategy code contains no order-placement calls.

## Cohort rule (in-sample exclusion)
Snapshots before this file's freeze are the SAME data H1/H3 (and hence variants A/B)
were derived from. Intents armed from them are labeled `insample` and are EXCLUDED
from all gates — reported separately as context only. Gates evaluate exclusively
intents with t0 ≥ 2026-08-23T23:00:00Z (prospective cohort).

## Known approximations (declared now, not discovered later)
- Entry at snapshot mark assumes arm-time execution; snapshots are 30-min sampled, so
  real arms are detected late by 0-30 min. The shadow inherits this lag honestly (it
  uses the snapshot mark, not a backfitted better price).
- 5m candle-walk cannot see intra-candle ordering; resolved conservatively (SL first).
- Tier-0 fees overstate costs if volume discounts apply live. Acceptable: bias is
  against the strategy.
