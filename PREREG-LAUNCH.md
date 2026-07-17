# HypeLens LAUNCH ADOPTION GATE — PRE-REGISTRATION
Registered 2026-07-15, BEFORE store submission. Thresholds frozen; changing them
after launch invalidates the experiment (same doctrine as calibration/PREREG.md).
sha256 of this file recorded in calibration/data/launch_prereg.hash at registration.

## The bet being tested
The product gap is evidence-backed (personal risk truth at point of trade; whale
drill-down). The UNVALIDATED bet is the form factor: will HL traders install and
trust a wallet-adjacent Chrome extension enough to route orders through it, against
a documented $713M/yr extension-trust headwind? Only installs can answer this.

## Metrics + windows (frozen)
Clock starts the day the Chrome Web Store listing goes public AND the alert-bot
funnel is live (both required; if only one is live the clock has not started).
Evaluation at T+6 weeks.

- **M1 Distribution**: unique installs at T+6wk.
  - CONTINUE ≥ 500 · ITERATE 100–499 · **KILL < 100** (funnel live the whole
    window). Kill = the overlay-of-official-app distribution thesis is wrong →
    stop solo-distribution investment; remaining value = embed/grant pitches.
- **M2 Activation**: % of installers who open the overlay on ≥3 distinct days
  within their first 14 days (measured only if consented telemetry ships;
  otherwise proxied by store-reported weekly-active/installs).
  - CONTINUE ≥ 25% · ITERATE 10–25% · **KILL < 10%** at n≥200 installs.
- **M3 Monetization conversion**: installers → builder-fee approvals.
  - Evaluated only at n≥300 installs. CONTINUE ≥ 5% · ITERATE 2–5% ·
    **KILL < 2%** = the one-click/builder-code revenue thesis fails regardless
    of M1/M2 → product survives only as pitch material (embed/grant).
- **Guardrail**: any security incident involving the signing path = immediate
  halt of one-click for all users (kill switch), independent of metrics.

## What KILL means (frozen)
Kill is a verdict on the THESIS named in the metric, not on the codebase. No
"one more month" extensions: a killed metric's thesis may only be revived by a
NEW pre-registered experiment with different mechanics (e.g. embed distribution).

## Trust-engineering launch blockers (all must precede store submission)
1. Public open-source repo (extension code as shipped, tag = store version).
2. Store listing + first-run screen state the 1bp builder fee explicitly and
   that HypeLens never touches private keys / seed phrases (anti-Crypto-Copilot).
3. Minimal permissions (storage + the two HL API hosts only) in the launch build.
4. Mainnet one-click stays OFF until the operator's testnet placement proof.
