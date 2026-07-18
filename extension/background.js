// HypeLens background service worker
// -----------------------------------------------------------------
// Read-only client for the Hyperliquid PUBLIC info API. No keys, no
// wallet, no signing, no execution — the only network target is
// POST https://api.hyperliquid.xyz/info with public JSON bodies.
//
// Verified response shapes (fetched live 2026-07-06):
//
//   {"type":"metaAndAssetCtxs"} -> [meta, ctxs]
//     meta.universe[i] = { szDecimals, name, maxLeverage, marginTableId,
//                          isDelisted?, onlyIsolated?, marginMode? }
//     ctxs[i]          = { funding, openInterest, prevDayPx, dayNtlVlm,
//                          premium, oraclePx, markPx, midPx, impactPxs,
//                          dayBaseVlm }   (all values are strings;
//                          premium/midPx/impactPxs are null for
//                          delisted assets)
//     `funding` is the HOURLY rate -> APR = funding * 24 * 365.
//
//   {"type":"predictedFundings"} -> [ [coin, [ [venue, {fundingRate,
//     nextFundingTime, fundingIntervalHours}], ... ]], ... ]
//     venues observed: "HlPerp" (1h interval), "BinPerp", "BybitPerp" (4h).
//
// Caching: chrome.storage.session (cleared when the browser closes,
// never written to disk). The service worker holds no long-lived
// timers — content script + popup ask for data on their own cadence
// and this worker serves cache unless it is older than the configured
// poll interval.
// -----------------------------------------------------------------

const INFO_API = 'https://api.hyperliquid.xyz/info';

// Module 3: allow our content scripts (untrusted context) to read the session-
// only decrypted agent key. This is readable by OUR content scripts, NOT the
// page. NEEDED: the vault (exchange/hl-vault.js) runs in the content-script
// context and unlocks/reads the session key there — without this, unlock fails.
// Mitigations: the key is an AGENT key (trade-only, cannot withdraw), and the
// vault auto-relocks after 30 min (hl-vault session TTL). setAccessLevel returns
// a promise — .catch() it (unhandled rejection on older Chrome otherwise).
try {
  const p = chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
  if (p && p.catch) p.catch(() => {});
} catch (e) {}

const DEFAULT_SETTINGS = {
  pollIntervalSec: 30,   // markets cache TTL / content-script poll cadence
  aprThresholdPct: 40    // |funding APR| above this = "extreme" highlight
};

const PREDICTED_TTL_MS = 5 * 60 * 1000; // predicted fundings move slowly

// ---- REAL LIQUIDATION WALLS + SMART MONEY (client-side, no backend) ----
// We fan out clearinghouseState for a bundled set of ~150 profitable whale
// wallets (data/whales.json), cache the raw states ~3min, then per FOCUSED
// coin bin their liquidationPx into price walls (Σ positionValue) and net
// their signed notional into a real smart-money side. clearinghouseState is a
// public keyless read on api.hyperliquid.xyz (already in host_permissions);
// 150×weight2 = 300 vs 1200/min budget. No placeholder, no external host.
const WHALE_TTL_MS = 3 * 60 * 1000;
const WHALE_CONCURRENCY = 9;
const CRAWL_CHUNK = 25;               // wallets per message-event invocation (SW-lifetime safe)
const CRAWL_MIN_PARTIAL = 50;         // ≥N wallets crawled → prefer live-partial over bundled
const CRAWL_PASS_MAX_AGE_MS = 30 * 60 * 1000;  // a pass older than this restarts
let whaleList = null;                 // [addr,...]
let whaleSnapshot = null;             // { at, byCoin, n, done, complete }
let crawlStateMem = null;             // in-progress pass (also persisted per chunk)
let crawlBusy = false;

// ---- BACKEND FEED (v0.22.0 — PRIMARY intel source) ----
// A cron-published precomputed JSON (GitHub Pages) crawls the LIVE leaderboard
// universe (union of top-500 by account value + top-700 by weekly volume,
// ~1,100 wallets ≈ 50% of BTC OI) every 15 min — the static 300-wallet bundle
// proved structurally unable to track a book whose positions churn in days.
// Freshness rule: feed updated <20 min ago → use it (levelsSource:'feed');
// stale/unreachable → in-browser chunked crawl → bundle (amber staleness
// honesty at each degradation step).
const FEED_URL = 'https://raw.githubusercontent.com/polyparlay/hypelens/main/docs/feed/hypelens-intel.json';  // raw serves the repo file directly — no Pages needed
const FEED_FRESH_MS = 20 * 60 * 1000;   // feed considered live within this window
const FEED_FETCH_GAP_MS = 3 * 60 * 1000; // min gap between fetch attempts
const FEED_CACHE_KEY = 'feedCache';
let feedCache = null;                    // { at, data }  (also in storage.session)
let feedInflight = null;
let feedLastAttempt = 0;
async function fetchFeed() {
  if (feedInflight) return feedInflight;
  if (!feedCache) {
    try { const o = await chrome.storage.session.get([FEED_CACHE_KEY]); feedCache = (o && o[FEED_CACHE_KEY]) || null; } catch (e) {}
  }
  const fresh = feedCache && feedCache.data && Date.now() - Date.parse(feedCache.data.updated || 0) < FEED_FRESH_MS;
  if (fresh || Date.now() - feedLastAttempt < FEED_FETCH_GAP_MS) return feedCache;
  feedLastAttempt = Date.now();
  feedInflight = (async () => {
    try {
      const r = await fetch(FEED_URL, { cache: 'no-cache' });
      if (!r.ok) throw new Error('feed HTTP ' + r.status);
      const data = await r.json();
      if (data && data.coins && data.updated) {
        feedCache = { at: Date.now(), data };
        try { const p = chrome.storage.session.set({ [FEED_CACHE_KEY]: feedCache }); if (p && p.catch) p.catch(() => {}); } catch (e) {}
        // remember the wallet universe ACROSS sessions → the in-browser fallback
        // crawl targets the RIGHT wallets even before the next feed fetch.
        if (Array.isArray(data.wallets) && data.wallets.length) {
          try { const p2 = chrome.storage.local.set({ feedWallets: data.wallets }); if (p2 && p2.catch) p2.catch(() => {}); } catch (e) {}
        }
      }
    } catch (e) {}
    return feedCache;
  })().finally(() => { feedInflight = null; });
  return feedInflight;
}
function feedFresh() { return Boolean(feedCache && feedCache.data && Date.now() - Date.parse(feedCache.data.updated || 0) < FEED_FRESH_MS); }
// feed positions → the same row shape the whale snapshot uses (heat/drill/ADL).
function feedRows(coin) {
  const c = feedCache && feedCache.data && feedCache.data.coins && feedCache.data.coins[coin];
  if (!c || !Array.isArray(c.positions)) return null;
  return c.positions.map((p) => ({ szi: p[2] === 0 ? 1 : -1, liqPx: p[0], posVal: p[1], addr: p[3] || '', pnl: 0, entryPx: p[4], acctVal: p[5] }));
}
// best per-coin rows for ADL / drill-down: fresh feed first, then the crawl.
function bestRows(coin) {
  if (feedFresh()) { const r = feedRows(coin); if (r && r.length) return r; }
  return (whaleSnapshot && whaleSnapshot.byCoin[coin]) || null;
}

// Bundled REAL liquidation levels (top-wallets snapshot, generated offline) =
// the instant-load profile shown before the live whale crawl covers the coin.
// Shape: { updated, coins: { COIN: { mark, levels: [[liqPx, notional, side]] } } }.
let realLiqBundle = null;
let realLiqUpdated = null;            // ISO date the bundle was generated (staleness honesty)
async function loadRealLiq() {
  if (realLiqBundle) return realLiqBundle;
  try {
    const r = await fetch(chrome.runtime.getURL('data/real_liq.json'));
    const j = await r.json();
    realLiqBundle = (j && j.coins) ? j.coins : {};
    realLiqUpdated = (j && j.updated) || null;
  } catch { realLiqBundle = {}; }
  return realLiqBundle;
}
function bundledLevels(coin) {
  const b = realLiqBundle && realLiqBundle[coin];
  if (!b || !Array.isArray(b.levels)) return [];
  return b.levels
    .map((L) => ({ price: num(L[0]), sizeUsd: Math.round(num(L[1]) || 0), side: L[2] === 'long' ? 'long' : 'short' }))
    .filter((x) => x.price != null && x.price > 0 && x.sizeUsd > 0);
}
// Full REAL-positions snapshot fallback (never "loading"): walls + smart-money
// net + levels, all derived from the bundled top-wallet positions. Used until
// the live whale crawl produces a fresher snapshot for this coin.
function bundleIntel(coin, mark) {
  const levels = bundledLevels(coin);
  let longUsd = 0, shortUsd = 0;
  const bins = new Map(), binW = mark ? mark * 0.004 : 1;
  for (const l of levels) {
    if (l.side === 'long') longUsd += l.sizeUsd; else shortUsd += l.sizeUsd;
    if (mark && Math.abs(l.price - mark) / mark <= 0.50) {
      const k = Math.round(l.price / binW), b = bins.get(k) || { sum: 0 };
      b.sum += l.sizeUsd; b.price = k * binW; b.side = l.price >= mark ? 'short' : 'long'; bins.set(k, b);
    }
  }
  const total = longUsd + shortUsd, pctShort = total > 0 ? Math.round((shortUsd / total) * 100) : 50;
  const walls = [...bins.values()].map((b) => ({ price: b.price, sizeUsd: Math.round(b.sum), side: b.side }))
    .sort((a, b) => b.sizeUsd - a.sizeUsd).slice(0, 12);
  const smartMoney = { pctShort, netUsd: Math.round(longUsd - shortUsd), nWallets: levels.length,
    side: pctShort >= 55 ? 'short' : pctShort <= 45 ? 'long' : 'mixed', source: 'sample' };
  return { walls, smartMoney, levels };
}

// Fallback name list for hyperps (assets with an EMA/mark-based oracle
// instead of an external spot oracle). The primary signal is the meta
// flags (onlyIsolated / strictIsolated on a non-delisted asset); this
// list only catches ones the flags miss. Update as HL lists new hyperps.
const HYPERP_NAME_FALLBACK = new Set([]);

// -------- settings --------

async function getSettings() {
  const { settings } = await chrome.storage.local.get(['settings']);
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

async function setSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur };
  if (patch && patch.pollIntervalSec != null) {
    next.pollIntervalSec = clamp(Number(patch.pollIntervalSec), 10, 300);
  }
  if (patch && patch.aprThresholdPct != null) {
    next.aprThresholdPct = clamp(Number(patch.aprThresholdPct), 1, 1000);
  }
  await chrome.storage.local.set({ settings: next });
  return next;
}

function clamp(n, lo, hi) {
  if (isNaN(n) || !isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

// -------- HL info API --------

async function postInfo(body) {
  const r = await fetch(INFO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`HL info ${body.type}: HTTP ${r.status}`);
  return r.json();
}

function num(v) {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) || !isFinite(n) ? null : n;
}

function isHyperp(u) {
  if (u.isDelisted) return false;
  if (u.onlyIsolated === true || u.marginMode === 'strictIsolated') return true;
  return HYPERP_NAME_FALLBACK.has(u.name);
}

// Flatten [meta, ctxs] into one row per LIVE perp.
function normalizeMarkets(payload) {
  if (!Array.isArray(payload) || payload.length < 2) return [];
  const universe = (payload[0] && payload[0].universe) || [];
  const ctxs = payload[1] || [];
  const rows = [];
  for (let i = 0; i < universe.length; i++) {
    const u = universe[i];
    const c = ctxs[i];
    if (!u || !c || u.isDelisted) continue;
    const fundingHr = num(c.funding);
    const markPx = num(c.markPx);
    const oraclePx = num(c.oraclePx);
    const oiBase = num(c.openInterest);
    const premium = num(c.premium);
    rows.push({
      coin: u.name,
      maxLeverage: u.maxLeverage,
      isHyperp: isHyperp(u),
      fundingHr,                                                  // hourly rate, e.g. 0.0000125
      aprPct: fundingHr == null ? null : fundingHr * 24 * 365 * 100, // signed annualized %
      markPx,
      oraclePx,
      midPx: num(c.midPx),
      premiumPct: premium == null ? null : premium * 100,         // mark-vs-oracle premium %
      oiNtl: oiBase != null && markPx != null ? oiBase * markPx : null, // OI in USD notional
      dayNtlVlm: num(c.dayNtlVlm),                                // 24h notional volume USD
      prevDayPx: num(c.prevDayPx)
    });
  }
  return rows;
}

// predictedFundings -> { COIN: [{venue, rateHrEquiv, aprPct, nextFundingTime, intervalHours}] }
function normalizePredicted(payload) {
  const byCoin = {};
  if (!Array.isArray(payload)) return byCoin;
  for (const entry of payload) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [coin, venues] = entry;
    if (!Array.isArray(venues)) continue;
    const list = [];
    for (const v of venues) {
      if (!Array.isArray(v) || v.length < 2 || !v[1]) continue;
      const [venue, d] = v;
      const rate = num(d.fundingRate);
      const hours = Number(d.fundingIntervalHours) || 1;
      if (rate == null) continue;
      list.push({
        venue,
        rate,                                       // rate per funding interval
        intervalHours: hours,
        aprPct: (rate / hours) * 24 * 365 * 100,    // normalized across intervals
        nextFundingTime: d.nextFundingTime || null
      });
    }
    if (list.length) byCoin[coin] = list;
  }
  return byCoin;
}

// -------- cached fetchers (in-flight dedupe so N tabs = 1 request) --------

let inflightMarkets = null;
let inflightPredicted = null;

async function getMarkets(force) {
  const settings = await getSettings();
  const ttlMs = settings.pollIntervalSec * 1000;
  const { marketsCache } = await chrome.storage.session.get(['marketsCache']);
  if (!force && marketsCache && Date.now() - marketsCache.fetchedAt < ttlMs) {
    return { ok: true, fromCache: true, ...marketsCache, settings };
  }
  if (!inflightMarkets) {
    inflightMarkets = (async () => {
      const raw = await postInfo({ type: 'metaAndAssetCtxs' });
      const cache = { fetchedAt: Date.now(), rows: normalizeMarkets(raw) };
      await chrome.storage.session.set({ marketsCache: cache });
      return cache;
    })().finally(() => { inflightMarkets = null; });
  }
  try {
    const cache = await inflightMarkets;
    return { ok: true, fromCache: false, ...cache, settings };
  } catch (err) {
    // Network hiccup: serve stale cache if we have one.
    if (marketsCache) {
      return { ok: true, fromCache: true, stale: true, ...marketsCache, settings };
    }
    return { ok: false, error: String(err && err.message ? err.message : err), settings };
  }
}

async function getPredicted() {
  const { predictedCache } = await chrome.storage.session.get(['predictedCache']);
  if (predictedCache && Date.now() - predictedCache.fetchedAt < PREDICTED_TTL_MS) {
    return { ok: true, ...predictedCache };
  }
  if (!inflightPredicted) {
    inflightPredicted = (async () => {
      const raw = await postInfo({ type: 'predictedFundings' });
      const cache = { fetchedAt: Date.now(), byCoin: normalizePredicted(raw) };
      await chrome.storage.session.set({ predictedCache: cache });
      return cache;
    })().finally(() => { inflightPredicted = null; });
  }
  try {
    return { ok: true, ...(await inflightPredicted) };
  } catch (err) {
    if (predictedCache) return { ok: true, stale: true, ...predictedCache };
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

// -------- REAL liq walls + smart money from the whale set --------

async function loadWhales() {
  if (whaleList) return whaleList;
  const valid = (a) => /^0x[a-f0-9]{40}$/.test(a);
  // PREFER the feed's CURRENT wallet universe (v0.22.0) — the fallback crawl
  // then targets the wallets that actually hold today's positions. The bundled
  // whales.json is only used when no feed has ever been seen on this profile.
  try {
    const fw = (feedCache && feedCache.data && feedCache.data.wallets) ||
      ((await chrome.storage.local.get(['feedWallets'])) || {}).feedWallets;
    if (Array.isArray(fw) && fw.length >= 50) {
      whaleList = fw.map((a) => ({ a: String(a).toLowerCase(), pnl: 0 })).filter((w) => valid(w.a));
      if (whaleList.length >= 50) return whaleList;
    }
  } catch (e) {}
  try {
    const r = await fetch(chrome.runtime.getURL('data/whales.json'));
    const j = await r.json();
    whaleList = (j.whales || [])
      .map((w) => ({ a: String(w.a).toLowerCase(), pnl: Number(w.pnl) || 0 }))
      .filter((w) => valid(w.a));
  } catch { whaleList = []; }
  return whaleList;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() { while (i < items.length) { const idx = i++; try { out[idx] = await fn(items[idx]); } catch { out[idx] = null; } } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
// Resolve null instead of hanging forever if a single request stalls.
// The loser's timer is cleared either way (no timer leak per whale request).
function withTimeout(p, ms) {
  let t;
  return Promise.race([p, new Promise((res) => { t = setTimeout(() => res(null), ms); })])
    .finally(() => clearTimeout(t));
}

// SW-restart safety: the whale snapshot lives in a module global that dies with
// the service worker (~30s idle) — persist it to chrome.storage.session on
// publish and rehydrate on demand, so intel doesn't drop to "bundled" after
// every SW restart while a fresh crawl re-runs.
const WHALE_SNAP_KEY = 'whaleSnapCache';
function persistWhaleSnapshot() {
  try { const p = chrome.storage.session.set({ [WHALE_SNAP_KEY]: whaleSnapshot }); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
async function rehydrateWhaleSnapshot() {
  if (whaleSnapshot) return whaleSnapshot;
  try {
    const o = await chrome.storage.session.get([WHALE_SNAP_KEY]);
    const s = o && o[WHALE_SNAP_KEY];
    // accept a persisted snapshot for a longer window (a fresh pass replaces it
    // incrementally); still bounded so a browser-session-old crawl can't linger.
    if (s && s.byCoin && Date.now() - s.at < WHALE_TTL_MS * 10) whaleSnapshot = s;
  } catch (e) {}
  return whaleSnapshot;
}

// ---- INCREMENTAL RESUMABLE CRAWL (v0.21.1 root-cause fix) ----
// The old refreshWhales() ran mapLimit over ALL 300 wallets in one async task:
// MV3 kills the idle SW ~30s after the triggering message resolves, so the
// crawl DIED partway, every TTL expiry RESTARTED it from wallet #0, and most
// coins never reached the 12-live-level bar → bundled fossil served as "real".
// Now: each incoming message advances ONE ~25-wallet chunk (seconds, safely
// inside the SW lifetime), persisting the cursor + accumulated per-wallet rows
// to chrome.storage.session after EVERY chunk — a full pass completes across
// many SW wakeups. Snapshot published progressively (≥50 wallets → live-partial
// preferred over bundled); `complete:true` only after the full pass.
const CRAWL_STATE_KEY = 'whaleCrawlState';
function persistCrawlState(st) {
  try { const p = st ? chrome.storage.session.set({ [CRAWL_STATE_KEY]: st }) : chrome.storage.session.remove([CRAWL_STATE_KEY]); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
async function loadCrawlState() {
  if (crawlStateMem) return crawlStateMem;
  try { const o = await chrome.storage.session.get([CRAWL_STATE_KEY]); crawlStateMem = (o && o[CRAWL_STATE_KEY]) || null; } catch (e) {}
  return crawlStateMem;
}
async function advanceWhaleCrawl() {
  if (crawlBusy) return; crawlBusy = true;
  try {
    await rehydrateWhaleSnapshot();
    // a COMPLETE snapshot fresher than the TTL → nothing to do this tick
    if (whaleSnapshot && whaleSnapshot.complete && Date.now() - whaleSnapshot.at < WHALE_TTL_MS) return;
    const list = await loadWhales(); if (!list.length) return;
    let st = await loadCrawlState();
    if (!st || st.listLen !== list.length || st.cursor >= list.length ||
        Date.now() - (st.startedAt || 0) > CRAWL_PASS_MAX_AGE_MS) {
      st = { cursor: 0, listLen: list.length, byCoin: {}, startedAt: Date.now() };   // new pass
    }
    const chunk = list.slice(st.cursor, st.cursor + CRAWL_CHUNK);
    await mapLimit(chunk, WHALE_CONCURRENCY, async (w) => {
      const cs = await withTimeout(postInfo({ type: 'clearinghouseState', user: w.a }), 6000);
      if (cs && cs.assetPositions) {
        // account value feeds the ADL index denominator (notional/account_value)
        const acctVal = cs.marginSummary ? num(cs.marginSummary.accountValue) : null;
        for (const ap of cs.assetPositions) {
          const p = ap.position || {}; const szi = num(p.szi), posVal = num(p.positionValue);
          if (!p.coin || szi == null || szi === 0 || posVal == null) continue;
          (st.byCoin[p.coin] || (st.byCoin[p.coin] = [])).push({ szi, liqPx: num(p.liquidationPx), posVal, addr: w.a, pnl: w.pnl,
            entryPx: num(p.entryPx), acctVal });   // + ADL-index inputs (entry, account value)
        }
      }
    });
    st.cursor += chunk.length;
    const complete = st.cursor >= list.length;
    // progressive publish: partial data beats a 12-day-old bundle once ≥50 wallets
    if (complete || st.cursor >= CRAWL_MIN_PARTIAL) {
      whaleSnapshot = { at: Date.now(), byCoin: st.byCoin, n: list.length, done: st.cursor, complete };
      persistWhaleSnapshot();
    }
    if (complete) { crawlStateMem = null; persistCrawlState(null); }
    else { crawlStateMem = st; persistCrawlState(st); }
  } catch (e) {} finally { crawlBusy = false; }
}
function shortAddr(a) { return a && a.length > 12 ? a.slice(0, 6) + '…' + a.slice(-4) : a; }

// Per-coin REAL intel. Buckets liquidationPx into price walls (Σ posVal) and
// nets signed notional into a smart-money side. `mark` classifies wall side.
// rowsOverride (v0.22.0): compute from FEED rows instead of the crawl snapshot.
function computeCoinIntel(coin, mark, rowsOverride) {
  const snap = whaleSnapshot;
  if (!rowsOverride && !snap) return null;
  const rows = rowsOverride || snap.byCoin[coin] || [];
  // smart money — net signed notional across profitable whales
  let longUsd = 0, shortUsd = 0, nWallets = 0;
  for (const r of rows) { nWallets++; if (r.szi > 0) longUsd += r.posVal; else shortUsd += r.posVal; }
  const totalUsd = longUsd + shortUsd;
  const pctShort = totalUsd > 0 ? Math.round((shortUsd / totalUsd) * 100) : 50;
  const smartMoney = { pctShort, netUsd: Math.round(longUsd - shortUsd), nWallets, side: pctShort >= 55 ? 'short' : pctShort <= 45 ? 'long' : 'mixed' };
  // walls — bin liquidationPx (within ±50% of mark) to a fine 0.4%-of-mark grid
  const walls = [];
  if (mark) {
    const binW = mark * 0.004, bins = new Map();
    for (const r of rows) {
      if (r.liqPx == null || r.liqPx <= 0) continue;
      if (Math.abs(r.liqPx - mark) / mark > 0.50) continue;
      const k = Math.round(r.liqPx / binW);
      const b = bins.get(k) || { sum: 0, n: 0 }; b.sum += r.posVal; b.n++; bins.set(k, b);
    }
    for (const [k, b] of bins) { const price = k * binW; walls.push({ price, sizeUsd: Math.round(b.sum), side: price >= mark ? 'short' : 'long' }); }
    walls.sort((a, b2) => b2.sizeUsd - a.sizeUsd);
  }
  // RAW positions (within ±50% of mark) for the client-side heat-density field
  // + hover tooltip: each carries the whale address + all-time PnL.
  const positions = [];
  if (mark) {
    for (const r of rows) {
      if (r.liqPx == null || r.liqPx <= 0 || r.posVal <= 0) continue;
      if (Math.abs(r.liqPx - mark) / mark > 0.50) continue;
      positions.push({ price: r.liqPx, sizeUsd: Math.round(r.posVal), side: r.liqPx >= mark ? 'short' : 'long', addr: shortAddr(r.addr), pnl: r.pnl });
    }
    positions.sort((a, b2) => b2.sizeUsd - a.sizeUsd);
  }
  return { coin, walls: walls.slice(0, 12), positions: positions.slice(0, 500), smartMoney,
    nWhales: rowsOverride ? rows.length : snap.n, at: rowsOverride ? Date.now() : snap.at };
}

async function getCoinIntel(coin, mark) {
  if (!coin) return { ok: true, loading: true };
  await loadRealLiq();                              // bundled instant-load data
  // ---- PRIMARY (v0.22.0): the backend feed — fresh (<20 min) → use it ----
  await fetchFeed();
  if (feedFresh()) {
    const rows = feedRows(coin);
    if (rows && rows.length >= 2) {
      const fc = feedCache.data.coins[coin];
      const intel = computeCoinIntel(coin, mark || fc.mark, rows);
      const levels = (intel.positions || []).map((p) => ({ price: p.price, sizeUsd: p.sizeUsd, side: p.side }));
      const pct = fc.coverage ? fc.coverage.pct : null;
      const agoMin = Math.max(0, Math.round((Date.now() - Date.parse(feedCache.data.updated)) / 60000));
      return { ok: true, loading: false, ...intel, levels, levelsSource: 'feed',
        coveragePct: pct, feedUpdated: feedCache.data.updated,
        crawl: { done: (feedCache.data.wallets || []).length, total: (feedCache.data.wallets || []).length, complete: true },
        coverage: { note: 'live feed · ' + (pct != null ? pct + '% of ' + coin + ' OI' : rows.length + ' tracked positions') + ' · updated ' + agoMin + 'm ago' } };
    }
  }
  // ---- FALLBACK: in-browser chunked crawl (0.21.1 machinery) → bundle ----
  await rehydrateWhaleSnapshot();                   // SW may have restarted — reuse persisted crawl
  advanceWhaleCrawl().catch(() => {});              // every message advances one chunk
  const live = computeCoinIntel(coin, mark);         // null until first (partial) snapshot
  const liveLevels = live ? (live.positions || []).map((p) => ({ price: p.price, sizeUsd: p.sizeUsd, side: p.side })) : [];
  const snapDone = whaleSnapshot ? (whaleSnapshot.done || 0) : 0;
  const snapTotal = whaleSnapshot ? (whaleSnapshot.n || 0) : ((whaleList && whaleList.length) || 0);
  const snapComplete = Boolean(whaleSnapshot && whaleSnapshot.complete);
  if (live && liveLevels.length >= 12) {             // enough live sample → use it
    // HONESTY: 'live' ONLY when the crawl pass is COMPLETE; while a pass is in
    // progress the data is labeled live-partial with its wallet coverage.
    const src = snapComplete ? 'live' : 'live-partial';
    return { ok: true, loading: false, ...live, levels: liveLevels, levelsSource: src,
      crawl: { done: snapDone, total: snapTotal, complete: snapComplete },
      coverage: { note: snapComplete ? 'real positions · top ' + (live.nWhales || snapTotal) + ' wallets (live)' : 'live · ' + snapDone + ' of ' + snapTotal + ' wallets' } };
  }
  // Fall back to the bundled REAL snapshot — ALWAYS resolves, NEVER stuck on
  // "loading". STALENESS HONESTY (v0.21.1): the bundle is an offline snapshot,
  // NOT live data — label it with its generation date so the UI can badge it
  // amber/stale instead of claiming "real positions".
  const nWhales = snapTotal || 0;
  const bun = bundleIntel(coin, mark);
  const ageMs = realLiqUpdated ? Date.now() - Date.parse(realLiqUpdated) : null;
  const stale = ageMs == null ? true : ageMs > 24 * 3600 * 1000;
  return { ok: true, loading: false, coin, walls: bun.walls, smartMoney: bun.smartMoney,
    positions: bun.levels.slice(0, 500).map((l) => ({ price: l.price, sizeUsd: l.sizeUsd, side: l.side, addr: '', pnl: 0 })),
    levels: bun.levels, levelsSource: 'bundled', bundleUpdated: realLiqUpdated, bundleStale: stale, nWhales,
    crawl: { done: snapDone, total: snapTotal, complete: snapComplete },
    coverage: { note: 'snapshot ' + (realLiqUpdated ? realLiqUpdated.slice(0, 10) : 'undated') + (stale ? ' · STALE' : '') + ' — live crawl in progress' } };
}

// -------- ADL EXPOSURE (estimated · profit×leverage rank) --------
// RESEARCH (2026-07): HL shows ADL risk-tier indicators in ITS web UI, but NO
// public info-endpoint field exposes an ADL tier / queue rank (checked
// clearinghouseState, webData2, docs). We therefore compute the DOCUMENTED
// proxy — HL docs give the exact ADL priority: counterparties in profit are
// ranked by  (mark_price / entry_price) * (notional_position / account_value)
// i.e. profit-ratio × effective leverage; highest is deleveraged FIRST.
// We rank the user's position against the crawled whale positions on the SAME
// coin+side (real data), and label it clearly as an ESTIMATE.
function adlIndexCalc(isLong, markPx, entryPx, notional, accountValue) {
  if (!markPx || !entryPx || !notional || !accountValue || accountValue <= 0) return null;
  const profitRatio = isLong ? markPx / entryPx : entryPx / markPx;   // >1 = in profit
  return { index: profitRatio * (notional / accountValue), profitRatio };
}
async function getAdlRank(q) {
  await fetchFeed();                 // feed rows carry entryPx/acctVal too
  await rehydrateWhaleSnapshot();
  const coin = q && q.coin, side = q && q.side, mark = num(q && q.mark);
  const user = adlIndexCalc(side !== 'short', mark, num(q && q.entryPx), num(q && q.notional), num(q && q.accountValue));
  if (!coin || !mark || !user) return { ok: false, error: 'bad adl query' };
  // ADL force-closes PROFITABLE positions on the winning side — a losing
  // position is effectively not in the queue.
  if (user.profitRatio <= 1) return { ok: true, source: 'proxy', eligible: false, tier: 'none', n: 0 };
  const rows = bestRows(coin);
  if (!rows) { advanceWhaleCrawl().catch(() => {}); return { ok: true, source: 'proxy', loading: true }; }
  const wantLong = side !== 'short';
  const idxs = [];
  for (const r of rows) {
    if ((r.szi > 0) !== wantLong) continue;
    const a = adlIndexCalc(wantLong, mark, r.entryPx, r.posVal, r.acctVal);
    if (a && a.profitRatio > 1) idxs.push(a.index);   // only in-profit peers queue
  }
  if (idxs.length < 5) return { ok: true, source: 'proxy', loading: idxs.length === 0, eligible: true, tier: 'unknown', n: idxs.length, index: user.index };
  const above = idxs.filter((x) => x >= user.index).length;         // whales AHEAD of the user
  const topPct = Math.max(1, Math.round(((above + 1) / (idxs.length + 1)) * 100));
  const tier = topPct <= 15 ? 'high' : topPct <= 40 ? 'elevated' : 'low';
  return { ok: true, source: 'proxy', eligible: true, topPct, n: idxs.length, index: user.index, tier };
}

// -------- NAMED-WHALE LIQ DRILL-DOWN --------
// Which wallets compose a heatmap cluster? Pure read of the existing whale
// snapshot (no new API calls, no new permissions). band = ±bandFrac around the
// clicked price (default ±0.6%, matches a rendered band's visual width).
async function getClusterWallets(q) {
  await rehydrateWhaleSnapshot();
  const coin = q && q.coin, price = num(q && q.price), mark = num(q && q.mark);
  if (!coin || !price) return { ok: false, error: 'bad cluster query' };
  await fetchFeed();
  const rows = bestRows(coin);
  if (!rows || !rows.length) { advanceWhaleCrawl().catch(() => {}); return { ok: true, loading: true, wallets: [], count: 0, totalUsd: 0 }; }
  const bandFrac = num(q && q.bandFrac) || 0.006;
  const lo = price * (1 - bandFrac), hi = price * (1 + bandFrac);
  const hits = [];
  let totalUsd = 0;
  for (const r of rows) {
    if (r.liqPx == null || r.liqPx < lo || r.liqPx > hi || !(r.posVal > 0)) continue;
    totalUsd += r.posVal;
    hits.push({ addr: r.addr, short: shortAddr(r.addr), side: r.szi > 0 ? 'long' : 'short',
      posVal: Math.round(r.posVal), liqPx: r.liqPx,
      distPct: mark ? ((r.liqPx - mark) / mark) * 100 : null });
  }
  hits.sort((a, b) => b.posVal - a.posVal);
  return { ok: true, loading: false, price, band: { lo, hi }, count: hits.length,
    totalUsd: Math.round(totalUsd), wallets: hits.slice(0, 6) };
}

// -------- GUARDIAN: the user's own open positions (read-only, public API) --------
// The content script detects the CONNECTED address from HL's page DOM/storage
// (never via wallet permissions) and asks for its clearinghouseState here.
// Public per-address read (weight 2), cached ~15s while the UI polls.
const USER_STATE_TTL_MS = 15 * 1000;
const userStateCache = new Map();   // addr -> { at, positions, account }
function summary(s) {
  if (!s) return null;
  return { accountValue: num(s.accountValue), totalNtlPos: num(s.totalNtlPos), totalRawUsd: num(s.totalRawUsd), totalMarginUsed: num(s.totalMarginUsed) };
}
async function getUserState(address) {
  const addr = String(address || '').toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(addr)) return { ok: false, error: 'bad address' };
  const c = userStateCache.get(addr);
  if (c && Date.now() - c.at < USER_STATE_TTL_MS) return { ok: true, fromCache: true, positions: c.positions, account: c.account };
  try {
    const st = await postInfo({ type: 'clearinghouseState', user: addr });
    const positions = [];
    if (st && Array.isArray(st.assetPositions)) {
      for (const ap of st.assetPositions) {
        const p = ap.position || {};
        const szi = num(p.szi); if (!p.coin || szi == null || szi === 0) continue;
        const positionValue = num(p.positionValue);
        // markPx isn't in the position object — derive it: positionValue = |szi|·markPx
        const markPx = (positionValue != null && Math.abs(szi) > 0) ? positionValue / Math.abs(szi) : null;
        positions.push({
          coin: p.coin, szi, side: szi > 0 ? 'long' : 'short',
          entryPx: num(p.entryPx), liquidationPx: num(p.liquidationPx),
          positionValue, unrealizedPnl: num(p.unrealizedPnl), markPx,
          leverage: p.leverage && p.leverage.value != null ? Number(p.leverage.value) : null,
          levType: p.leverage && p.leverage.type ? p.leverage.type : null,   // 'isolated' | 'cross'
          marginUsed: num(p.marginUsed)
        });
      }
    }
    const account = {
      marginSummary: summary(st && st.marginSummary),
      crossMarginSummary: summary(st && st.crossMarginSummary),
      crossMaintenanceMarginUsed: num(st && st.crossMaintenanceMarginUsed)
    };
    userStateCache.set(addr, { at: Date.now(), positions, account });
    return { ok: true, positions, account };
  } catch (err) {
    if (c) return { ok: true, stale: true, positions: c.positions, account: c.account };
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

// -------- candlesticks (for our own mini-chart) --------
// {"type":"candleSnapshot","req":{coin,interval,startTime,endTime}} ->
// [{t,T,s,i,o,h,l,c,v,n}] (OHLCV as strings). CORS-open, keyless.
const CANDLE_TTL_MS = 60 * 1000;
const CANDLE_MS = { '15m': 9e5, '1h': 36e5, '4h': 144e5, '1d': 864e5 };
const candleCache = new Map();
async function getCandles(coin, interval, bars) {
  interval = CANDLE_MS[interval] ? interval : '1d';   // default DAILY
  bars = Math.max(20, Math.min(Number(bars) || 90, 500));
  const key = coin + '|' + interval + '|' + bars;
  const c = candleCache.get(key);
  if (c && Date.now() - c.at < CANDLE_TTL_MS) return { ok: true, ...c.data };
  try {
    const now = Date.now();
    const raw = await postInfo({ type: 'candleSnapshot', req: { coin, interval, startTime: now - bars * CANDLE_MS[interval], endTime: now } });
    const candles = (Array.isArray(raw) ? raw : []).map((k) => ({ t: +k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v }))
      .filter((k) => isFinite(k.o) && isFinite(k.c) && isFinite(k.h) && isFinite(k.l));
    const data = { coin, interval, candles };
    candleCache.set(key, { at: Date.now(), data });
    return { ok: true, ...data };
  } catch (err) { return { ok: false, error: String(err && err.message ? err.message : err), candles: [] }; }
}

// -------- Module 3: EXCHANGE / INFO passthrough (testnet + mainnet) --------
// The extension signs in the UI context (agent key via the vendored SDK, or the
// master wallet via the MAIN-world bridge); the SIGNED payload is POSTed here so
// the request goes out from the background (which holds the host permission).
// We never sign here and never touch a private key.
const HL_NET = {
  testnet: { exchange: 'https://api.hyperliquid-testnet.xyz/exchange', info: 'https://api.hyperliquid-testnet.xyz/info' },
  mainnet: { exchange: 'https://api.hyperliquid.xyz/exchange', info: 'https://api.hyperliquid.xyz/info' }
};
// HARD BLOCK (mirrors exchange/hl-actions.js MAINNET_PLACEMENT_ENABLED): the
// background refuses to POST any mainnet /exchange order until this is flipped
// after testnet proof + operator sign-off. Testnet + read-only /info are allowed.
const HL_MAINNET_PLACEMENT_ENABLED = false;
async function hlPost(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text(); let data; try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  if (!r.ok) return { ok: false, error: 'HTTP ' + r.status + (data && data.raw ? ': ' + String(data.raw).slice(0, 200) : ''), data };
  return { ok: true, data };
}
async function hlExchange(net, payload) {
  if (net === 'mainnet' && !HL_MAINNET_PLACEMENT_ENABLED) return { ok: false, error: 'mainnet placement is disabled in this build (testnet only)' };
  const N = HL_NET[net === 'mainnet' ? 'mainnet' : 'testnet'];
  if (!payload || !payload.action || payload.signature == null || payload.nonce == null) return { ok: false, error: 'malformed exchange payload' };
  return hlPost(N.exchange, payload);
}
async function hlInfo(net, body) {
  const N = HL_NET[net === 'mainnet' ? 'mainnet' : 'testnet'];
  const res = await hlPost(N.info, body || { type: 'meta' });
  if (res.ok && res.data && res.data.universe) return { ok: true, data: res.data };
  return res;
}

// -------- message router --------
// Every response carries `v` = this build's manifest version, so a content
// script can detect it's ORPHANED old code after an extension reload (it
// compares v against its own captured VERSION and shows a reload banner).
const BG_VERSION = (function () { try { return chrome.runtime.getManifest().version; } catch (e) { return ''; } })();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponseRaw) => {
  const sendResponse = (r) => sendResponseRaw((r && typeof r === 'object' && !Array.isArray(r)) ? Object.assign({ v: BG_VERSION }, r) : r);
  (async () => {
    try {
      switch (msg && msg.type) {
        case 'getMarkets':
          sendResponse(await getMarkets(Boolean(msg.force)));
          break;
        case 'getPredicted':
          sendResponse(await getPredicted());
          break;
        case 'getCoinIntel':
          sendResponse(await getCoinIntel(msg.coin, msg.mark));
          break;
        case 'getCandles':
          sendResponse(await getCandles(msg.coin, msg.interval, msg.bars));
          break;
        case 'getUserState':
          sendResponse(await getUserState(msg.address));
          break;
        case 'getAdlRank':
          sendResponse(await getAdlRank(msg));
          break;
        case 'getClusterWallets':
          sendResponse(await getClusterWallets(msg));
          break;
        case 'getSettings':
          sendResponse({ ok: true, settings: await getSettings() });
          break;
        case 'setSettings':
          sendResponse({ ok: true, settings: await setSettings(msg.settings) });
          break;
        case 'hlExchange':
          sendResponse(await hlExchange(msg.net, msg.payload));
          break;
        case 'hlInfo':
          sendResponse(await hlInfo(msg.net, msg.body));
          break;
        default:
          sendResponse({ ok: false, error: 'Unknown message type' });
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  })();
  return true; // async response
});
