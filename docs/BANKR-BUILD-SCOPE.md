# HypeLens Intel on Bankr — build scope (2026-07-22)

Revenue-generating application built from existing HypeLens code, deployed on Bankr's
x402 Cloud. Scoped against measured Bankr economics (2026-07-22 leaderboard API pull —
see memory `machine-review-and-bankr-scope-2026-07-22`): token-fee revenue is a
launch-day lottery (NO-GO as a plan), so this build monetizes the OTHER lane —
**pay-per-call USDC endpoints selling real pre-trade intelligence to agents**, where
utility is actually what's paid for. Platform fee 0% on first 1,000 req/mo, 5% after;
revenue settles directly to our wallet.

## Product: `HypeLens Intel` — pre-trade risk API for HL-trading agents

Bankr agents can open leveraged Hyperliquid positions by prompt, but have ZERO
pre-trade risk data: no liq walls, no cascade estimates, no whale context. Every
endpoint below is a thin TypeScript wrapper over assets that already exist and run:

- **Data**: `docs/feed/hypelens-intel.json` — 1,112-wallet real-position crawl,
  10 coins, 50-69% OI coverage, refreshed every 15 min by the HYPELENS-INTEL-FEED
  cron and served publicly from raw.githubusercontent. Handlers just `fetch()` it —
  **no secrets, no infra, no state**.
- **Models**: `extension/viewmodel.js` pure functions — `computeCascade`,
  `liqPrice`/`maintMarginFraction`, `huntRiskCluster`, `suggestClearLeverage` —
  port to TS verbatim.
- **Honesty**: every response carries `coverage_pct`, `data_age_s`, and
  `estimated:false` labels (the data-honesty doctrine is a selling point vs
  estimate-based tools).

### Endpoints (v1 — 4 services)

| Service | Input | Output (from existing code) | Price |
|---|---|---|---|
| `liq-walls` | coin | clusters ≥$1M: price, sizeUsd, side, dist%; nearest wall; totals above/below; magnet flag (≥$10M within 1.5%) | $0.002 |
| `cascade` | coin, dir | `computeCascade`: trigger px, terminal px, total liq $, hop count, drop% | $0.005 |
| `pretrade-check` | coin, dir, leverage, entry? | liq price; does it land inside a wall (`huntRiskCluster`); nearest clear leverage (`suggestClearLeverage`); cascade-hits-you flag | $0.005 |
| `whale-book` | coin, topN? | top-N whale positions: liq px, entry, notional, side, addr | $0.01 |

`pretrade-check` is the wedge: it answers the exact question an agent should ask
in the beat between "user said long 20x HYPE" and signing the order.

### Distribution (free funnels, all existing Bankr surfaces)

1. **Skill** — `hl-risk-lens/SKILL.md` PR to github.com/BankrBot/skills (catalog has
   ~5 entries; same format as Claude skills). Teaches any Bankr agent: before placing
   an HL order, call `pretrade-check`; on "why did price move," call `cascade`.
   The `~/skills/bankr` stub from Feb gets its purpose.
2. **Agent profile** — `POST /agent/profile` (admin-approved) listing the extension +
   endpoints. Free listing to the agent-developer audience.
3. **Phase 2 (gated)**: Bankr App dashboard (`ctx.appKV` shared with endpoints,
   visitor-paid `bankr.x402.fetch` buttons) — our exact overlay competence, and
   deploy `worker/liq-alerts.js` (built Jul 12, never deployed) as a paid
   whale-liq-alert webhook.
4. **Token launch: NOT in scope.** Optional one-off marketing event later
   (measured EV ≈ $0-500); never the revenue plan.

## Effort & cost

| Item | Effort |
|---|---|
| Port 4 pure fns to TS handlers + schemas in `bankr.x402.json` | ~half day |
| Bankr account + Club + CLI + deploy + `bankr x402 call` tests | ~1-2 h |
| SKILL.md + catalog PR | ~2 h |
| Agent profile submission | ~1 h |
| Instrumentation note + prereg gates file | ~1 h |
| **Total: ~1-2 days.** Running cost: $20/mo Club. No trading capital, no keys with write scope, no halt-doctrine surface. | |

Code lives in `bankr/` in this repo (handlers + config + SKILL.md), committed like
everything else.

## Pre-registered gates (instrument 4-6 wk, doctrine-consistent)

Frozen before deploy; call volume is the only metric that matters (revenue follows).
- **Week 2 checkpoint**: ≥50 paid calls from wallets that are not ours, or ≥1
  recurring caller. Below that → distribution problem, iterate skill/profile only.
- **Week 6 go/no-go**: ≥200 calls/wk OR ≥$25/wk settling → build Phase 2
  (app dashboard + alerts). Below → leave endpoints live (zero marginal cost),
  stop investing, write the verdict to memory.
- Expected value, stated honestly: conservative = tens of $/mo; the bet is being
  the default risk-data dependency if agentic x402 volume inflects, for ~2 days
  of work re-using code that already runs.

## Risks

| Risk | Mitigation |
|---|---|
| x402 agent-call demand is unproven (the real unknown) | Gates above; sunk cost capped at ~2 days + $20/mo |
| Bankr ships native liq data | Moat = the 1,112-wallet crawl + 15-min feed + calibration program, not the wrapper |
| Feed freshness depends on this Mac's cron | Acceptable for probe; Phase 2 moves aggregator to a Cloudflare worker (scaffold exists in `worker/`) |
| Builder-code cannibalization | None: Bankr-side agents were never HypeLens builder-fee flow; skill never routes our extension users to Bankr |
| Admin approval gate on profile listing | Endpoints + skill work without it; profile is upside |
