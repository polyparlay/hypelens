# Agent Rail — rollout plan (2026-07-22)

No "post on CT and pray." Every channel below is a named registry, community, or
direct counterparty with a concrete submission mechanic. Revenue ground truth is
on-chain: builder-fee receipts at 0x9548…7c88 + count of distinct wallets that
signed `approveBuilderFee`.

## Wave 1 — publish + registries (this week; mostly Claude-executable)

| # | Venue | Mechanic | Who |
|---|---|---|---|
| 1 | **npm** (`hypelens-agent-rail`) — makes `npx` quickstart real; npm search is a discovery surface itself | `npm publish` from agent-rail/ (prepack bundles vendor) | **Operator**: npm account/token. Claude: everything else |
| 2 | **Official MCP Registry** (registry.modelcontextprotocol.io) — what Claude/Cursor/clients browse | add `server.json`, publish via `mcp-publisher` CLI (GitHub auth) | Claude preps; operator authorizes GitHub auth |
| 3 | **Smithery.ai** — largest MCP directory, shows install counts (our adoption KPI) | GitHub sign-in + add repo (one click) + `smithery.yaml` | Claude preps yaml; **operator**: one-click connect |
| 4 | **Glama / PulseMCP / mcp.so** MCP directories | submission forms / PRs | Claude |
| 5 | **awesome-mcp-servers** + **awesome-hyperliquid** GitHub lists | PRs | Claude |
| 6 | Split to standalone repo `polyparlay/agent-rail`? | better star/discovery surface than a subdir | Operator decision; Claude executes |

## Wave 2 — where HL agent devs actually are (next week)

| # | Venue | Mechanic | Who |
|---|---|---|---|
| 7 | **Hyperliquid Discord** #api-traders / #builder-codes — where HL routes every bot dev asking API questions | working demo post + answer threads; this is support-driven distribution, not broadcast | Claude drafts; operator posts (account) |
| 8 | **Hyper Foundation builder grants / ecosystem page** — funding AND official listing; grantees get promoted by HL itself | application; reuse `marketing/pitch/PITCH-CORE.md` grant skin (Jul 17) | Claude drafts full application; operator submits |
| 9 | **ElizaOS plugin registry** (elizaos-plugins org) — the largest open agent framework; an existing `plugin-hyperliquid` proves demand and has NO risk tools and NO real liq data | thin plugin wrapping the SDK; PR to registry index | Claude |
| 10 | **Bankr skills catalog** (BankrBot/skills, ~5 entries) | SKILL.md PR teaching Bankr agents `pretrade_check` | Claude (already scoped) |
| 11 | **Coinbase AgentKit** action provider | PR adding HL risk actions | Claude (secondary) |

## Wave 3 — direct B2B (the % of real volume; starts as soon as Wave 1 is live)

Named counterparties, each with a specific ask — data licensing for platforms
that already have their own builder codes, rail integration for those that don't:

| Target | Why them | Ask |
|---|---|---|
| **pvp.trade, Insilico, Dexari, Mizar** (established HL frontends/terminals) | have builder-code flow, have NO real-position liq data (all use estimates or nothing) | license the feed/pretrade-check as white-label API ($/mo) — they keep their code, we sell the eyes |
| **Capacitr, Hypurr, Nexus Trading Labs** (Bankr's HL-adjacent agents, measured small but live) | free rail integration = instant differentiation for them | integrate free risk tools; execution via our rail where they lack their own |
| **Top HL vault leaders / copy-trade operators** — addresses already in our feed | they route size programmatically; our whale drill-down IS their risk profile | direct note: "here's your own liq exposure on our map" + rail/API |
| **HL trading-bot OSS maintainers** (hyperliquid-python-sdk ecosystem, ccxt-hyperliquid users) | devs who wire bots by hand | PR examples + README links |

Reuse `marketing/pitch/OUTREACH-SENDS.md` (partner skin) for all of the above.

## Gate to revenue

Builder fees only accrue on **mainnet** flow. The one blocking item is the
standing Module 3 gate: **operator testnet money-path proof → explicit sign-off
→ flip `MAINNET_PLACEMENT_ENABLED`** in `extension/exchange/hl-actions.js`
(rail inherits it automatically). Wave 1-2 proceed regardless — risk tools are
mainnet-real today and are the acquisition hook.

## Pre-registered adoption gates (no dust)

- **Week 2** (from npm publish): ≥25 installs (Smithery + npm downloads) OR ≥2
  live integration conversations from Wave 3 → continue. Below both → the
  problem is packaging/pitch; iterate THAT, don't add features.
- **Week 6**: ≥1 platform integration signed OR ≥$50/wk builder-fee revenue
  on-chain OR ≥200 weekly `pretrade_check` calls → invest (Eliza-native vault
  product, alerts). Below all three → write the verdict to memory, keep the
  rail published at zero marginal cost, stop investing.

## Operator one-time checklist (~2h total)
1. npm account + `npm publish` (or hand Claude a token)
2. Smithery GitHub connect (one click)
3. MCP-registry GitHub auth for `mcp-publisher`
4. Decide: split `polyparlay/agent-rail` repo?
5. HL Discord + grant submission (Claude drafts everything)
6. Testnet proof session (~30 min with testnet USDC) → mainnet sign-off
