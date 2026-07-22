// HypeLens Agent Rail — MCP stdio server.
// Free risk tools + testnet-gated execution for any MCP client
// (Claude Code/Desktop, Cursor, custom agents).
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { walls, cascade, pretradeCheck, whaleBook } from './core.js';
import { status, placeOrder, approvePayloads, newAgentWallet } from './exchange.js';

const j = (v) => ({ content: [{ type: 'text', text: JSON.stringify(v, null, 1) }] });
const wrap = (fn) => async (args) => {
  try { return j(await fn(args)); }
  catch (e) { return { content: [{ type: 'text', text: 'ERROR: ' + (e && e.message ? e.message : e) }], isError: true }; }
};

export async function main() {
  const server = new McpServer({ name: 'hypelens-agent-rail', version: '0.1.0' });

  server.tool('hl_walls',
    'Liquidation walls for a Hyperliquid coin from REAL tracked whale positions (not estimates): binned clusters, nearest wall, totals above/below mark, magnet flag (≥$10M within 1.5%).',
    { coin: z.string().describe("Coin symbol, e.g. 'BTC'") },
    wrap(({ coin }) => walls(coin)));

  server.tool('hl_cascade',
    'Liquidation-cascade chain estimate: if price moves in a direction, which walls trigger, where the chain terminates, and total notional liquidated on the way.',
    { coin: z.string(), dir: z.enum(['up', 'down']).describe('Price direction to simulate') },
    wrap(({ coin, dir }) => cascade(coin, dir)));

  server.tool('hl_pretrade_check',
    'ALWAYS call before opening a Hyperliquid perp position. Computes your liquidation price and checks it against real liq walls and cascade paths. verdict: ok | warning (a cascade can reach your liq) | danger (your liq sits inside a crowded wall — reduce leverage; a clear leverage is suggested).',
    { coin: z.string(), dir: z.enum(['long', 'short']), leverage: z.number().positive(), entryPx: z.number().positive().optional().describe('Defaults to current mark'), sizeUsd: z.number().positive().optional() },
    wrap((a) => pretradeCheck(a)));

  server.tool('hl_whale_book',
    'Top tracked whale positions for a coin: address, side, notional, entry, liquidation price.',
    { coin: z.string(), topN: z.number().int().positive().max(50).optional() },
    wrap(({ coin, topN }) => whaleBook(coin, topN || 10)));

  server.tool('hl_exchange_status',
    'Execution readiness: network (testnet-first; mainnet placement is hard-blocked pending operator sign-off), signer self-test, builder-fee config, agent-key presence.',
    {}, wrap(() => status()));

  server.tool('hl_new_agent_wallet',
    'Generate a fresh agent wallet (private key + address) for Hyperliquid API trading. Store the key yourself; then have the MASTER wallet sign the approve payloads.',
    {}, wrap(() => newAgentWallet()));

  server.tool('hl_approve_payloads',
    'EIP-712 payloads the MASTER wallet must sign once: approveAgent(agentAddress) and approveBuilderFee (0.01% HypeLens builder fee). The rail never touches the master key.',
    { agentAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/) },
    wrap(({ agentAddress }) => approvePayloads(agentAddress)));

  server.tool('hl_place_order',
    'Place a risk-checked Hyperliquid perp order (GTC limit, optional SL/TP, HypeLens builder code attached). TESTNET unless mainnet is operator-enabled. Refuses orders whose liq price sits inside a wall unless override=true.',
    {
      coin: z.string(), isBuy: z.boolean(), size: z.number().positive().describe('Size in coin units'),
      entryPx: z.number().positive(), slPx: z.number().positive().optional(), tpPx: z.number().positive().optional(),
      leverage: z.number().positive().optional().describe('Enables the pre-trade risk check'),
      override: z.boolean().optional(), skipRiskCheck: z.boolean().optional()
    },
    wrap((a) => placeOrder(a)));

  await server.connect(new StdioServerTransport());
}
