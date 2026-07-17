# PROBLEM.md — jobs-to-be-done, with evidence

Operator directive: "do not build something that will collect dust." This doc tests the three hypotheses the MVP rests on against actual user evidence (mined 2026-07-02→06; every item carries quote + URL + platform). Grades: STRONG / SUPPORTED / WEAK. Each hypothesis ends with a **verdict against the current MVP spec** (README: sortable all-perps table with signed funding APR / premium / OI / volume / hyperp flags; per-coin badge incl. next-funding vs Binance/Bybit; popup share card).

Honesty note up front: first-person **Hyperliquid-specific** complaint quotes were thin — X search is closed to tooling and Reddit's 2025-26 archive coverage is patchy. Where evidence is generic-perp rather than HL-specific, it's labeled. Absence findings are listed too; they cut features.

---

## H1. "Traders get hurt by funding they didn't see at decision time" — SUPPORTED (strong generic-perp, thin HL-specific first-person)

### Evidence

| # | Evidence | Source |
|---|---|---|
| 1 | "I bought Solana at 33 but was liquidated because of funding fees for futures" — u/Guenda09 | [r/Daytrading, ~Jan 2025](https://www.reddit.com/r/Daytrading/comments/1hyqpgr/theres_a_reason_90_fail/m6qgukl/) |
| 2 | "8/10 I make money but those 2/10 times I get liquidated even if I Short at +50% pump. The funding fees or it just pumps too much that I loose all my funds." — u/AssistanceNo2838 | [r/litecoin, early 2025](https://www.reddit.com/r/litecoin/comments/1jlya8z/u_dumbass_will_never_get_rich_overnight_for/mk7c05h/) |
| 3 | "Deduct funding fees, and you can be liquidated before liquidation price...." — u/Aromatic_Flight6968 | [r/MEXC_official](https://www.reddit.com/r/MEXC_official/comments/1i5k0oh/mexc_closed_my_positions/m84lpq9/) |
| 4 | HL-curious beginner: "The other thing is, I just do not get the funding rate." + reply: "with such small size, fees such as including funding can eat into your trades" | [r/CryptoHelp](https://www.reddit.com/r/CryptoHelp/comments/1jpeq2l/us_i_want_to_use_hyperliquid_to_be_able_to_long/) |
| 5 | HL-specific structure: funding cap is **4%/hour** — "a $1,000,000 notional long position would owe a staggering $40,000 in a single hour"; HL "consistently posted the highest mean funding rates and standard deviation among major venues" | [ChainUp, 2026](https://www.chainup.com/blog/hyperliquid-funding-rate-engine-explained/) |
| 6 | JELLY squeeze (Mar 26, 2025): deeply negative funding, +429% in an hour, HLP took >$10.5M floating loss — funding extremes ARE the drama on this venue | [PANews](https://www.panewslab.com/en/articles/g0fmo186) |
| 7 | "Many traders get liquidated not from price moves, but from accumulated funding fees… professional traders never open a position without checking funding rates first" (guides teaching the CoinGlass context-switch) | [Zipmex 2026](https://zipmex.com/blog/how-to-analyze-funding-rates-in-crypto/) |
| 8 | "Skipping the funding layer is the single most common reason real net PnL diverges from a back-of-envelope number" | [Keel](https://usekeel.io/lab/pnl-calculator) |

### What HL's own UI shows vs lacks (verified via [eco.com review](https://eco.com/support/en/articles/15082536-hyperliquid-funding-rate-how-it-works-track-profit) + [HL docs](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding))

- SHOWS: current 1h rate + predicted next-hour in the orderbook header; premium index on hover; a funding overlay in the chart tab; and a **native cross-venue [funding-comparison page](https://app.hyperliquid.xyz/fundingComparison)**.
- LACKS: **annualized display at the point of trade**, **all-perps extremes view**, **per-position projected funding cost**, **any alerts**.

### Failed to find
A verbatim HL-specific "funding ate my profit" complaint. The pain is real but users articulate it as *liquidation confusion and fee surprise*, mostly on CEX subreddits. HL traders may be more sophisticated on average — which shifts the pitch from "learn what funding is" to "see extremes faster than the next guy."

### Verdict vs MVP
- **Validated:** signed annualized APR as the hero number; extremes highlighting; all-perps sortable table. This is the gap the native UI actually has.
- **Weak differentiator, keep only because it's free:** the badge's next-funding-vs-Binance/Bybit element — HL ships a native comparison page AND the cross-venue data comes in the same `predictedFundings` call we already make. Fine to display; **never market it as novel** (DATA_GAPS.md).
- **Cut/never-claim:** any "HL doesn't let you compare funding across venues" framing — false.
- **Strongest v1.x candidates the evidence points at:** (a) per-position projected funding cost ("this short costs ~$14/day at current rate" — directly answers quotes 1-4; note read-only constraint: compute from user-entered size or the API's `clearinghouseState` for a pasted address, not from page DOM); (b) funding-extreme **alerts** — [CryptocurrencyAlerting.com covers Binance/Bybit/OKX/Kraken but NOT Hyperliquid](https://cryptocurrencyalerting.com/funding-rate-alert.html): a genuinely open niche (see H4).

---

## H2. "Trust is the adoption blocker — post-drainer-wave users refuse connect-and-sign tools" — STRONG (best-evidenced hypothesis)

### Evidence

| # | Evidence | Source |
|---|---|---|
| 1 | Trust Wallet Chrome extension v2.68 supply-chain hack (Dec 24, 2025): "~$7 million" drained from 2,596 wallets — the nightmare headline for any crypto Chrome extension | [CoinDesk](https://www.coindesk.com/business/2025/12/26/trust-wallet-users-lose-more-than-usd7-million-to-hacked-chrome-extension) |
| 2 | "$713M" lost to personal-wallet compromise in 2025; "Users who followed every standard self-custody rule… still lost funds. That's not a user-education problem. It's an architecture problem." | [CryptoSlate, Dec 2025](https://cryptoslate.com/how-browser-extensions-expose-your-crypto-to-a-fatal-design-flaw-that-the-industry-ignored-bleeding-713m-in-2025/) |
| 3 | "Never connect your wallet to sites or dapps. This is how crypto is stolen" — u/vman305 | [r/XRP](https://www.reddit.com/r/XRP/comments/1jmfkus/all_my_xrp_is_gone/mkbm3r7/) |
| 4 | "absolutely never connect your wallet to dApps / contracts managed by third-parties" — u/blade0r | [r/CoinBase](https://www.reddit.com/r/CoinBase/comments/1jjwm9k/im_being_scammed_right_now_please_help/mjsa2t9/) |
| 5 | "Never connect your wallet to anything other than Coinbase don't click any links" — u/Important-thug183; multiple subreddits now post this as **AutoModerator boilerplate** — the refusal norm is institutionalized | [r/solana](https://www.reddit.com/r/solana/comments/1hq8l9v/phantom_wallet_drained/mps1bk2/) |
| 6 | Category-specific: both incumbent HL extensions demand wallet/auth access → 6 users and ~0 users; the HL-targeted phishing wave is documented at length in POSITIONING.md §1 | USERBASE.md §4, POSITIONING.md |

### Failed to find
A quote refusing specifically a *trading-adjacent Chrome extension* or explicitly demanding "read-only." The sentiment is abundant but framed around wallet-connect/dApps generally. (Read-only success precedents — Pocket Universe, Revoke.cash, watch-wallets — are in POSITIONING.md §2.)

### Verdict vs MVP
- **Validated, hard:** read-only / storage-only / no-signing is not marketing garnish, it's the admission ticket. A signing extension in this category is near-DOA (6-user competitor proof).
- **Design consequence for Module 2:** wallet intel must be **address-paste** (public API `clearinghouseState`), never wallet-connect. HL's own agent-wallet architecture (API wallets "without withdrawal permissions" — [HL docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets)) gives Module 3 a less-scary path *later*, but any signing surface before trust is banked restarts the clock.
- **Corollary:** open-source + unminified is load-bearing (evidence #2's "architecture problem" framing is our copy, almost verbatim).

---

## H3. "Copy-trading/leaderboard followers get burned and want better trader intel" — SUPPORTED (strong secondary evidence, no first-person burn quotes)

### Evidence

| # | Evidence | Source |
|---|---|---|
| 1 | "All 8 traders once made huge profits on Hyperliquid, but every one of them ended up getting wiped out." — Lookonchain | [X](https://x.com/lookonchain/status/2017885115859505623) |
| 2 | "97% of the copy-trade leaders were profitable on their own books — but only about 44% of them produced positive PnL for the people copying them" | [Bitsgap 2026](https://bitsgap.com/blog/why-copying-on-chain-whale-trades-usually-backfires) |
| 3 | "If you had blindly copied the Trump Insider Whale, you might have lost money after the wallet became widely known"; plus multi-wallet opacity ("maybe 1 wallet is created to hedge against other positions") | [Whaleportal, Mar 2026](https://whaleportal.com/blog/hyperliquid-whale-tracker-explained/) |
| 4 | James Wynn — crypto's most-watched HL whale: "liquidated nine times," down ~$22M, fully liquidated to $23 | [DL News](https://www.dlnews.com/articles/defi/hyperliquid-trader-james-wynn-liquidated-nine-times/), [CoinDesk](https://www.coindesk.com/markets/2025/05/31/cryptos-most-watched-whale-gets-fully-liquidated-after-placing-billions-in-risky-bets) |
| 5 | Leaderboard-gaming context: early points program bred wash trading and "decorative liquidity"; whales telegraph with large visible orders then pull — spoofing-adjacent | [Liu study](https://medium.com/@gwrx2005/hyperliquids-trading-behavior_f867c897d970), [growth analysis](https://medium.com/@julia_innovator/the-anatomy-of-hyperliquids-growth-from-mvp-to-hype-a0a4a3bc26ec) |

### Failed to find
A named individual saying "I copied X and lost $Y" (Wynn coverage documents HIS losses, not followers'). No hard evidence of leaderboard PnL being technically falsified — the critique is **opacity** (hedge wallets, missing context), not fake numbers. Don't print "the leaderboard lies."

### Verdict vs MVP
- **Correctly deferred.** Module 2 (trader report cards) is validated as *content* — the 44%-of-copiers stat and Wynn arc are exactly the drama the card engine monetizes into attention — but as *product* it enters the most crowded space in the ecosystem (Hyperdash Copy Score and HyperStats S+-to-F grades already score copyability — DATA_GAPS.md §4).
- **Differentiated angle when built:** funding-paid-vs-earned and realized-vs-unrealized splits (`userFunding` API) — the *cost* lens on famous wallets, which the scoring incumbents don't lead with and which ties back to H1.

---

## H4 (form-factor check). "Do they want alerts (bots) rather than an in-page overlay?" — evidence favors: overlay now, funding-alert niche open, whale-alert bots saturated

- Revealed demand for **whale-move** alerting is Telegram-first and crowded: Slate Wallet Tracker bot ([hypurr.co listing](https://www.hypurr.co/ecosystem-projects/slate-wallet-tracker)); ≥4 separate "build your own HL whale-alert TG bot" tutorials ([QuickNode](https://www.quicknode.com/guides/hyperliquid/real-time-hyperliquid-whale-alert-bot), [Chainstack](https://chainstack.com/hyperliquid-on-chain-activity-tracker-build-your-own-telegram-bot/), [GetBlock](https://docs.getblock.io/guides/how-to-build-a-hyperliquid-whale-tracker-bot-with-getblock)); CoinGlass/CoinAnk ship HL whale alerts. **Don't build whale alerts.**
- **Funding-rate alerting for HL specifically appears to be nobody's product** ([CryptocurrencyAlerting.com](https://cryptocurrencyalerting.com/funding-rate-alert.html) covers 4 CEXs, not HL).
- No direct quote preferring overlay vs bot was found. Decision stands on structure: the overlay serves decision-time (H1), alerts serve monitoring-time; they're complements, and the USERBASE.md §4 kill-metric pivot path (if installs stall while cards get engagement → ship the same data as a TG funding-alert bot) is the hedge that makes betting on the overlay first safe.

---

## Summary verdict on the MVP

| MVP element | Evidence verdict |
|---|---|
| Annualized signed funding APR, all-perps table, extremes highlighting | **BUILD — core validated (H1)** |
| Read-only / storage-only / no-signing architecture | **BUILD — the admission ticket (H2)** |
| Hyperp flags + premium | **BUILD — only first-of-kind claim (DATA_GAPS §5); no complaint evidence but no supply either** |
| Badge cross-venue next-funding element | **KEEP quietly — free from same API call; never market as novel** |
| Share-card generator | **BUILD — the distribution engine (VIRALITY.md), works at zero installs** |
| Module 2 wallet intel | **DEFER — crowded; when built: address-paste only, lead with funding-cost lens** |
| Whale alerts, liq maps, copy scoring | **DON'T BUILD — saturated free (H4, DATA_GAPS §3-4)** |
| Funding-extreme alerts (TG/notification) | **v1.x CANDIDATE — verified open niche; also the pivot path if extension form factor fails** |

The dust-collection risk is not "nobody has this problem" — H1/H2 are solid. It is the **form factor** (browser extension, 6-user category — USERBASE.md §4). That risk is managed by the kill metric + pivot path in LAUNCH.md, not by more features.
