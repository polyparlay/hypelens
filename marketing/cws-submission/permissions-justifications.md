# HypeLens — CWS permission justifications (paste into the dev console)
# LAUNCH build permissions are intentionally minimal: only `storage` +
# one host. This scope is the #1 thing that keeps a finance-extension review fast.

## `storage`
HypeLens stores your local UI preferences (selected coin, heat intensity/opacity, optional watch-address for read-only position monitoring) via chrome.storage.local. Nothing is uploaded and nothing is shared.

## Host permission: `https://api.hyperliquid.xyz/*`
HypeLens fetches public Hyperliquid market data (prices, candles, funding, open interest) and public on-chain wallet positions (clearinghouseState) to render the liquidation heatmap and the user's own position risk. This is Hyperliquid's public API; no authentication and no private keys are involved.

## Content script match: `https://app.hyperliquid.xyz/*`
HypeLens injects its read-only overlay pill only on the official Hyperliquid trading app so the heatmap and position-risk read appear in-context. It reads the visible coin and (optionally) the connected wallet address from the page as text — it never connects to the wallet or requests signing.

# NOTE: the LAUNCH build declares NO <all_urls>, NO tabs/activeTab, NO world:MAIN
# injection. The separate trading build (later submission) adds the MAIN-world
# window.ethereum bridge for opt-in order placement and MUST then disclose the
# builder fee in the listing + UI per the CWS affiliate-ads policy.
