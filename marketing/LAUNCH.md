# LAUNCH.md — launch sequence with copy

Order of operations: content engine warms up BEFORE the CWS listing is live (cards work at zero installs), listing ships, then one coordinated week across X → ecosystem directories → Discord/TG → Reddit. Everything below is drafted, not TODO. Success/kill metrics at the bottom — this launch doubles as the form-factor experiment (USERBASE.md §4).

Channel priority comes from the userbase data: **X first, ecosystem directories second, Discord/Telegram third, Reddit last** (HL's community is X/TG-native; r/hyperliquid is marginal — the inverse of PolyParlay's Reddit-heavy plan).

---

## Phase 0 (pre-listing, ~1 week): warm the account

1. X account (@hypelens or nearest available): bio = one-liner from POSITIONING.md §3; pinned = safety explainer once launch thread exists.
2. Post 1 funding-extremes card/day manually at 00:00 UTC (VIRALITY.md cadence) for 5-7 days before launch. The account must not be empty when the launch thread lands.
3. Follow/engage (genuine replies, no shilling): @hypurr_co, @asxn_r, @stevenyuntcap, @Hypurrscan, @HyperliquidNews, @xulian_hl, active $HYPE traders.
4. Publish the repo public with the trust README. **The repo link is load-bearing in every subsequent artifact.**
5. Join HL Discord + official Telegram; lurk, note channel norms (channel map unverified from outside — do not plan a specific channel until inside).

## Phase 1: (a) CWS listing checklist

Copy: title/subtitle/description from POSITIONING.md §4.

- [ ] Developer account ($5) on a clean Google account; 2FA on (the imToken ownership-transfer attack is the category horror story — account hygiene is a security feature)
- [ ] Listing name exactly `HypeLens — Hyperliquid Funding Intel (Read-Only)`; "Not affiliated with Hyperliquid Labs" line present (also preempts trademark takedown risk from squatter-cleanup sweeps)
- [ ] **Privacy tab must render "No data collected"** — fill the data-use disclosure accordingly; this is the visible contrast vs both incumbents (they disclose collecting auth info) and it's checkable by every security-conscious installer
- [ ] Justify the single `storage` permission in the review notes; confirm manifest requests nothing else; host permissions = `app.hyperliquid.xyz` + `api.hyperliquid.xyz` only
- [ ] Privacy policy URL (rewrite `web/privacy.html` — the ported file still says PolyParlay; per `web/MODULE-2-SCAFFOLDING.md` do not deploy as-is)
- [ ] Screenshots (1280×800, 4-5): panel sorted by APR with extremes highlighted; per-coin badge; popup + share card; **screenshot #4 = the manifest/permissions screen itself** (the audit IS the ad); optional #5 = side-by-side "what we never ask for" (crossed-out wallet-connect modal)
- [ ] Promo tile 440×280 with tagline #1 ("Nothing to sign. Nothing to drain.")
- [ ] Category: Tools; regenerate ALL assets — `extension/marketing/` is PolyParlay parts-bin (README warns)
- [ ] Submit; expect days-to-2-weeks review; **do not announce a date until approved**
- [ ] Day 0 after approval: fresh-profile install test — pill, panel, badge, popup, card gen all green before any public link goes out

## Phase 1: (b) X launch thread (post day of approval, 14:00-16:00 UTC)

**GIF/media beats are specified per post — record at 1600×1000, ≤8s loops, dark theme.**

**Post 1 (hook = money):**
> Hyperliquid traders: someone paid 300%+ APR in funding this week just to keep a position open.
>
> They probably didn't know. The UI shows an hourly rate; nobody's brain annualizes 0.035%/hr mid-trade.
>
> We built a lens for it. 🧵
>
> *[GIF: app.hyperliquid.xyz/trade. HypeLens pill clicked → side panel slides out → one click sorts by funding APR → top row glows with a triple-digit APR]*

**Post 2 (what it is):**
> HypeLens is a Chrome extension that overlays what Hyperliquid's UI doesn't show, on the page where you trade:
>
> → every perp's funding, annualized + signed
> → mark-vs-oracle premium
> → OI + 24h volume
> → extremes highlighted
>
> No new tab. No dashboard. It's just… there.
>
> *[GIF: sort by premium, then by OI; extreme rows highlight as sort changes]*

**Post 3 (badge beat):**
> Open any coin page and the badge tells you what holding actually costs — this coin's funding APR, premium, and next funding vs Binance/Bybit.
>
> The number you should see BEFORE you click Buy, not in your PnL a week later.
>
> *[GIF: navigate BTC → coin page badge pops in → hover shows detail]*

**Post 4 (hyperps — the alpha claim):**
> Hyperps (pre-launch perps) are priced off an EMA of their own mark — funding behaves completely differently and no dashboard anywhere tracks it.
>
> HypeLens flags every hyperp and shows the premium. As far as we can tell, we're the first to surface this at all.
>
> *[Static image: table filtered to hyperp rows, HYP badges + premium column visible]*

**Post 5 (the safety pivot — the thread's real message):**
> Now the part that matters.
>
> Fake "Hyperliquid" sites and extensions spent 2025-26 draining wallets. Every one of those attacks started the same way: connect and sign.
>
> HypeLens has no connect. No sign. It CAN'T touch your wallet — there's nothing to approve, ever.
>
> *[Image: the "typical HL extension vs HypeLens" contrast table from POSITIONING.md §2]*

**Post 6 (verify, don't trust):**
> Don't take our word for it:
>
> → 1 permission: storage. Not tabs, not cookies, not "all websites"
> → talks to exactly one API: Hyperliquid's public info endpoint
> → open source, unminified, no build step — read every line that runs
>
> [repo link]
>
> *[GIF: chrome://extensions → HypeLens details → permissions view; cut to the repo file tree]*

**Post 7 (share card = built-in distribution):**
> It also makes these — today's funding extremes as a card, generated locally in your browser. Post your own market read in one click.
>
> *[Image: an actual funding-extremes card — this doubles as a template for followers]*

**Post 8 (CTA + honesty close):**
> Free. No account. No token. Not affiliated with Hyperliquid Labs — just intel where you trade.
>
> Chrome Web Store: [link]
>
> If you check funding on a dashboard in another tab today, this replaces that tab. If it doesn't — tell us why, we ship fast.

After posting: pin the thread; reply to every comment <1h for the first day; QT the thread from any personal account with reach.

## Phase 1: (c) community posts (community tone, not ad tone)

**HL Discord** (post 48h+ after joining, in whichever channel tools-sharing is normal — confirm norms first; ask a mod if unsure. Short, one message, never repost):

> Built a small open-source Chrome extension for the HL UI: overlays annualized funding APR / premium / OI on every perp + flags hyperps, right on app.hyperliquid.xyz. Read-only — one permission, no wallet access, nothing to sign (given what's floating around the extension store lately, that's the whole point). Repo if anyone wants to audit before installing: [link]. Feedback very welcome, especially on what's missing from the table.

**r/hyperliquid** (title + body; transparent-builder register; expect small audience, treat as SEO artifact as much as community post):

> **Title:** I built a read-only Chrome extension that shows annualized funding / premium / OI inside the HL app — open source, roast it
>
> **Body:** Kept getting annoyed that the funding number in the orderbook header is hourly — 0.0125% reads like nothing until you realize it's ~110% APR. So I built HypeLens: it overlays a sortable table of every perp (signed funding APR, mark-vs-oracle premium, OI, 24h vol, hyperp flags) on app.hyperliquid.xyz, plus a badge on each coin page with that coin's cost-to-hold.
>
> Because the HL extension category has a scam problem, I built it to be verifiable rather than trusted: read-only, single `storage` permission, only network call is HL's public info API, no wallet surface at all, open source and unminified — the repo is [link], and the whole thing is small enough to read in one sitting.
>
> Free, no account, no token, not affiliated with HL Labs. What I'd genuinely like from this sub: what belongs in the table that isn't there? (Funding history sparklines and funding-extreme alerts are the current candidates.)

**Official Telegram community:** 2-line version of the Discord message, only if links are normal there (observe first).

## Phase 1-2: (d) directory submissions (week 1-2)

| Directory | URL / process | What the form needs | Notes |
|---|---|---|---|
| **HypeWatch** | [hypewatch.io](https://www.hypewatch.io/tools) — "Submit a Protocol" button | name, category (Tools), site, description, socials | HL-ecosystem directory w/ 100+ protocols and a dedicated Tools section — highest-fit listing |
| **Hypurr Collective** | [hypurr.co](https://www.hypurr.co/) ecosystem-projects pages + community wiki ([hyperliquid-co.gitbook.io](https://hyperliquid-co.gitbook.io/community-docs/community-and-projects/ecosystem-projects/tools)) | no public form found — DM @hypurr_co / @NarwhalTan / @kirbyongeo on X with one-paragraph pitch + card image | Also pitch inclusion in their **weekly ecosystem update thread** — the single most-read ecosystem artifact on HL X |
| **hype.global** | [hype.global/ecosystem](https://hype.global/ecosystem) — "add your project" flow on page | standard listing fields | Low effort, do it same day as HypeWatch |
| **hyperevm.top** | [hyperevm.top/ecosystem](https://hyperevm.top) (91 entries) | submission mechanism not verified — check page footer/X account for contact | HyperEVM-flavored; we're HyperCore-adjacent tooling, still fits "ecosystem aggregator" |
| **RootData** | [rootdata.com/Projects/submit](https://www.rootdata.com/Projects/submit?ft=claimApply) ([requirements](https://docs.rootdata.com/feedback/get-listed)) | official full name, website, TGE status (No), + fill ALL optional fields (team, X link, description) to expedite; 1-5 business days for priority projects | Rejection risks per their docs: incomplete info, "overly early/conceptual" — submit AFTER CWS listing + X presence exist, not before |
| **DefiLlama** | listing = TVL adapter PR to [github.com/DefiLlama/DefiLlama-Adapters](https://github.com/DefiLlama/DefiLlama-Adapters) | **N/A for Module 1** — a read-only extension has no TVL; nothing to list honestly | Revisit only if Module 3 ever routes volume (builder-code fee dashboards would list us via Flowscan/ASXN instead) |
| **@xulian_hl's canonical HL data-pages list** | [the list](https://x.com/xulian_hl/status/1889161644678271352) | polite reply/DM once we have traction proof | Being on "the list everyone bookmarks" is a directory in itself |

## Phase 2: (e) listicle / SEO outreach (week 2-4 — these pages already rank; get added rather than outrank)

| Target | Page | How tools get added |
|---|---|---|
| **QuickNode Builders Guide** | ["Top 10 Trading Terminals on Hyperliquid 2026"](https://www.quicknode.com/builders-guide/best/top-10-trading-terminals-on-hyperliquid-2026) + their [HL guides](https://www.quicknode.com/guides/hyperliquid/real-time-hyperliquid-whale-alert-bot) | Builders-guide submission/contact via QuickNode's guide pages; we don't fit "terminals" — pitch a new "analytics/safety tools" slot or a guest guide ("reading HL funding via the public info API") which links us as the worked example |
| **Datawallet** | [HL statistics](https://www.datawallet.com/crypto/hyperliquid-statistics), [Top HyperEVM projects](https://www.datawallet.com/crypto/top-hyperevm-projects) | Editorial — email/DM pitch; angle: "the only read-only HL extension, launched against the fake-extension wave" is a *story*, not just a listing |
| **perp.wiki** | perp.wiki (perp-DEX wiki) | Wiki-style — check edit/submission policy; add a factual HypeLens entry under HL tooling with sources |
| **CoinMarketMan blog** | ["Hyperliquid data providers compared"](https://coinmarketman.com/blog/hyperliquid-data-providers-compared/) | Already the category's comparison page — pitch inclusion in the matrix (we're a new cell: "in-UI overlay, free, read-only") |
| **buildix.trade** | [CoinGlass-alternatives post](https://www.buildix.trade/blog/coinglass-alternatives-open-interest-funding-rate-tools-2026) | Pitch as the "inside-the-app" alternative in their next update |
| **eco.com support/learn** | [HL funding guide](https://eco.com/support/en/articles/15082536-hyperliquid-funding-rate-how-it-works-track-profit) | Their guide literally documents the gap we fill ("annualized… the native interface doesn't provide") — pitch a one-line tool mention |
| Security-listicle long shots | CoinGecko learn ("security browser extensions crypto"), revoke.cash-adjacent roundups | Angle: first read-only exchange-overlay extension; cite POSITIONING.md facts |

Also week 2-4: influencer DM cycle starts (5/day, rev-share pitch — VIRALITY.md §4); auto-poster activation per WHEN-TO-ACTIVATE gate (≥100 followers, ≥10 manual posts, ≥1 post 1K+ impressions).

---

## Metrics, gates, and the kill switch

Weekly transparency post (installs / card impressions / best card) — solo-builder metric posts outperform, per PolyParlay playbook, and they compound the "nothing to hide" positioning.

| Gate | Threshold | Action |
|---|---|---|
| Week 2 | listing live + ≥3 directories accepted + launch thread ≥20K impressions | if thread flopped (<5K), re-run hook with a JELLY-style funding-drama case study instead of product framing |
| Week 4 | ≥100 installs | on track; start funding-alert v1.x scoping (PROBLEM.md H4) |
| **Week 6 (kill/pivot)** | **<100 installs AND cards averaging <10K impressions** → product + content both dead: stop | **<100 installs BUT cards performing** → intel wanted, extension form factor dead (consistent with 6-user category baseline): pivot the same data layer to a Telegram funding-alert bot / X bot, keep the no-signing brand |
| Week 6+ | ≥300 installs & organic mentions | double down: Module 2 (address-paste wallet intel) + Hypurr weekly-thread push |

Single highest-leverage action in this whole file: **getting HypeLens into the Hypurr Collective weekly ecosystem thread + ecosystem map** — it's the one artifact the entire HL X graph already reads, and one inclusion outperforms every cold post above.
