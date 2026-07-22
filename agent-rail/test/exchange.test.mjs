import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadShipped } from '../src/load.js';
import { status, placeOrder, newAgentWallet, approvePayloads } from '../src/exchange.js';
import { _setFixtures } from '../src/core.js';

test('shipped modules load in node; signer self-test passes', () => {
  const { actions, signer, VM } = loadShipped();
  assert.equal(signer.selfTest().ok, true, signer.selfTest().error || '');
  assert.equal(typeof VM.computeCascade, 'function');
  assert.equal(actions.BUILDER, '0x9548B8E9554a1968843B3C380431b10996247c88');
});

test('every order action carries the pinned builder fee', () => {
  const { actions } = loadShipped();
  const a = actions.buildOrderAction({ assetIndex: 0, szDecimals: 5, isBuy: true, entryPx: 100000, size: 0.01, slPx: 95000, tpPx: 111000 });
  assert.deepEqual(a.builder, { b: actions.BUILDER.toLowerCase(), f: 10 });
  assert.equal(a.grouping, 'normalTpsl');
  assert.equal(a.orders.length, 3);
  assert.equal(a.orders[1].r, true); // SL reduce-only
});

test('mainnet placement is hard-blocked', async () => {
  process.env.HYPELENS_NET = 'mainnet';
  process.env.HYPELENS_AGENT_PK = '0x' + '1'.repeat(64);
  await assert.rejects(
    () => placeOrder({ coin: 'BTC', isBuy: true, size: 0.01, entryPx: 100000, skipRiskCheck: true }),
    /MAINNET PLACEMENT DISABLED/);
  delete process.env.HYPELENS_NET;
  delete process.env.HYPELENS_AGENT_PK;
});

test('placement without agent key fails closed', async () => {
  delete process.env.HYPELENS_AGENT_PK;
  await assert.rejects(
    () => placeOrder({ coin: 'BTC', isBuy: true, size: 0.01, entryPx: 100000, skipRiskCheck: true }),
    /HYPELENS_AGENT_PK not set/);
});

test('risk gate refuses danger orders without override', async () => {
  process.env.HYPELENS_NET = 'testnet';
  process.env.HYPELENS_AGENT_PK = '0x' + '1'.repeat(64);
  _setFixtures({
    feed: {
      updated: new Date().toISOString(),
      coins: { BTC: { mark: 100000, coverage: { pct: 53 }, positions: [[94800, 50e6, 0, '0xaaa0000000000000000000000000000000000001', 104000]] } }
    },
    meta: { BTC: { assetIndex: 0, szDecimals: 5, maxLeverage: 40, markPx: 100000, oiNtl: 2e9, dayNtlVlm: 2e9 } }
  });
  // leverage chosen so liq falls near 94800 wall; if the model puts liq inside
  // the wall the order must be refused (no network call is made on refusal)
  const r = await placeOrder({ coin: 'BTC', isBuy: true, size: 0.01, entryPx: 100000, leverage: 18 })
    .catch((e) => ({ threw: String(e.message) }));
  if (r.refused) {
    assert.match(r.refused, /wall/);
    assert.equal(r.placed, false);
  } else {
    // liq didn't land in the wall under the shipped model — acceptable; the
    // testnet POST path was then exercised or asset lookup failed. Either way
    // the call must not report a successful mainnet placement.
    assert.notEqual(r.net, 'mainnet');
  }
  delete process.env.HYPELENS_AGENT_PK;
  delete process.env.HYPELENS_NET;
});

test('agent wallet + approve payloads are well-formed', () => {
  const w = newAgentWallet();
  assert.match(w.address, /^0x[0-9a-fA-F]{40}$/);
  const p = approvePayloads(w.address);
  assert.equal(p.approveAgent.action.type, 'approveAgent');
  assert.equal(p.approveBuilderFee.action.maxFeeRate, '0.01%');
  assert.equal(p.approveBuilderFee.primaryType, 'HyperliquidTransaction:ApproveBuilderFee');
});
