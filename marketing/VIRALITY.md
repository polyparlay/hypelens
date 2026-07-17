# VIRALITY.md — the share-card content engine

HypeLens inherits a working, already-built virality pipeline from PolyParlay. This doc: (1) audit of exactly what that pipeline automates today, (2) the HL retarget spec — card types, layouts, cadence, (3) the influencer rev-share distribution pitch.

Operator context: "polyparlay is partly designed for virality." Correct — the virality design is the **shareable-artifact loop**: every use of the tool can emit a URL/image that carries the tool's name into feeds. We keep the loop, swap the artifact.

---

## 1. Audit — what `/Users/clawdlawd/polyparlay/marketing-auto/` already automates

(Also mirrored as-is into `/Users/clawdlawd/hypelens/marketing-auto/` by the port. Nothing below needs to be built from scratch — only retargeted.)

| File | What it does | Reusable for HL? |
|---|---|---|
| `x-poster.mjs` | Fully autonomous X poster. Every run: fetches live Polymarket markets (gamma-api), builds a 3-5 leg parlay, runs 10K Monte Carlo, encodes a base64url share URL, picks one of **8 rotating tweet templates**, posts via `twitter-api-v2` (OAuth 1.0a), logs to `.post-log.jsonl` for dedup + analytics. Guardrails: 3.5h min-interval between posts, `--dry` / `--force` flags, leg-count rotation (3/4/5) for feed variety. | YES — swap the data fetch (gamma-api → `POST https://api.hyperliquid.xyz/info`), swap templates. ~150 of its 290 lines (template rotation, log/dedup, posting, flags) carry over unchanged. |
| `generate-content.mjs` | On-demand content generator for **manual** posting: same market fetch + parlay build, emits 3 ready parlays with tweet copy in 5 template variants, `--json` mode for piping. | YES — becomes `generate-hl-content.mjs`: fetch funding table, emit "top extremes" copy + card payload. |
| `dm-packet.mjs` | Influencer DM assembler: reads next unassigned comp code from `comp-codes.md`, builds a fresh sample artifact, fills a personalized DM template (`--handle`, `--tweet`, `--batch 5`, `--assign` marks the tracker). | YES — mechanics identical; swap sample artifact (parlay slip → funding card) and the pitch (comp code → builder-fee rev-share, see §4). |
| `templates.txt` | 40+ pre-written posts: 16 X singles, 3 full threads, 8 Reddit posts, 6 Discord messages, 3 Telegram messages, hashtag sets. | STRUCTURE yes, copy no. The channel mix and tone calibration (Reddit=transparent-builder, Discord=no-link-spam, X=show-don't-tell) is the reusable asset. HL copy drafted in LAUNCH.md / below. |
| `30-day-plan.md` | Day-by-day launch script (launch → Reddit → thread → Discord lurk-then-post → 5 DMs/day → weekly transparency metrics posts → AMA → Space), plus daily 5-min checklist and best/avg/bad-case install forecasts. | YES — LAUNCH.md adapts it to HL venues. |
| `outreach.md` + `influencer-research.md` + `comp-codes.md` | DM/email templates per recipient type (platform team, 1K-50K influencers, subreddit power users, Discord admins, podcasters, newsletters); vetting checklist; 20-code comp tracker with activation-rate-as-signal methodology. | YES — swap Polymarket targets for HL ecosystem accounts; comp-code mechanic is replaced/augmented by builder-code rev-share (a *stronger* offer, §4). |
| `SETUP-AUTOMATION.md` + `app.polyparlay.x-poster.plist` | 15-min activation: X API free tier (1,500 posts/mo), launchd every 4h (or GitHub Actions YAML for always-on). | YES verbatim — rename plist label, done. |
| `WHEN-TO-ACTIVATE.md` | **Activation gate for the auto-poster**: do NOT turn on until ≥100 followers AND ≥10 manual posts AND ≥1 post with 1K+ impressions. Auto-posting into an empty timeline gets buried by X anti-bot heuristics. | YES — keep this gate verbatim. It's doctrine. |

**What the pipeline does NOT automate (gaps to fill for HL):**

1. **Image card generation is not in marketing-auto.** PolyParlay's visual virality rides on the `polyparlay.app/slip#...` URL rendering an OG preview via `web/slip.html`. HypeLens already has a **Canvas share-card generator (1200×630) in `extension/popup.js`** — but that's user-initiated inside the popup. The content engine needs a headless equivalent: a small node script (`render-card.mjs`, node-canvas or Playwright screenshot of a local HTML template) so `x-poster.mjs` can attach a PNG via `v1.uploadMedia` instead of relying on link previews. X's algorithm downranks link-only posts; native images perform materially better. **This is the one new build item.**
2. **No engagement analytics** beyond the post log. Fine at this scale; revisit at 1K followers.
3. **No reply/mention automation.** Keep manual — replies are where trust is built, especially with safety-first positioning.

---

## 2. The HL retarget — three card types

All cards render at **1200×630** (X large-card ratio, matches the existing popup generator). Dark theme matching the extension and HL's own UI: `#0f1a1f` background, mint `#50d2c1` accents, red `#ed7088` for negative/short, white mono numerals. Every card footer carries the constant brand strip. Data source for every number: `POST https://api.hyperliquid.xyz/info` (`metaAndAssetCtxs`, `predictedFundings`) — the same keyless public API the extension uses, so cards are independently verifiable by anyone.

### Card type 1 — FUNDING EXTREMES (daily workhorse)

The daily "weather report" of HL funding. Exact layout mock:

```
┌────────────────────────────────────────────────────────────────┐
│  HYPELENS · FUNDING RADAR                    2026-07-06 00:00Z │
│                                                                │
│  LONGS ARE PAYING ▼                 SHORTS ARE PAYING ▲        │
│  ────────────────────               ────────────────────       │
│  1. XYZ-PERP   −312% APR            1. ABC-PERP   +187% APR    │
│  2. QRS-PERP   −155% APR            2. DEF-PERP    +96% APR    │
│  3. TUV-PERP    −88% APR            3. GHI-PERP    +71% APR    │
│                                                                │
│  ● XYZ shorts earn ~0.85%/day just for holding                 │
│  ● 14 of 180 perps above the 40% |APR| extreme line            │
│                                                                │
│  BTC +8.2%  ETH +10.9%  HYPE +12.4%          (baseline row)    │
│                                                                │
│  ⌕ HypeLens — funding intel inside app.hyperliquid.xyz         │
│  read-only · no wallet · no signatures · open source           │
└────────────────────────────────────────────────────────────────┘
```

Design rules: max 3+3 assets (screenshot-legible on mobile), signed APR is the hero number (nobody else leads with **annualized** — HL's UI shows hourly, which reads as noise; "−312% APR" reads as money), one plain-English takeaway line ("shorts earn X%/day"), the baseline row anchors extremes against majors, and the trust strip is on EVERY card — the positioning rides along with every impression.

Post copy template (rotates like PolyParlay's 8):
> Funding check on Hyperliquid: XYZ longs are paying 312% APR to stay in. Shorts on the other side are being paid to hold. Full table inside the app → [link]

### Card type 2 — HYPERP PREMIUM ALERT (event-driven, the "alpha" card)

Fires only when a hyperp's mark diverges from its EMA-oracle by more than a threshold, or when funding on a hyperp flips sign. Hyperps (pre-launch perps with EMA-of-own-mark oracles) are HypeLens's most defensible data — no incumbent dashboard covers them (see DATA_GAPS.md §5).

```
┌────────────────────────────────────────────────────────────────┐
│  HYPELENS · HYPERP ALERT                          [HYP badge]  │
│                                                                │
│  WXYZ-PERP (hyperp)                                            │
│  mark $2.41  vs  EMA oracle $2.07     PREMIUM +16.4%           │
│                                                                │
│  ▁▂▃▅▇█  premium, last 7d  (sparkline)                         │
│                                                                │
│  funding: longs paying 214% APR and rising                     │
│  ● hyperp funding pushes mark back to its own EMA —            │
│    premium this wide has historically compressed               │
│                                                                │
│  ⌕ HypeLens · read-only · no signatures · open source          │
└────────────────────────────────────────────────────────────────┘
```

Cadence: event-driven, cap 1/day. Scarcity is the point — this card type is what HL power traders retweet, because it's data they cannot get elsewhere. Technical care (DATA_GAPS.md §5): HL's hyperp mark formula now blends external pre-launch prices where they exist and caps at 10× the EMA — compute premium off the *current* formula before any card ships; one wrong number kills the "verifiable" brand.

### Card type 3 — TRADER REPORT CARD (Module 2, later — the true viral engine)

Deferred until Module 2 (wallet intel) ships. Paste any address → shareable report card: 30d PnL (realized vs unrealized split), funding paid vs earned lifetime, win rate, max drawdown, liq-proximity gauge. Two viral vectors PolyParlay's slips proved out: **self-flex** (traders share their own card = free distribution) and **call-out** (share the card of a leaderboard whale = drama distribution). The funding-paid-vs-earned number is the hook nobody else surfaces: "this wallet made $214K trading and gave $61K of it back in funding." Gate: only build after Module 1 has installs; card URLs render via the ported `web/slip.html` → funding-card viewer.

### Cadence

| Phase | What | Frequency |
|---|---|---|
| Pre-CWS-approval | Manual: funding-extremes card via `generate-content` output + popup card, posted by hand | 1/day, fixed time (00:00 UTC = funding-day boundary; consistency builds a "daily check" habit) |
| Post-launch, pre-gate | Manual, same cadence + hyperp alerts when they trigger | 1-2/day |
| After WHEN-TO-ACTIVATE gate (≥100 followers, ≥10 manual posts, 1 post ≥1K impressions) | `x-poster.mjs` retarget goes autonomous | 2-3/day auto + manual event cards. NOT PolyParlay's 6/day — funding data has a natural daily rhythm; over-posting identical tables reads as bot. |

Every post links to the CWS listing (post-launch) with the constant closer line: *"read-only — it never asks for a signature."*

---

## 3. Why this loop works for HL specifically (vs PolyParlay)

- PolyParlay's artifact was a *user's bet* (personal, required a user to make one). HypeLens's Type-1/2 artifacts are *market states* — generatable 24/7 with zero users, so the content engine works from day 0 at zero installs.
- Funding extremes are intrinsically dramatic (triple-digit APRs, "getting paid to short") and time-decaying — perfect feed content, useless a day later, so followers must keep watching.
- CT (crypto Twitter) already has a proven genre of funding/OI screenshot posts; we're entering an existing content format with a better-designed, branded, verifiable card.

---

## 4. Influencer distribution — the builder-fee rev-share pitch

PolyParlay's influencer offer was a $99 comp code. HypeLens Module 1 has nothing to comp (free, read-only) — but Hyperliquid gives us something better: **builder codes**, the protocol-native fee split. When Module 3 (opt-in order routing) ships, orders routed through HypeLens carry our builder code and earn a per-fill fee ([official docs](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/builder-codes): cap 10 bps on perps, 100 bps on spot; registration needs only 100 USDC in a perps account). This is a proven, large economy — **>$40M lifetime builder-code revenue, $17.4M in Q1 2026 alone; pvp.trade has earned $7.2M lifetime and Phantom ~$100K/day** ([Dwellir](https://www.dwellir.com/blog/hyperliquid-builder-codes), Datawallet). Builder revenue is **on-chain and publicly auditable** — anyone can verify what any builder earns on [Flowscan's live builders leaderboard](https://www.flowscan.xyz/builders) (ASXN tracks it too). That verifiability IS the pitch: no trust-me affiliate dashboards.

Mechanics for the split: influencer-specific referral param in the install/landing link → installs attributed → their share of builder fees from attributed users paid weekly in USDC on HL. Until Module 3 exists, the offer is early access + a standing rev-share agreement in writing.

### DM template (`dm-packet.mjs` retarget)

> Hey @{{handle}} — saw your {{recent HL post reference}}.
>
> I built HypeLens: a Chrome extension that overlays funding APR, mark-vs-oracle premium, OI and hyperp flags directly inside app.hyperliquid.xyz. Read-only — one permission, no wallet access, never asks for a signature, open source. (Given what fake "Hyperliquid" extensions have been doing lately, that's the whole point.)
>
> Today's card from it: {{card image / link}}
>
> The ask + the offer: if it's useful and you share it, I'll cut you into the builder-fee split when order routing ships — {{X}}% of fees from users who came via your link, paid in USDC, and you can verify every cent of builder revenue on-chain (Flowscan tracks builder fees publicly — no affiliate-dashboard trust games).
>
> If it's not useful, tell me why — that's worth as much.

Target profile (adapting `influencer-research.md` vetting): 1K-50K follower accounts that post HL positions/PnL screenshots, hyperp callers, funding-arb posters, HL ecosystem builders. Skip mega-accounts and paid-promo bios. 5 DMs/day sustained, tracker in `comp-codes.md` format (columns: handle, channel, DMed, shared?, ref installs).

### Sequencing rule

Rev-share talk is **Module 3 bait, Module 1 truth**: in all public copy, HypeLens Module 1 must stay "free, read-only, no execution." The influencer pitch is private and explicitly framed as future-conditional. Never let the safety positioning and the monetization pitch appear in the same public artifact — the no-signing message dies the moment a public post reads as "install my fee-extracting tool."

---

## 5. Build list (content engine, in order)

1. `render-card.mjs` — headless 1200×630 PNG renderer for card types 1-2 (share layout logic with `extension/popup.js`'s canvas generator; do not fork the design twice).
2. `generate-hl-content.mjs` — gamma-api fetch → HL info API; emits card payload + rotating copy. (Direct port of `generate-content.mjs`.)
3. `x-poster.mjs` retarget — swap fetch + templates, add `uploadMedia` for the PNG. Keep min-interval, log, dedup, dry-run guardrails verbatim.
4. `dm-packet.mjs` retarget — template above, tracker columns updated.
5. Type-3 report card — blocked on Module 2.

Items 1-3 are ~a day of work because the PolyParlay code carries the structure. Nothing here blocks launch: week 1 is manual posting by design (WHEN-TO-ACTIVATE gate).
