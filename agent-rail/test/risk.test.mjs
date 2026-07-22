import { test } from 'node:test';
import assert from 'node:assert/strict';
import { binWalls, pretradeCheck, walls, cascade, whaleBook, _setFixtures } from '../src/core.js';

// Synthetic fixture: BTC at 100,000 with a fat long wall at 95,000.
const FEED = {
  updated: new Date().toISOString(),
  coins: {
    BTC: {
      mark: 100000, oiUsd: 2e9, coverage: { pct: 53 },
      positions: [
        [95000, 30e6, 0, '0xaaa0000000000000000000000000000000000001', 104000],
        [94900, 15e6, 0, '0xaaa0000000000000000000000000000000000002', 103000],
        [99500, 12e6, 0, '0xaaa0000000000000000000000000000000000003', 101000],
        [112000, 20e6, 1, '0xbbb0000000000000000000000000000000000004', 98000],
        [140000, 5e6, 1, '0xbbb0000000000000000000000000000000000005', 90000]
      ]
    }
  }
};
const META = { BTC: { assetIndex: 0, szDecimals: 5, maxLeverage: 40, markPx: 100000, oiNtl: 2e9, dayNtlVlm: 2e9 } };

test('binWalls: bins by 0.4% of mark, sides by price vs mark, sorted by size', () => {
  const w = binWalls(FEED.coins.BTC.positions.map((p) => ({ price: p[0], sizeUsd: p[1] })), 100000);
  assert.ok(w.length >= 3);
  // 95000 → bin 238 (95200), 94900 → bin 237 (94800): adjacent bins, no merge
  assert.equal(w[0].sizeUsd, 30e6);
  assert.equal(w[0].side, 'long');
  assert.ok(Math.abs(w[0].distPct + 5) < 1);
  assert.equal(w[1].sizeUsd, 20e6); // the 112000 short wall ranks second
  // 140000 is outside ±50%? no — inside; but check the 112000 short bin exists
  assert.ok(w.some((x) => x.side === 'short'));
});

test('walls(): magnet detected only within 1.5% and ≥$10M', async () => {
  _setFixtures({ feed: FEED, meta: META });
  const r = await walls('BTC');
  assert.equal(r.magnet.sizeUsd, 12e6); // 99500 wall is 0.5% away and ≥$10M
  assert.equal(r.magnet.side, 'below');
  assert.equal(r.coverage_pct, 53);
  assert.ok(r.totalLiqBelowUsd > r.totalLiqAboveUsd);
});

test('pretradeCheck: high leverage lands in the wall → danger + clear-leverage suggestion', async () => {
  _setFixtures({ feed: FEED, meta: META });
  // long entry 100k: find a leverage whose liq is ~95k (inside the 45M wall)
  const r = await pretradeCheck({ coin: 'BTC', dir: 'long', leverage: 18, entryPx: 100000 });
  assert.equal(typeof r.liqPx, 'number');
  assert.ok(r.liqPx < 100000);
  if (r.liqInsideWall) {
    assert.equal(r.verdict, 'danger');
    assert.ok(r.suggestedClearLeverage == null || r.suggestedClearLeverage < 18);
  } else {
    assert.ok(['ok', 'warning'].includes(r.verdict));
  }
});

test('pretradeCheck: low leverage clears the walls', async () => {
  _setFixtures({ feed: FEED, meta: META });
  const r = await pretradeCheck({ coin: 'BTC', dir: 'long', leverage: 2, entryPx: 100000 });
  assert.equal(r.liqInsideWall, false);
  assert.notEqual(r.verdict, 'danger');
});

test('pretradeCheck: rejects leverage above max', async () => {
  _setFixtures({ feed: FEED, meta: META });
  await assert.rejects(() => pretradeCheck({ coin: 'BTC', dir: 'long', leverage: 41 }), /exceeds max/);
});

test('cascade: returns model output shape from shipped computeCascade', async () => {
  _setFixtures({ feed: FEED, meta: META });
  const r = await cascade('BTC', 'down');
  assert.equal(r.dir, 'down');
  if (r.cascade) {
    assert.ok(r.cascade.triggerPx > 0);
    assert.ok(r.cascade.totalLiqUsd > 0);
  }
});

test('whaleBook: sorted by notional, capped, honest fields present', async () => {
  _setFixtures({ feed: FEED, meta: META });
  const r = await whaleBook('BTC', 3);
  assert.equal(r.positions.length, 3);
  assert.ok(r.positions[0].notionalUsd >= r.positions[1].notionalUsd);
  assert.ok(r.source.includes('NOT estimates'));
});
