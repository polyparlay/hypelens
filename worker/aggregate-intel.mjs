// HypeLens backend aggregator — the "thin cache" that does the heavy
// wallet fan-out so the extension fetches ONE small precomputed JSON.
// ---------------------------------------------------------------------
// STATUS: STUB — verified against live APIs, NOT YET DEPLOYED (TODO below).
// Run: `node worker/aggregate-intel.mjs > hypelens-intel.json`
// Deploy target (TODO): cron (GH Action / Cloudflare Cron Trigger) every
// 60s → write JSON to a static host / R2 / KV; point the extension's
// HYPELENS_DATA_URL at it. Node 18+ (global fetch).
//
// Confirmed API shapes (live 2026-07-06):
//   GET  https://stats-data.hyperliquid.xyz/Mainnet/leaderboard
//        -> { leaderboardRows: [ { ethAddress, accountValue,
//             windowPerformances: [ ["day",{pnl,roi,vlm}], ["week",..],
//             ["month",..], ["allTime",{pnl,roi,vlm}] ] } ] }   (~40k rows, 33MB)
//   POST https://api.hyperliquid.xyz/info {"type":"clearinghouseState","user":addr}
//        -> { assetPositions: [ { position: { coin, szi (signed str: + long
//             − short), entryPx, liquidationPx (str|null), positionValue (str),
//             unrealizedPnl (str), leverage, marginUsed, maxLeverage } } ] }
//        weight 2, 1200/min per IP.
//   POST {"type":"metaAndAssetCtxs"} -> mark prices for bin ranges.
//
// OUTPUT JSON SHAPE (this is the extension's data contract — must match
// viewmodel.js buildViewModel(intel)):
//   {
//     updated: <ms epoch>,
//     coverage: { wallets, walletsWithPositions, note },
//     coins: {
//       "SOL": {
//         markPx: 142.3,
//         smartMoney: { side:"short", pctShort:62, netUsd:-4100000,
//                       nWallets:140, nProfitable:90,
//                       topEntries:[ { addr, side, sizeUsd, liqPx, roi,
//                                      pnlLabel:"skilled"|"lucky"|null } ] },
//         liqClusters: [ { price, sizeUsd, side:"long"|"short" } ]
//       }, ...
//     }
//   }

const INFO = 'https://api.hyperliquid.xyz/info';
const LEADERBOARD = 'https://stats-data.hyperliquid.xyz/Mainnet/leaderboard';
const TOP_N = 200;            // start with the 200 wallets that move price
const BINS_PER_SIDE = 6;      // liq price buckets above/below mark
const BAND = 0.30;            // only bucket liqs within ±30% of mark
const CONCURRENCY = 8;

async function post(body) {
  const r = await fetch(INFO, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('info ' + body.type + ' HTTP ' + r.status);
  return r.json();
}
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
function perf(row, name) {
  const wp = (row.windowPerformances || []).find((w) => w[0] === name);
  return wp ? wp[1] : null;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx], idx); } catch { out[idx] = null; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function pnlLabel(all) {
  if (!all) return null;
  const pnl = num(all.pnl), roi = num(all.roi);
  if (pnl == null || pnl <= 0) return null;
  return roi != null && roi > 0.1 ? 'skilled' : 'lucky';
}

async function main() {
  // 1. mark prices
  const [meta, ctxs] = await post({ type: 'metaAndAssetCtxs' });
  const markByCoin = {};
  meta.universe.forEach((u, idx) => { if (ctxs[idx]) markByCoin[u.name] = num(ctxs[idx].markPx); });

  // 2. top-N wallets by account value
  const lb = await (await fetch(LEADERBOARD)).json();
  const rows = (lb.leaderboardRows || []).slice()
    .sort((a, b) => parseFloat(b.accountValue) - parseFloat(a.accountValue))
    .slice(0, TOP_N);

  // 3. fan-out clearinghouseState
  const states = await mapLimit(rows, CONCURRENCY, async (r) => ({
    row: r, state: await post({ type: 'clearinghouseState', user: r.ethAddress })
  }));

  // 4. aggregate per coin
  const coins = {};
  let walletsWithPositions = 0;
  for (const s of states) {
    if (!s || !s.state) continue;
    const positions = s.state.assetPositions || [];
    if (positions.length) walletsWithPositions++;
    const all = perf(s.row, 'allTime');
    const roi = all ? num(all.roi) : null;
    const profitable = roi != null && roi > 0;
    const label = pnlLabel(all);
    for (const ap of positions) {
      const p = ap.position; if (!p) continue;
      const coin = p.coin;
      const szi = num(p.szi);
      const notional = num(p.positionValue);
      const liqPx = num(p.liquidationPx);
      if (!coin || szi == null || notional == null || szi === 0) continue;
      const side = szi > 0 ? 'long' : 'short';
      const c = coins[coin] || (coins[coin] = {
        markPx: markByCoin[coin] ?? null,
        _short: 0, _long: 0, _net: 0, _nWallets: 0, _nProf: 0,
        _liq: [], _entries: []
      });
      c._nWallets++;
      // smart-money = net exposure of PROFITABLE wallets only
      if (profitable) {
        c._nProf++;
        if (side === 'short') c._short += notional; else c._long += notional;
        c._net += szi > 0 ? notional : -notional;
        c._entries.push({ addr: s.row.ethAddress, side, sizeUsd: notional, liqPx, roi, pnlLabel: label });
      }
      // liq cluster contribution (any wallet with a real liq price in band)
      if (liqPx != null && c.markPx) {
        const dist = Math.abs(liqPx - c.markPx) / c.markPx;
        if (dist <= BAND) c._liq.push({ price: liqPx, sizeUsd: notional, side });
      }
    }
  }

  // 5. finalize per coin: bucket liqs, rank entries, compute side/pct/net
  const outCoins = {};
  for (const [coin, c] of Object.entries(coins)) {
    const totalProf = c._short + c._long;
    const pctShort = totalProf > 0 ? Math.round((c._short / totalProf) * 100) : 50;
    const side = pctShort >= 55 ? 'short' : pctShort <= 45 ? 'long' : 'mixed';
    const topEntries = c._entries.sort((a, b) => b.sizeUsd - a.sizeUsd).slice(0, 5)
      .map((e) => ({
        addr: e.addr.slice(0, 6) + '…' + e.addr.slice(-4),
        side: e.side, sizeUsd: Math.round(e.sizeUsd),
        liqPx: e.liqPx, roi: e.roi, pnlLabel: e.pnlLabel, agoMin: null
      }));
    // bucket liqs into BINS_PER_SIDE above/below mark
    const clusters = bucketLiqs(c._liq, c.markPx);
    outCoins[coin] = {
      markPx: c.markPx,
      smartMoney: {
        side, pctShort, netUsd: Math.round(c._net), nWallets: c._nWallets, nProfitable: c._nProf, topEntries
      },
      liqClusters: clusters
    };
  }

  return {
    updated: Date.now(),
    coverage: { wallets: rows.length, walletsWithPositions, note: 'top ' + rows.length + ' wallets by account value — the ones that move price' },
    coins: outCoins
  };
}

function bucketLiqs(liqs, markPx) {
  if (!markPx || !liqs.length) return [];
  const below = liqs.filter((l) => l.price < markPx); // long liqs cascade down
  const above = liqs.filter((l) => l.price >= markPx);
  return [...binSide(above, markPx, markPx * (1 + BAND)), ...binSide(below, markPx * (1 - BAND), markPx)]
    .filter((b) => b.sizeUsd > 0)
    .sort((a, b) => b.price - a.price);
}
function binSide(liqs, lo, hi) {
  if (!liqs.length) return [];
  const out = [];
  const step = (hi - lo) / BINS_PER_SIDE;
  for (let i = 0; i < BINS_PER_SIDE; i++) {
    const bLo = lo + i * step, bHi = lo + (i + 1) * step;
    const inBin = liqs.filter((l) => l.price >= bLo && l.price < bHi);
    if (!inBin.length) continue;
    const sizeUsd = Math.round(inBin.reduce((a, l) => a + l.sizeUsd, 0));
    // dominant side in the bin (nearly always uniform: below=long, above=short)
    const longUsd = inBin.filter((l) => l.side === 'long').reduce((a, l) => a + l.sizeUsd, 0);
    out.push({ price: Math.round((bLo + bHi) / 2 * 1e6) / 1e6, sizeUsd, side: longUsd >= sizeUsd / 2 ? 'long' : 'short' });
  }
  return out;
}

main().then((j) => { process.stdout.write(JSON.stringify(j)); })
  .catch((e) => { console.error('aggregate-intel failed:', e); process.exit(1); });
