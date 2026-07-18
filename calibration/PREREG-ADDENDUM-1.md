# Addendum 1 — collector coverage expansion (registered 2026-07-18, PROSPECTIVE)
Discovery (2026-07-18): the frozen collector (aggregate-intel top-200-by-account-value)
missed a $20.5M BTC wall @ $59,482 visible in the extension's 300-wallet
"profitable whales" set. Under-coverage biases magnet/cascade event detection.
CHANGE (prospective only, applies to snapshots from this date): the collector's
wallet set becomes the UNION of aggregate-intel top-200 and extension
data/whales.json (300). Snapshots before this addendum are scored under the old
method and flagged `method:1`; after, `method:2`. No retroactive rescoring.
All hypotheses, thresholds, windows, and go/no-go gates are UNCHANGED.
