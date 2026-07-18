// HypeLens view-model — the DATA-SHAPE CONTRACT + shared math the whole UI
// consumes. Loaded into BOTH the content-script world and the popup (as a
// plain <script> before their own JS), exposing `window.HLVM`.
// ---------------------------------------------------------------------
// Hero = LIQUIDATION INTELLIGENCE + SMART-MONEY POSITIONING + the
// LIQ-AWARE LEVERAGE tool (keep your liq price clear of the walls big
// books target). Funding is a one-line footnote.
//
// smartMoney + liqClusters come from a backend-precomputed JSON (see
// worker/aggregate-intel.mjs) fetched by background.js. When that JSON is
// unavailable the UI falls back to clearly-labelled PLACEHOLDER data.
// Funding is always live from the HL info row.
//
// ┌── CONTRACT (HLVM.buildViewModel -> this shape) ────────────────────┐
// │ {                                                                  │
// │   coin, markPx, maxLeverage, mmf,     // mmf = maint margin frac   │
// │   smartMoney:{ side, pctShort, netUsd, nWallets, nProfitable,      │
// │                recentEntries:[{addr,side,sizeUsd,liqPx,roi,        │
// │                                pnlLabel,agoMin}], source },        │
// │   liq:{ clusters:[{price,sizeUsd,side,distPct}], nearest,          │
// │         totalBelowUsd, totalAboveUsd, source },                    │
// │   funding:{ apr, perDayPer1k, fundingHr, side, premiumPct, source},│
// │   isHyperp, placeholder                                            │
// │ }                                                                  │
// │ Backend JSON per coin: { markPx, smartMoney:{side,pctShort,netUsd, │
// │   nWallets,nProfitable,topEntries:[...]}, liqClusters:[{price,     │
// │   sizeUsd,side}] } — see worker/aggregate-intel.mjs.               │
// └────────────────────────────────────────────────────────────────────┘

(function (g) {
  'use strict';

  // ---- formatting ----
  function moneyPerDayPer1k(fundingHr) { return fundingHr == null ? null : fundingHr * 24 * 1000; }
  function fmtMoney(n) {
    if (n == null || isNaN(n)) return '—';
    const v = Math.abs(n);
    if (v >= 100) return '$' + v.toFixed(0);
    if (v >= 10) return '$' + v.toFixed(1);
    return '$' + v.toFixed(2);
  }
  function fmtUsd(n) {
    if (n == null || isNaN(n)) return '—';
    const abs = Math.abs(n), s = n < 0 ? '-' : '';
    if (abs >= 1e9) return s + '$' + (abs / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return s + '$' + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return s + '$' + (abs / 1e3).toFixed(1) + 'K';
    return s + '$' + abs.toFixed(0);
  }
  function fmtApr(n) { return n == null || isNaN(n) ? '—' : (n > 0 ? '+' : '') + Number(n).toFixed(1) + '%'; }
  function fmtPrice(p) {
    if (p == null || isNaN(p)) return '—';
    const v = Math.abs(p);
    if (v >= 1000) return '$' + p.toFixed(0);
    if (v >= 1) return '$' + p.toFixed(2);
    return '$' + p.toFixed(4);
  }
  function fmtPrem(n) { return n == null ? '—' : (n > 0 ? '+' : '') + n.toFixed(3) + '%'; }
  function signClass(n) { return n == null ? '' : n > 0 ? 'pos' : n < 0 ? 'neg' : ''; }
  function shortAddr(a) { if (!a) return '0x…'; return a.length > 12 ? a.slice(0, 6) + '…' + a.slice(-4) : a; }
  function agoLabel(min) {
    if (min == null) return '';
    if (min < 60) return Math.round(min) + 'm ago';
    const h = min / 60;
    if (h < 24) return h.toFixed(h < 10 ? 1 : 0) + 'h ago';
    return Math.round(h / 24) + 'd ago';
  }

  // ========================================================================
  // LIQ-AWARE LEVERAGE math (the killer feature). Pure functions, shared.
  // ========================================================================
  // Maintenance-margin fraction. HL doesn't cheaply expose the tiered mmf,
  // so we approximate mmf ≈ 1/(2·maxLeverage) (a standard first-pass; refine
  // when meta exposes the margin table). Used only to place the liq marker,
  // never to execute anything.
  function maintMarginFraction(maxLeverage) {
    return maxLeverage && maxLeverage > 0 ? 1 / (2 * maxLeverage) : 0.05;
  }
  // Liquidation price at entry E, leverage L, direction, maint-margin mmf.
  //   long  ≈ E·(1 − 1/L + mmf)   short ≈ E·(1 + 1/L − mmf)
  // (operator-specified approximation; mark used as entry proxy.)
  function liqPrice(entry, leverage, dir, mmf) {
    if (!entry || !leverage) return null;
    return dir === 'short'
      ? entry * (1 + 1 / leverage - mmf)
      : entry * (1 - 1 / leverage + mmf);
  }
  // A long's liq sits BELOW mark → it can be hunted into LONG-liq walls;
  // a short's liq sits ABOVE mark → hunted into SHORT-liq walls. Return the
  // biggest cluster within `band` (default ±1.5%) of the liq price, else null.
  function huntRiskCluster(liqPx, clusters, dir, band) {
    band = band || 0.015;
    if (liqPx == null || !clusters) return null;
    const rel = clusters.filter((c) => (dir === 'long' ? c.side === 'long' : c.side === 'short'));
    let hit = null;
    for (const c of rel) {
      if (Math.abs(c.price - liqPx) / liqPx <= band) {
        if (!hit || c.sizeUsd > hit.sizeUsd) hit = c;
      }
    }
    return hit;
  }
  // Descriptive helper: the highest leverage AT OR BELOW the user's current
  // at which the computed liq price sits clear of every cluster. This DESCRIBES
  // the data ("leverage where your liq sits clear of walls: ≤Nx") — it is NOT a
  // recommendation to trade at that leverage. Scans currentL → 1.
  function suggestClearLeverage(entry, dir, mmf, clusters, currentL, maxL) {
    // contract: AT OR BELOW current. currentL 0/negative means "nothing below" —
    // NOT "scan from max" (`0` is falsy; `currentL || maxL` violated the contract).
    if (currentL != null && currentL < 1) return null;
    const top = Math.min(Math.floor(currentL != null ? currentL : (maxL || 1)), Math.floor(maxL || 50));
    for (let L = top; L >= 1; L--) {
      const lp = liqPrice(entry, L, dir, mmf);
      if (!huntRiskCluster(lp, clusters, dir)) return { lev: L, liqPx: lp };
    }
    return null;
  }
  // Full evaluation for a given user input.
  function evalLeverage(vm, input) {
    if (!vm || !vm.markPx) return null;
    const dir = input.dir === 'short' ? 'short' : 'long';
    const L = Math.max(1, Math.min(Number(input.leverage) || 1, vm.maxLeverage || 50));
    const entry = vm.markPx;
    const lp = liqPrice(entry, L, dir, vm.mmf);
    const hit = huntRiskCluster(lp, vm.liq.clusters, dir);
    const clear = hit ? suggestClearLeverage(entry, dir, vm.mmf, vm.liq.clusters, L - 1, vm.maxLeverage) : null;
    return {
      dir, leverage: L, sizeUsd: Number(input.sizeUsd) || 1000,
      margin: input.margin === 'cross' ? 'cross' : 'isolated',
      liqPx: lp,
      liqDistPct: entry ? ((lp - entry) / entry) * 100 : null,
      cluster: hit,              // cluster the liq sits inside, or null
      inWall: Boolean(hit),      // liq lands inside a crowded cluster
      suggest: clear             // { lev, liqPx } at-or-below current that sits clear, or null
    };
  }

  // ---- funding leg (LIVE) ----
  function fundingLeg(row) {
    if (!row) return null;
    return {
      apr: row.aprPct,
      perDayPer1k: moneyPerDayPer1k(row.fundingHr),
      fundingHr: row.fundingHr,
      side: row.fundingHr == null || row.fundingHr === 0 ? 'funding flat'
        : row.fundingHr > 0 ? 'longs pay shorts' : 'shorts pay longs',
      premiumPct: row.premiumPct,
      source: 'live'
    };
  }

  // ---- normalize REAL whale intel (from background getCoinIntel) ----
  function normSmart(sm) {
    return {
      side: sm.side || (sm.pctShort >= 55 ? 'short' : sm.pctShort <= 45 ? 'long' : 'mixed'),
      pctShort: sm.pctShort, netUsd: sm.netUsd,
      nWallets: sm.nWallets, nProfitable: sm.nProfitable != null ? sm.nProfitable : null,
      source: sm.source || 'live'                       // 'live' (crawl) or 'sample' (bundled snapshot)
    };
  }
  function normLiq(wallsRaw, markPx) {
    const clusters = (wallsRaw || []).map((c) => ({
      price: c.price, sizeUsd: c.sizeUsd, side: c.side,
      distPct: markPx ? ((c.price - markPx) / markPx) * 100 : null
    })).sort((a, b) => b.price - a.price);
    return finishLiq(clusters);
  }
  function finishLiq(clusters) {
    const nearest = clusters.slice().sort((a, b) => Math.abs(a.distPct || 1e9) - Math.abs(b.distPct || 1e9))[0] || null;
    const totalBelowUsd = clusters.filter((c) => c.side === 'long').reduce((a, c) => a + c.sizeUsd, 0);
    const totalAboveUsd = clusters.filter((c) => c.side === 'short').reduce((a, c) => a + c.sizeUsd, 0);
    return { clusters, nearest, totalBelowUsd, totalAboveUsd, source: 'live' };
  }
  const LOADING_LIQ = { clusters: [], nearest: null, totalBelowUsd: 0, totalAboveUsd: 0, source: 'loading' };
  const LOADING_SM = { side: 'mixed', pctShort: 50, netUsd: 0, nWallets: 0, nProfitable: 0, source: 'loading' };

  // ---- the one function the UI calls ----
  // opts: { coin, row (HL info row), intel (REAL whale intel from
  // getCoinIntel: { loading, walls:[{price,sizeUsd,side}], smartMoney }) }
  function buildViewModel(opts) {
    const coin = (opts.coin || '').toUpperCase();
    const row = opts.row || null;
    const intel = opts.intel || null;
    const markPx = row ? row.markPx : null;
    const maxLeverage = row ? row.maxLeverage : 50;
    let smartMoney = LOADING_SM, liq = LOADING_LIQ, positions = [];
    if (intel && !intel.loading && intel.smartMoney) {
      smartMoney = normSmart(intel.smartMoney);
      liq = normLiq(intel.walls || [], markPx);
      positions = (intel.positions || []).map((p) => ({ price: p.price, sizeUsd: p.sizeUsd, side: p.side, addr: p.addr, pnl: p.pnl }));
    }
    // REAL liquidation LEVELS for the VPVR-style profile — populated even while
    // the live whale crawl is still running (bundled snapshot fallback), so the
    // profile renders instantly. Each: { price(=liqPx), sizeUsd(=notional), side }.
    const liqLevels = (intel && Array.isArray(intel.levels))
      ? intel.levels.map((l) => ({ price: l.price, sizeUsd: l.sizeUsd, side: l.side === 'long' ? 'long' : 'short' }))
      : [];
    const funding = fundingLeg(row);
    return {
      coin, markPx, maxLeverage, mmf: maintMarginFraction(maxLeverage),
      dataAsOf: Date.now(), smartMoney, liq, positions, liqLevels,
      liqLevelsSource: intel ? (intel.levelsSource || null) : null, funding,
      // STALENESS HONESTY (v0.21.1): where the levels came from + how fresh —
      // drives the chart-foot badge and verdict-confidence degradation.
      levelsMeta: intel ? {
        source: intel.levelsSource || null,
        bundleUpdated: intel.bundleUpdated || null,
        bundleStale: Boolean(intel.bundleStale),
        coveragePct: intel.coveragePct != null ? intel.coveragePct : null,   // feed: REAL per-coin % of OI
        feedUpdated: intel.feedUpdated || null,
        crawl: intel.crawl || null
      } : null,
      oiNtl: row ? row.oiNtl : null, dayNtlVlm: row ? row.dayNtlVlm : null,
      isHyperp: row ? Boolean(row.isHyperp) : false, loading: liq.source === 'loading'
    };
  }

  // ========================================================================
  // VOLATILITY (honest, computed from candles — never a fake "% liquidation").
  // ========================================================================
  // Typical 1-day move as a fraction (0.0136 = 1.36%) from candle log returns.
  function dailyMovePct(candles, interval) {
    if (!candles || candles.length < 3) return null;
    const rets = [];
    for (let i = 1; i < candles.length; i++) { const a = candles[i - 1].c, b = candles[i].c; if (a > 0 && b > 0) rets.push(Math.log(b / a)); }
    if (rets.length < 2) return null;
    const mu = rets.reduce((x, y) => x + y, 0) / rets.length;
    const sd = Math.sqrt(rets.reduce((x, y) => x + (y - mu) * (y - mu), 0) / rets.length);
    const perDay = interval === '15m' ? 96 : interval === '4h' ? 6 : interval === '1d' ? 1 : 24; // default 1h
    return sd * Math.sqrt(perDay);
  }
  // How many typical daily moves a price level sits from mark.
  function volDistance(level, mark, dmp) { if (!level || !mark || !dmp) return null; return Math.abs(level - mark) / mark / dmp; }
  // Risk color from vol-distance: RED ≤1 move · ORANGE ≤2.5 · GREEN beyond.
  function volColor(d) { if (d == null) return 'green'; return d <= 1.0 ? 'red' : d <= 2.5 ? 'orange' : 'green'; }
  function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  // Barrier-touch approximation ~2·(1−Φ(d)) — VOLATILITY ESTIMATE, NOT a
  // prediction, and NEVER to be labelled "liquidation chance" as fact.
  function reachEstimate(d) { if (d == null) return null; const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2)); return Math.max(0, Math.min(1, 2 * (1 - Phi(d)))); }

  // ========================================================================
  // LIQUIDATION CASCADE ("gravity") — the PREDICTIVE layer. Only possible
  // because HL is on-chain and we have REAL per-wallet liq prices + notionals:
  // price entering a cluster forces those liquidations → forced market orders
  // push price further → can reach the NEXT cluster → chain reaction. This is a
  // MODEL: the impact coefficient is an estimate, never present terminalPx as
  // certain. Coinglass/Hyblock can't do this from estimated data.
  // ========================================================================
  const CASCADE_K = 0.6;          // impact coefficient (TUNABLE): dumping N notional
                                  // moves price ~ k·N / marketDepth. Conservative.
  const CASCADE_MAX_STEP = 0.06;  // clamp any single cluster's impact to ≤6% (a lone
                                  // huge wall can't teleport price across the book).
  const CASCADE_BAND = 0.35;      // only consider clusters within ±35% of mark.
  function cascadeDepth(vm) {
    if (vm.oiNtl && vm.oiNtl > 0) return { depth: vm.oiNtl, source: 'oi' };            // open interest USD — best proxy
    if (vm.dayNtlVlm && vm.dayNtlVlm > 0) return { depth: vm.dayNtlVlm, source: 'vlm' }; // 24h volume USD fallback
    // last-resort proxy: 4×Σ(tracked liq). OVERSTATES impact by 1/(4·coverage) when
    // tracked liqs are a thin slice of true OI (exactly when oi/vlm are missing) —
    // callers must treat source 'proxy' as LOW-CONFIDENCE: no red alarms off it.
    const t = (vm.liqLevels || []).reduce((s, l) => s + (l.sizeUsd || 0), 0);
    return { depth: t > 0 ? t * 4 : 0, source: 'proxy' };
  }
  // dir: 'down' = long-liq cascade below mark; 'up' = short-squeeze above mark.
  function computeCascade(vm, dir, opts) {
    opts = opts || {};
    const mark = vm && vm.markPx;
    if (!mark || !Array.isArray(vm.liqLevels) || !vm.liqLevels.length) return null;
    const down = dir !== 'up';
    const k = opts.k != null ? opts.k : CASCADE_K;
    const maxStep = opts.maxStep != null ? opts.maxStep : CASCADE_MAX_STEP;
    const band = opts.band != null ? opts.band : CASCADE_BAND;
    const dd = opts.depth != null ? { depth: opts.depth, source: opts.depthSource || 'oi' } : cascadeDepth(vm);
    const depth = dd.depth, depthSource = dd.source;
    if (!depth || depth <= 0) return null;
    // bucket the real liq levels on the relevant side into clusters
    const bw = mark * (opts.bucketFrac || 0.0025);
    const bins = new Map();
    for (const l of vm.liqLevels) {
      const p = l.price, n = l.sizeUsd || 0;
      if (p == null || n <= 0) continue;
      if (down ? !(p < mark) : !(p > mark)) continue;
      if (Math.abs(p - mark) / mark > band) continue;
      const key = Math.round(p / bw), b = bins.get(key) || { wpx: 0, usd: 0 };
      b.usd += n; b.wpx += p * n; bins.set(key, b);
    }
    let clusters = [];
    for (const b of bins.values()) clusters.push({ price: b.wpx / b.usd, usd: b.usd });
    if (!clusters.length) return null;
    // nearest → farthest from mark (down: highest price first; up: lowest first)
    clusters.sort((a, b) => down ? b.price - a.price : a.price - b.price);
    const biggest = clusters.slice().sort((a, b) => b.usd - a.usd)[0];
    // walk price from mark into the side; each fired cluster's impact may reach
    // the next → self-sustaining chain.
    const hops = [];
    let price = mark, total = 0;
    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i];
      if (i > 0) {
        const reached = down ? price <= c.price : price >= c.price;
        if (!reached) break;   // chain stalls: prior impact didn't reach this wall
      }
      hops.push({ price: c.price, usd: c.usd });
      total += c.usd;
      const impact = Math.min(maxStep, k * c.usd / depth);
      price = down ? c.price * (1 - impact) : c.price * (1 + impact);
    }
    const chain = hops.length >= 2;   // self-sustaining = ≥2 walls fired in sequence
    if (chain) {
      const triggerPx = hops[0].price, terminalPx = price;
      return {
        dir: down ? 'down' : 'up', chain: true, isolated: false,
        triggerPx, terminalPx, totalLiqUsd: total, hops,
        dropFrac: Math.abs(terminalPx - mark) / mark,
        biggestWall: biggest, depth, depthSource, k
      };
    }
    // no chain — report the single biggest wall + its ISOLATED impact
    const impact = Math.min(maxStep, k * biggest.usd / depth);
    const terminalPx = down ? biggest.price * (1 - impact) : biggest.price * (1 + impact);
    return {
      dir: down ? 'down' : 'up', chain: false, isolated: true,
      triggerPx: biggest.price, terminalPx, totalLiqUsd: biggest.usd,
      hops: [{ price: biggest.price, usd: biggest.usd }],
      dropFrac: Math.abs(terminalPx - mark) / mark,
      biggestWall: biggest, depth, depthSource, k
    };
  }
  // Does a cascade sweep THROUGH a given price (e.g. the user's liq)? True when
  // liqPx lies between triggerPx and terminalPx inclusive — the chain blows past it.
  function cascadeHitsPrice(cascade, liqPx) {
    if (!cascade || liqPx == null) return false;
    const a = Math.min(cascade.triggerPx, cascade.terminalPx), b = Math.max(cascade.triggerPx, cascade.terminalPx);
    return liqPx >= a && liqPx <= b;
  }

  g.HLVM = {
    CONTRACT_VERSION: '0.5',
    dailyMovePct, volDistance, volColor, reachEstimate,
    moneyPerDayPer1k, fmtMoney, fmtUsd, fmtApr, fmtPrice, fmtPrem, signClass, shortAddr, agoLabel,
    maintMarginFraction, liqPrice, huntRiskCluster, suggestClearLeverage, evalLeverage,
    computeCascade, cascadeHitsPrice, cascadeDepth, CASCADE_K,
    fundingLeg, buildViewModel
  };
})(typeof window !== 'undefined' ? window : this);
