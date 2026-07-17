# USERBASE.md — who Hyperliquid traders are

Compiled 2026-07-06 from web research. Every number below carries its source; unverified items are flagged inline. Purpose: make sure HypeLens is built for people who exist, in channels they actually read.

---

## 1. Size and activity

| Metric | Figure | Source |
|---|---|---|
| Total users | ~1.4M wallets (end-2025); +609,700 added in 2025 | [Datawallet](https://www.datawallet.com/crypto/hyperliquid-statistics) |
| Monthly actives | ~217K | [SignalPlus](https://t.signalplus.com/crypto-news/detail/hyperliquid-wallet-integration-low-roi-whale-concentration) |
| Daily actives | **~50K** (single-sourced — treat as order-of-magnitude) | SignalPlus, above |
| 24h perp volume | ~$10.2B | [CoinGecko](https://www.coingecko.com/en/exchanges/hyperliquid) |
| 30d perp volume | $172.6B = ~32% of all perp-DEX volume | Datawallet |
| Open interest | ~$9.2B (May 2026) | Datawallet |
| Q1 2026 protocol revenue | $214.95M (incl. **$17.4M builder-code fees**) | Datawallet |
| Discord (official) | ~87.5K members | [altindex tracker](https://altindex.com/ticker/hype/discord-members-total) |
| Telegram (official community) | ~95.7K members | [nicegram hub](https://nicegram.app/hub/group/HyperliquidXCommunity) |
| @HyperliquidX on X | ~410K followers | [TwitterScore](https://twitterscore.io/twitter/HyperliquidX/overview/) |
| r/hyperliquid | exists; member count **UNVERIFIED** (Reddit blocked all fetch routes; indirect signals say small) | — |

### The distribution that matters: whales run this venue

- **Top ~500 addresses (0.23% of actives) control ~70% of open interest (~$5.4B)** — [SignalPlus](https://t.signalplus.com/crypto-news/detail/hyperliquid-wallet-integration-low-roi-whale-concentration).
- Hyperdash's cohort data: 82,586 tracked active wallets, only **230 wallets with >$1M PnL**, and **58,848 unprofitable** — [Hyperdash](https://hyperdash.com/learn/best-tools-trading-hyperliquid).
- Whale behavior: mean leverage ~6.9x, short-biased, concentrated in mid-caps — [Liu, Medium](https://medium.com/@gwrx2005/hyperliquids-trading-behavior-f867c897d970).
- **~40% of HL daily actives already trade through third-party frontends** (Phantom, pvp.trade, Based, Axiom…) — [Dwellir](https://www.dwellir.com/blog/hyperliquid-builder-codes).

**Marketing implication:** the audience is not "1.4M users." It is roughly 50K daily traders, of whom the long tail is losing money partly to costs they don't watch (funding), while a tiny whale cohort generates the drama everyone else watches. Two personas fall straight out of the data:

1. **The grinder (target user, ~tens of thousands):** retail/semi-pro, on app.hyperliquid.xyz daily, unprofitable-to-breakeven (58.8K of 82.6K tracked wallets), leaks PnL to funding and bad position hygiene, already alt-tabs to free dashboards. Wants edge, pays with attention not money, deeply phishing-scarred.
2. **The whale-watcher (amplifier):** doesn't move markets, consumes whale-position content (Hyperdash alerts, Coinglass whale pages, @HyperliquidNews). This persona *shares* content — they're the distribution channel for our cards (VIRALITY.md), not necessarily the installer.

Already-proven behavior we piggyback: this userbase demonstrably bolts third-party layers onto HL (40% via alternative frontends, 50K+ monthly on pvp.trade alone). Adding a tool to their HL stack is a normal act — the barrier isn't willingness, it's **trust** (see POSITIONING.md).

---

## 2. Where they congregate

**X is the center of gravity.** The community is X + Telegram native; Reddit is marginal (contrast with Polymarket, where r/PolyMarket mattered).

- **@HyperliquidX** — ~410K followers; follower graph includes 1,814 founders, 2,026 influencers ([TwitterScore](https://twitterscore.io/twitter/HyperliquidX/overview/)).
- **@hypurr_co (Hypurr Collective)** — the ecosystem hub: weekly ecosystem-update threads (20+ volumes), maintains the Hyperliquid Ecosystem Map; co-founders @NarwhalTan, @kirbyongeo ([hypurr.co](https://www.hypurr.co/)). Getting onto their ecosystem map/weekly thread is a named LAUNCH.md action.
- **@stevenyuntcap** — prominent HL-native analyst (Assistance Fund / HyperCore commentary).
- Analytics/news accounts traders follow: **@asxn_r**, **@HypurrDash** (Hyperdash), **@Hypurrscan**, **@HyperliquidNews**, **@xulian_hl** (curates the canonical [HL data-pages list](https://x.com/xulian_hl/status/1889161644678271352) — a listing target for us).
- Tags: cashtag **$HYPE** primary; #Hyperliquid secondary.
- (Follower counts for the ecosystem accounts other than @HyperliquidX could not be verified — X blocks unauthenticated reads. Directionally they are 10K-100K-class accounts.)

**Discord:** official server ~87.5K members ([invite](https://discord.com/invite/hyperliquid)). Channel map unverified from outside — join and lurk before posting (LAUNCH.md).

**Telegram:** official community ~95.7K; **pvp.trade** groups are the social-trading arena (**50K+ monthly users**, clan leaderboards — [Delphi Digital](https://members.delphidigital.io/feed/hyperliquids-social-trading-arena), [group roundup](https://trysuper.co/blog/hyperliquid-telegram-groups)).

**Reddit:** r/hyperliquid size unverified; do not build the launch plan around it (one honest builder post, that's all — LAUNCH.md).

---

## 3. Tools they already pay attention to (the competitive attention-set)

| Tool | What it does | Traction / price |
|---|---|---|
| [Hyperdash](https://hyperdash.info) | Terminal + analytics: liquidation heatmaps, wallet cohorts, whale alerts, copy trading | Free dashboard; monetizes execution; 82.6K wallets tracked |
| [ASXN / HyperScreener](https://hyperscreener.asxn.xyz) | The most complete **free** dashboard (whale positions, funding, OI, builder codes); also powers the official-linked stats.hyperliquid.xyz | Free |
| [HypurrScan](https://hypurrscan.io) | De facto HL block explorer | Free |
| [Flowscan](https://www.flowscan.xyz) | Explorer + **live builder-code revenue leaderboard** ([/builders](https://www.flowscan.xyz/builders)) | Free |
| [Coinglass](https://www.coinglass.com/hyperliquid) | Whale tracker, liq maps, cross-exchange funding | $29–$699/mo tiers |
| [HyperTracker](https://hypertracker.io) | Wallet/whale cohort API (1.5M+ wallets) | Free tier → $2,399/mo |
| [Loris Tools](https://loris.tools) | **Funding-arb scanner + historical funding charts**, HL vs Binance/OKX/Drift | Free-ish |
| pvp.trade / Dexari / Lootbase / Based | Alt frontends & social trading (builder-code monetized) | pvp.trade: $7.2M lifetime builder fees |

(Comparison source: [CoinMarketMan](https://coinmarketman.com/blog/hyperliquid-data-providers-compared/); terminals: [QuickNode Top-10 2026](https://www.quicknode.com/builders-guide/best/top-10-trading-terminals-on-hyperliquid-2026).)

**The white space HypeLens occupies:** every tool above is a **destination** — another tab, another context switch. Nobody delivers the intel *inside* app.hyperliquid.xyz where the trade decision happens. The only two attempts at the in-browser form factor are the two CWS extensions below, and they have effectively zero adoption.

---

## 4. Extension-adoption ground truth (verified firsthand on CWS, 2026-07-02)

| Extension | CWS id | Users | Ratings | Last updated | Notes |
|---|---|---|---|---|---|
| **snakehead** | `llkinfcmlbefjnlkinalbagigcnhbagi` | **6 users** | 0 (unrated) | 2026-05-04 | Full in-browser trading terminal (executes trades, side panel, 100+ perps). **Collects authentication information.** Snakehead LLC, Austin TX. 2.97 MiB. |
| **Testudo** | `jebgpddpchapllhmmfhlbgancmljbfad` | **count not displayed** (0 reviews, 0.0 rating) | 0 | 2026-05-06 | TradingView-companion position sizer with order routing to HL/Binance/Bybit/WOO X; handles auth + financial data. v1.1.5, 525 KiB, dev sub0x. Count also absent on mirror ([crxsoso](https://www.crxsoso.com/webstore/detail/jebgpddpchapllhmmfhlbgancmljbfad)); CWS hides counts this low — read as single digits. |

### Reading the go/no-go datum honestly

Six users. Zero reviews. Both competitors are ~2 months old and dead on arrival. Two interpretations, and the build should be sized for the possibility that both are true:

- **Bull case (category is open):** both failed extensions demand the maximum-trust ask — wallet auth + trade execution from a browser extension — in the middle of a phishing wave where "Hyperliquid Chrome extension" is literally a scam signature (POSITIONING.md). They also had zero distribution effort (no X presence found, no community launch). A read-only, no-signature, open-source extension with a real content engine is the opposite object on both failure axes. The 40%-use-third-party-frontends stat proves demand for layered tooling; nobody has yet offered it in a form that doesn't require trust.
- **Bear case (form factor is unproven):** it is possible HL traders simply don't install extensions — the phishing wave taught them that *any* extension near their exchange is a threat, and destination dashboards (free, excellent: ASXN, Hyperdash) already serve the need in a tab. 6 users is also what "nobody wants this" looks like.

**Consequence for the operator's "don't build something that will collect dust" directive:** treat CWS installs as the kill metric, not a vanity metric. The content engine (VIRALITY.md) works even at zero installs — cards are generated from public API data — so the cheap test is: run the card engine + launch sequence for 4-6 weeks; if the cards get engagement but installs stay <100, the intel is wanted but the extension form factor is dead → pivot the same codebase's data layer to where the audience already is (Telegram bot / web dashboard / X bot), keeping the no-signing positioning. Decision gate belongs in LAUNCH.md.

---

## 5. What they complain about lacking (verified complaint evidence)

Direct X-post quotes were not retrievable (X blocks unauthenticated search); the following is from reviews, docs, and third-party writeups. See PROBLEM.md for the JTBD-level evidence mining.

1. **Funding is the silent PnL leak.** "Skipping the funding layer is the single most common reason real net PnL diverges from a back-of-envelope number" — [Keel](https://usekeel.io/lab/pnl-calculator). The native UI shows the current + predicted **hourly** rate in the orderbook header; for history, annualization, and extremes traders leave for Coinglass/Loris ([eco.com explainer](https://eco.com/support/en/articles/15082536-hyperliquid-funding-rate-how-it-works-track-profit), [loris.tools](https://loris.tools)).
2. **The native UI is not enough for alpha.** "Relying solely on the native exchange interface is no longer sufficient to spot alpha" — [Hyperdash](https://hyperdash.com/learn/best-tools-trading-hyperliquid) (self-interested source, but it's the pitch that demonstrably lands — their traction proves the pain).
3. **No native automation / advanced order types** — traders bolt on bots via API wallets ([Bitsgap](https://bitsgap.com/blog/best-hyperliquid-trading-bots-in-2026)). Not our MVP, but confirms the "HL UI is a chassis you extend" mental model.
4. **Beginner-hostile UI** — "clean for advanced traders, but still intimidating for beginners" ([CryptoSlate](https://cryptoslate.com/decentralized-exchanges/hyperliquid-exchange-review/)).
5. **Support/compliance horror stories** (Trustpilot 1.8★, n=8: frozen funds, no appeals — [Trustpilot](https://www.trustpilot.com/review/hyperliquid.xyz)) and a [27-minute API freeze](https://tradersunion.com/news/cryptocurrency-news/show/404781-hyperliquid-api-failure/). Not tooling gaps, but they explain the ambient distrust our positioning must clear.

**Accuracy guardrail for all copy:** app.hyperliquid.xyz *does* have a [funding-comparison page](https://app.hyperliquid.xyz/fundingComparison). Never claim "HL doesn't let you compare funding." The true, defensible claims: no **annualized** view at the point of trade, no **historical funding chart** in-app, no **extremes radar** across all perps, no **hyperp premium** surfacing — and everything else requires leaving the page you trade on.

---

## 6. Top-3 userbase insights (the ones that shape everything else)

1. **Whale-concentrated venue, loser-majority long tail.** 0.23% of wallets hold 70% of OI; 71% of tracked wallets are unprofitable. Sell the grinder a way to stop leaking (funding awareness); feed the whale-watcher shareable drama (cards). Same data, two products of attention.
2. **This crowd already layers third-party tools on HL as normal behavior (40% via alt frontends) — but zero of that adoption has gone to browser extensions (6 users).** The gap between those two facts is exactly the trust chasm the phishing wave created; the entire wedge is crossing it with a verifiably-safe artifact.
3. **X + Telegram is where distribution happens; Reddit is a rounding error; and every incumbent tool is a destination site.** Launch (LAUNCH.md) is therefore X-thread + Hypurr Collective ecosystem listing + Discord/TG community posts — not Reddit-first like PolyParlay's plan — and the pitch line "without leaving the trade screen" attacks all incumbents at once.
