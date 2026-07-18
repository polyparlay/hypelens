// HypeLens backend feed aggregator — the "thin cache" that does the heavy
// wallet fan-out so the extension fetches ONE small precomputed JSON.
// ---------------------------------------------------------------------
// v0.22.0: DEPLOYED (GitHub Pages, cron every 15 min — worker/feed-cron.sh).
// The static 300-wallet bundle proved structurally incapable of tracking a
// book whose positions churn in days (operator-proven: it held ZERO of the
// wallets carrying today's $124M BTC shorts). The universe is now re-derived
// from the LIVE leaderboard every run:
//   union( top-500 by accountValue, top-700 by weekly volume )
// (~1,100 wallets ≈ 50% of BTC OI vs ~20% for the old static 300).
//
// Run:  node worker/aggregate-intel.mjs            → docs/feed/hypelens-intel.json
//       node worker/aggregate-intel.mjs --bundle   → also regenerates the
//         extension ship-time fallbacks (extension/data/real_liq.json + whales.json)
//
// FEED SHAPE (the extension's data contract — background.js feedRows()):
// {
//   updated: ISO,
//   wallets: ["0x…", ...],                  // current universe → in-browser fallback crawl
//   coins: {
//     BTC: {
//       mark, oiUsd,
//       coverage: { trackedNotionalUsd, oiUsd, pct },   // REAL per-coin coverage
//       positions: [[liqPx, posValUsd, side(0=long|1=short), addr, entryPx, acctVal], ...]
//     }, ...
//   }
// }
// positions power the heat field + named-wallet drill-down + ADL proxy.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INFO = 'https://api.hyperliquid.xyz/info';
const LEADERBOARD = 'https://stats-data.hyperliquid.xyz/Mainnet/leaderboard';
const TOP_BY_ACCT = 500;
const TOP_BY_WEEK_VLM = 700;
const CONCURRENCY = 9;
const BAND = 0.50;             // keep liqs within ±50% of mark
const MAX_POS_PER_COIN = 400;  // size bound (top by notional)
const MIN_POS_USD = 20000;     // ignore dust positions

async function post(body) {
  const r = await fetch(INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('info ' + body.type + ' HTTP ' + r.status);
  return r.json();
}
const num = (v) => { const n = parseFloat(v); return isNaN(n) || !isFinite(n) ? null : n; };
const perf = (row, name) => { const wp = (row.windowPerformances || []).find((w) => w[0] === name); return wp ? wp[1] : null; };

async function mapLimit(items, limit, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; try { await fn(items[idx], idx); } catch (e) {} }
  }));
}

// ---- 1) wallet universe: union(top-500 acct value, top-700 week volume) ----
console.error('fetching leaderboard…');
const lb = await (await fetch(LEADERBOARD)).json();
const rows = (lb.leaderboardRows || []).filter((r) => r.ethAddress);
const av = (r) => num(r.accountValue) || 0;
const wv = (r) => { const p = perf(r, 'week'); return p ? (num(p.vlm) || 0) : 0; };
const byAcct = rows.slice().sort((a, b) => av(b) - av(a)).slice(0, TOP_BY_ACCT);
const byVlm = rows.slice().sort((a, b) => wv(b) - wv(a)).slice(0, TOP_BY_WEEK_VLM);
const universe = new Map();
for (const r of byAcct.concat(byVlm)) universe.set(r.ethAddress.toLowerCase(), r);
const wallets = [...universe.keys()];
console.error('universe:', wallets.length, 'wallets (union of top-' + TOP_BY_ACCT + ' acct + top-' + TOP_BY_WEEK_VLM + ' week vlm)');

// ---- 2) marks + OI ----
const [meta, ctxs] = await post({ type: 'metaAndAssetCtxs' });
const markOf = {}, oiOf = {};
(meta.universe || []).forEach((u, i) => {
  const c = ctxs[i] || {};
  const mark = num(c.markPx), oi = num(c.openInterest);
  if (u && u.name && mark != null) { markOf[u.name] = mark; oiOf[u.name] = oi != null ? oi * mark : null; }
});

// ---- 3) crawl clearinghouseState for the universe ----
const perCoin = {};
const trackedUsd = {};   // COVERAGE: ALL tracked notional per coin (incl. positions
                         // without an in-band liq price — they are still tracked OI)
let done = 0, positions = 0, fails = 0;
await mapLimit(wallets, CONCURRENCY, async (addr) => {
  try {
    const st = await post({ type: 'clearinghouseState', user: addr });
    const acctVal = st.marginSummary ? num(st.marginSummary.accountValue) : null;
    for (const ap of (st.assetPositions || [])) {
      const p = ap.position || {};
      const lp = num(p.liquidationPx), pv = num(p.positionValue), szi = num(p.szi), ep = num(p.entryPx);
      if (!p.coin || pv == null || pv <= 0 || !szi) continue;
      trackedUsd[p.coin] = (trackedUsd[p.coin] || 0) + pv;
      if (lp == null || lp <= 0 || pv < MIN_POS_USD) continue;
      const mark = markOf[p.coin];
      if (mark && Math.abs(lp - mark) / mark > BAND) continue;
      (perCoin[p.coin] || (perCoin[p.coin] = [])).push([+lp.toFixed(6), Math.round(pv), szi > 0 ? 0 : 1, addr, ep != null ? +ep.toFixed(6) : null, acctVal != null ? Math.round(acctVal) : null]);
      positions++;
    }
  } catch (e) { fails++; }
  done++;
  if (done % 100 === 0) console.error('  crawled', done, '/', wallets.length, '·', positions, 'positions ·', fails, 'fails');
});

// ---- 4) emit feed ----
const coins = {};
for (const [coin, list] of Object.entries(perCoin)) {
  const mark = markOf[coin]; if (!mark || list.length < 2) continue;
  list.sort((a, b) => b[1] - a[1]);
  const kept = list.slice(0, MAX_POS_PER_COIN);
  const tracked = trackedUsd[coin] || list.reduce((s, p) => s + p[1], 0);
  const oi = oiOf[coin];
  coins[coin] = {
    mark, oiUsd: oi != null ? Math.round(oi) : null,
    coverage: { trackedNotionalUsd: Math.round(tracked), oiUsd: oi != null ? Math.round(oi) : null, pct: oi ? Math.min(100, Math.round(tracked / oi * 100)) : null },
    positions: kept,
  };
}
const feed = { updated: new Date().toISOString(), wallets, coins };
const feedPath = path.join(ROOT, 'docs', 'feed', 'hypelens-intel.json');
fs.mkdirSync(path.dirname(feedPath), { recursive: true });
fs.writeFileSync(feedPath, JSON.stringify(feed));
const kb = Math.round(fs.statSync(feedPath).size / 1024);
console.error('WROTE', feedPath, kb + 'KB ·', Object.keys(coins).length, 'coins ·', positions, 'positions ·', fails, 'failed wallets');
if (kb > 500) console.error('WARNING: feed exceeds the 500KB size budget');

// BTC summary (the ground-truth check)
const btc = coins.BTC;
if (btc) {
  const above = btc.positions.filter((p) => p[0] > btc.mark), below = btc.positions.filter((p) => p[0] < btc.mark);
  const near = (arr, f) => arr.filter((p) => Math.abs(p[0] - btc.mark) / btc.mark <= f);
  const sum = (arr) => arr.reduce((s, p) => s + p[1], 0) / 1e6;
  console.error(`BTC mark ${btc.mark} · coverage ${btc.coverage.pct}% of OI ($${(btc.coverage.trackedNotionalUsd / 1e6).toFixed(0)}M / $${(btc.coverage.oiUsd / 1e6).toFixed(0)}M)`);
  console.error(`  shorts above: ${above.length} liqs $${sum(above).toFixed(1)}M total (within +15%: $${sum(near(above, 0.15)).toFixed(1)}M)`);
  console.error(`  longs below : ${below.length} liqs $${sum(below).toFixed(1)}M total (within −15%: $${sum(near(below, 0.15)).toFixed(1)}M)`);
}

// ---- 5) optional: regenerate the extension's ship-time fallbacks ----
if (process.argv.includes('--bundle')) {
  const bundleCoins = {};
  for (const [coin, c] of Object.entries(coins)) {
    bundleCoins[coin] = { mark: c.mark, levels: c.positions.map((p) => [p[0], p[1], p[2] === 0 ? 'long' : 'short']) };
  }
  const bundle = { updated: feed.updated, updated_note: 'real HL positions · ' + wallets.length + '-wallet leaderboard-union crawl · generated ' + feed.updated.slice(0, 10), coins: bundleCoins };
  fs.writeFileSync(path.join(ROOT, 'extension', 'data', 'real_liq.json'), JSON.stringify(bundle));
  const wj = { updated: feed.updated, note: 'union(top-' + TOP_BY_ACCT + ' acct, top-' + TOP_BY_WEEK_VLM + ' week vlm) leaderboard universe', whales: wallets.map((a) => ({ a, pnl: 0, av: Math.round(av(universe.get(a))) })) };
  fs.writeFileSync(path.join(ROOT, 'extension', 'data', 'whales.json'), JSON.stringify(wj));
  console.error('WROTE extension/data/real_liq.json + whales.json (ship-time fallbacks, ' + wallets.length + ' wallets)');
}
