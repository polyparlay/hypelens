# Addendum 2 — collector reads the v0.22 feed (registered 2026-07-22, PROSPECTIVE)
Discovery (2026-07-22): the v0.22.0 aggregate-intel rewrite (2026-07-18) stopped
emitting JSON on stdout (it writes docs/feed/hypelens-intel.json and logs to
stderr), so cascade_shadow --collect crashed on every run from 2026-07-18 12:30
through 2026-07-22. ZERO snapshots were produced under Addendum 1's method — no
method:2 data exists to contaminate.
CHANGE (prospective only): the collector now runs the aggregator and reads the
feed file it writes. The wallet universe becomes the v0.22 aggregator's
union(top-500 by account value, top-700 by weekly volume) ≈ 1,110 wallets — a
superset of Addendum 1's intended union(top-200, whales.json 300), so this
SUPERSEDES Addendum 1 before any data was collected under it. Liq levels are
the feed's raw per-position entries [liqPx, notionalUsd]. Snapshots from this
date carry an explicit `method: 2` field; earlier rows (implicit method:1,
2026-07-15 → 2026-07-18) are unchanged and scored under the old method.
All hypotheses, thresholds, windows, and go/no-go gates are UNCHANGED.
