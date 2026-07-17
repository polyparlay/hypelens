# HypeLens — Launch Checklist & Operator Handoff
_Everything the tool needs to go from "built" to "live + earning." Split into DONE
(in the repo) and OPERATOR (only you can do — browser/wallet/accounts/keys)._

═══════════════════════════════════════════════════════════════════
## STATE OF THE BUILD
═══════════════════════════════════════════════════════════════════
Extension: `extension/` — two manifests:
  • `manifest.launch.json`  → READ-ONLY store build (minimal perms: storage + api.hyperliquid.xyz). Submit THIS.
  • `manifest.module3.json` → TRADING build (adds MAIN-world wallet bridge + one-click placement). Later submission.
  • Active `manifest.json` = whichever you `cp` over it. Bump version every change.

DONE (verified in-repo):
  ✓ Real-data liquidation heatmap (top-wallet positions, viridis field, $ cluster labels)
  ✓ Your-liq-vs-crowd + SAFE/MAX-EDGE leverage + cluster-aware PLACE LEVELS (audited: placer passes its own evaluator, 6/6 coins)
  ✓ Guardian mode (reads your REAL on-chain position, exact liq) + chip risk light
  ✓ Portfolio / cross view: account-wide cross liquidation + correlation flag + what-if stress   [0.18.0]
  ✓ Offense-reframed copy + "survived the wick" share card   [0.18.1]
  ✓ Module 3 placement: agent-wallet signing, builder code f=10 → 0x9548…7c88, TESTNET-only, mainnet HARD-BLOCKED. Signing pipeline cryptographically verified end-to-end (25/25, sig recovery to master+agent).
  ✓ Orphan-guard (0.17.1): a stale tab announces itself ("reload this tab") instead of silently running old code.
  ✓ Store assets: marketing/cws-submission/ (listing, permissions), web/privacy.html
  ✓ Alert funnel: worker/liq-alerts.js (cascade detector, verified on live HL data) + wrangler.alerts.toml
  ✓ Hypercall/SYN watcher: worker/hypercall_watch.py (daily tripwire; verdict = WAIT, no market yet)

═══════════════════════════════════════════════════════════════════
## OPERATOR TO-DO (in order)
═══════════════════════════════════════════════════════════════════

### 0. Load the current build (fixes the recurring stale-pill)
   brave://extensions (or chrome://) → Developer mode ON → REMOVE all HypeLens →
   QUIT the browser (⌘Q) → reopen → Load unpacked → /Users/clawdlawd/hypelens/extension →
   NEW tab → app.hyperliquid.xyz → pill header must show the CURRENT version.
   (Reloading without quitting/close-reopen keeps old injected code — that's the ghost.)

### 1. Prove the money path (testnet, ~10 min) — only you can (browser+wallet)
   a. `cp manifest.module3.json manifest.json` in extension/, reload as in step 0.
   b. app.hyperliquid-testnet.xyz → connect wallet → FAUCET (free testnet USDC).
   c. Back on app.hyperliquid.xyz → pill → "Place on Hyperliquid" (network = TESTNET).
   d. Connect → set a local password (8+ chars) → 2 signatures (approve agent, approve builder fee).
   e. ⚡ PLACE LEVELS → Place → verify the order + SL/TP on the testnet site.
   → If it works: the pipeline is proven. If not: the on-screen error is all I need.

### 2. Turn on revenue (mainnet) — after step 1 passes
   a. Fund the builder wallet 0x9548…7c88 with ≥100 USDC in its HL perps account (builder eligibility).
   b. Tell me to flip the two `MAINNET_PLACEMENT_ENABLED` flags (hl-actions.js + background.js).
   → Every trade placed through the tool then pays 1bp to your wallet.

### 3. Launch the free read-only tool (distribution)
   a. `cp manifest.launch.json manifest.json` (clean read-only build for review).
   b. Register a Chrome dev account ($5). Declare TRADER status (EU DSA) before any revenue build.
   c. Capture 3–5 screenshots (1280×800) from the running extension; produce the 128px icon + promo tiles (rebrand PolyParlay's).
   d. Host web/privacy.html (get a URL) — needed for the listing.
   e. Submit using marketing/cws-submission/STORE-LISTING-PASTE.md + permissions-justifications.md. Review ~3–14 days.

### 4. Turn on the funnel (traffic)
   a. Telegram: create channel @hypelens_alerts, add the (PolyParlay) bot as admin.
   b. `cd worker && npx wrangler kv namespace create HL_KV` → paste id into wrangler.alerts.toml.
   c. `npx wrangler secret put TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHANNEL_ID` (-c wrangler.alerts.toml).
   d. Set INSTALL_URL in wrangler.alerts.toml to the store link once live.
   e. `npx wrangler deploy -c wrangler.alerts.toml` → cascade alerts auto-post every 5 min on real HL cascades.
   f. Decide: rebrand @polyparlay X account (warm start, adjacent audience) vs fresh @hypelens. (Tell me the follower count.)
   g. Seed via CT: AwesomeHyperEVM PR + Hypurr map form + DM @asxn_r; post the demo GIF; reply into liquidation-cascade moments.

═══════════════════════════════════════════════════════════════════
## STRATEGY (why, in one screen)
═══════════════════════════════════════════════════════════════════
• Positioning: the DEFENSIVE risk tool, framed as OFFENSE. Hyperdash & everyone map the crowd's liqs (offense);
  nobody shows "is YOUR book about to blow" (defense). We do both, in-app, honest, cheap — but we SELL it as edge.
• Moat: in-app overlay of the official app (uncontested) + your account as ONE cross book (native shows per-position
  lines only). Not "real data" alone (HL-native tools have that too).
• Money: builder codes ONLY pay if we own the execution click (Module 3) — passive heatmaps earn $0 (measured: zero
  analytics tools on the builder leaderboard). So one-click placement IS the business; heatmap is the hook. Diversify
  later with a cheap sub (undercut CoinGlass) + HL referral for new signups.
• Customer: the semi-serious CROSS-margin multi-position trader burned once by a correlated cascade — NOT the
  40x-no-stop terminal degen (blows up regardless). Has money, native fails them, no competitor serves them.
• Sizing (honest): niche. ~1,500 installs → ~$100/day at 1bp is the break-even; base case 7–11k installs.
