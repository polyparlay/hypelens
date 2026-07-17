# HypeLens cascade/magnet calibration — PRE-REGISTRATION
Registered: 2026-07-15 (before any data collection). Scoring rules below are
FROZEN — changing them after data starts invalidates the run (EdgeClaw doctrine:
the scorecard is written before the game, hash this file to detect edits).

## What is being tested
The shipped HypeLens model (extension/viewmodel.js `computeCascade`, k=0.6,
maxStep=6%, and the "clusters are magnets" doctrine in hud.js) makes three
falsifiable claims that have NEVER been scored against outcomes:

- **H1 — MAGNET**: price is *pulled toward* big real-liq walls. When a wall
  ≥$10M sits within 1.5% of mark, price touches the wall band (±0.35%) within
  24h MORE OFTEN than it touches the equidistant anti-magnet price on the
  opposite side (the random-walk control).
- **H2 — CASCADE**: when an armed chain exists (chain=true, depthSource≠proxy)
  and price subsequently touches triggerPx within 24h, the chain carries price
  ≥50% of the way from trigger to terminalPx within the following 6h. Also
  logged (diagnostic, not gated): the terminal-reach ratio distribution, for
  retuning k.
- **H3 — SWEEP-AND-REVERSE**: after price touches a ≥$10M wall band, it
  reverses ≥50% of its approach distance within 4h (the "wall holds first
  touch" claim behind PLACE LEVELS' stop placement).

## Method (frozen)
- Collector runs every 30 min via cron on the top-OI coins present in the
  whale crawl (aggregate-intel.mjs, TOP_N=200 wallets). Each snapshot stores
  mark, oiNtl, dayNtlVlm, the raw cluster set, both cascades from the SHIPPED
  computeCascade (no reimplementation), and the nearest ≥$10M wall within 1.5%.
- Scorer joins 1h candles (public candleSnapshot) once a snapshot is ≥25h old.
  Touch = candle [low,high] intersects the target band. One score per snapshot;
  snapshots of the same coin within 6h of a previously SCORED armed event are
  skipped for H2/H3 (event dedup — no double-counting the same setup).
- Effect sizes use Wilson 95% lower bounds.

## Go / no-go (frozen)
- **n gate**: no claim of any kind before n≥100 scored events per hypothesis.
- **H1 passes** if Wilson-lower(P_touch_magnet) > Wilson-upper(P_touch_control)
  at n≥100 paired events.
- **H2 is calibration, not pass/fail**: report trigger-hit rate and the
  terminal-reach ratio; k is retuned ONLY after n≥50 trigger-touch events and
  only prospectively (new PREREG addendum, old data kept).
- **Marketing use**: a hit-rate may be quoted publicly ONLY as
  "Wilson-lower ≥55% at n≥100", quoted with its n.
- **Failure is a result**: if H1/H3 fail, the extension's copy changes (drop
  "magnet"/"hunted" language) — the tool must not claim what the data refutes.

sha256 of this file at registration is stored in data/prereg.hash.
