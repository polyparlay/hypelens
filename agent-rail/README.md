# HypeLens Agent Rail

**Eyes and hands for AI agents trading Hyperliquid perps.** Real-data liquidation
intelligence (free) + risk-checked execution (builder-code monetized), as an MCP
server and a plain Node SDK.

- **Real, not estimated**: walls/cascades come from a live crawl of ~1,100 top
  Hyperliquid wallets (union of top-500 by account value and top-700 by weekly
  volume), refreshed every 15 minutes. Every response carries `coverage_pct`
  and `data_age_s` — we tell you exactly how much of open interest we see.
- **Risk-checked execution**: `hl_place_order` computes your liquidation price
  and *refuses* orders whose liq lands inside a crowded wall (override
  available). SL/TP ship in the same atomic order group.
- **Testnet-first**: mainnet placement is hard-blocked in code until the
  operator's testnet money-path sign-off — the same gate as the HypeLens
  extension's Module 3.

## Quickstart (MCP)

```bash
# Claude Code
claude mcp add hypelens -- npx hypelens-agent-rail

# any MCP client — stdio server:
npx hypelens-agent-rail
```

Tools: `hl_walls`, `hl_cascade`, `hl_pretrade_check`, `hl_whale_book`,
`hl_exchange_status`, `hl_new_agent_wallet`, `hl_approve_payloads`,
`hl_place_order`.

## Quickstart (SDK)

```js
import { walls, pretradeCheck, placeOrder } from 'hypelens-agent-rail';

const w = await walls('BTC');           // real liq walls + magnet flag
const r = await pretradeCheck({ coin: 'BTC', dir: 'long', leverage: 20 });
if (r.verdict !== 'danger') {
  await placeOrder({ coin: 'BTC', isBuy: true, size: 0.01, entryPx: r.entryPx,
                     slPx: r.liqPx * 1.02, leverage: 20 });   // testnet until enabled
}
```

Execution env: `HYPELENS_AGENT_PK` (agent wallet key you generate with
`hl_new_agent_wallet`; the master wallet signs two one-time EIP-712 approvals —
agent + 0.01% builder fee — via `hl_approve_payloads`). `HYPELENS_NET=testnet`
(default).

## How it's built

The rail evals the exact modules the HypeLens Chrome extension ships —
`viewmodel.js` (liq math, cascade model), `hl-actions.js` (wire-format action
builders, builder fee pinned), `hl-signer.js` + vendored signing SDK
(deterministic-hash-gated) — never a reimplementation. Same data, same model,
same safety gates as the extension overlay on app.hyperliquid.xyz.

## Economics, stated plainly

Risk tools are free, forever. Execution routed through the rail carries the
HypeLens builder code at **1 basis point (0.01%)** — $0.10 per $1,000 traded —
approved explicitly by the user's master wallet with a hard `maxFeeRate`, and
revocable on-chain at any time.

## Test

```bash
npm test          # 13 tests: model load, wire format, mainnet block, risk gate
```

MIT. Part of [HypeLens](https://github.com/polyparlay/hypelens).
