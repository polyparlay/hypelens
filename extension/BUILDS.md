# HypeLens build variants

Two manifests ship in this folder. The **default `manifest.json` is the read-only
launch build** — load it for the store / free launch. Module 3 (placement) code
is present but dormant unless you deliberately switch to the phase-2 manifest.

## 1. LAUNCH — read-only heatmap (default)
- File: **`manifest.json`** (version `0.14.0`)
- `host_permissions`: **`https://api.hyperliquid.xyz/*`** only (read the HL info API).
- Content scripts: `viewmodel.js`, Lightweight-Charts, `hud.js`, `content.js` (+ `content.css`).
- **No `world:"MAIN"` injection. No testnet host. No exchange/wallet code loaded.**
- Popup: `popup.html` (no placement scripts).
- Result: minimal permission footprint for a clean store review. The Module 3
  files sit in the package unreferenced (`vendor/hl-sdk.js`, `exchange/*.js`,
  `inject-eth-main.js`, `popup.module3.html`); `window.HLX3` is never defined, so
  the placement UI never mounts on-page or in the popup.

## 2. PHASE-2 — Module 3 placement (testnet)
- File: **`manifest.module3.json`** (version `0.14.0-testnet`)
- Adds `host_permissions` `https://api.hyperliquid-testnet.xyz/*`, loads the
  `exchange/*` modules before `content.js`, adds the `world:"MAIN"`
  `inject-eth-main.js` bridge, and uses `popup.module3.html`.
- To enable: `cp manifest.module3.json manifest.json` (and reload the extension).
- Still requires vendoring `@nktkas/hyperliquid` into `vendor/hl-sdk.js` — until
  then placement is disabled (SDK-not-vendored, fail-closed).

## Mainnet is HARD-BLOCKED in code
`MAINNET_PLACEMENT_ENABLED = false` in `exchange/hl-actions.js` **and**
`HL_MAINNET_PLACEMENT_ENABLED = false` in `background.js`. While false: the
mainnet network option is a locked pill, `setNet('mainnet')` is coerced to
testnet, `setup()`/`place()` throw on mainnet, and the background refuses any
mainnet `/exchange` POST. Flip **both** flags only after testnet proof + an
explicit operator sign-off.
