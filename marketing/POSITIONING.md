# POSITIONING.md — "NO SIGNING" as the lead message

Operator directive: "push the 'no signing' safety side." The research confirms this is not just a nice angle — **in this category, safety is the entire buying decision.** Both incumbent HL extensions ask for wallet/auth access and have ~6 and ~0 visible users respectively (USERBASE.md §4). The category's biggest listing by installs is a probable impersonator. The audience has been trained by two years of drainers to treat "Hyperliquid extension" as a threat string. We win by being the first object in the category that is *verifiably incapable* of stealing.

---

## 1. The factual backbone (all verified July 2026 — cite these, and only these)

### The 2025-26 phishing wave around Hyperliquid

- **Google Ads drainer (June 26, 2025, flagged by ScamSniffer):** a sponsored ad above the real search result sent users to a cloned `app.hyperliquid.xyz-trade.foundation-s1.eu.com`; connecting + signing approvals drained wallets. [Coverage](https://www.thecoinrepublic.com/2025/06/26/did-you-just-google-hyperliquid-you-mightve-landed-on-a-wallet-drainer/).
- **A network of fake Hyperliquid clone sites** (documented through Jan 2026): pixel-perfect copies where the only working button is "Connect Wallet" → drainer prioritizes highest-value assets; spread via hacked verified X accounts. Domains incl. `hyperliquid[.]life`, `hyperliquidmetrics[.]xyz`, `app-hyperiliquild[.]org` ([pcrisk](https://www.pcrisk.com/removal-guides/29580-fake-hyperliquid-trading-platform-scam)). Variants: [HYPE Vote Rewards drainer](https://malwaretips.com/blogs/hyperliquid-hype-vote-rewards-scam/), [wallet-connection scam](https://www.pcrisk.com/removal-guides/31988-hyperliquid-wallet-connection-scam), [airdrop scam](https://www.pcrisk.com/removal-guides/29899-hyperliquid-hype-airdrop-scam).
- **OneKey's "Hyperliquid Phishing Scams Targeting Users in 2026"** ([link](https://onekey.so/blog/ecosystem/hyperliquid-phishing-scam-2026/)) documents five active schemes — typosquats, paid-search phishing, fake airdrops, fake support, malicious HyperEVM approval requests — with the core mechanism: *"That signature may approve a malicious contract, transfer assets, or grant token permissions that allow later theft."*
- **On the Chrome Web Store itself:** a listing named **"Hyperliquid Extension - Perps & Vault"** (~23 users) carries a mismatched "Habit Tracker" description — the classic repurposed-listing red flag — and Hyperliquid Labs ships **no** official extension. A separate "HyperliquidX Browser Extension" site (hyperliquidextension.com) is already a dead domain. The name is being squatted and probably weaponized.
- **Industry numbers:** 2024 drainer losses **$494M / 300K+ wallets**; 2025 still **$83.85M across 106,106 victims**, with **Permit-signature phishing = 38% of large-case losses** ([ScamSniffer 2025 report](https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/), corroborated by [Cointelegraph](https://cointelegraph.com/news/crypto-phishing-losses-fell-83-percent-2025-wallet-drainers)). Drainers embedded in **malicious browser extensions caused $40M+ by mid-2025**. Marquee extension incidents: **Trust Wallet extension supply-chain compromise, Dec 2025, ~$6-7M** ([CCN](https://www.ccn.com/education/crypto/trust-wallet-warning-6m-lost-btc-eth-sol-browser-extension/)); fake **"Safery" wallet extension** exfiltrating seeds from inside CWS for ~7 weeks ([The Hacker News](https://thehackernews.com/2025/11/fake-chrome-extension-safery-steals.html)); the **imToken clone that turned malicious after an ownership transfer** ([The Hacker News](https://thehackernews.com/2026/03/chrome-extension-turns-malicious-after.html)).

### ⚠️ Corrections vs. the original brief (do not print these claims)

1. **There is no OneKey writeup about a fake "Hyperliquid" Chrome extension.** OneKey's HL security articles cover site/ad/signature phishing, not an extension takedown. Cite OneKey for the threat taxonomy only.
2. The "Hyperliquid Extension - Perps & Vault" impersonation read is high-confidence but its details (23 users, provenance) come from search-index data, not a live listing fetch — verify manually before naming it in published copy; safer to say "extensions squatting the Hyperliquid name."
3. Don't say HL itself was hacked/DNS-hijacked — **no evidence found.** The true story is sharper anyway: *the platform is fine; the periphery is the kill zone.*

### The synthesis that IS the positioning

> Every documented way HL users lost money in 2025-26 — ad clones, vote/airdrop drainers, fake extensions, Permit phishing — **begins with a connect-and-sign step.** HypeLens has no such step. Not "we're careful with your signatures" — *there is nothing to sign, nothing to connect, nothing to approve.* A read-only extension with one host permission and zero signing capability sits structurally outside the entire 2025-26 loss dataset.

## 2. Our counter-position (claims inventory — every line auditable against `extension/manifest.json` and README)

| Claim | Ground truth |
|---|---|
| **Read-only** | Never touches `window.ethereum`, keys, signatures, or the page's own DOM state |
| **Zero wallet permissions** | One permission total: `storage`. No `tabs`, no `activeTab`, no `<all_urls>`, no cookies, no `scripting` |
| **Two hosts only** | Content script on `app.hyperliquid.xyz`; only network call is `POST https://api.hyperliquid.xyz/info` — HL's public, keyless API |
| **No signatures ever requested** (MVP) | No execution path exists in the code |
| **No accounts, no telemetry** | Nothing sent anywhere except the HL public API request |
| **Open source, audit-in-minutes** | Vanilla JS, no build step, no minification — "what you read is what runs" |

This checklist deliberately mirrors what security writeups tell users to inspect (minimal permissions, single-host scope, no "authentication information" in the CWS privacy tab, reviewable source — cf. [OneKey's own checklist](https://onekey.so/blog/ecosystem/browser-wallet-hyperliquid-trading/), and the precedent that read-only positioning converts: Pocket Universe's "we can only read, never touch" pitch, Revoke.cash's open-source stance, DeBank/Zerion watch-wallets). Our CWS privacy tab must read **"No data collected"** — both competitors disclose collecting authentication info; that contrast is visible right on the store page.

**Contrast table for copy (never name-and-shame by brand in public posts; describe by behavior):**

| | Typical "HL extension" | HypeLens |
|---|---|---|
| Wallet access | embedded/connected wallet | none — can't hold funds |
| Signing | places real orders | nothing to sign, ever |
| Permissions | auth info, broad hosts | `storage` + one site |
| Source | minified | open, unminified |
| If it turns malicious | your funds | your funding table |

**Roadmap honesty rule:** Module 3 (opt-in order routing via builder code) will someday add signing. All copy must say "never asks for a signature — **and the day any optional execution feature exists, it will be a separate, explicit opt-in; the read-only core stays read-only.**" Never write "will never execute trades." Burned trust here kills the company; the imToken ownership-transfer story is exactly the pattern users fear.

---

## 3. The one-liner

> **HypeLens shows you every funding extreme on Hyperliquid without ever asking for a signature — read-only, one permission, open source.**

Short form (bio/footer): **Funding intel inside Hyperliquid. Read-only. Nothing to sign, nothing to drain.**

---

## 4. Chrome Web Store listing copy

**Title** (CWS shows ~45 chars in search):
```
HypeLens — Hyperliquid Funding Intel (Read-Only)
```

**Subtitle / short description** (132 chars max):
```
Funding APR, premiums, OI & hyperp flags overlaid on app.hyperliquid.xyz. Read-only: no wallet, no signatures, no data collected.
```

**Description:**
```
HypeLens overlays live market intel on app.hyperliquid.xyz — so you see what a
position really costs before you open it, without leaving the trade screen.

WHAT YOU GET
• Every HL perp in one sortable table: signed funding APR (annualized, not the
  hourly noise), mark-vs-oracle premium, open interest, 24h volume
• Extreme-funding highlighting — spot who's paying 300% APR to hold
• A badge on every coin page: that coin's funding APR, premium, OI, and
  next-funding vs Binance/Bybit
• Hyperp flags — pre-launch perps priced off their own EMA behave differently;
  HypeLens marks them and shows the premium
• A shareable funding-extremes card (generated locally in your browser)

WHY YOU CAN TRUST IT — VERIFY, DON'T BELIEVE
Fake "Hyperliquid" sites and extensions drained wallets throughout 2025-26.
Every one of those attacks needed you to connect and sign. HypeLens removes
that surface entirely:
• READ-ONLY. It cannot place orders, hold funds, or touch your wallet.
  There is nothing to sign — ever.
• ONE PERMISSION: storage (caches API responses). No tabs, no cookies,
  no "read data on all websites."
• ONE DATA SOURCE: Hyperliquid's public info API. Your data goes nowhere —
  we collect nothing, there are no accounts and no telemetry.
• OPEN SOURCE, UNMINIFIED. Plain JavaScript, no build step. Read every line
  that runs: [repo URL]

Not affiliated with Hyperliquid Labs. HypeLens is analytics only and never
asks you to connect a wallet — if something claiming to be HypeLens does,
it's fake.
```

(CWS checklist for the listing itself is in LAUNCH.md §a.)

---

## 5. Five taglines

1. **Nothing to sign. Nothing to drain.**
2. **The only Hyperliquid extension that can't touch your wallet.** *(defensible: the other two hold auth credentials)*
3. **See the funding. Keep the keys.**
4. **Intel, not access — read-only by design.**
5. **Don't trust it. Read it.** *(open-source, unminified — the audit IS the ad)*

---

## 6. Voice rules

- Lead with the trader value (funding extremes at the point of trade), then land safety as the reason it's installable. Safety alone doesn't create desire; funding APR does. Formula: **hook = money, close = safety.**
- Say "read-only" and "nothing to sign" in *every* public artifact — post footers, card footers, bio, README, listing. Repetition is the moat; we're conditioning "HypeLens = the safe one" against a backdrop where "HL extension = scam."
- Never FUD Hyperliquid itself (the platform wasn't hacked; the periphery was). We're allies of the venue: "the app is fine — it's everything pretending to be the app that isn't."
- Prefer verifiable imperatives over assurances: "check our permissions tab — it says storage, that's all" beats "we take security seriously."
- "Not affiliated with Hyperliquid Labs" appears wherever the name does. Squatters blurred that line; we sharpen it and it makes us look like the adults.
