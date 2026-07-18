# HypeLens changelog

## v0.21.1 (both manifests) — 2026-07-18

**CRITICAL data-honesty fix** (operator-found live): the heatmap served the July-6 bundled snapshot as "real positions" — BTC walls at $66k/$68k/$60.6k that no longer exist. Ground truth (fresh 300-wallet crawl): ZERO short walls above mark within +15%, one $20.5M long wall @ $59,482.

- **ROOT CAUSE (confirmed):** `refreshWhales()` crawled ALL 300 wallets in one async task. MV3 kills the idle service worker ~30s after the triggering message resolves → the crawl died partway EVERY time; each TTL expiry restarted it from wallet #0; only the first ~10-30s of wallets (always the same ones) ever got crawled, so most coins never reached the 12-live-level bar → `computeCoinIntel` fell back to `bundledLevels` forever, labeled "real positions". The v0.20.1 session-persistence only helped if a pass ever completed — none did. Confirmed empirically: a fresh full crawl reproduces the operator's ground truth exactly ($20.5M long @ $59,482, zero shorts +15%), which the fossil bundle contradicted.
- **FIX 1 — incremental resumable crawl:** `advanceWhaleCrawl()` replaces refreshWhales. Each incoming message (getCoinIntel/getMarkets/getAdlRank/getClusterWallets) advances ONE ~25-wallet chunk (seconds — safely inside the SW lifetime), persisting the cursor + accumulated per-wallet rows to `chrome.storage.session` after EVERY chunk. A full pass completes across many SW wakeups; a pass older than 30 min restarts; `crawlBusy` prevents overlap. Progressive publish: ≥50 wallets → the partial snapshot is preferred over the bundle; `complete:true` (and `levelsSource:'live'`) ONLY after the full pass; `'live-partial'` + wallet count while in progress. Message-driven continuation — NO new permissions (no alarms).
- **FIX 2 — staleness honesty (brand-critical):** chart-foot badge now has three exact states: bundled → amber **"snapshot 2026-07-18 · STALE — live crawl in progress"** (STALE appears when the bundle is >24h old; date read from the bundle's new `updated` field); live-partial → **"live · N of 300 wallets"**; complete → **"real positions · ~X% of OI"** (unchanged). Badge updates dynamically every render (was mount-only). Verdict degradation on stale bundled data: a would-be "clear" renders amber **"~ … clear? · stale data"** — NEVER mint; all status lines get a dim "stale data" suffix + tooltip caveat; the cascade card dims with a "stale data" suffix and the red cascade-through-liq alarm is suppressed. `viewmodel` passes `levelsMeta {source, bundleUpdated, bundleStale, crawl}` through to the HUD.
- **FIX 3 — bundle regenerated:** fresh 300-wallet crawl (573 positions, 91 coins, 0 failed wallets) written to `data/real_liq.json` in the extension format with `updated: 2026-07-18T…` — even the fallback is current at ship time, and dated forever after.
- **Verified by execution** (`crawl_stale_test.cjs`, real background.js + hud.js, 30 asserts): simulated SW-restarts (fresh sandbox per boot, only a structured-clone fake `storage.session` surviving) — cursor persists per chunk (25 → resumes at 50, never restarts from 0), partial snapshot publishes at ≥50 with `live-partial` labeling, pass completes across lifetimes with every wallet crawled exactly once, complete snapshot survives a further restart as `'live'`, fresh pass → no redundant crawling; badge copy exact in all 3 states; stale verdict cap (mint impossible, amber "clear?", suffix + tooltip) with the identical book still mint under live data; cascade dim+suffix; regenerated bundle date + ground-truth walls asserted. All 6 prior suites still green. `node --check` green.

## v0.21.0 (both manifests) — 2026-07-15

Two launch-gap features, both evidence-backed by the market research ("personal risk truth at point of trade"): ADL exposure + named-whale liq drill-down. Cascade predictor untouched.

**FEATURE 1 — ADL EXPOSURE (estimated · profit×lev rank)**
- **Research verdict:** HL shows ADL risk-tier indicators in its own web UI, but NO public info-endpoint field exposes a tier/queue rank (checked clearinghouseState, webData2, docs). The docs DO publish the exact priority formula: counterparties in profit are ranked by `(mark_price / entry_price) * (notional_position / account_value)` — profit-ratio × effective leverage, highest deleveraged first. We compute that documented proxy and label it "estimated" everywhere (same real-vs-estimated honesty as the heatmap).
- **background.js:** whale crawl now also keeps `entryPx` + `acctVal` per position (same clearinghouseState response, no new calls). New `getAdlRank` message: computes the user's ADL index and percentile-ranks it against the IN-PROFIT same-coin+side tracked whale positions → `{eligible, topPct, n, tier: high(≤15%)/elevated(≤40%)/low, source:'proxy'}`. A position in LOSS returns `eligible:false` (ADL force-closes winners). <5 comparable whales → `tier:'unknown'` (never a fake rank).
- **content.js:** per-position ADL fetch (throttled 60s/coin) after each positions poll; attached to the guardian position + every portfolio row.
- **UI (one line, prose in tooltips):** guardian status line gets an ADL segment — `ADL high · top 8%` (red/amber/mint; tooltip: "top 8% profit×lev among tracked BTC longs (n=42)… estimated from HL's documented ADL priority — not an official queue position"). Portfolio rows get a compact color-coded `ADL` marker.
- **HEDGE-LEG WARNING (the Oct-10 failure mode):** `hedgeRisk()` — when the book holds offsetting long+short legs across CORR_MAJORS (minor side ≥25% of major gross, so dust doesn't count) AND a leg is ADL-high, one red line in the portfolio card (and on that coin's guardian view): "⚠ hedge risk: your LONG leg (BTC) is ADL-exposed — a squeeze can amputate it and leave you naked short".

**FEATURE 2 — NAMED-WHALE LIQ DRILL-DOWN (roadmap #1)**
- **background.js:** new `getClusterWallets` message — coin + price → the wallets whose liq prices sit in a ±0.6% band, from the EXISTING whale snapshot (no new API calls, no new permissions). Returns full+short addr, side, position value, exact liq price, distance from mark; sorted by size; top 6 + count + total.
- **UI:** a `walls` chip row under the chart (top 3 real walls ≥$10M: `▼ $41M @ $60.7k`, side-colored, tap to drill; hidden in the popup where no data source exists). Tap → ONE compact drill-down panel: up to 6 rows of `0x1a2b…c3d4 · long · $12.4M · liq $60,725 · −4.9%`, each addr an `<a target="_blank">` to hypurrscan.io (plain link, no new permissions), then "N more wallets · $XM total". Second tap on the same wall or × closes.
- **Share hook:** the panel's ⇪ renders a branded 1200×675 PNG — "$31M IN LIQS STACKED AT $60,036 · top wallets listed" — cluster levels only, never the user's own data; same clipboard+download path as the other cards.
- **Verified with the real bundled data:** top BTC long wall $60,036 → "$31M WALL @ $60,036 · 2 wallets · top 0xa822…d748 $23M".

**Verified by execution** (`adl_drill_test.cjs`, real background.js + hud.js in a chrome-shimmed sandbox, 22 asserts): highest profit×lev → tier high/top 8%; rank monotonic in the index; loss → not eligible; shorts/losers excluded from a longs queue (n exact); drill-down returns exactly the in-band wallets, sorted desc, truncated at 6, totals over ALL in-band; hedge warning fires ONLY on offsetting-with-exposed-leg (not on no-offset / no-exposure / dust / non-major); rendered ADL copy + tooltips checked. All prior suites still pass (lev_hero, cascade, density, bridge_secret, content_fixes). All `node --check` green.

## v0.20.1 (both manifests) — 2026-07-13

FIX BATCH from a two-agent code review (wiring + security). hud.js/viewmodel.js untouched (third review pending). Verified against source; every fix executed under test where cheap.

**content.js**
- **H1 coin-case:** `detectCoin()` uppercases the URL segment ("KPEPE") but the bg caches are keyed by HL canonical names ("kPEPE") → mixed-case coins rendered empty intel as real data + candle retries forever. Now every bg send canonicalizes via `rowFor(coin).coin` (`apiCoinFor`); the UPPERCASED form stays the local cache key only.
- **H2 guardian address false positives:** (a) the any-localStorage-value 0x scan is DELETED — only wagmi/rainbow/walletconnect keys are read, with a structured walk of the wagmi JSON (`collectWagmiAccounts`) preferred over raw regex; (b) DOM candidates are only accepted when the page ALSO shows the address as a truncated connected-account label (`0x1a2b…c3d4`) in header/account context; (c) an established `userAddr` is never silently switched — a different address is adopted only after the current one vanishes from ALL sources for ≥3 consecutive scans (logged).
- **H3 stale-response race:** `fetchPositions` re-checks `state.userAddr` against the requested address AFTER the await — positions for a previous address are dropped.
- **H4 onRoute vs onCoin:** the 500ms route poll acted on `coin !== state.currentCoin`, snapping a portfolio row-click (onCoin) back to the URL coin within 500ms. Now it tracks `lastUrlCoin` (initialized at boot) and only acts on a REAL navigation; onCoin overrides survive until the URL coin actually changes.
- **M1 wallet disconnect:** when a non-manual address disappears from storage+DOM for ≥3 scans, guardian state (userAddr/positions/account) is cleared and re-rendered.
- **M2 orphan guard:** `markDead()` now clears pollTimer, posTimer, the route interval, and all retry timeouts; `refreshData`/`fetchPositions`/`onRoute` bail when dead; `renderStaleChip` is idempotent; a bg version-mismatch response resolves `null` (L4) so stale code never renders new-version data.
- **M5 retry backoff:** fixed 2s-forever retries replaced with exponential 2s→30s (cap); candle retries capped at 10 per coin|tf, counters reset on success and on coin/tf change. Verified: exactly 11 sends (1+10) then stop.
- **L1:** a late `getCoinIntel` response only sets `state.coverage` when its coin is still the active coin. **L5:** `openPanel` persists `chip.dismissed=false` via `saveChip()`.

**background.js**
- **M3 SW-restart safety:** the whale snapshot is persisted to `chrome.storage.session` on every publish and rehydrated in `refreshWhales`/`getCoinIntel` — intel no longer drops to "bundled" after every service-worker restart. The hardcoded `nWhales: 2000` is replaced by the actual snapshot/crawl-list count.
- **L2/L5-security:** `setAccessLevel(TRUSTED_AND_UNTRUSTED_CONTEXTS)` promise is `.catch()`ed and documented (REQUIRED: the vault unlocks in the content-script context); hardening added in the vault instead — see 30-min auto-relock below.
- **L3:** `withTimeout` clears its timer in `finally` (no leaked timer per whale request). **L6:** fire-and-forget `refreshWhales()` gets `.catch(()=>{})`.

**exchange/* + inject-eth-main.js (security; mainnet block + builder pinning untouched)**
- **S-M1 bridge authenticity (ship-blocker):** postMessage responses were matched by observable `id` only — any page script could forge `HLX3_ETH_RES`. Now: `inject-eth-main.js` (moved to `run_at: document_start`, MAIN world) generates a per-page-load random secret and writes it to `<html data-hlx3s>`; new `exchange/hl-secret.js` (ISOLATED, document_start) grabs AND DELETES the attribute before any page script runs, pinning it on an isolated-world global. Every REQ/RES must carry the secret; unsigned messages are ignored both directions; all posts target `window.location.origin`, never `'*'`. Verified: a hostile in-page forger is ignored while the real handler answers; secret-less REQs get no reply.
- **S-M2 typed-data allowlist:** the MAIN-world bridge refuses any `eth_signTypedData_v4` whose primaryType isn't `HyperliquidTransaction:ApproveAgent` / `ApproveBuilderFee`; for ApproveBuilderFee it enforces `message.builder` == pinned builder (lowercased) and `maxFeeRate === '0.01%'` — pinned constants duplicated in the MAIN script (it must trust nothing from the page). Verified: Permit-style payloads and wrong-builder/wrong-fee refused WITHOUT calling the wallet; the two legit payloads relay.
- **S-M3 wire-value preview (ship-blocker):** new `HLX3.place.preview(plan)` returns the exact `priceToWire`/`sizeToWire` values; place-ui shows them BEFORE signing ("places 0.12 BTC @ 12346 — rounded from your …") and BLOCKS when normalized size drifts >0.5% from input or the rounded entry crosses the SL/TP trigger.
- **S-M4 stale master:** `setup()` re-queries `eth_accounts` (read-only, no prompt — new bridge method) before EACH of the two signatures and aborts with "wallet account changed — reconnect" on mismatch.
- **S-L6:** `sizeToWire` throws "size rounds to zero at N decimals" instead of emitting '0' for a positive size. **S-L8:** vault `saveLocal`/`saveSession` reject on `chrome.runtime.lastError` instead of silently resolving.
- **Vault auto-relock (L2 hardening):** the decrypted agent key in session storage now lazy-expires 30 minutes after unlock — any read past the TTL wipes it (works across SW restarts, no alarms permission).

**Verified:** all JS `node --check` green; existing suites (lev_hero, cascade, density) still pass untouched; two NEW executed suites — `bridge_secret_test.cjs` (16 asserts: secret handshake, forgery rejection, origin-targeted posts, typed-data allowlist, eth_accounts, sizeToWire guard) and `content_fixes_test.cjs` (real content.js in a chrome/DOM shim: canonical kPEPE sends, 11-send retry cap, onCoin override survives route poll, wagmi-store adoption, decoy rejection).

## v0.20.0 (both manifests) — 2026-07-12

**DENSITY REDESIGN.** Operator feedback: "too much scroll and too text heavy." Reorganized the planner/guardian information architecture around a no-scroll default view + progressive disclosure. ALL functionality and event wiring preserved (dir/margin/size/slider, `.hlx-setlev` snap, PLACE LEVELS, Place-in-HL, X3 wizard) — this is reorganization + prose-cutting, not deletion.

- **Merged status line** — the leverage-verdict card (`.hlx-safelev`) and the `Nx · liq $X · verdict` readout (`.hlx-readout`) collapse into ONE color-coded line (`.hlx-status`): clear → `✓ 16× · liq $60,725 · clear`; on-wall → `⚠ 40× · liq $60,237 · near $31M wall → 16× [Set 16×]` (inline verdict-consistent snap, `.hlx-setlev` wiring + nearest-clear invariant intact); straddle → `⚠ 9× · liq $57,665 · walls straddle liq zone`. The long "no leverage clears them, set a hard stop…" prose is now the line's `title=` tooltip.
- **Cascade → one line** — `▼ $60M cascade @ $60,725 → $58.2k · ▲ $89M squeeze @ $66,000` (down red, up mint). Shows the chaining side(s); if neither chains, the single biggest wall. The "modeled cascade · real positions, estimated impact" disclaimer moved to the line's tooltip. Multi-row card markup removed.
- **Prose → tooltips** — the panel subtitle ("the crowd's liq walls = where price gets pulled…") is now a `ⓘ` next to the title (`LIQ DEFENSE ⓘ`); the cross-liq "≈ account-wide" caveat is the `≈ liq` segment's tooltip; the chart-foot credibility badge trimmed to `real positions · ~N% of OI` (the moat claim kept, the sentence dropped).
- **"Trade" expander** — a single toggle (`Trade ▸` / `Trade ▾`), COLLAPSED by default, hides the manual SL/TP % inputs + R:R badge, the "Place in HL" button + funding chip + info ⓘ, and the X3 placement wizard mount. Open/closed persists in a session-scoped in-memory flag (survives data-refresh AND remounts). Gated by a container-level `.hlx-trade-open` class so it also hides the externally-appended `.hlx-x3-mount`. Guardian mode has no order entry → no expander, just merged verdict + cascade + the pre-liq cascade-through-liq warning (one short line).
- **CSS** — new `.hlx-status` / `.hlx-casc-line` (one row) / `.hlx-trade-toggle` + `.hlx-trade-body` (collapsed = `display:none`) / `.hlx-plan-info`; removed the now-dead `.hlx-safelev*` and `.hlx-readout` rules (verified unused in both guardian + planner).
- **Verified by execution** (`density_test.cjs`, real `HLVM`/`HLHUD`, DOM shim): (a) verdict+liq+cluster render on ONE `.hlx-status` line; (b) cascade on ONE `.hlx-casc-line`; (c) every teaching sentence (subtitle, cross-liq caveat, cascade disclaimer) appears ONLY inside a `title="…"` attribute, never inline; (d) the Trade body is `display:none` by default and its SL/TP inputs + Place button + wizard mount exist in the DOM after the toggle (revealed on expand); guardian shows the merged line with NO Set button. Both prior suites still green: `lev_hero_test.cjs` (leverage-hero invariant) and `cascade_test.cjs` (cascade model).
- Untouched: cascade model + leverage math + verdict thresholds, portfolio, heatmap, PLACE LEVELS logic, Module 3 signing, read-only launch manifest.

## v0.19.0 (both manifests) — 2026-07-12

**LIQUIDATION CASCADE MAP ("gravity") — the predictive layer + core moat.** Turns the descriptive heatmap into a PREDICTIVE one: price entering a real liq cluster forces those liquidations → forced market orders push price further → can reach the NEXT cluster → chain reaction. Only possible because HL is on-chain and we have real per-wallet liq prices + notionals (Coinglass/Hyblock simulate from estimated data and can't do this).

- **`computeCascade(vm, dir, opts)`** in `viewmodel.js` (exported on `window.HLVM`), pure. `dir` = `'down'` (long-liq cascade below mark) or `'up'` (short-squeeze above mark). Buckets the real `vm.liqLevels` on the relevant side into clusters, sorts nearest→farthest from mark, then WALKS price into the side: each fired cluster's notional `N` moves price by `impact ≈ k·N / marketDepth` (depth = `vm.oiNtl` OI-USD, fallback `dayNtlVlm`, then a crude liq-sum proxy), clamped to ≤6%/step. If that impact carries price to the next cluster, it fires too (accumulate); stop when the chain stalls or the side exhausts. Returns `{dir, chain, isolated, triggerPx, terminalPx, totalLiqUsd, hops[], dropFrac, biggestWall, depth, k}`.
  - **Self-sustaining** = ≥2 walls fire in sequence → `chain:true`, `triggerPx` = the first wall ("cascades if price breaks X"). No chain → reports the single biggest wall + its isolated impact, labelled "no chain · isolated wall".
  - Tunable consts: `CASCADE_K = 0.6` (impact coefficient — conservative), `CASCADE_MAX_STEP = 0.06`, `CASCADE_BAND = 0.35`.
  - **`cascadeHitsPrice(cascade, px)`** — true when a price (e.g. your liq) lies in `[terminalPx, triggerPx]`, i.e. the chain sweeps through it.
- **Cascade card** (planner + guardian, one tight card in the existing visual language): a "⛓ LIQUIDATION CASCADE" head, then each side — down in red, up in mint — e.g. "▼ $59.6M cascade if **$60,725** breaks → **$57,584** (5.6× daily) · 3 walls chain". The bigger/chained side leads. Footer label **"modeled cascade · real positions, estimated impact"** — we never present terminalPx as certain (same "real vs estimated" honesty discipline).
- **Guardian pre-liq warning:** if a same-side cascade (long → down, short → up) runs THROUGH your real liq, the guardian read gets a red line: "⚠ a $47M cascade at $60,725 runs THROUGH your liq $59,400" — a warning that fires BEFORE price reaches your liq.
- **On-chart overlay: shipped card-only** (per spec) — the directional arrow/gradient was skipped to avoid the LWC readiness race; the card is the feature and stands alone. Can be added later once the overlay plumbing is proven stable.
- **Verified by execution** (`cascade_test.cjs`, real `HLVM`): stacked walls $17M@60725 / $30.6M@60000 / $12M@59000, mark 61000, depth 500M OI — `k=1.0` fires all 3 walls (total $59.6M, chain, trigger 60725, terminal 57584); `k=0.2` stalls at the first wall (no chain, reports biggest $30.6M wall). A lone distant wall → no chain, isolated. Down/up symmetry holds (equal hop count + totalLiqUsd; dropFrac ~equal, approximate under multiplicative impact). Guardian path-through-liq fires ONLY when liq ∈ [terminalPx, triggerPx]. 22/22 assertions pass.
- Untouched: leverage hero (0.18.2), verdict math, portfolio, heatmap, PLACE LEVELS, Module 3, read-only launch manifest.

## v0.18.2 (both manifests) — 2026-07-12

Fix the leverage hero: it implied leverage-safety was monotonic ("MAX EDGE LEVERAGE ≤ N×"), but clusters make it NON-monotonic — a *lower* leverage can walk your liq onto a wall a higher one clears. Operator hit exactly this in Cross: the hero said "≤ 20×" while their current 16× liq sat on a $17M wall (and the current-liq line correctly read "LIQ ON CLUSTER, critical"). The hero contradicted the verdict and made "less leverage" look safe when it was more dangerous.

- **Dropped the "≤ N×" framing entirely.** The hero no longer implies "anything under N is safe."
- **Hero now AGREES with the current-liq verdict** (keyed off the SAME `dangerVerdict` result). If your current liq is clear → "✓ YOUR {L}× LIQ IS CLEAR · liq $X sits in a gap". If it's on/near a wall → "⚠ YOUR {L}× LIQ SITS ON A $Nm WALL / HAS A WALL IN ITS PATH / IS NEXT TO A $Nm WALL / IS IN THE KILL ZONE" (drawn from the verdict's own on-cluster / path / proximity signals, so the two can never disagree).
- **Nearest-clear suggestion (search BOTH directions).** New `nearestClearLev(curL)` expands outward from your current leverage (curL±1, ±2, …) and returns the closest leverage whose liq lands in a clear gap AND is ≥~2 daily moves out — up OR down. At each radius the DOWN step (farther liq = safer proximity) is preferred on ties. Sub-line: "clear it → {nc}× (liq $X)" + a one-tap **"Set {nc}×"** snap (planner only; guardian shows it as info since the real position's leverage can't be changed from here).
- **Per-leverage safety strip** under the slider (planner): a thin mint/red gradient across the whole 1..maxLev range — mint where that leverage's liq is in a clear gap, red where it's on/near a wall — making the non-monotonicity visible at a glance. Cached on coin/dir/mark/field (recomputes only when those change, not on every slider tick).
- **Share card** second line matches the window now: clear → "✓ {L}× LIQ CLEAR OF THE WALLS", else "⚡ CLEAR IT → {nc}×". No more "≤".
- **`safeLeverage` refactored** onto a shared per-leverage `levClear(L)` check (liq in a gap + ≥2 daily moves); still used by PLACE LEVELS + the card's fallback (as a concrete value, not a "≤" claim).
- **Cross/short direction confirmed:** long liq price is monotonic increasing in leverage, short monotonic decreasing — the displayed liq tracks the slider correctly in both iso and cross.
- **Regression test** (`_t` read-only hooks): a book where a higher leverage is clear but a lower (current) one lands on a wall — asserts the hero never claims "≤L clear", flags the on-wall current setting, and points to a genuinely-clear nearest leverage. All pass.
- Untouched: verdict math thresholds, portfolio, guardian, heatmap, PLACE LEVELS logic, Module 3, read-only launch manifest.

## v0.18.1 (both manifests) — 2026-07-12

Offense-frame the copy (same data, edge language not nanny language) + a "survived the wick" share card. No logic changes to the risk math.

- **Offense-framed copy (wording only, still descriptive/compliant):**
  - SAFE-LEVERAGE hero → **"⚡ MAX EDGE LEVERAGE ≤ N× · your liq stays out of the crowd's kill zone — press the edge"**; above it → "you're at M× — past the edge, in the kill zone"; none → "⚠ NO EDGE LEVERAGE — every level lands your liq in the kill zone — size for it".
  - Section descriptor → "the crowd's liq walls = where price gets pulled · keep your liq clear" (offense + defense together).
  - PLACE LEVELS result → **"your edge · R:R 1:Z · SL $X (stop behind the wall) · TP $Y (into the magnet)"**.
  - Share card bottom line uses "⚡ MAX EDGE LEVERAGE" too.
- **"SURVIVED THE WICK" share card (new variant):** `detectWick` scans the visible candles for a wick that stabbed to within ~1.5% of the liq (guardian real liq or planner liq) on the SAFE side (didn't liquidate) AND where price then recovered. When found, a 🔥 button appears next to ⇪ in the header → renders a branded 1200×675 amber-accented card: "SURVIVED THE WICK · {coin} wicked to $X — {N}% from my liq — and held", the real heat bands, the wick + liq marked, HypeLens + hypelens.app. Same canvas → clipboard + download path. No size/PnL (privacy). No near-miss → the button just isn't shown; the normal ⇪ card is unchanged. Verified: near-miss+recovery fires (1.1%), liquidated / no-miss / still-hovering all correctly return null, shorts work.
- Untouched: portfolio (0.18.0), guardian, heatmap, verdict math, PLACE LEVELS logic, Module 3, read-only manifest.

## v0.18.0 (both manifests) — 2026-07-12

PORTFOLIO / CROSS view — account-wide risk across ALL your positions (the thing native + everyone else doesn't show). Read-only, same clearinghouseState we already fetch, no new permissions.

- **Data plumbing:** `getUserState` now also returns `marginSummary` / `crossMarginSummary` (accountValue, totalNtlPos, totalRawUsd, totalMarginUsed) + `crossMaintenanceMarginUsed`, and per position adds `markPx` (derived positionValue/|szi|) and `leverage.type` (isolated|cross). content.js fetches each held coin's candles for the daily-move distance and passes a `portfolio` into ctx.
- **Third mode (portfolio ⇄ guardian ⇄ planner):** auto-shown when the user has ≥2 positions or any cross position; a `book/guardian/planner` toggle switches. The chart still marks your real liq for the current coin regardless of panel.
- **Account header:** account value · total notional · total leverage (totalNtlPos/accountValue) · free margin (accountValue − totalMarginUsed) · a margin-utilization health bar (mint→amber→red).
- **All-positions list (risk-sorted, closest-to-liq first):** coin · side · lev · [ISO|CROSS] · uPnL · liqPx · distance-to-liq in daily moves · a mint/amber/red risk dot. Tapping a row switches the chart/guardian to that coin.
- **Account-wide CROSS liquidation (the hero number):** first-order model — `m_liq ≈ (crossEquity − crossMaintenance) / |Σ signed cross notional|`, a down move if net long / up if net short, with the biggest-drag coin + its share of net notional. "All isolated → no shared-margin risk" and net-flat → "hedged" handled honestly; caveat tooltip (first-order, correlated move, maintenance ~constant, real liq path-dependent). Verified on a synthetic 3-cross-long book: $8.2k buffer / $60k net → ~13.7% down, drag BTC 50%.
- **Net exposure + correlation flag:** net long/short % of notional; if ≥70% net one-sided across ≥2 correlated majors (BTC/ETH/SOL/…) → red "⚠ N% net {side} across correlated majors — one market dump hits the whole book."
- **What-if stress (−5/−10/−20% presets):** recomputes the cross buffer + lists which longs liquidate at that move ("cross buffer $X · BTC, ETH liq"). Verified: −10% → BTC+ETH, −20% → whole book gone.
- **Planner cross-liq honesty:** in planner with margin=cross, the liq is labeled "≈ liq" with a note "cross liq is account-wide, not per-position — see the Portfolio view" (no longer presents the iso formula as a cross liq). Guardian already uses the exact API liquidationPx.
- Untouched: guardian/chip/share/coverage, heatmap, verdicts, safe-leverage, PLACE LEVELS, Module 3 dormant, read-only manifest scope.

## v0.17.2 (both manifests) — 2026-07-10

Placement-wizard UX fix (operator hit it live): the wallet prompt is now the FIRST thing that happens, and bridge failures are loud.

- **Wizard reordered (1/4…4/4 progress header):** STEP 1/4 "Connect wallet" fires `eth_requestAccounts` through the MAIN-world bridge IMMEDIATELY on click — the familiar wallet popup leads; the connected address shows as ✓ confirmation. STEP 2/4 is the passphrase, with plain-language copy: "Set a local password (8+ chars). It encrypts HypeLens's trading key on this device — it is NOT your wallet password and never leaves your machine. You'll use it to unlock trading each session." STEP 3/4 = the two signatures (approve agent → approve 0.01% builder fee, each labeled "signature N of 2 — check your wallet"). STEP 4/4 = ready. `hl-place.js` split into `connectMaster()` + `setup(passphrase, master, onStep)`.
- **Bridge failures surfaced (was: silent 120s hang = "looks broken").** New instant `ping` handshake in the MAIN-world script + `probe()` in the isolated client (1.5s): no pong → "wallet bridge not available in this tab — reload the tab (the extension may have been updated)"; pong but no provider → "no wallet provider found — is MetaMask/Rabby installed and unlocked?". `eth_requestAccounts` timeout cut to **~20s** with a visible error. Every step logs `[HLX3] …` (bridge loaded → probe → prompting wallet → account → passphrase→key → approveAgent sig → approveBuilderFee sig → complete).
- **End-to-end bridge trace (real files, simulated postMessage loop + fake provider):** happy path → connect OK + valid 132-char signature; no-provider → instant clear error; bridge-missing → 1.5s probe error instead of a 2-minute silent non-prompt. Manifest verified: `world:"MAIN"` entry present, same matches as the isolated bundle, load order bridge < place < ui < content, REQ/RES tags and method names symmetric on both sides.
- No other changes. Both manifests → 0.17.2.

## v0.17.1 (both manifests) — 2026-07-10

Orphaned-content-script guard — kills the recurring "extension updated but the HL tab still runs old code" ghost-debugging loop.

- **Unmissable stale state.** When the content script detects it's orphaned (`markDead`), the chip re-renders as an amber pulsing `⟳ HypeLens updated — reload this tab` (clicking it — or the old drag/click path — calls `location.reload()`), and if the window is open a centered overlay banner appears: "HypeLens was updated. Close and reopen this tab (⌘W) to load the new version." + a Reload button. `renderChip`/`renderWindow` early-return to the stale state so normal renders can't overwrite it.
- **Fast detection (~5s).** Three triggers: (1) a lightweight 5s heartbeat checks `chrome.runtime.id`; (2) every `send()` (all poll ticks) marks dead on a gone runtime / context-invalidated `sendMessage`; (3) belt-and-braces version echo — background now attaches `v: manifest.version` to EVERY response, and the content script marks dead on `v !== VERSION` (covers runtime-still-valid edge cases). All paths log the reason.
- No other changes. Both manifests → 0.17.1.

## v0.16.2 (launch) + v0.16.2-testnet (module3) — 2026-07-10

Placer/evaluator contradiction fixed (shared horizon) + three logic upgrades.

- **BUG FIX — shared `SWEEP_HORIZON = 2.5` daily moves.** The placer picked its stop wall with a ~1.5-move horizon while the sweep-checker had none, so they disagreed (SL $61,735 "volatility stop" while the guide flagged "move below to $60,163"). Now ONE constant drives BOTH: `computePlaceLevels` stops BEYOND any big wall within 2.5 moves (vol stop only when none), and `evalStop` only flags sweep-path for walls within the same horizon (a wall 3+ moves out is noise). `clusterPlan`'s suggestion uses the identical filter + the same 1.2-move vol fallback, so guide and placer always say the same thing. **INVARIANT self-check:** `placeLevels` runs its own output through `evalStop` and nudges cold-side until it passes (bounded; flags "no clear stop" if impossible). **Regression: 6/6 PASS** across long/short × BTC/ETH/SOL real data — every placer output reads `evalStop→ok` (BTC long now correctly stops beyond the $17M wall at $59,060 instead of a sweep-path vol stop).
- **Stop-vs-liq ordering rule (`LIQ_STOP_RATIO = 1.5`).** Liq distance must be ≥1.5× stop distance. Planner: violation shows red "⚠ liq inside your stop range — max leverage for this stop: N×" (closed form: `L ≤ 1/(1.5·stopFrac + mmf)`), and PLACE LEVELS caps its leverage at `min(safeLeverage, maxLevForStop)` (result notes "lev capped at N× so liq stays ≥1.5× the stop"). Guardian (fixed leverage): warns when the real liq is inside 1.5× the suggested stop. Wall-stops farther than the vol baseline also show the honest cost: "size ↓ to $N to hold $X risk".
- **Structure-ratchet trail line:** one quiet line — "trail stop → $X (behind the $NM wall)" — the level just beyond the nearest big wall on the profit-protecting side of price (+ buffer). Shows in planner AND guardian (recomputes live as walls get consumed). Tooltip is honest: HL has no native trailing orders; this is the suggested level to move your stop to (descriptive).
- **Regime-aware TP2 runner (informational only):** when the market lean is directional IN our direction AND a second big cluster sits beyond the first magnet within ~5 moves, the PLACE LEVELS result adds one conditional line: "runner: TP2 $Y into $MM wall if the $NM magnet is consumed · R:R 1:Z with trail". Never auto-set as a line; no new controls.
- Untouched: guardian polling/chip/share/coverage, heatmap, verdicts, safe-leverage hero, Module 3 (dormant), read-only manifest.

## v0.16.1 (launch) + v0.16.1-testnet (module3) — 2026-07-10

⚡ PLACE LEVELS — one tap computes AND applies the complete cluster-aware plan (draws lines only; no orders).

- **The button** (mint, in the LIQ DEFENSE/GUARDIAN panel, both modes) runs `computePlaceLevels`:
  - **SL:** nearest >$10M cluster in the LOSS direction → placed just BEYOND it (cold side) + ~0.3×daily-move buffer (0.4% floor); if no wall within ~1.5 daily moves → volatility stop at ~1.2 moves. Then VERIFIED against the same rendered-heat sampling — never ON a bright band; nudged past (up to 8 buffers) if needed, flagged "no clear stop — clusters stack …" if even that fails.
  - **TP:** just BEFORE the nearest big magnet in the PROFIT direction (front-run ~0.25%, into the magnet not through it); if no magnet within ~3 moves → 2:1 from the stop.
  - **Leverage:** planner mode sets the slider to `safeLeverage`; GUARDIAN leaves the real position's leverage untouched (SL/TP only).
- **Apply = the existing risk state** (`stopPct/tpPct` + slider), so the lines DRAW exactly as if dragged, the readout/R:R update, and the user can still drag to adjust. One-line result: `levels set · SL $X beyond $NM wall · TP $Y into $MM magnet · R:R 1:Z`, with honesty flags: R:R < 1 → "— tight setup" (amber); no-clear-stop → red with the reason; no safe leverage noted.
- **Guardian exit plan:** SL/TP lines now draw + drag in GUARDIAN too (around the real position, using its side for the math: `clusterPlan`/`lineYs`/`applyDrag`/`desiredRange` are guardian-direction-aware).
- **Compliance:** tooltip states it "sets plan LINES on the chart — does NOT place any order. Read-only; ordering is a separate opt-in module."
- Verified on real data: BTC long → vol-stop + TP into the $66M magnet (R:R 1.1); BTC short → SL beyond the $66M wall nudged 3× past heat, R:R 0.6 flagged tight; ETH/SOL → clean fallbacks (R:R 2.0).

## v0.16.0 (launch) + v0.16.0-testnet (module3) — 2026-07-10

GUARDIAN MODE — LIQ DEFENSE now monitors the user's ACTUAL open position (read-only, ZERO new permissions), not just a hypothetical. Plus the chip risk light, a share card, and a coverage badge.

- **Real positions, read-only:** content.js detects the CONNECTED address from HL's page localStorage (wagmi-style keys) and DOM attributes (`href/title/data-*` carry the full 0x…40 even when the label is truncated) — never a wallet permission. Fallback: a small "watch addr" button in the footer prompts to paste an address (persisted). background.js polls `clearinghouseState` for it (~20s, 15s cache, public per-address read) → per coin: side/size (szi), entryPx, **exact liquidationPx**, positionValue, leverage, marginUsed, uPnL.
- **GUARDIAN mode (default when a position exists):** the panel replaces the planner inputs with the REAL position read — side/leverage/entry/size/uPnL row, then the same SAFE-LEVERAGE hero + verdict readout, all computed on the **exact API liquidationPx** (no estimate) against the rendered cluster field. The chart draws "YOUR LIQ" (verdict-colored) + a subtle entry line; draggable SL/TP and the stop hint are planner-only. A small `guardian ⇄ planner` toggle in the title row switches to the hypothetical inputs (unchanged) — guardian default with a position, planner when none.
- **Chip = live risk light:** with an open position on the detected coin, the chip glows mint/amber/red by the same verdict and shows e.g. `BTC long 10× · liq 3.5 moves` / `liq ON a cluster`; red pulses. Reuses the same position poll (no extra load; candles fetched once for the vol read). No position → the market-lean chip is unchanged.
- **Share card:** ⇪ in the window header renders a branded **1200×675 canvas PNG** — coin, price, the real heat bands (same field), mark/liq/SL/TP level lines with price chips, the verdict + safe leverage, HypeLens wordmark + hypelens.app — then copies it to the clipboard AND downloads it (PolyParlay's canvas→toBlob→ClipboardItem/download pattern, ported). **No sizes/PnL on the card** (levels + verdict only, privacy by default).
- **Coverage badge:** footer now reads `… top wallets · ~X% of OI` (Σ tracked positionValue ÷ coin OI, both already fetched) with an honest tooltip. Verified ≈16% on BTC's sample.
- **Permissions/manifest unchanged:** launch build still `storage` + `https://api.hyperliquid.xyz/*` only, no MAIN-world entry; module3 variant untouched apart from the version. All guardian data = page DOM/storage text + the existing public API host.

## v0.15.1 (launch) + v0.15.1-testnet (module3) — 2026-07-09

Two bug fixes.

- **"NO SAFE LEVERAGE" was always showing — redefined the calc.** The old rule required the liq to be 'clear' (beyond ALL clusters + none in path); since clusters stack continuously (e.g. BTC longs), there's always a cluster in the path → never clear → always null. Redefined: SAFE LEVERAGE = the highest leverage whose liq is BOTH (a) ≥ ~2 daily moves from mark AND (b) NOT sitting on a bright cluster (rendered-heat intensity at the liq < the on-cluster threshold — i.e. lands in a darker GAP). A cluster in the PATH no longer disqualifies (it stays only as the secondary "$Nm CLUSTER IN PATH" note). Verified real numbers now: BTC 13×, ETH 15×, SOL 16×, DOGE long 13×, HYPE 16× — "NO SAFE LEVERAGE" is now rare (only when even 1× can't reach a gap ≥2 moves out). States unchanged (≤safe mint / above-safe amber + Set N× / none red).
- **Injected pill chart intermittent blank — retry-until-LWC-ready.** The on-page pill mounts LWC before the host is laid out, so `priceToCoordinate` returned null intermittently and the draw path gave up. New `chartReady(s)` gate: only draw once the host has non-zero dimensions AND the candle series has data AND `priceToCoordinate(mark)` is non-null. Until then the render loop NUDGES every ~100ms — `chart.applyOptions({width,height})` to force a resize + `updateChartData` to (re)set data + `fitContent` on first data — and keeps retrying instead of drawing-once-and-giving-up. `updateChartData` re-runs on late candle arrival; a `ResizeObserver` now watches both the LWC host and the `.hlx-chart-wrap` and forces an applyOptions + redraw when the pill is laid out / reopened. Fixes the open/close/reopen + fresh-load blank.

## v0.15.0 (launch) + v0.15.0-testnet (module3) — 2026-07-08

Strategic reorient: lead with DEFENSE (protect your position) vs the incumbent's offensive heatmap. Two sharpenings, no new UI clutter.

- **SAFE LEVERAGE hero (the defensive core).** New `safeLeverage()` = the HIGHEST leverage whose liq reads 'clear' — beyond the real clusters in the liq direction AND ≥2.5 daily moves from mark (same rendered-heat sampling + daily-move vol as the verdict). Promoted from a footnote to a prominent element right under the leverage slider:
  - `✓ SAFE LEVERAGE ≤ N×` in mint when your current leverage is at/below it ("your liq stays clear of the crowd's clusters").
  - When above safe → amber `⚠ SAFE LEVERAGE ≤ N× · you're at M× — above safe` + a one-tap **`Set N×`** that snaps the slider to safe.
  - Honest no-safe case → red `⚠ NO SAFE LEVERAGE · this direction sits in the clusters — no leverage clears them` (e.g. BTC's near $30M cluster within 2.5 moves; verified real numbers appear where clusters are far — ETH 13×, SOL long 9×, DOGE long 1×).
  - Removed the old inline "drop to N×" footnote (the hero replaces it).
- **Defense-first framing (copy only).** The planner section is now **"LIQ DEFENSE — your liq vs the crowd's clusters · drag SL/TP"** (was "trade planner"), with the descriptor "see if your position sits in the crowd's liquidation zone — and what leverage keeps your liq clear of it." Descriptive/compliant — "safe leverage" = the leverage that clears the clusters, framed as such (no liquidation-proof absolutes).
- Unchanged: the heatmap (now context, not the hero), draggable SL/TP, the verdict logic, cluster chips, Module 3 (dormant), the read-only manifest, the mainnet hard-block.

## v0.14.1-testnet (module3) — 2026-07-08

The `@nktkas/hyperliquid` signing SDK is really vendored (`vendor/hl-sdk.js`, 304KB IIFE, adapter contract verified byte-identical to the SDK). Finalized the async signing chain + a load-time self-test.

- **Async signing chain (the required fix):** viem signs asynchronously, so `HLSDK.signL1Action(...)` returns a Promise. `hl-signer.js#signL1` is now `async` and **`await`s** the signature before returning `{signature, action, nonce, hash}`; `hl-place.js#place` already `await`s `withPrivateKey(pk => signer.signL1(...))`. Audited all sign sites: the L1 agent path (`signL1Action`) and the master path (`eth_signTypedData_v4` via the bridge) are both awaited; `userSignedTypedData` stays sync (typed-data build) before the async wallet sign. Runtime-verified against the real bundle: `signL1Action` returns a Promise and the awaited signature has valid r/s/v.
- **Load-time self-test (fail-closed):** `hl-signer.js` runs a self-test at load — all 6 adapter methods present + `hashL1Action` deterministic (sync string) — caches the result, logs pass/fail, and `signer.ready()` reflects it. If it fails, `status().sdkError` carries the reason and the placement UI shows "Order placement disabled — <reason>". Placement stays fail-closed on any failure.
- **Mainnet hard-block untouched** (`MAINNET_PLACEMENT_ENABLED = false` in code + background). Testnet only. The read-only launch build (`manifest.json`, v0.14.0) is unaffected.
- Module3 build: `manifest.module3.json` loads `vendor/hl-sdk.js` before `exchange/hl-signer.js` (verified). Ready for the operator's end-to-end testnet test (approve agent → approve builder fee → place entry+SL/TP with a testnet wallet + faucet funds).

## v0.14.0 (launch) + v0.14.0-testnet (module3) — 2026-07-08

Two safety/compliance items on top of Module 3: mainnet hard-block + a launch-build scope split.

- **Mainnet placement HARD-BLOCKED in code.** `MAINNET_PLACEMENT_ENABLED = false` in `exchange/hl-actions.js` and a mirrored `HL_MAINNET_PLACEMENT_ENABLED = false` in `background.js`. While false (defense-in-depth): the mainnet toggle is a disabled `Mainnet 🔒` pill, `place.setNet('mainnet')` coerces to testnet, `getNet()` coerces any stored 'mainnet' back to testnet, `setup()`/`place()` throw `assertNet`, and the **background refuses any mainnet `/exchange` POST**. No real-money order can be sent until BOTH flags are flipped after testnet proof + operator sign-off. Testnet stays fully usable; read-only `/info` is unaffected.
- **Launch build = minimal read-only manifest (default `manifest.json`, v0.14.0).** `host_permissions` scoped to `https://app.hyperliquid.xyz/*` (content match) + `https://api.hyperliquid.xyz/*` (reads) ONLY — no testnet host, no `<all_urls>`, no wildcards. Content scripts load only the read-only bundle (viewmodel, Lightweight-Charts, hud, content); **no `world:"MAIN"` injection, no exchange/wallet scripts**. Popup is `popup.html` (no placement scripts). `window.HLX3` is never defined, so the placement UI never mounts — Module 3 is dormant.
- **Phase-2 build = `manifest.module3.json` (v0.14.0-testnet).** Adds the testnet host, the `exchange/*` modules, the `world:"MAIN"` bridge, and `popup.module3.html`. Enable via `cp manifest.module3.json manifest.json` + reload. See `BUILDS.md`.
- **Read-only core verified intact:** `hud.js` (the v0.13.0 LWC chart) has zero Module-3 references; `content.js`/`popup.js` placement mounts are guarded by `window.HLX3` and no-op in the launch build.

## v0.14.0-testnet — 2026-07-08

MODULE 3 — opt-in one-click order placement with builder code, **TESTNET-first**, gated behind explicit setup + a network toggle. The read-only heatmap/planner (v0.13.0 LWC) is unchanged; this ADDS placement, fully fail-closed.

- **No hand-rolled signing — SDK vendor slot.** `vendor/hl-sdk.js` is a required drop-in for the `@nktkas/hyperliquid` signing subset (`randomPrivateKey`, `addressFromPrivateKey`, `hashL1Action`, `signL1Action`, `userSignedTypedData`, `orderToWire`). Until it's populated, `window.HLSDK` is null and the whole placement path is DISABLED (the UI says so). `exchange/hl-signer.js` is the only place that produces signatures and it goes exclusively through the SDK; it re-derives the L1 action hash and **asserts equality before every send** (`assertDeterministicHash`), refusing to sign on mismatch.
- **Agent wallet (extension never holds the master key).** `exchange/hl-vault.js` generates an agent keypair (via the SDK) and stores the private key **encrypted** in `chrome.storage.local` (AES-GCM, key = PBKDF2-SHA256 250k iters of a user passphrase, via WebCrypto). The decrypted key lives only in `chrome.storage.session` (+ memory) while unlocked, handed to the signer only at sign time. Background grants content-script read of session (never the page). UI states: agent can trade, **not withdraw**.
- **Master-wallet signing via a MAIN-world bridge.** `inject-eth-main.js` (manifest `content_scripts world:"MAIN"`) relays only `eth_requestAccounts` + `eth_signTypedData_v4` between the page's `window.ethereum` and the extension over tagged `postMessage`; `exchange/hl-eth-bridge.js` is the isolated-world client. Used only for the two one-time approvals.
- **Flows (testnet URLs, chain "Testnet", L1 source "b", sig chainId 0x66eee):** SETUP → `approveAgent` + `approveBuilderFee` (maxFeeRate 0.01%, builder **pinned** `0x9548…7c88`), each shown to the user before signing. PLACE → one L1 `order` action, `grouping:"normalTpsl"`, orders = [entry Gtc limit, SL reduceOnly stop-market trigger, TP reduceOnly trigger], `builder:{b:"0x9548…7c88", f:10}` (1bp). Prices/sizes normalized via `float_to_wire` (≤5 sig figs, no trailing zeros, decimals from `szDecimals` in `/info` meta) — unit-tested. Strictly-increasing ms nonce. Signed with the agent key, POSTed via the background (host permission) to the selected `/exchange`.
- **UI:** a "Place on Hyperliquid" section under the planner (on-page window + popup) with a **TESTNET-default** network toggle, setup wizard, unlock/lock, one-click place, live status, and disclaimers. The builder address is pinned in code — never read from the page.
- Manifest: `host_permissions` add the testnet API host; new content-script bundle loads the exchange modules before `content.js`; MAIN-world entry added. Version `0.14.0-testnet`.

## v0.13.0 — 2026-07-07

HARD REVERT of the 0.12.0 chart-engine swap. The operator confirmed the injected pill rendered at 0.11.0 (LWC engine) and broke at 0.12.0 (self-rendered). Restored the exact 0.11.0 Lightweight Charts engine; kept the real-data heat + verdict logic on top.

- **Lightweight Charts is back:** re-added `vendor/lightweight-charts.standalone.production.js` to the manifest content scripts (before hud.js) and to popup.html. `hud.js` renders via LWC again: `createChart` on `.hlx-chart-lwc`, `addCandlestickSeries` (transparent, for the price/time scale + native scroll/zoom + coordinate maps), and the heat field + candles + overlay lines + cluster chips + SL/TP/liq are all positioned via `series.priceToCoordinate()` / `timeScale().timeToCoordinate()` — exactly as 0.11.0. Native pan/zoom works because the overlay is `pointer-events:none` except while hovering a SL/TP line, so wheel/drag pass through to the LWC canvas.
- **Removed the 0.12.x self-render additions:** `computeView` / own price↔pixel mapping, `niceTicks`/own axis, `measureWrap` + `drawMessage` self-diagnostic path, `stampVersion` on-canvas, the pan/zoom viewport (`panViewport`/`zoomViewport`/`resetViewport`/wheel+drag) and the `everRendered`/`s.wrap`/`s.view` state. Restored the LWC `mountChart` (deferred rAF build) + `createChartNow` + `updateChartData` + `setAnchor` + `plotWidth` + LWC crosshair subscribe + `ResizeObserver`; `render` uses `updateChartData`/`setAnchor` again; `.hlx-chart-lwc` div + CSS restored.
- **Kept (predate 0.12 or wanted):** the real-data heat kernel field from `real_liq.json` + live refresh, the cluster `$` chips, the leverage/liq/stop/TP verdict logic that samples the rendered heat field (the field-consistency fix — it samples the field by price, independent of coordinates, so it's unchanged and now reads LWC-derived line positions), the market-lean bar, INT/OPAC sliders, draggable SL/TP, the chip, the header version tag.

## v0.12.2 — 2026-07-07

Price zoom/pan on the self-rendered chart (LWC's built-in pan/zoom went away when we dropped it).

- **User price viewport:** `s.viewport = {pLo, pHi}` (null = auto). `computeView` uses it when set, else falls back to `desiredRange` — the single override point that all rendering already flows through.
- **Wheel to zoom (price):** wheel over the chart zooms the price range centered on the cursor's price (`view.priceAt(cursorY)`), ×1.1 per step (in = smaller range, out = larger), `preventDefault` so the page doesn't scroll. The cursor price stays pinned. Clamped to a min span of 0.5% of mark and a max of 3× the auto range.
- **Drag to pan (price):** dragging on empty chart area shifts `pLo/pHi` by the drag delta in price units. Does NOT conflict with SL/TP dragging — if the pointer starts on a line handle the line drags (overlay is `pointer-events:auto` only while hovering a line, and it `stopPropagation`s); otherwise the chart pans. A 3px threshold keeps plain clicks from engaging.
- **Price-axis drag zoom:** dragging vertically in the right price-axis gutter compresses/expands the scale around the center (drag down = zoom out).
- **Reset:** double-click resets to auto-fit; a small "⤢ fit" pill appears (top-right of the plot) whenever a manual viewport is active and clicking it also resets.
- Redraws on the existing rAF loop; viewport changes set `heatDirty` so the heat re-maps to the new range. Cursor hints: `grab` over the plot, `ns-resize` over the axis. Preserved: draggable SL/TP, crosshair, self-diagnosing render, the on-canvas `v0.12.2` stamp.

## v0.12.1 — 2026-07-07

Self-diagnosing chart — the injected pill can no longer render a silent blank; a single screenshot now reveals the cause, with the build version stamped on-canvas.

- **Never a silent blank.** The render loop is wrapped so it ALWAYS paints something: `try/catch` around `computeView` + `drawHeat` + `drawOverlay`; on throw it draws "render error: <message>" (red, centered) and `console.error`s it. If the container is still 0-sized after ~20 frames/500ms it draws "chart W×H — container not sized" (red). If market price isn't in yet: "waiting for market price…". If candles are missing it STILL renders the heat + axis + lines and shows "no candle data — retrying (Ns)" in the plot — never requires all data to draw.
- **Hardened sizing (`measureWrap`):** measures with `getBoundingClientRect()`, falls back to `offsetWidth/Height` → `clientWidth/Height` → forces `wrap.style.height='300px'` inline and the window width − 24 as a last resort, so we always reach a drawable size. The heat + overlay canvas `.width/.height` ATTRIBUTES are set explicitly to measured-px × dpr every draw (an unset canvas is 300×150 and clips).
- **Version stamped on-canvas:** a small `v0.12.1` tag is drawn in the chart's bottom-left corner (via `stampVersion`) on the working chart AND on every diagnostic message, and `content.js` logs `content script loaded v0.12.1` at boot — so a screenshot proves whether the NEW build is live (a prior screenshot showed a TradingView logo, which only existed in the old LWC build → the tab was running stale injected code; a hard reload of app.hyperliquid.xyz is needed after updating the extension).
- All diagnostics repaint to the working chart automatically as soon as size + data arrive.

## v0.12.0 — 2026-07-07

Permanently killed the intermittent blank chart by removing the dependency on Lightweight Charts' coordinate readiness — the chart is now rendered entirely by us from our own price/time mapping. Plus the liq-verdict consistency fix.

- **Self-rendered chart (no LWC):** dropped Lightweight Charts entirely (removed the vendor script from the manifest + popup). We compute our OWN mapping every frame from the candle data + `desiredRange`: `y(price) = padT + (pHi−price)/(pHi−pLo)·plotH`, `x(i) = inset + i/(n−1)·(plotW−2·inset)`, and `priceAt(y)` for drag/crosshair. The heat field, candles, cluster chips, SL/TP/liq lines, gridlines AND the price-axis labels all draw from this mapping. Rendering now depends ONLY on candle data + a sized container — there is no `priceToCoordinate` readiness race, so it can't blank. (Root cause of the popup-works/pill-blank split: in the host page the chart was measured/created before layout and LWC init at 0×0 left it blank.)
- **Host-page container hardening:** the render loop measures `.hlx-chart-wrap` every frame and only draws once it has real non-zero size (logs `chart rendering at W×H` once); a `ResizeObserver` redraws on HL relayout. The CSS is hardened with `!important` explicit dimensions (`.hlx-chart-wrap` height 300px, canvases `width/height:100%`, `position:absolute`, `inset:0`) so HL's global CSS/resets can't collapse it to 0×0.
- **Bulletproof candle fetch:** `getCandles` logs its candle count every fetch and retries on empty/slow so the chart always gets data (from 0.11.0/0.10.5).
- **Liq verdict now READS the rendered heat (unified sampler):** liq, stop AND TP all sample the SAME heat field via one function — the MAX normalized intensity in a small ±1.2% window around the price (matching the visible glowing-band width). So a liq that sits just above/on a bright cluster reads "⚠ LIQ ON A $Nm CLUSTER" (red), never "✓ clear" — consistent with the stop's sweep detection and with the band it visibly sits on. Combined with proximity (daily-moves) and cluster-in-path; final = worst of the three. Verified: the $61k-on-a-band case now flags.
- Crosshair, draggable SL/TP, cluster chips, market-lean, sliders, snap hint — all preserved, now on the self-rendered canvas.

## v0.11.0 — 2026-07-07

Scope-locked to two things — the liquidation heatmap and your position against it. No new features; core fixes + one minimal guidance line + a declutter pass.

- **Verdict now READS the rendered heat** (consistency fix): the danger verdict and the SL/TP/liq colors sample the SAME viridis field the user sees — intensity AT the liq price (on-cluster) and the brightest band ALONG the path from mark→liq — instead of a separate bucket heuristic. So the words can never contradict the bright bands. Verified: long 16× with its liq on a bright band now reads "⚠ LIQ ON $Nm CLUSTER" (was "CLEAR"). Still combined with the proximity check (daily-moves < 1.2 → critical). `$` labels come from the real notional aggregated in the same ±band the field glows from.
- **Minimal cluster-aware stop hint** (the one piece of position guidance kept): a SINGLE quiet line — "⚠ stop in the sweep path — move below $X" / "✓ stop clear of the walls" — plus a small `snap` button that moves SL & TP to the cluster-aware prices (stop BEYOND the nearest wall + buffer; TP INTO the nearest wall). No busy panel, no extra control rows.
- **Declutter/elegance pass:** removed the Trail input + its chart line and the ghost suggestion lines; tightened readout/guide spacing and type. The window is now: header · market-lean · heatmap · leverage→liq read · one stop hint · SL/TP + R:R. Near-black, mint, mono, calm.
- Carries the 0.10.5 fixes below (chart-render-on-open, chip populate, version tag).

## v0.10.5 — 2026-07-07

Entry-point fixes: the chip reliably opens the window, and the chart renders on first open (was blank).

- **Blank chart on first open — ROOT CAUSE + fix:** the LWC chart + heat/overlay canvases were created in the same tick the window was shown, when `host.clientWidth/clientHeight` were still 0 (window not laid out yet) → LWC init at 0×0 and 0-size canvases = permanently blank chart. Fix: `mountChart` now DEFERS creation via `requestAnimationFrame`, retrying each frame (up to ~40) until the host has real dimensions, and only then builds the chart (`createChartNow`) at the true size. Logs `host W×H (after N frames)` at create time. `drawHeat`/`drawOverlay` also guard against 0-size (skip + retry next frame), and a `ResizeObserver` marks the heat dirty on resize. The render mount-condition no longer tears down a pending build (`!s.chart && !s.mounting`), and stale deferred builds abort (`container.__hlx !== s`). When candles / liq levels arrive after open, the running render loop + `updateChartData` redraw automatically, so a chart built before data fills in.
- **Chip open reliability:** the chip no longer captures the pointer on `pointerdown` (which could swallow the click on the HL SPA) — capture is deferred until an actual drag passes the 5px threshold, so a clean click always reaches the open path. Added a deduped `click` fallback (350ms lock) so the window opens even if pointer events are flaky. Console logs at each step: chip activate → toggleWindow → openWindow → renderWindow (mounted/updated/error).
- **Robust open path:** `openWindow` forces the window visible up-front, renders, positions on-screen, fetches data, and re-renders next frame; `renderWindow` wraps `HLHUD.render` in try/catch so a failure shows a message instead of a blank window.
- **Blank chart (2nd root cause) — candle series had no data:** the window was sized but the candle series was empty at draw, so `priceToCoordinate` returned null and BOTH the heat (uses it for yTop/yBot) and our candles drew nothing (walls/price/lean rendered because they don't use the chart scale). Fix: on the FIRST real candle data, `updateChartData` / `createChartNow` call `timeScale().fitContent()` to establish the scale, then mark heat dirty; `drawHeat` retries next frame while the scale isn't ready (never draws-blank-and-stops); `fetchCandles` logs the candle count and retries on an empty/slow fetch so the chart never stays blank waiting on data. Redraws on data arrival via the running RAF loop.
- **Chip always populates (bundled fallback):** `getMarkets` returning no rows now retries in 2s (was a 30s poll gap that left the chip stuck on "loading…"); once markets load, the chip fills from the same bundled-real-positions snapshot the window uses (coin + positioning % + wall) — never a permanent blank. The chip data fetch runs on page load (not just on open).
- **Version tag:** the window header shows `v{manifest.version}` (and the content script logs its version) so a `chrome://extensions ↻` reload is confirmable.

## v0.10.4 — 2026-07-07

Two bugs + a legend tidy.

- **Price axis now readable (heat clipped out of the gutter):** new `plotWidth(s,W)` = chart width − `priceScale('right').width()`. The heat wash + viridis field are clipped to `[0, plotW]`, and the whole heat canvas is first filled solid `--bg-1` (`#0C0E12`) so the right price-axis gutter stays opaque dark — LWC's price labels ($84000, $80000…) are crisp. The overlay (our candles + cluster chips + SL/TP/liq lines) is likewise clipped to the plot area; only the current-price pill draws in the gutter (our own price marker). Nothing bright bleeds under the axis numbers.
- **INT + OPAC sliders work live + persist:** on `input` both now mutate `ctx.heat`, and redraw the heat IMMEDIATELY (not just on the next throttle tick). INT invalidates the cached bitmap (`s.heatBmp=null`) so it re-bakes at the new gamma, and the intensity→gamma mapping was widened to `1.28 − int·1.08` (≈0.96→0.31) so every step visibly changes contrast (mid-density point I 0.42→0.75 across the range). OPAC drives the field's `globalAlpha` on the heat draw. Both persist via `onHeat` → `chrome.storage` (`hlx_heat`).
- **Vertical legend tucked:** the viridis scale (heavy→light) is now a tidy translucent chip (`rgba(8,9,11,.5)` + soft border, small uppercase labels) so it no longer overlaps the candles or the axis.
- Unchanged: our opaque candles on top of the heat, full-width viridis heat (now clipped to the plot area), cluster `$` chips, combined proximity+path leverage logic, liq/SL/TP lines, market-lean bar.

## v0.10.3 — 2026-07-06

BUGFIX — candles were invisible (LWC's transparent candle layer rendered blank over the heat). Now WE draw the candles ourselves, opaque, on top of the heat — price visibility no longer depends on LWC's rendering.

- **Own opaque candles on the overlay (z2):** new `drawCandles` renders each candle at its exact chart coordinates (x = `timeScale().timeToCoordinate`, y = `series.priceToCoordinate`) — dark halo (3px `rgba(4,6,10,.7)` wick + `rgba(4,6,10,.6)` body 1.2px larger) THEN the colored wick (1.3px) + opaque body (up `#2bf5ae` / down `#ff5f6e`). Drawn first in `drawOverlay`, below the cluster chips / SL·TP·liq lines.
- **LWC kept only for scales + zoom + coordinate maps:** the LWC candlestick series is now fully transparent (`rgba(0,0,0,0)`) — it still drives autoscale and `priceToCoordinate`/`timeToCoordinate`, but is no longer what the user sees. No more dependence on LWC's blank candle layer.
- **Stays aligned on pan/zoom:** `drawOverlay` (hence `drawCandles`) runs every animation frame, so our candles re-project against the axes on every scroll/zoom/scale change.
- **Empty-data guard:** if `ctx.candles.candles` is empty, we log it and show a "loading price…" state instead of a blank chart (data flow getCandles → state.candles → ctx.candles is intact; the fix is drawing them ourselves).
- Unchanged: full-width viridis heat behind (opacity ~0.5), cluster `$` chips, combined proximity+path leverage logic, liq/SL/TP lines, current-price pill, market-lean bar, INT/OPAC sliders, draggable SL/TP.

## v0.10.2 — 2026-07-06

Ported the operator-approved reference design: full-width heat with readable candles, and the corrected combined leverage-danger logic.

- **Full-width smooth viridis heat (no spikes):** the real-data kernel field from 0.10.1 spans the ENTIRE chart width uniformly — one 1px viridis column baked from the per-price-row density, drawImage-stretched across the full width with `imageSmoothingEnabled` (smooth, no banding, no right-side profile, no dimmed-left/bright-right split). Real liq clusters read as horizontal glowing bands across the whole width.
- **Heat opacity ~0.5** (default; OPAC slider controls it) so candles show through. Opacity is now baked into the field draw via `globalAlpha` rather than the canvas `style.opacity`, so the halos below stay full-strength.
- **Candles readable via DARK HALO:** `drawCandleHalos` draws, on the heat canvas (z0, under the LWC colored candles at z1), a wider semi-dark version of each candle at its exact coordinates — wick as a 3px `rgba(4,6,10,.7)` stroke, body as a `rgba(4,6,10,.6)` rect 1.2px larger each side — so the bright candle pops inside a dark outline over yellow bands. Candle colors brightened (up `#2bf5ae`, down `#ff5f6e`), borders removed.
- **Corrected leverage danger — PROXIMITY + PATH (combined, in order):** daily-move volatility = stdev of log-returns of the chart closes; liq distance in daily moves = `|liqPx−mark|/mark / dailyMove`. Verdict: (1) moves < 1.2 → CRITICAL "⚠ LIQ ONLY {m} DAILY MOVES AWAY" — **fixes the old bug where high leverage read CLEAR** (50× now CRITICAL at 0.3 moves); (2) liq on a >$10M bucket → CRITICAL "⚠ LIQ ON A $Nm WALL"; (3) >$10M cluster between mark and liq → WARN "⚠ $Nm WALL IN PATH"; (4) moves < 2.5 → WARN; (5) else CLEAR "✓ CLEAR · {m} MOVES, NO WALLS". Liq line color follows the verdict (mint/amber/red) with glow. Hint when not clear: "↓ drop to N× to clear all walls & noise" (highest leverage that reads clear). SL/TP still flagged when sitting on a real wall. Verified on real BTC (2.5% daily move): long 50×→CRITICAL(0.3), 25×→CRITICAL(1.1), 10×→WARN($31M in path), 3×→CRITICAL($23M wall); short 10×→CRITICAL($38M wall).
- Kept: `real_liq.json` + live whale refresh, cluster `$` chips at the walls, market-lean bar, current-price pill (glow), viridis legend, mint/mono/near-black, INT/OPAC sliders, draggable SL/TP.

## v0.10.1 — 2026-07-06

Reverted the skinny VPVR bars back to the loved viridis HEAT GRADIENT FIELD — but now driven by the REAL liquidation data from 0.10.0 (not the old estimated leverage model). Real heat map, real clusters.

- **Viridis heat field restored** (`drawHeat`): the glowing smooth field is back — full-canvas dark wash (no black patches) + additive viridis bitmap stretched across the chart, candles crisp on top, vertical viridis legend + INT/OPAC sliders (int = contrast, opac = opacity).
- **Driven by REAL data (kernels per real level):** each real liquidation level (`vm.liqLevels` from `real_liq.json` + the live whale refresh) deposits a Gaussian HEAT KERNEL centered at its liq price, weight = its real notional $. Summed over all levels → a smooth vertical density that GLOWS at the real clusters and fades between. Kernel ~0.7% of price so kernels merge into a field yet real clusters stay distinct. High-percentile normalization so one giant cluster doesn't wash the rest; faint viridis baseline floor. Verified on real BTC: distinct bright zones at $47k (I=1.0), $65.5k (I=1.0), $80k (0.83), $68k (0.71) with dark gaps between (mark I=0.05) — 11 distinct peaks, not a formless blob, not skinny lines.
- **Kept from 0.10.0:** the cluster `$` labels at the big real clusters (POC ◆ + top walls, side-colored), the path-danger logic ("⚠ WALL IN PATH" / "AT WALL" / "CLEAR" when a real cluster sits between price and the liq), liq/SL/TP lines, market-lean bar, near-black + mint + mono.
- **Fixed the stuck "whales loading…":** `getCoinIntel` now ALWAYS resolves — when the live whale crawl hasn't produced a snapshot (or the coin is sparse), it falls back to the bundled REAL top-wallet snapshot for smart-money + walls + heat levels (`levelsSource: bundled`, `smartMoney.source: sample`), so the lean bar and heat show real data instantly and the live crawl upgrades on the next poll. The market-lean breakdown now reads "positions N% short" (snapshot) or "whales N% short" (live) instead of "whales loading…".

## v0.10.0 — 2026-07-06

MAJOR PIVOT — replaced the estimated viridis liquidation blob with a functional, VPVR-style liquidation profile built from REAL positions. Functional over pretty.

- **Real data, estimated model DELETED.** Removed the entire estimated leverage-tier field engine (LSAMP continuous-leverage smear, `buildFieldGrid`/`buildFieldBmp`, viridis LUT, 2D blur, `sampleField`/`zoneAt`). The profile now reads REAL liquidation levels: each an `[liqPx, notional, side]` from top-wallet open positions.
  - Instant load: `data/real_liq.json` (top-2000 wallets snapshot, 169 coins, ~180 BTC levels) is bundled and loaded in `background.js` via `chrome.runtime.getURL` (no host permission, no web-accessible-resources).
  - Live refresh: the existing whale crawl (`clearinghouseState` fan-out over the bundled wallet set, ~5-min cache) rebuilds real per-coin liq levels client-side; `getCoinIntel` serves the bundled snapshot instantly, then swaps to live positions once the sample is meaningful (`levelsSource: bundled → live`). `vm.liqLevels` carries them through the view-model.
- **VPVR-style render** (`drawProfile` in hud.js): real levels are bucketed by price (~0.4% of mark), notional summed per bucket, and drawn as HORIZONTAL bars extending leftward from the right price axis (occupying ~the right 35–42%), semi-transparent so candles show through. LONG-liq buckets (below mark) = red downside-cascade fuel; SHORT-liq (above mark) = teal upside-squeeze fuel. Bar length + opacity ∝ notional. The INT/OPAC sliders now control bar length-scale / opacity.
- **Point of Control + cluster labels:** the biggest visible bucket is marked (◆ + white base tick) and the top ~5 walls get `$`-notional labels (e.g. "$65.6M") just left of the axis, colored by side; a faint full-width rule marks the major walls so they read as horizontal levels across the chart.
- **Path-danger logic** (research PATH model, not local darkness): the liq / SL / TP lines are classified against the real profile — liq AT a big wall → CRITICAL (red, "⚠ AT WALL"); a big wall BETWEEN price and the liq → DANGER (orange, "⚠ WALL IN PATH", cascade overshoots toward it); liq clear of the walls in that direction → CLEAR (green). "clear ≤N×" now finds the leverage whose liq lands path-clear. Verified on real BTC: long 3× lands on a $23M wall → critical; long 5–10× have a $30.6M wall in path → danger; short 10× lands on a $37.9M wall → critical; near-mark high-lev → clear.
- **Honest labeling:** footer reads "liquidation profile · real positions · top wallets" with a long-liq/short-liq color key — truthful that it's real positions from the wallets we can see (a large sample, not 100% of OI), NOT "estimated", NOT "all". Crosshair now reports the real `$` long/short-liq notional at the hovered price. Manifest renamed to "Liquidation Profile & Smart Money".
- Kept: candles crisp on top, current-price pill, draggable SL/TP, Market Lean bar, near-black + mint palette, mono numbers.

## v0.9.8 — 2026-07-06

VISUAL-ONLY fill + polish (operator: "improve design and gradient fade to fill it out"). No change to the density MODEL or the danger-zone LOGIC — those still await the real-data + cluster-logic spec.

- **Gradient fades to FILL the chart (no patchy empty areas):**
  - **Baseline viridis wash:** the bitmap bake now applies a low-level floor (`BASE=0.06`) so every cell carries a faint viridis value — empty areas render deep-purple `rgb(27,17,46)` instead of transparent black, ramping smoothly indigo → teal → yellow up to the bright clusters. Verified: raw 0 → purple, 0.5 → teal-green, 1.0 → full yellow; clusters still stand out on the filled field.
  - **Full-canvas dark wash:** behind the field, a vertical `#0A0B10 → #141328 → #0A0B10` gradient fills the ENTIRE chart (including the small autoscale margins above/below the data band), darker at the top/bottom edges — so there are no black patches anywhere, and the seam at the data-band edge matches the baseline tone.
  - **Extra render smoothing:** the bitmap is baked from a lightly re-blurred COPY of the grid (X±1 / Y±2), so the fade between clusters is smoother. The copy leaves `f.grid` untouched, so the liq-line danger sampling / zone thresholds read the exact same values as before (logic unchanged).
- **Polish:** chart frame gets soft depth (`0 6px 22px` drop shadow + 1px inner top highlight); the vertical viridis legend's low end aligned to the new deep-indigo baseline (`#141328`) so it matches the filled field. Candles stay crisp on top (heat z0 under LWC z1). Palette unchanged: near-black, mint accent, Inter labels + mono numbers.
- Kept exactly: viridis colormap, candles on top, legend, INT/OPAC sliders, liq line + draggable SL/TP, market-lean bar, and the entire leverage/density model and danger logic.

## v0.9.7 — 2026-07-06

Heatmap looked like 3–4 discrete generic bands because only 4 discrete leverage tiers were deposited. Replaced the discrete tiers with a **continuous leverage distribution** so the field reads as an organic cloud (render unchanged; viridis kept).

- **Continuous leverage smear:** each cohort (both the dominant current-price cohort and the recency-weighted historical candles) now spreads its size across ~80 log-spaced leverage samples from 5×–125× weighted by a smooth log-normal popularity density peaking ~15× (`LSAMP`). Each sample's liq price is computed with `VM.liqPrice(entry, L, dir, mmf)` and deposited into the price×time grid → a smooth smear that's dense near entry (high-lev, close liqs) and fades to the tails (low-lev, far liqs). Overlapping smears from many recent entry prices form organic clusters/gaps, NOT countable bands.
- **Softer recency:** half-life relaxed ~10-day → **~18-day** so historical texture isn't blank; current-price cohort still dominates the danger cloud straddling price.
- **Range/blur:** price range widened to mark ×0.78–1.22 (covers down to ~5×), FROWS 220→240, Y-blur ~3%. Sanity (synthetic BTC): density concentrated near price (I≈0.5 near mark, short-side I≈0.9), fades dark at the 5× tails, ~20 broad clusters post-blur (was 4 sharp bands).
- Unchanged: viridis time×price render, candles on top, legend, intensity/opacity sliders, draggable SL/TP, liq-line danger sampling.
- **NOTE:** this is still the *estimated* candle-volume leverage model. Superseded direction (real 1500-wallet liq-level aggregation + corrected cluster/danger logic) is pending a spec; render stays.

## v0.9.6 — 2026-07-06

Heatmap DATA fix — the field now represents CURRENT liquidation danger (render unchanged; loved viridis kept).

- **Root cause fixed:** the accumulation weighted all ~90 candles equally, so old June highs ($76k+) painted a bright blob up top that's irrelevant at today's price, while the danger zones near current price were dark.
- **Heavy recency weighting:** per-candle cohorts now decay exponentially by age (~10-day half-life, per-timeframe), so old far-away levels fade and current positioning dominates.
- **Dominant current-price cohort:** from the CURRENT price, longs liquidate BELOW / shorts ABOVE at leverage tiers {100/50/25/10×} → bright bands straddling price in BOTH directions (the long-liq danger zones below price are now visible), brightest at the live right edge. Computed with `VM.liqPrice(mark, L, dir, mmf)` — the SAME maint-margin formula the user's liq line uses — so the line lands exactly on its band.
- **Consistency:** verified on BTC ~$63k — brightest cluster spans ~$57k→$70k straddling price, old $85k highs dark (I≈0.3), and the user's 10× DANGER liq at $57.9k sits on bright heat (I=1.0). The red DANGER line now sits on bright heat; "clear" liqs fall in dark gaps.
- Unchanged: viridis smooth time×price render, candles on top, vertical legend, intensity/opacity sliders, draggable SL/TP, restyle.

## v0.9.5 — 2026-07-06

Heatmap engine rebuilt to the CoinAnk model: a smooth **viridis time×price liquidation field** (supersedes the 0.9.4 green→red gradient and the abandoned streak-line experiment).

- **Time×price accumulation (2D):** walk the chart's candles → infer long (up) / short (down) cohorts weighted by volume → project liq prices at leverage tiers {100/50/25/10×} → accumulate weighted size into price×time buckets, terminating a level when a later candle's wick trades through it (consumed). Bright clustered zones emerge at the real liq levels.
- **Smooth VIRIDIS render (not lines, not green→red, not blocks):** the grid is 2D-blurred (light X / moderate Y), baked into a small cols×rows viridis bitmap (empty→transparent dark · purple · indigo · teal · green · **bright yellow = biggest cluster**), then **bilinear-stretched** across the chart (X = candle time axis, Y = price scale) with `imageSmoothingEnabled` + additive `lighter` — a seamless glowing heat field, not discrete strips. Bitmap re-bakes only on the intensity slider; grid rebuilds only when candles change.
- **Candles crisp on top** (LWC z1 over heat z0); **vertical viridis legend on the left** with a mono $ scale (0 → OI ceiling), CoinAnk-style.
- **Value prop:** bright zones = liquidation TARGETS. The user's liq line danger = field intensity at the liq price — on a bright zone → "⚠ in liq target zone", dark → "✓ clear"; the leverage slider moves it through the field and "clear ≤N×" finds a leverage whose liq lands in a dark gap. Draggable SL/TP sample the same field.
- Consistency (from 0.9.4): the liq line's danger colour is sampled from the SAME field painted under it, so line and background always agree.
- Kept: near-black restyle, mint accent, Inter labels + mono numbers, intensity + opacity sliders (persisted), LIVE badge, bigger chart, draggable SL/TP.

## v0.9.3 — 2026-07-06

Full premium restyle + smooth glowing heat + radical text cut + opacity dial.

- **Design system:** exact palette (--bg-0 #08090B / --bg-1 #0C0E12 near-black, --accent #4FE3C1 mint, --long #17C784 / --short #F6465D, 1px --border #21262F hairlines, 6px radius, inset-top "milled edge", accent glow). No glassmorphism, no offset shadows, no dot-grid.
- **Type:** labels/headings in **Inter** (kills the all-mono "boots in DOS" feel); **all numbers in JetBrains Mono** with `tabular-nums` + `-0.01em`. Section headers Inter 11px/600/0.08em/uppercase/--text-lo.
- **Heatmap = smooth glowing gradient (not block strips):** perceptual 256-entry LUTs (side-split warm short / cool long, luminance+alpha climb to near-white hot cores), additive `lighter` on near-black, **heavy Y-blur (~2.8%) merges the leverage bands into one seamless thermal fade** (verified max row-to-row Δ 1.9% of peak — continuous, no strip edges), p95 gamma-compress. Still concentrated near price, dark at extremes (0.9.2 model kept).
- **Heat OPACITY slider** (default 65%) + intensity slider in the footer, both **persisted** (`chrome.storage` hlx_heat) — dial the heat from subtle wash to bold.
- **Crisp candles** over the soft heat: --long/--short bodies, 1px own-color border (razor edges = the premium signature).
- **Text radically cut** — sentences → numbers + color + icons + tooltips: liq readout "10× · liq $57,716 · 4.6σ · ⚠ DANGER · clear ≤6×"; SL/TP pills get tiny "sweep"/"magnet" chips; R:R is one inline badge; the bottom paragraph + coverage + disclaimer all moved into a single ⓘ tooltip.
- **Chart is bigger (300px, hero)**; controls compacted (SL/TP/trail on one row, inline R:R).
- **Current-price** = filled mint pill (right) + accent glow + 1px accent rule; **pulsing LIVE dot**; **crosshair readout** (mono price + estimated density %).
- **Loading fixed:** whale aggregation publishes a partial snapshot after 60 wallets / a 10s deadline (6s per-request timeout) → never stuck on "loading".

## v0.9.2 — 2026-07-06

Density-MODEL correctness fix (the heat now represents real magnets).

- **Anchored to leverage-tier distances from CURRENT price, not 90 historical closes.** The old model projected liquidations off every one of 90 candle closes → a diffuse top-to-bottom smear (the "meaningless top pink" was short-liqs projected from old high-priced candles). Now bands sit at fixed tier distances from mark: LONG (below) 100x −1% / 50x −2% / 25x −4% / 10x −10% / 5x −20%; SHORT (above) the mirror. Weighted by tier popularity.
- **Distance-decay** `exp(−dist/0.09)` per band → near-price bands bright, far bands fade; the extremes of a wide range are DARK, not colored.
- **Modest spread** via a TIGHT recent-price window (last 14 candles, not 90) → bands reflect where positions were actually opened, without smearing.
- **Blur cut** to ~0.7% of range (was 4.5%) → bands stay distinct glowing zones.
- Verified on BTC ~$63k: bright green bands at ~$62.2k/$61k (50x/25x, brightest), fading through $57k (10x) to $50.8k (5x), and **0.00 intensity at $78k / $50k extremes** — concentrated near price, dark outward, no top wash. Zone detection (liq line vs zones) now reflects meaningful magnets.
- Color ramp / premium restyle intentionally held for the incoming design-research spec.

## v0.9.1 — 2026-07-06

Declunk pass on the 0.9.0 layout + heatmap.

- **Chart-bottom cram fixed.** The "liquidation density" legend + intensity slider are moved OUT of the chart into a dedicated, properly-spaced **footer row below the chart** (`.hlx-chartfoot`) — nothing overlaps the chart or the "YOUR LIQ" pill anymore, and the stray in-chart legend text (".l" glitch) is gone.
- **Heatmap now shows concentrated glowing ZONES, not an edge-wash.** Lighter blur (~1% of range, was 4.5%), **per-side p99 normalization** (both long & short zones surface), and a **high-contrast exponent** (>1 — suppresses non-magnet areas to near-black, makes piled zones glow). Verified: clustered recent prices produce distinct bands (leverage-tier rings at ~0.5/1.5/3.5/9.5/19.5%) with dark gaps between, throughout the range including around the candles. Ramps deepened/desaturated (deep red, not garish pink).
- **Label overlaps resolved.** Current-price tag moved to the LEFT edge so it no longer collides with the right-hand price-axis numbers.
- **Tighter top spacing** — header, coin row and Market Lean compressed ~30% so the chart (the hero) gets more height (250px).
- **Loading can't hang** — each whale `clearinghouseState` request now has an 8s timeout (resolves null → aggregation always completes to a value; it only feeds the top Market Lean bar).

## v0.9.0 — 2026-07-06

The product, focused to three things: estimated liq heatmap + leverage→liq-vs-zones + R/R planner. Paid-tool visual bar.

- **Estimated graded liq heatmap (chart hero).** Real whale liq levels are too sparse for a dense field, so the background is ESTIMATED (Coinglass-style): recent candle closes as proxy entries weighted by that candle's volume, projected through leverage tiers (100/50/25/10/5× with popularity weights) to long/short liquidation prices, deposited into ~600 price buckets, then **3-pass box-blurred (~4.5% of range) into a seamless continuous thermal fade** — verified max row-to-row delta 1.2% of peak (no bars/strips). Side-split diverging ramps (green below mark / red above), additive-blended on black, p99-compressed, intensity slider. Legend labeled simply "liquidation density".
- **No whale lines on the chart** — removed all whale wall/magnet overlays, per-wall labels, and whale hover. Whale data now appears ONLY in the top Market Lean bar.
- **Hero interaction — leverage → liq vs zones.** The liq line is the most prominent line (thickest, brightest, largest glow, "YOUR LIQ" pill); dragging the leverage slider slides it through the heatmap live. Its risk state samples the **heatmap density at the liq price**: hot zone → red "sits in a heavy liquidation zone — cascade risk"; clear → green "clear of the clustered zones"; combined with vol-distance for color. Auto-suggest "leverage where your liq sits in a clear zone: ≤N×". Compliant framing ("clear of the zones", "cascade risk" — never "safe"/"avoid liquidation").
- **R/R planner intact:** draggable SL/TP lines, R:R + $ risk/reward, stop-sweep now uses the same heatmap-zone check.
- **Refined Market Lean bar:** tighter type (uppercase label + right-aligned direction arrow), sleeker diverging fill, muted mono breakdown.
- **Paid-grade polish:** cohesive moody DeFi-terminal glass palette, mono tabular numerals, tightened spacing/hierarchy, inner-shadow chart frame, glowing leverage slider, refined pills/toggles/legend.
- Permissions unchanged.

## v0.8.2 — 2026-07-06

The hero: a real background liquidation HEAT FIELD, plus draggable SL/TP and a Market-Lean bar (0.8.1 folded in).

- **Background heat field (density kernels).** Built client-side from real whale positions: each `liquidationPx` adds a Gaussian kernel weighted by `positionValue`, **adaptive σ** (big whale = tight ~0.05% bright blade, small = soft fill). Two fields — `D_short` (above mark) / `D_long` (below). **p99-compressed** `I=(D/D_p99)^intensity` (exposed as a Hyblock-style intensity slider), **floored to 0** so genuine empty zones stay pure black — not a smear. Rendered **full-width horizontal** behind candles (Coinglass streak look), devicePixelRatio-scaled.
- **Side-split diverging color** (our edge — we know the side): short-liqs above → red ramp `#1A0E1E→…→#FF9EB0`; long-liqs below → green ramp `#0C1A14→…→#B6FFD8`; alpha ∝ intensity (low ≤0.25 so candles read, hot ~0.7).
- **Core + bloom** on top-5%-notional walls: a crisp 1.6px bright core line at the exact liq price + a soft additive vertical bloom (≤20px) — magnet + gap-fill.
- **Layering:** black bg → heat (additive `lighter`) → **candles crisp on top** (LWC transparent bg, slightly desaturated bodies) → overlay lines → cyan current-price line. Heat is its own canvas *behind* the LWC canvas; overlay lines/pills on a canvas *above*.
- **Hover tooltip** (per-wallet truth): "$12.4M short-liq · N pos · top 0xAB…3f · +$3.1M PnL" from the real whale set.
- **"REAL · on-chain" badge** + intensity slider on the legend.
- **Draggable SL/TP (0.8.1):** grab the stop or TP line on the chart (ns-resize), drag up/down → % inputs + R:R + sweep/vol-color update live. Overlay toggles pointer-events near a line so chart scroll/zoom still works elsewhere.
- **Market Lean bar (0.8.1)** replaces "smart money %": composite LEAN ∈ [−1,+1] from whale net (0.45) + 7d momentum (0.35) + funding (0.20), amplitude scaled by OI/volume confidence. Center-anchored red/green fill, "MARKET LEAN → SHORT/LONG/NEUTRAL", breakdown "funding · OI · whales · 7d". Descriptive flow summary, never a buy/sell signal.
- **Wider walls (0.8.1):** whales.json → 300; liq band ±30%→±50%; finer bins; top-12 walls + up to 500 raw positions to the client for the field.
- Time-X streak variation deferred (needs history). Permissions unchanged.

## v0.8.0 — 2026-07-06

Walls are now **REAL** (placeholder removed) + a liq-aware R:R trade planner.

- **Real liq walls + smart money, client-side.** Bundled `data/whales.json` (150 profitable whale addresses, top +$445M all-time). `background.js` fans out `clearinghouseState` for all 150 (≤9 concurrent, raw states cached ~3min), then per focused coin: bins `liquidationPx` × `positionValue` into price walls (top 6, red-above/green-below vs mark) and nets signed notional into a real smart-money side (% long/short + net $). Verified live: BTC 72% short net −$34M + a $13.3M long-liq wall; ETH 98% short; SOL 96% short.
- **Removed** `HYPELENS_DATA_URL`, `getIntel`, and the fake `placeholderLiq`/`placeholderSmartMoney`/`seeded` generators. While the whale set aggregates, the UI shows an honest "loading walls from top-150 wallets…" (no fake numbers); once in, the PREVIEW label is gone and a "real walls · top-150 profitable wallets" provenance line shows. Whale recency dropped (needs historical diffing we don't have).
- **LIQ-AWARE TRADE PLANNER (R:R):** added a take-profit line beside the stop (both %-input, drawn on the chart, always kept in frame). Live **R:R 1:x** with $ risk / $ reward, color-graded (green ≥2, amber ≥1, red <1). Heatmap-aware, descriptive helpers: "TP at $2.3M cluster (squeeze magnet)" when TP sits on a wall, the existing stop "sweep risk", and a nearest-wall-above/below reference row. Seeds a 1:2 template (stop 1.5 daily moves, TP 3) the user then edits. Never prescriptive.
- **Place copy fixed:** planning (stop/TP/R:R) is presented as live and read-only; only order placement is Module 3 — "Your plan … is live and read-only — place it with attached SL/TP in Hyperliquid. One-click + builder-code order arrives in Module 3."
- Permissions unchanged (`storage` + `api.hyperliquid.xyz`); whales.json is bundled data, fetched via `chrome.runtime.getURL` (no host permission, no `web_accessible_resources` needed).

## v0.7.2 — 2026-07-06

Web3 reskin + risk-visualization + stops, on the Lightweight Charts engine.

- **Web3 / DeFi-terminal aesthetic:** frosted-glass chip + window (`backdrop-filter: blur`, translucent near-black teal `#0a0f11`, light-alpha borders, soft drop shadows), neon glows (liq line, mint accents, active toggles, slider thumb), gradients (mint→teal CTA/accents, red→green smart-money bar, radial header sheen), refined desaturated risk red/green + violet secondary, 150–180ms transitions, mono/tabular numerals, 12–16px radii, refined pill toggles + thin glowing-thumb slider.
- **1D default** candles (~90 bars) + a 1D/4H/1H pill toggle. `getCandles` now takes `(coin, interval, bars)`.
- **Smooth gradient heatmap** in the right gutter (gaussian-smoothed wall density → vertical `createLinearGradient`, hot = bright/opaque, cool = transparent; red family above mark / green below), hottest-above/below get a $ label + a soft glow line onto the chart. No chunky bars.
- **Liq line always in-frame:** a transparent auto-scale "anchor" line series forces the price range to always include the user's liq/stop price + near walls (+ padding), so the hero liq line never falls off-screen as the slider moves.
- **Shaded risk bands** behind candles (low-opacity washes): red ≤1 typical daily move from mark, orange 1–2.5, green beyond, both directions. The liq line slides across them and recolors red→orange→green with a ⚠/◎/✓ glyph on its glowing pill.
- **Stops + trailing (read-only, descriptive):** stop-% and trail-% inputs draw lines on the chart, vol-colored; **sweep warning** flags a stop sitting within ~0.3% of a liq wall ("inside $X wall · sweep risk") vs "clear of walls ✓". Place stub notes Module-3 will attach the stop.
- All marks drawn on one overlay canvas via `priceToCoordinate`, redrawn on a throttled rAF so they stay glued through scroll/zoom. Chart fills its height (dead space removed).
- Permissions unchanged (`storage` + `api.hyperliquid.xyz`).

## v0.7.0 — 2026-07-06

Chart engine swap: replaced the hand-rolled static canvas with **TradingView Lightweight Charts v4.2.3** (bundled locally, MIT/Apache-2.0), giving real scroll/zoom/pan.

- **`vendor/lightweight-charts.standalone.production.js`** (164KB) bundled locally — NO CDN, CSP-safe (vetted: no `eval`/`new Function`). Loaded before `hud.js` in both the content-script list and `popup.html`. No `web_accessible_resources` needed (loads in the content-script isolated world).
- **Candles** rendered by Lightweight Charts from HL `candleSnapshot` (`{t,o,h,l,c}` → `{time,open,high,low,close}`), interactive scroll/zoom/pan for free.
- **Liq walls** = a dedicated right-side heat-strip canvas positioned via `series.priceToCoordinate(price)`, redrawn on a rAF loop so it stays aligned through scroll/zoom. RED above mark / GREEN below, length ∝ $USD, top-4 non-overlapping labels. Candles never painted over.
- **User liq line** = native `series.createPriceLine()` (vol-colored, dashed, axis label), updates live as the leverage slider moves. **Mark line** = another subtle dotted price line.
- HLHUD now MOUNTS on first render / coin change and UPDATES otherwise (preserving zoom across the 30–45s data refresh via saved visible logical range).
- Everything below the chart unchanged (dir/iso-cross/size, leverage slider, Place stub, smart-money bar, funding chip, disclaimer). Both surfaces still share one renderer.
- Graceful failure: if the vendor global is missing, the chart area shows "chart engine failed to load" + a console error (no silent fallback).
- Permissions unchanged (`storage` + `api.hyperliquid.xyz`).

## v0.6.0 — 2026-07-06

Unified both surfaces on one renderer; visible version/name bump.

- **Renamed** to "HypeLens — Liquidation Heatmap & Smart Money"; **version 0.6.0** (every build bumps version now so `chrome://extensions` visibly changes on reload).
- **Shared HUD (`hud.js`, `window.HLHUD`)** — one renderer for the candlestick chart + liq-wall heat bands + vol-colored liq line + leverage/size slider + Place stub. Loaded by both the content script and the popup so the two surfaces are pixel-identical.
- **Toolbar popup rebuilt** to render the SAME `HLHUD` window (with a coin picker, default = most active perp). Removed the old dense-panel popup (`renderHero`/`renderIntelCard`/liq-map bar list/`drawCard` share card).
- **On-page chip** made obvious: branded "◉ HypeLens · BTC 58% SHORT · wall …" pill, mint glow, defaults to bottom-right, drag-to-move, click opens the window.
- Permissions unchanged (`storage` + `api.hyperliquid.xyz`).

## v0.5.0 — 2026-07-06

Architecture pivot to a self-contained mini-chart. Abandoned overlaying HL's own TradingView chart (iframe + canvas-rendered axis = unreachable/unalignable from a content script — confirmed via operator diag: pane rect null, zero DOM price labels, MAIN-world inject produced no output). Removed `inject.js`, the MAIN-world content script, `all_frames`, and all axis-scrape/native-probe machinery.

- **THE ONE WINDOW** (draggable, opened from the chip): renders **our own candlestick chart** on a canvas from `candleSnapshot` (1h/72h), so `price→pixel` is exact and everything aligns perfectly.
- **Liq-wall heat bands + user liq line** drawn on our chart via our own linear price scale.
- **Volatility-distance risk coloring** (honest, computed from candle log-return stdev → `dailyMovePct`): every level colored red ≤1 typical daily move / orange ≤2.5 / green beyond. The user liq line moves AND recolors live as the leverage slider drags — the visceral "am I in range of a wall" read. Optional barrier-touch "reach estimate ≈X% in 24h", explicitly labelled *volatility estimate, not a prediction*. Never "liquidation chance."
- **LIQ-AWARE SIZING** block (direction · size · leverage) shaped as an order-form skeleton; a **Place** button stubs the Module-3 builder-code hook (read-only; no wallet/signing/permissions in v1).
- Single surface: one small draggable chip (persisted position, dismissible) + the window. Never covers HL's right-side order form.
- Smart-money split bar + funding chip inside the window; compliance disclaimer via footer ⓘ tooltip; PREVIEW labels on placeholder liq data.
- New `getCandles` in background (60s cache); `dailyMovePct`/`volDistance`/`volColor`/`reachEstimate` in `viewmodel.js`.
- Permissions unchanged: `storage` + `api.hyperliquid.xyz` only.

## v0.4.0 — 2026-07-06

Product pivot to **liquidation intelligence + smart-money positioning** as the hero, with an on-chart overlay flagship and a liq-aware leverage tool. Structural lineage still traces to PolyParlay (see `PORTING.md`).

- **On-chart overlay (flagship):** liq-wall lines drawn directly on HL's TradingView chart. Native alignment via a MAIN-world probe (`inject.js`, TradingView `priceToCoordinate`) preferred; axis-scrape fallback; side-panel ladder as final fallback. Mark-sanity + monotonic checks — never draws misaligned lines. Top-5 walls, glanceable `$size` labels, corner "nearest wall" badge. `[HypeLens diag]` logging for blind alignment.
- **Liq-aware leverage tool:** direction / size / leverage (isolated·cross) → computed liq price draws as a live dashed line that moves with the slider; flags when liq lands inside a crowded wall; descriptive "leverage where your liq sits clear of walls: ≤Nx" (not advice). Cross-margin note (liq ≈ leverage-independent).
- **Smart-money positioning + liq ladder + click-to-select coin list** in a right-docked, opt-in detail panel (does not cover the order strip).
- **Data contract** (`viewmodel.js`) consumed by all surfaces; backend aggregator (`worker/aggregate-intel.mjs`) stub verified against live APIs (leaderboard → `clearinghouseState` → binned liq walls + net profitable-wallet side) — **not yet deployed**; `HYPELENS_DATA_URL` unset → clearly-labelled PREVIEW placeholder data.
- **SPA-safe coin detection:** 500ms poll + `popstate` + DOM fallback (content scripts can't intercept the page's pushState).
- **Compliance:** persistent "not financial advice / no tool can prevent liquidation" disclaimer on panel, hero, popup, and share cards; banned overpromise phrasing scrubbed; approved value-prop copy.
- Funding demoted to a live one-line footnote.
- Permissions unchanged: `storage` + `api.hyperliquid.xyz` host only.

## v0.1.0 — 2026-07-06

Initial MVP: read-only funding & market-intel overlay (funding APR, premium, OI, volume, hyperp flags), popup + shareable card. Superseded by the v0.4 pivot.
