# HypeLens — Chrome Web Store Listing (paste-ready)
# For the READ-ONLY launch build (manifest.launch.json). Placement/trading is a
# separate later submission that will add the builder-fee disclosure per CWS
# affiliate-ads policy. This listing describes the free read-only overlay ONLY.

═══════════════════════════════════════════ PRODUCT DETAILS ═══════════════════════════════════════════

**Title**
`HypeLens — Liquidation Heatmap & Risk for Hyperliquid`

**Summary** (132 chars max)
`Real-data liquidation heatmap + your-position risk, live on the Hyperliquid app. See the crowd's liq walls and where your liq sits.`

**Description** (paste into the description box)
```
HypeLens overlays a real liquidation heatmap and personal position-risk read directly onto the official Hyperliquid app (app.hyperliquid.xyz) — no separate dashboard, no tab-switching.

Unlike heatmaps that ESTIMATE liquidations from assumed leverage, HypeLens is built from REAL on-chain positions of the top Hyperliquid wallets — so the walls you see are where actual leverage gets force-closed.

WHAT YOU GET (FREE)
• Real-data liquidation heatmap — the crowd's liquidation clusters as a live viridis field over the price chart, labeled with $ notional. Bright zones are where price gets pulled and cascades trigger.
• Your liq vs the crowd — see exactly where YOUR liquidation price sits against the real clusters, and whether you're in a magnet zone.
• Safe / max-edge leverage — the highest leverage that keeps your liq clear of the walls and beyond normal daily volatility, computed live.
• Cluster-aware stop & take-profit levels — one tap places a stop beyond the wall (not in the sweep path where stops get hunted) and a TP into the magnet.
• Guardian mode — point HypeLens at your connected address (read-only, public data) and it monitors your ACTUAL open position: your real on-chain liquidation price against the clusters.
• Portfolio / cross view — your whole cross-margin book as one risk object: the account-wide liquidation the native UI never shows, plus a "what if the market drops X%" stress test and a correlated-exposure flag.
• Market context — funding, open interest and real positioning, inline on the ticker.
• Coverage transparency — we show what % of open interest our real-position sample covers. Honest, not "all."

HOW IT WORKS
1. Install and open app.hyperliquid.xyz.
2. A small HypeLens pill appears; click it to open the overlay for the coin you're trading.
3. Read the heatmap, drag your stop/TP on the chart, and check your liq and safe leverage against the crowd's clusters.

READ-ONLY
HypeLens is an analysis overlay. It does NOT connect to your wallet, hold keys, sign, or place any orders. It reads public Hyperliquid market data and (for Guardian mode) your public on-chain position from your address. You place trades yourself in Hyperliquid.

PRIVACY
HypeLens collects nothing personally identifying and uploads nothing. Settings are stored locally via chrome.storage on your machine. The only network calls are to Hyperliquid's public API for market and position data. No analytics, no tracking, no accounts.

DISCLAIMER
Informational only — not financial advice. Leveraged trading carries substantial risk and you can lose all your funds. Liquidation clusters are estimates of where leverage concentrates; no tool can predict price or prevent liquidation. You are responsible for your own decisions.
```

**Category**: `Productivity`
**Language**: `English (United States)`

═══════════════════════════════════════════ GRAPHIC ASSETS ═══════════════════════════════════════════
• Store icon 128×128 — rebrand PolyParlay's store-icon (HypeLens mark, mint on near-black). TODO: produce.
• Screenshots 1280×800 (1–5): (1) heatmap + your-liq, (2) SAFE LEVERAGE + PLACE LEVELS, (3) Portfolio/cross view, (4) Guardian on a live position. Capture from the running extension.
• Small promo 440×280, Marquee 1400×560 — rebrand PolyParlay promo tiles.

═══════════════════════════════════════════ PRIVACY / DATA ═══════════════════════════════════════════
Single purpose: "A read-only liquidation-heatmap and position-risk overlay for the Hyperliquid trading app."
Data collection: NONE. Certify: does not sell data, does not use for unrelated purposes, no creditworthiness use.
Remote code: NO (data fetched from an API is not remote code; no remote JS injected).
Host permission justification: see permissions-justifications.md.
