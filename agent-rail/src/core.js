// HypeLens Agent Rail — RISK CORE (free tools).
// Data: the public HypeLens intel feed (1,100-wallet real-position crawl,
// refreshed every 15 min) + one unauthenticated HL info call for mark/meta.
// Models: the SHIPPED extension viewmodel (liqPrice, huntRiskCluster,
// suggestClearLeverage, computeCascade) — evaluated, never reimplemented.
// Every response carries honesty fields: coverage_pct, data_age_s, source.
import { readFileSync } from 'node:fs';
import { loadShipped } from './load.js';

const FEED_URL = process.env.HYPELENS_FEED_URL
  || 'https://raw.githubusercontent.com/polyparlay/hypelens/main/docs/feed/hypelens-intel.json';
const INFO = { mainnet: 'https://api.hyperliquid.xyz/info', testnet: 'https://api.hyperliquid-testnet.xyz/info' };
const FEED_TTL_MS = 60e3, META_TTL_MS = 30e3;
const BIG_WALL = 10e6, MAGNET_NEAR = 0.015; // same thresholds as calibration PREREG

let _feed = null, _feedAt = 0, _meta = null, _metaAt = 0;

export async function getFeed() {
  if (_feed && Date.now() - _feedAt < FEED_TTL_MS) return _feed;
  if (process.env.HYPELENS_FEED_FILE) {
    _feed = JSON.parse(readFileSync(process.env.HYPELENS_FEED_FILE, 'utf8'));
  } else {
    const r = await fetch(FEED_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!r.ok) throw new Error('feed HTTP ' + r.status);
    _feed = await r.json();
  }
  _feedAt = Date.now();
  return _feed;
}

export async function getMeta(net = 'mainnet') {
  if (_meta && Date.now() - _metaAt < META_TTL_MS) return _meta;
  const r = await fetch(INFO[net], {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'metaAndAssetCtxs' })
  });
  if (!r.ok) throw new Error('metaAndAssetCtxs HTTP ' + r.status);
  const [meta, ctxs] = await r.json();
  const byCoin = {};
  meta.universe.forEach((u, i) => {
    const c = ctxs[i] || {};
    byCoin[u.name] = {
      assetIndex: i, szDecimals: u.szDecimals, maxLeverage: u.maxLeverage,
      markPx: parseFloat(c.markPx), oiNtl: parseFloat(c.openInterest) * parseFloat(c.markPx) || null,
      dayNtlVlm: parseFloat(c.dayNtlVlm) || null
    };
  });
  _meta = byCoin; _metaAt = Date.now();
  return byCoin;
}

// test hook — inject fixtures instead of network
export function _setFixtures({ feed, meta } = {}) {
  if (feed !== undefined) { _feed = feed; _feedAt = feed ? Date.now() : 0; }
  if (meta !== undefined) { _meta = meta; _metaAt = meta ? Date.now() : 0; }
}

function coinIntel(feed, coin) {
  const d = feed.coins && feed.coins[coin.toUpperCase()];
  if (!d) throw new Error('coin not in feed: ' + coin + ' (have: ' + Object.keys(feed.coins || {}).join(',') + ')');
  // feed positions: [liqPx, notionalUsd, sideIdx(0=long,1=short), addr, entryPx, acctValue?]
  const positions = (d.positions || []).map((p) => ({
    price: p[0], sizeUsd: p[1], side: p[2] === 0 ? 'long' : 'short', addr: p[3], entryPx: p[4]
  }));
  return { ...d, positions };
}

// Wall binning — port of extension/background.js bundleIntel (0.4% bins,
// ±50% of mark, top 12 by notional). Side = position side of the bin majority
// is approximated by price vs mark exactly as the extension does.
export function binWalls(positions, mark) {
  const bins = new Map(), binW = mark ? mark * 0.004 : 1;
  for (const l of positions) {
    if (!mark || Math.abs(l.price - mark) / mark > 0.5) continue;
    const k = Math.round(l.price / binW), b = bins.get(k) || { sum: 0 };
    b.sum += l.sizeUsd; b.price = k * binW; b.side = l.price >= mark ? 'short' : 'long';
    bins.set(k, b);
  }
  return [...bins.values()]
    .map((b) => ({ price: b.price, sizeUsd: Math.round(b.sum), side: b.side, distPct: mark ? ((b.price - mark) / mark) * 100 : null }))
    .sort((a, b) => b.sizeUsd - a.sizeUsd).slice(0, 12);
}

function honesty(feed, d) {
  return {
    coverage_pct: d.coverage ? d.coverage.pct : null,
    data_age_s: feed.updated ? Math.max(0, Math.round((Date.now() - Date.parse(feed.updated)) / 1000)) : null,
    source: 'real positions — union(top-500 acct, top-700 weekly vol) HL leaderboard crawl; NOT estimates'
  };
}

export async function walls(coin) {
  const [feed, meta] = [await getFeed(), await getMeta()];
  const d = coinIntel(feed, coin);
  const mark = (meta[coin.toUpperCase()] || {}).markPx || d.mark;
  const w = binWalls(d.positions, mark);
  let magnet = null;
  for (const l of d.positions) {
    if (l.sizeUsd < BIG_WALL) continue;
    const dist = Math.abs(l.price - mark) / mark;
    if (dist <= MAGNET_NEAR && (!magnet || l.sizeUsd > magnet.sizeUsd)) {
      magnet = { price: l.price, sizeUsd: l.sizeUsd, distPct: +(dist * 100).toFixed(2), side: l.price < mark ? 'below' : 'above' };
    }
  }
  const below = d.positions.filter((p) => p.price < mark), above = d.positions.filter((p) => p.price > mark);
  const sum = (a) => Math.round(a.reduce((s, p) => s + p.sizeUsd, 0));
  return {
    coin: coin.toUpperCase(), mark, walls: w,
    nearest: w.slice().sort((a, b) => Math.abs(a.distPct) - Math.abs(b.distPct))[0] || null,
    totalLiqBelowUsd: sum(below), totalLiqAboveUsd: sum(above),
    magnet, ...honesty(feed, d)
  };
}

export async function cascade(coin, dir) {
  if (dir !== 'up' && dir !== 'down') throw new Error("dir must be 'up' or 'down'");
  const { VM } = loadShipped();
  const [feed, meta] = [await getFeed(), await getMeta()];
  const d = coinIntel(feed, coin);
  const m = meta[coin.toUpperCase()] || {};
  const vm = {
    coin: coin.toUpperCase(), markPx: m.markPx || d.mark, oiNtl: m.oiNtl, dayNtlVlm: m.dayNtlVlm,
    liqLevels: d.positions.map((p) => ({ price: p.price, sizeUsd: p.sizeUsd }))
  };
  const c = VM.computeCascade(vm, dir);
  return {
    coin: vm.coin, dir, mark: vm.markPx,
    cascade: c ? {
      triggerPx: c.triggerPx, terminalPx: c.terminalPx, totalLiqUsd: Math.round(c.totalLiqUsd),
      hops: c.hops.length, dropFrac: c.dropFrac, depthSource: c.depthSource
    } : null,
    note: c ? 'chain-reaction estimate from real tracked positions (model k=' + VM.CASCADE_K + ')' : 'no armed chain in this direction',
    ...honesty(feed, d)
  };
}

export async function pretradeCheck({ coin, dir, leverage, entryPx = null, sizeUsd = null }) {
  if (dir !== 'long' && dir !== 'short') throw new Error("dir must be 'long' or 'short'");
  if (!(leverage > 0)) throw new Error('leverage must be > 0');
  const { VM } = loadShipped();
  const [feed, meta] = [await getFeed(), await getMeta()];
  const d = coinIntel(feed, coin);
  const m = meta[coin.toUpperCase()];
  if (!m) throw new Error('coin not in HL meta: ' + coin);
  if (leverage > m.maxLeverage) throw new Error('leverage ' + leverage + ' exceeds max ' + m.maxLeverage + ' for ' + coin);
  const entry = entryPx || m.markPx;
  const mmf = VM.maintMarginFraction(m.maxLeverage);
  const liqPx = VM.liqPrice(entry, leverage, dir, mmf);
  const clusters = binWalls(d.positions, m.markPx);
  const hit = VM.huntRiskCluster(liqPx, clusters, dir);
  const clear = hit ? VM.suggestClearLeverage(entry, dir, mmf, clusters, leverage - 1, m.maxLeverage) : null;
  const casc = VM.computeCascade({
    coin: coin.toUpperCase(), markPx: m.markPx, oiNtl: m.oiNtl, dayNtlVlm: m.dayNtlVlm,
    liqLevels: d.positions.map((p) => ({ price: p.price, sizeUsd: p.sizeUsd }))
  }, dir === 'long' ? 'down' : 'up');
  const cascadeReachesLiq = Boolean(casc && VM.cascadeHitsPrice(casc, liqPx));
  const verdict = hit ? 'danger' : cascadeReachesLiq ? 'warning' : 'ok';
  return {
    coin: coin.toUpperCase(), dir, leverage, entryPx: entry, sizeUsd,
    liqPx, distToLiqPct: +((Math.abs(liqPx - entry) / entry) * 100).toFixed(2),
    liqInsideWall: Boolean(hit), wall: hit || null,
    suggestedClearLeverage: clear ? clear.lev : null,
    cascadeReachesLiq,
    cascade: casc ? { triggerPx: casc.triggerPx, terminalPx: casc.terminalPx, totalLiqUsd: Math.round(casc.totalLiqUsd) } : null,
    verdict, ...honesty(feed, d)
  };
}

export async function whaleBook(coin, topN = 10) {
  const feed = await getFeed();
  const d = coinIntel(feed, coin);
  return {
    coin: coin.toUpperCase(), mark: d.mark,
    positions: d.positions.slice().sort((a, b) => b.sizeUsd - a.sizeUsd).slice(0, Math.min(topN, 50))
      .map((p) => ({ addr: p.addr, side: p.side, notionalUsd: Math.round(p.sizeUsd), entryPx: p.entryPx, liqPx: p.price })),
    nTracked: d.positions.length, ...honesty(feed, d)
  };
}
