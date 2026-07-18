// HypeLens shared HUD — ONE renderer for both surfaces (injected window +
// toolbar popup). Chart: TradingView Lightweight Charts v4 (bundled local),
// with a REAL liquidation HEAT FIELD behind the candles + a draggable
// SL/TP trade planner + a Market-Lean momentum bar on top.
//
// LAYERS (bottom→top):
//   heat canvas (z0, behind LWC) : black bg → density kernels (side-split
//     red-above / green-below ramps, additive) → core+bloom on big walls
//   LWC canvas  (z1)             : candlesticks (transparent bg → heat shows)
//   overlay     (z2, top)        : mark line + liq/stop/TP/trail lines & pills
//   tooltip/legend (z3)          : hover $-at-price + top whale, intensity
// The density field is built client-side from REAL whale positions
// (liquidationPx × positionValue), adaptive-σ (big whale = tight bright blade,
// small = soft fill), p99-compressed, floored to 0 so empty zones stay black.

(function (g) {
  'use strict';
  const VM = g.HLVM;
  // Density redesign (v0.20.0): order-entry (SL/TP · Place · wizard) lives behind
  // a collapsed "Trade" expander. Session-scoped in-memory flag survives both
  // data-refresh re-renders AND remounts (coin/tf/mode switches).
  let _tradeOpen = false;
  const DISCLAIMER = 'Informational only · not financial advice · leverage can lose all funds · no tool can prevent liquidation. Volatility figures are estimates, not predictions.';
  const LC = () => g.LightweightCharts;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // Perceptual 256-entry LUTs — luminance AND alpha climb together (empty =
  // transparent near-black, hot = opaque near-white cores) so bands GLOW.
  // Side colors — used only for the cluster $ labels & key (LONG-liq below mark
  // = red downside fuel · SHORT-liq above = teal upside fuel). The HEAT FIELD
  // itself is a single viridis density ramp (not side-split).
  const C_LONG = [246, 70, 93];    // #F6465D
  const C_SHORT = [23, 199, 132];  // #17C784
  // VIRIDIS colormap: empty=transparent near-black → purple → indigo → teal →
  // green → BRIGHT YELLOW (biggest real liquidation cluster). Stops [t,r,g,b,a].
  function buildLUT(stops) {
    const lut = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) {
      const t = i / 255; let a = stops[0], b = stops[stops.length - 1];
      for (let s = 0; s < stops.length - 1; s++) { if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; } }
      const f = (b[0] - a[0]) ? (t - a[0]) / (b[0] - a[0]) : 0;
      lut[i * 4] = a[1] + (b[1] - a[1]) * f; lut[i * 4 + 1] = a[2] + (b[2] - a[2]) * f; lut[i * 4 + 2] = a[3] + (b[3] - a[3]) * f; lut[i * 4 + 3] = a[4] + (b[4] - a[4]) * f;
    }
    return lut;
  }
  const LUT_VIRIDIS = buildLUT([[0, 12, 10, 20, 0], [0.12, 44, 26, 74, 120], [0.30, 54, 52, 120, 170], [0.48, 42, 110, 140, 195], [0.64, 34, 168, 132, 215], [0.80, 122, 209, 81, 235], [0.92, 200, 225, 60, 248], [1.0, 253, 231, 55, 255]]);
  function levLeverage(vm, lev) { const maxL = vm.maxLeverage || 50; let L = lev.leverage; if (L == null) L = Math.min(10, maxL); return Math.max(1, Math.min(L, maxL)); }
  function levEval(vm, lev) { return VM.evalLeverage(vm, { sizeUsd: lev.sizeUsd, dir: lev.dir, leverage: levLeverage(vm, lev), margin: lev.margin }); }
  function volHex(col) { return col === 'red' ? '#e5726e' : col === 'orange' ? '#e0a24a' : '#46c08a'; }
  function leverIsLong(risk) { return (risk && risk.dir) ? risk.dir === 'long' : true; }
  function stopPrice(vm, risk) { if (!risk || !risk.stopPct) return null; const s = risk.stopPct / 100; return leverIsLong(risk) ? vm.markPx * (1 - s) : vm.markPx * (1 + s); }
  function tpPrice(vm, risk) { if (!risk || !risk.tpPct) return null; const t = risk.tpPct / 100; return leverIsLong(risk) ? vm.markPx * (1 + t) : vm.markPx * (1 - t); }

  // ---- MARKET LEAN (composite momentum from real inputs; descriptive only) ----
  function marketLean(vm, ctx) {
    const parts = [];
    const smReady = vm.smartMoney.source === 'live' || vm.smartMoney.source === 'sample';
    if (smReady) parts.push({ v: (100 - 2 * vm.smartMoney.pctShort) / 100, w: 0.45 });
    const apr = vm.funding ? vm.funding.apr : null;
    if (apr != null) parts.push({ v: clamp(apr / 40, -1, 1), w: 0.2 });
    let mom = null;
    if (ctx.candles && ctx.candles.candles && ctx.candles.candles.length >= 8) { const cs = ctx.candles.candles, a = cs[cs.length - 8].c, b = cs[cs.length - 1].c; if (a > 0) mom = (b - a) / a; }
    if (mom != null) parts.push({ v: clamp(mom / 0.1, -1, 1), w: 0.35 });
    let sum = 0, ws = 0; for (const p of parts) { sum += p.v * p.w; ws += p.w; }
    let score = ws > 0 ? sum / ws : 0;
    const oi = vm.oiNtl, vlm = vm.dayNtlVlm; let conf = 1; if (oi && vlm) conf = clamp(0.55 + 0.45 * (vlm / oi), 0.55, 1);
    score = clamp(score * conf, -1, 1);
    const dir = score > 0.08 ? 'long' : score < -0.08 ? 'short' : 'neutral';
    return { score, dir, mom, apr, oi, vlm, pct: vm.smartMoney.pctShort, src: vm.smartMoney.source, loading: !smReady };
  }
  function leanHtml(vm, ctx) {
    const L = marketLean(vm, ctx);
    const dcls = L.dir === 'long' ? 'hlx-pos' : L.dir === 'short' ? 'hlx-neg' : 'hlx-dim';
    const label = L.dir === 'long' ? '→ LONG' : L.dir === 'short' ? '→ SHORT' : '→ NEUTRAL';
    const half = Math.abs(L.score) * 50;
    const fill = L.score >= 0
      ? 'left:50%;width:' + half + '%;background:linear-gradient(90deg,#2a9d8f,#4affd4)'
      : 'left:' + (50 - half) + '%;width:' + half + '%;background:linear-gradient(270deg,#7a241f,#e5726e)';
    const brk = [];
    if (L.apr != null) brk.push('funding ' + VM.fmtApr(L.apr) + '/yr');
    if (L.oi != null) brk.push('OI ' + VM.fmtUsd(L.oi));
    if (!L.loading) { const w = L.src === 'sample' ? 'positions' : 'whales'; brk.push(w + ' ' + L.pct + '% ' + (L.pct >= 50 ? 'short' : 'long')); } else brk.push('positions loading…');
    // momentum = last 8 bars of the ACTIVE timeframe — label it that way, not "7d"
    // (on 1h candles that read "7d" while showing an 8-hour move; review F8).
    if (L.mom != null) { const m8 = { '1d': '8d', '4h': '32h', '1h': '8h' }[ctx.tf || '1d'] || '8 bars'; brk.push(m8 + ' ' + (L.mom >= 0 ? '+' : '') + (L.mom * 100).toFixed(0) + '%'); }
    return '<div class="hlx-lean">' +
      '<div class="hlx-lean-top"><span class="hlx-lean-label">market lean</span>' +
        '<span class="hlx-lean-dir ' + dcls + '">' + label + '</span>' +
        '<span class="hlx-lean-i" title="Descriptive positioning/flow summary — where funding, OI, price momentum and whale positioning point. NOT a buy/sell signal or price prediction.">ⓘ</span></div>' +
      '<div class="hlx-lean-bar"><span class="hlx-lean-fill" style="' + fill + '"></span><span class="hlx-lean-mid"></span></div>' +
      '<div class="hlx-lean-break">' + brk.join('&nbsp;&nbsp;·&nbsp;&nbsp;') + '</div>' +
      '</div>';
  }

  function tfToggle(tf) { return '<div class="hlx-tf">' + [['1d', '1D'], ['4h', '4H'], ['1h', '1H']].map((t) => '<button data-tf="' + t[0] + '" class="' + (tf === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>'; }

  // GUARDIAN mode = a REAL position on THIS coin (exact liquidationPx) drives the
  // chart, unless the user forced PLANNER. (True even while the PORTFOLIO panel is
  // shown, so the chart still marks your real liq for the current coin.)
  function guardianActive(ctx) { return Boolean(ctx.position && ctx.position.liquidationPx != null && ctx.mode !== 'planner'); }
  function portfolioEligible(ctx) { const ps = (ctx.portfolio && ctx.portfolio.positions) || []; return ps.length >= 2 || ps.some((p) => p.levType === 'cross'); }
  // PORTFOLIO panel is shown when the user has ≥2 positions or any cross position
  // (auto), or explicitly toggled to it.
  function portfolioActive(ctx) {
    const ps = (ctx.portfolio && ctx.portfolio.positions) || []; if (!ps.length) return false;
    if (ctx.mode === 'portfolio') return true;
    if (ctx.mode === 'guardian' || ctx.mode === 'planner') return false;
    return portfolioEligible(ctx);
  }
  function currentMode(ctx) { return portfolioActive(ctx) ? 'portfolio' : (guardianActive(ctx) ? 'guardian' : 'planner'); }
  function modeToggle(ctx) {
    const hasPos = Boolean(ctx.position && ctx.position.liquidationPx != null), elig = portfolioEligible(ctx);
    if (!hasPos && !elig) return '';
    const cur = currentMode(ctx);
    const btn = (m, lbl, t) => '<button data-mode="' + m + '" class="' + (cur === m ? 'on' : '') + '" title="' + t + '">' + lbl + '</button>';
    let s = '<span class="hlx-modes">';
    if (elig) s += btn('portfolio', 'book', 'Account-wide cross risk across ALL your positions');
    if (hasPos) s += btn('guardian', 'guardian', 'Monitor your REAL position on this coin');
    s += btn('planner', 'planner', 'Hypothetical what-if inputs');
    return s + '</span>';
  }

  // ===== PORTFOLIO / CROSS math (pure; account-wide risk across ALL positions) =====
  const CORR_MAJORS = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'AVAX', 'LINK', 'SUI', 'APT', 'ARB', 'OP', 'MATIC', 'LTC', 'ADA', 'HYPE', 'TON', 'NEAR', 'INJ', 'TIA']);
  function portfolioStats(portfolio) {
    const ps = (portfolio && portfolio.positions) || [], acct = portfolio && portfolio.account;
    let netNtl = 0, grossNtl = 0, longNtl = 0, shortNtl = 0;
    const positions = ps.map((p) => {
      const mark = p.markPx != null ? p.markPx : (p.positionValue != null && Math.abs(p.szi) > 0 ? p.positionValue / Math.abs(p.szi) : null);
      const ntl = Math.abs(p.positionValue || 0), signed = (p.szi > 0 ? 1 : -1) * ntl;
      netNtl += signed; grossNtl += ntl; if (p.szi > 0) longNtl += ntl; else shortNtl += ntl;
      let moves = null;
      if (p.liquidationPx != null && mark && p.dmp) moves = Math.abs(p.liquidationPx - mark) / mark / p.dmp;
      return Object.assign({}, p, { mark, ntl, signed, moves });
    });
    return { positions, netNtl, grossNtl, longNtl, shortNtl, acct };
  }
  function posRiskColor(p) { if (p.moves == null) return 'dim'; return p.moves < 1.2 ? 'red' : p.moves < 2.5 ? 'orange' : 'mint'; }
  // account-wide CROSS liquidation (first-order): buffer / |net cross notional|.
  function crossLiq(stats) {
    const acct = stats.acct; if (!acct || !acct.crossMarginSummary) return null;
    const cross = stats.positions.filter((p) => p.levType === 'cross');
    if (!cross.length) return { none: true };
    const equity = acct.crossMarginSummary.accountValue, maint = acct.crossMaintenanceMarginUsed;
    if (equity == null || maint == null) return { unknown: true };
    const buffer = equity - maint;
    let netNotional = 0; for (const p of cross) netNotional += p.signed;
    if (!(Math.abs(netNotional) > 0.001 * equity)) return { hedged: true, buffer, equity, count: cross.length };
    const mLiq = buffer / Math.abs(netNotional), dir = netNotional > 0 ? 'down' : 'up';
    let drag = null; for (const p of cross) { if (netNotional > 0 ? p.signed > 0 : p.signed < 0) { if (!drag || Math.abs(p.signed) > Math.abs(drag.signed)) drag = p; } }
    return { mLiq, dir, buffer, equity, maint, netNotional, drag, dragShare: drag ? Math.abs(drag.signed) / Math.abs(netNotional) : null, count: cross.length };
  }
  function netExposure(stats) {
    if (!(stats.grossNtl > 0)) return null;
    const netPct = stats.netNtl / stats.grossNtl;
    let majLong = 0, majShort = 0, majGross = 0, majCount = 0;
    for (const p of stats.positions) { if (!CORR_MAJORS.has(p.coin.toUpperCase())) continue; majCount++; majGross += p.ntl; if (p.szi > 0) majLong += p.ntl; else majShort += p.ntl; }
    const majNet = majGross > 0 ? (majLong - majShort) / majGross : 0;
    const flagged = majCount >= 2 && Math.abs(majNet) >= 0.7;
    return { netPct, side: netPct >= 0 ? 'long' : 'short', majNet, majSide: majNet >= 0 ? 'long' : 'short', majGross, majCount, flagged };
  }
  // down-move stress: which LONGS liquidate at market −X%, and the new cross buffer.
  function stressTest(stats, X, cl) {
    const liq = [];
    for (const p of stats.positions) { if (p.szi > 0 && p.mark && p.liquidationPx != null) { const d = (p.mark - p.liquidationPx) / p.mark; if (d > 0 && d <= X) liq.push(p.coin); } }
    let newBuffer = null;
    if (cl && !cl.none && !cl.unknown && cl.buffer != null && cl.netNotional != null) newBuffer = cl.buffer + (-X) * cl.netNotional;
    else if (cl && cl.buffer != null) newBuffer = cl.buffer;
    return { X, liq, newBuffer };
  }
  // coverage: tracked liq-level notional vs the coin's open interest (honest sample size)
  function coverageBadge(vm) {
    if (!vm.oiNtl || !Array.isArray(vm.liqLevels) || !vm.liqLevels.length) return '';
    let sum = 0; for (const l of vm.liqLevels) sum += l.sizeUsd || 0;
    const pct = Math.min(100, sum / vm.oiNtl * 100);
    if (!(pct > 0)) return '';
    return ' <span class="hlx-cov" title="Tracked positions cover ~' + pct.toFixed(0) + '% of this coin&#39;s open interest (Σ tracked position value ÷ OI). A large real sample — not all of OI.">· ~' + (pct < 1 ? '<1' : pct.toFixed(0)) + '% of OI</span>';
  }
  // ---- STALENESS HONESTY (v0.21.1): the data-source badge NEVER claims "real
  // positions" for the offline bundle. Three states: live / live-partial (with
  // wallet coverage) / bundled snapshot (amber, dated, marked STALE >24h). ----
  function dataStale(vm) {
    const m = vm && vm.levelsMeta;
    if (!m || m.source !== 'bundled') return false;
    if (m.bundleStale) return true;
    if (!m.bundleUpdated) return true;                      // undated bundle = assume stale (honest default)
    const t = Date.parse(m.bundleUpdated);
    return !isFinite(t) || Date.now() - t > 24 * 3600 * 1000;
  }
  function srcBadgeHtml(vm) {
    const m = vm && vm.levelsMeta;
    if (m && m.source === 'feed') {
      // BACKEND FEED (v0.22.0): REAL per-coin coverage from the feed — never a
      // hardcoded number. <30% coverage gets an explicit "partial view" mark.
      const ago = m.feedUpdated ? Math.max(0, Math.round((Date.now() - Date.parse(m.feedUpdated)) / 60000)) : null;
      const cov = m.coveragePct != null ? m.coveragePct + '% of ' + vm.coin + ' OI' : 'coverage unknown';
      return '<b>real positions</b> <span class="hlx-src" title="Live backend feed: the wallet universe is re-derived from the leaderboard (top accounts + top weekly volume) and re-crawled every ~15 min. Coverage = tracked notional ÷ open interest for THIS coin.">· live feed · ' + cov + (ago != null ? ' · updated ' + ago + 'm ago' : '') + '</span>' +
        (m.coveragePct != null && m.coveragePct < 30 ? '<span class="hlx-src-partial" title="Under 30% of this coin&#39;s open interest is tracked — the walls you see are a PARTIAL view of the real book."> · partial view</span>' : '');
    }
    if (m && m.source === 'bundled') {
      const date = m.bundleUpdated ? String(m.bundleUpdated).slice(0, 10) : 'undated';
      const stale = dataStale(vm);
      return '<span class="hlx-src-stale" title="These walls are an OFFLINE snapshot generated ' + date + ', not live data' + (stale ? ' — older than 24h, positions have moved' : '') + '. The live top-wallet crawl replaces them incrementally as it progresses.">snapshot ' + date + (stale ? ' · STALE' : '') + ' — live crawl in progress</span>';
    }
    if (m && m.source === 'live-partial' && m.crawl) {
      return '<b>live</b> <span class="hlx-src" title="Live per-wallet crawl in progress — walls from the ' + m.crawl.done + ' wallets crawled so far; the rest of the pass fills in over the next minutes.">· ' + m.crawl.done + ' of ' + m.crawl.total + ' wallets</span>' + coverageBadge(vm);
    }
    return '<b>real positions</b>' + coverageBadge(vm);
  }
  function updateSrcBadge(container, ctx) {
    const el = container.querySelector('.hlx-legend-lbl');
    if (el) el.innerHTML = srcBadgeHtml(ctx.vm);
  }
  function bodyHtml(ctx, opts) {
    const vm = ctx.vm, loading = vm.liq.source !== 'live';
    const f = vm.funding, fCls = f && f.perDayPer1k > 0 ? 'hlx-neg' : 'hlx-pos';
    const maxL = vm.maxLeverage || 50, L = levLeverage(vm, ctx.lev);
    const disc = ctx.disclaimer || DISCLAIMER; const r = ctx.risk || {};
    const inten = (ctx.heat && ctx.heat.intensity != null) ? ctx.heat.intensity : 0.5;
    const opac = (ctx.heat && ctx.heat.opacity != null) ? ctx.heat.opacity : 0.5;
    const port = portfolioActive(ctx);
    const guard = !port && guardianActive(ctx), pos = ctx.position;
    // ⓘ note collects everything wordy (coverage · read-only · disclaimer)
    const note = (loading ? 'Aggregating whale positions… ' : ((ctx.coverageText || '') + '. ')) + 'Read-only, no wallet, no execution. ' + disc;
    // panel body: PORTFOLIO (account-wide) vs GUARDIAN (real position) vs PLANNER
    let panelBody;
    if (port) {
      panelBody = '<div class="hlx-portfolio"></div>';   // filled by updatePortfolio
    } else if (guard) {
      const pnl = pos.unrealizedPnl, pnlCls = pnl >= 0 ? 'hlx-pos' : 'hlx-neg';
      panelBody =
        '<div class="hlx-gpos">' +
          '<span class="hlx-gpos-side ' + (pos.side === 'long' ? 'hlx-pos' : 'hlx-neg') + '">' + pos.side.toUpperCase() + (pos.leverage ? ' ' + pos.leverage + '×' : '') + '</span>' +
          '<span class="hlx-gpos-kv">entry <b>' + VM.fmtPrice(pos.entryPx) + '</b></span>' +
          '<span class="hlx-gpos-kv">size <b>' + VM.fmtUsd(pos.positionValue) + '</b></span>' +
          (pnl != null ? '<span class="hlx-gpos-kv">uPnL <b class="' + pnlCls + '">' + VM.fmtUsd(pnl) + '</b></span>' : '') +
        '</div>' +
        '<div class="hlx-status"></div>' +
        '<div class="hlx-cascade"></div>' +
        '<div class="hlx-guide"></div>' +
        '<div class="hlx-placelev-row"><button class="hlx-placelev" title="Sets cluster-aware SL + TP as plan LINES on the chart (your real leverage is untouched). Draws lines only — does NOT place any order. Read-only.">⚡ PLACE LEVELS</button><span class="hlx-place-result"></span></div>';
    } else {
      panelBody =
        '<div class="hlx-sizing-controls">' +
          '<div class="hlx-seg hlx-lev-dir"><button data-dir="long" class="' + (ctx.lev.dir === 'long' ? 'on' : '') + '">Long</button><button data-dir="short" class="' + (ctx.lev.dir === 'short' ? 'on' : '') + '">Short</button></div>' +
          '<div class="hlx-seg hlx-lev-margin" title="Cross-margin liq is ~leverage-independent"><button data-margin="isolated" class="' + (ctx.lev.margin === 'isolated' ? 'on' : '') + '">Iso</button><button data-margin="cross" class="' + (ctx.lev.margin === 'cross' ? 'on' : '') + '">Cross</button></div>' +
          '<label class="hlx-num-lbl">$<input class="hlx-lev-size" type="number" min="1" step="100" value="' + (ctx.lev.sizeUsd || 1000) + '"></label>' +
        '</div>' +
        '<div class="hlx-slider-row"><span class="hlx-slider-cap">lev</span><input class="hlx-lev-slider" type="range" min="1" max="' + maxL + '" value="' + L + '"><span class="hlx-lev-val">' + L + '×</span></div>' +
        '<div class="hlx-levstrip" title="Per-leverage liq safety: mint = liq lands in a clear gap, red = liq lands on/near a wall. NOT monotonic — a lower leverage can be worse."></div>' +
        '<div class="hlx-status"></div>' +
        '<div class="hlx-cascade"></div>' +
        '<div class="hlx-guide"></div>' +
        '<div class="hlx-placelev-row"><button class="hlx-placelev" title="One tap: sets cluster-aware SL (beyond the wall), TP (into the magnet) and safe leverage as plan LINES on the chart — you can still drag them. Draws lines only — does NOT place any order. Read-only; ordering is a separate opt-in module.">⚡ PLACE LEVELS</button><span class="hlx-place-result"></span></div>' +
        '<button class="hlx-trade-toggle" title="Manual stop/target sizing and order entry">Trade ' + (_tradeOpen ? '▾' : '▸') + '</button>' +
        '<div class="hlx-trade-body">' +
          '<div class="hlx-risk-row">' +
            '<label class="hlx-num-lbl" title="Stop-loss, % from mark">SL<input class="hlx-stop-in" type="number" min="0" step="0.5" placeholder="%" value="' + (r.stopPct != null ? r.stopPct : '') + '"></label>' +
            '<label class="hlx-num-lbl" title="Take-profit, % from mark">TP<input class="hlx-tp-in" type="number" min="0" step="0.5" placeholder="%" value="' + (r.tpPct != null ? r.tpPct : '') + '"></label>' +
            '<span class="hlx-rr" title="Risk : reward on the current SL/TP"></span>' +
          '</div>' +
          '<div class="hlx-sizing-action"><button class="hlx-place">Place in HL ▸</button><span class="hlx-fund-chip ' + fCls + '" title="Funding rate">' + (f ? VM.fmtApr(f.apr) + '/yr' : '') + '</span><span class="hlx-info" title="' + note.replace(/"/g, '&quot;') + '">ⓘ</span></div>' +
        '</div>';
    }
    const title = port ? 'PORTFOLIO' : (guard ? 'GUARDIAN' : 'LIQ DEFENSE');
    const sub = port ? 'account-wide cross risk across all your positions' : (guard ? 'your position vs the crowd&#39;s liq walls — where price gets pulled' : 'the crowd&#39;s liq walls = where price gets pulled · keep your liq clear');
    return '' +
      '<div class="hlx-win-head" data-drag="1">' +
        '<span class="hlx-win-coin">' + vm.coin + (vm.isHyperp ? ' <span class="hlx-hyp">hyperp</span>' : '') + '<span class="hlx-win-mark">' + VM.fmtPrice(vm.markPx) + '</span></span>' +
        '<span class="hlx-head-right">' + (opts && opts.version ? '<span class="hlx-ver" title="HypeLens version">v' + opts.version + '</span>' : '') + (detectWick(ctx) ? '<button class="hlx-share-wick" title="Share the near-miss — you wicked toward your liq and held. Branded card, levels only, no size.">🔥</button>' : '') + '<button class="hlx-share" title="Share this read — copies a PNG card to the clipboard (and downloads it). Levels + verdict only, no sizes.">⇪</button><span class="hlx-live"><span class="hlx-live-dot"></span>LIVE</span>' + tfToggle(ctx.tf || '1d') + (opts && opts.showClose ? '<button class="hlx-win-close" title="Close">×</button>' : '') + '</span>' +
      '</div>' +
      leanHtml(vm, ctx) +
      '<div class="hlx-chart-wrap">' +
        '<canvas class="hlx-heat"></canvas><div class="hlx-chart-lwc"></div><canvas class="hlx-overlay"></canvas><div class="hlx-cross"></div>' +
        '<div class="hlx-edge-top"></div><div class="hlx-edge-bot"></div>' +
        '<div class="hlx-vlegend" title="Liquidation heat (viridis) from REAL top-wallet positions. Bright yellow = biggest real liquidation cluster; dark = few liquidations.">' +
          '<span class="hlx-vl-top">heavy</span><span class="hlx-vl-bar"></span><span class="hlx-vl-bot">light</span></div>' +
      '</div>' +
      '<div class="hlx-chartfoot">' +
        '<span class="hlx-legend-lbl" title="Heat = liquidation notional at each price from the top wallets we can see. The badge tells you EXACTLY how fresh: live (full crawl) · live-partial (crawl running) · dated snapshot (offline bundle, stale-flagged).">' + srcBadgeHtml(vm) + '</span>' +
        (ctx.onAddr && !ctx.userAddr ? '<button class="hlx-watchaddr" title="Guardian couldn&#39;t auto-detect your connected address from the page — paste it to watch your REAL positions (read-only, public API)">watch addr</button>' : '') +
        '<span class="hlx-heatctl"><span class="hlx-foot-int">int</span><input class="hlx-intensity" type="range" min="0.3" max="0.9" step="0.05" value="' + inten + '" title="Heat contrast">' +
          '<span class="hlx-foot-int">opac</span><input class="hlx-opacity" type="range" min="0.1" max="1" step="0.05" value="' + opac + '" title="Heat opacity"></span>' +
      '</div>' +
      '<div class="hlx-walls"></div>' +
      '<div class="hlx-thinwrap"></div>' +
      '<div class="hlx-drill"></div>' +
      '<div class="hlx-panel' + (guard ? ' hlx-guardian' : '') + (port ? ' hlx-port' : '') + '">' +
        '<div class="hlx-plan-title">' + title + '<span class="hlx-plan-info" title="' + sub.replace(/"/g, '&quot;') + ' · Read-only — HypeLens never places orders.">ⓘ</span>' + modeToggle(ctx) + '</div>' +
        panelBody +
      '</div>';
  }

  // Radically compact: numbers + color, no sentences. Details live in tooltips.
  // v0.20.0: ONE merged status line (was .hlx-safelev card + .hlx-readout line):
  // "{icon} {lev}× · liq $X · {verdict}" — verdict-consistent, prose → tooltip.
  function updateReadout(container, ctx) {
    const out = container.querySelector('.hlx-status'); if (!out) return;
    const vm = ctx.vm, s = container.__hlx;
    const guard = guardianActive(ctx), pos = ctx.position;
    // GUARDIAN: verdict on the REAL position's EXACT liquidationPx (no estimate).
    const liqPx = guard ? pos.liquidationPx : (levEval(vm, ctx.lev) || {}).liqPx;
    const dir = guard ? pos.side : ctx.lev.dir;
    const curLev = guard ? (pos.leverage || null) : levLeverage(vm, ctx.lev);
    // clear DEPENDENT sections too on bail-outs — otherwise a stale cascade line /
    // stop guide (old mark's prices) outlives an emptied status (review F7).
    const clearDeps = () => {
      const c = container.querySelector('.hlx-casc-line'); if (c && c.parentNode) c.parentNode.removeChild(c);
      const g = container.querySelector('.hlx-guide'); if (g) g.innerHTML = '';
      const strip = container.querySelector('.hlx-levstrip'); if (strip) strip.style.background = '';
    };
    if (liqPx == null) { out.innerHTML = ''; out.className = 'hlx-status'; clearDeps(); return; }
    const gctx = guard ? Object.assign({}, ctx, { lev: Object.assign({}, ctx.lev, { dir }) }) : ctx;
    const v = dangerVerdict(vm, gctx, s, liqPx, dir);   // proximity + path (rendered heat)
    // UNKNOWN (no candles AND no heat field): dim honest line, no verdict, no
    // Set-button, no strip, no share-worthy claim (review F2: no data ≠ safe).
    if (v.level === 'unknown') {
      out.className = 'hlx-status hlx-dim';
      out.innerHTML = '<span class="hlx-st-main" title="No candle or liquidation data yet for this coin — the safety read needs at least one of them. This is NOT a clear verdict.">' +
        '<span class="hlx-st-ic">…</span> <b class="hlx-st-lev">' + (curLev != null ? curLev + '×' : '—') + '</b> · liq <b>' + VM.fmtPrice(liqPx) + '</b> · <span class="hlx-st-verdict">' + v.text.toLowerCase() + '</span></span>';
      clearDeps(); return;
    }
    let cls = v.color === 'red' ? 'hlx-neg' : v.color === 'orange' ? 'hlx-warn' : 'hlx-pos';
    const curL = curLev != null ? Math.round(curLev) : null;
    const levTxt = curLev != null ? curLev + '×' : '—';
    // ---- MERGED VERDICT: same verdict `v` drives the read AND the nearest-clear
    // pointer, so they can never contradict. NO "≤ N×" framing (leverage-safety
    // is NON-monotonic). Prose → the line's title tooltip. ----
    let icon, verdictText, setBtn = '', lineTitle;
    const nc = (v.level !== 'clear') ? (curL != null ? nearestClearLev(vm, gctx, s, curL, dir) : safeLeverage(vm, gctx, s)) : null;
    if (v.level === 'clear') {
      icon = '✓'; verdictText = 'clear';
      lineTitle = 'Your liq is beyond ~2.5 daily moves and clear of the real walls in that direction.';
    } else {
      icon = '⚠';
      const profile = getProfile(s, gctx);
      let why;
      if (v.onI >= HEAT_HI) { const n = localNotional(profile, liqPx, 0.008); why = 'on ' + (n > 0 ? usdM(n) + ' ' : '') + 'wall'; }
      else if (v.pathI >= HEAT_HI) { why = 'wall in path'; }
      else if (v.onI >= HEAT_MED) { const n = localNotional(profile, liqPx, 0.008); why = 'near ' + (n > 0 ? usdM(n) + ' ' : '') + 'wall'; }
      else if (v.moves != null && v.moves < 2.5) { why = v.moves.toFixed(1) + ' moves away'; }
      else { why = 'in kill zone'; }
      if (nc != null) {
        verdictText = why + ' → ' + nc + '×';
        setBtn = guard ? '' : '<button class="hlx-setlev" data-lev="' + nc + '" title="Snap to the nearest leverage whose liq lands in a clear gap">Set ' + nc + '×</button>';
        lineTitle = 'Your ' + (curL != null ? curL + '× ' : '') + 'liq ' + why + '. Nearest clear leverage: ' + nc + '× (liq ' + VM.fmtPrice(VM.liqPrice(vm.markPx, nc, dir, vm.mmf)) + ').';
      } else {
        verdictText = 'walls straddle liq zone';
        lineTitle = 'These walls straddle your liq zone — no leverage clears them. Set a hard stop above the walls, not at your liq.';
      }
    }
    // ---- leverage-safety strip (planner only): shows the NON-monotonicity at a
    // glance. Cached — depends on coin/dir/mark/field, NOT the current slider. ----
    if (!guard) {
      const strip = container.querySelector('.hlx-levstrip');
      if (strip) {
        const maxL = Math.floor(vm.maxLeverage || 50);
        const key = dir + '|' + vm.markPx + '|' + (ctx.candles ? ctx.candles.dmp : 0) + '|' + maxL + '|' + (s && s.heatKey || '');
        if (s && s._levStripKey !== key) {
          const stops = [];
          for (let L = 1; L <= maxL; L++) {
            const c = levClear(vm, ctx, s, L, dir) ? '#17C784' : '#ff5f6e';
            stops.push(c + ' ' + ((L - 1) / maxL * 100).toFixed(2) + '%', c + ' ' + (L / maxL * 100).toFixed(2) + '%');
          }
          s._levStripCss = 'linear-gradient(90deg,' + stops.join(',') + ')';
          s._levStripKey = key;
        }
        strip.style.background = (s && s._levStripCss) || '';
      }
    }
    // ORDERING RULE (only meaningful once a manual stop is set → expander): stop
    // must sit between entry and liq with headroom. Violated → short red line.
    let liqOrder = '';
    {
      const rr2 = ctx.risk || {}; rr2.dir = dir;
      const spx = stopPrice(vm, rr2);
      if (spx != null && liqPx != null && vm.markPx) {
        const stopD = Math.abs(vm.markPx - spx), liqD = Math.abs(liqPx - vm.markPx);
        if (stopD > 0 && liqD < LIQ_STOP_RATIO * stopD) {
          const cap = maxLevForStop(stopD / vm.markPx, vm.mmf);
          liqOrder = '<div class="hlx-hud hlx-neg" title="Your liq is closer to mark than your stop — a normal wick past the stop can liquidate you first.">⚠ liq inside stop range' + (!guard && cap != null ? ' · max ' + cap + '×' : '') + '</div>';
        }
      }
    }
    // CROSS-LIQ HONESTY: planner + cross uses the ISO formula → label ≈ and put
    // the account-wide caveat in the tooltip (decision 3: prose → tooltip).
    const crossPlanner = !guard && ctx.lev.margin === 'cross';
    const liqSeg = crossPlanner
      ? '<span class="hlx-st-liq" title="≈ cross liq is account-wide, not per-position — see the Portfolio view for your real cross liquidation">≈ liq <b>' + VM.fmtPrice(liqPx) + '</b></span>'
      : '<span class="hlx-st-liq">' + (guard ? 'your liq' : 'liq') + ' <b>' + VM.fmtPrice(liqPx) + '</b></span>';
    // GUARDIAN pre-liq CASCADE warning — kept, ONE short line (decision 5).
    // STALE data (bundled >24h) → NEVER a red cascade alarm from fossil walls.
    const stale = dataStale(vm);
    let cascadeWarn = '';
    const sideCascade = VM.computeCascade(vm, dir === 'short' ? 'up' : 'down');
    // proxy depth → no red alarm (review F3): the impact model is low-confidence
    // without real OI/volume; the card still shows it with a "low confidence" badge.
    if (!stale && sideCascade && sideCascade.depthSource !== 'proxy' && (sideCascade.chain || sideCascade.totalLiqUsd >= BIG_WALL) && VM.cascadeHitsPrice(sideCascade, liqPx)) {
      cascadeWarn = '<div class="hlx-hud hlx-neg" title="A modeled liquidation cascade (real positions, estimated impact) would run through your liq before price gets there.">⚠ ' + usdM(sideCascade.totalLiqUsd) + ' cascade @ ' + VM.fmtPrice(sideCascade.triggerPx) + ' runs through your liq</div>';
    }
    // STALE data → cap the verdict's CONFIDENCE: a mint "clear" from 12-day-old
    // walls is a lie. Clear degrades to amber "clear?" with a stale suffix; all
    // levels get the dim "stale data" marker + tooltip caveat.
    let staleSuffix = '';
    if (stale) {
      staleSuffix = '<span class="hlx-st-stalemark"> · stale data</span>';
      lineTitle += ' CAUTION: walls are from an offline snapshot older than 24h (positions have moved) — treat this verdict as low-confidence until the live crawl covers this coin.';
      if (v.level === 'clear') { cls = 'hlx-warn'; icon = '~'; verdictText = 'clear?'; }
    }
    // GUARDIAN: estimated ADL exposure segment (real position only) + the
    // hedge-leg amputation warning when THIS coin is the exposed leg.
    const adlHtml = guard ? adlSeg(pos, vm.coin) : '';
    let hedgeWarn = '';
    if (guard && ctx.portfolio) {
      const hr = hedgeRisk(portfolioStats(ctx.portfolio));
      if (hr && hr.leg.coin === pos.coin) {
        hedgeWarn = '<div class="hlx-hud hlx-neg" title="Oct-10 failure mode: ADL force-closes the PROFITABLE leg of a hedge first — the rest of your book is left directional. Estimated from profit×leverage ranking.">⚠ hedge risk: your ' + hr.legSide.toUpperCase() + ' leg is ADL-exposed — a squeeze can amputate it and leave you naked ' + hr.nakedSide + '</div>';
      }
    }
    out.className = 'hlx-status ' + cls;
    out.innerHTML =
      '<span class="hlx-st-main" title="' + lineTitle.replace(/"/g, '&quot;') + '">' +
        '<span class="hlx-st-ic">' + icon + '</span> <b class="hlx-st-lev">' + levTxt + '</b> · ' + liqSeg + ' · <span class="hlx-st-verdict">' + verdictText + '</span>' + staleSuffix +
      '</span>' + adlHtml + setBtn + hedgeWarn + cascadeWarn + liqOrder;
    renderCascadeCard(container, ctx);

    // R:R — one compact badge inline in the risk row (planner only)
    if (!guard) {
      const r = ctx.risk || {}; r.dir = ctx.lev.dir;
      const entry = vm.markPx, isLong = leverIsLong(r), sp = stopPrice(vm, r), tp = tpPrice(vm, r), notional = (ctx.lev.sizeUsd || 1000);
      const rrEl = container.querySelector('.hlx-rr');
      if (rrEl) {
        if (sp != null && tp != null) {
          const risk = isLong ? entry - sp : sp - entry, reward = isLong ? tp - entry : entry - tp;
          if (risk > 0 && reward > 0) {
            const rr = reward / risk, dRisk = notional * risk / entry, dRew = notional * reward / entry, rrCls = rr >= 2 ? 'hlx-pos' : rr >= 1 ? 'hlx-warn' : 'hlx-neg';
            rrEl.className = 'hlx-rr hlx-rr-badge ' + rrCls; rrEl.title = 'Risk ' + VM.fmtUsd(dRisk) + ' · Reward ' + VM.fmtUsd(dRew);
            rrEl.textContent = '1:' + rr.toFixed(1);
          } else { rrEl.className = 'hlx-rr'; rrEl.textContent = ''; }
        } else { rrEl.className = 'hlx-rr'; rrEl.textContent = ''; }
      }
    }
    updateGuide(container, ctx);
  }

  // Compact position read for the CHIP risk light (no chart state needed —
  // builds the heat field fresh from ctx). Returns { color, level, chipText }.
  function positionRead(ctx, pos) {
    const vm = ctx.vm;
    const gctx = Object.assign({}, ctx, { lev: Object.assign({}, ctx.lev, { dir: pos.side }) });
    const v = dangerVerdict(vm, gctx, null, pos.liquidationPx, pos.side);
    const mv = v.moves != null ? v.moves.toFixed(1) + ' moves' : null;
    let chipText;
    if (v.level === 'unknown') chipText = 'reading risk…';
    else if (v.level === 'critical') chipText = v.onI >= HEAT_HI ? ('liq ON a cluster' + (mv ? ' · ' + mv : '')) : ('liq only ' + (mv || 'a hair') + ' away');
    else if (v.level === 'warn') chipText = v.pathI >= HEAT_HI ? ('cluster in path' + (mv ? ' · liq ' + mv : '')) : ('liq ' + (mv || 'close') + ' away');
    else chipText = 'liq clear' + (mv ? ' · ' + mv : '');
    return { color: v.level === 'unknown' ? 'dim' : v.color === 'red' ? 'red' : v.color === 'orange' ? 'orange' : 'mint', level: v.level, chipText, verdict: v };
  }

  // the liq the chart is reading (guardian real liq, else the planner's).
  function currentLiq(ctx) {
    if (guardianActive(ctx)) return { liqPx: ctx.position.liquidationPx, isLong: ctx.position.side !== 'short' };
    const ev = levEval(ctx.vm, ctx.lev);
    return (ev && ev.liqPx != null) ? { liqPx: ev.liqPx, isLong: ctx.lev.dir !== 'short' } : null;
  }
  // SURVIVED THE WICK: in the visible candles, a wick stabbed to within ~1.5% of
  // the liq (on the safe side — didn't liquidate) and price RECOVERED. Returns
  // the closest such wick, or null (then the wick share card isn't offered).
  function detectWick(ctx) {
    const cd = ctx.candles; if (!cd || !cd.candles || !cd.candles.length) return null;
    const cl = currentLiq(ctx); if (!cl || cl.liqPx == null || cl.liqPx <= 0) return null;
    const liqPx = cl.liqPx, isLong = cl.isLong, cs = cd.candles;
    let best = null;
    for (const k of cs) {
      const extreme = isLong ? k.l : k.h;
      const dist = isLong ? (extreme - liqPx) / liqPx : (liqPx - extreme) / liqPx;   // >0 = safe side (held)
      if (dist > 0 && dist <= 0.015) { if (!best || dist < best.dist) best = { wickPx: extreme, dist: dist, t: k.t }; }
    }
    if (!best) return null;
    const mark = ctx.vm.markPx, curDist = isLong ? (mark - liqPx) / liqPx : (liqPx - mark) / liqPx;
    if (!(curDist > best.dist * 1.5)) return null;   // still hovering the wick → didn't recover
    return { wickPx: best.wickPx, distPct: best.dist * 100, isLong: isLong, liqPx: liqPx };
  }

  // ===== PORTFOLIO CARD renderer (account header · cross-liq hero · net/corr ·
  // risk-sorted positions · what-if stress). Compact, no user-supplied HTML. =====
  function updatePortfolio(container, ctx) {
    const el = container.querySelector('.hlx-portfolio'); if (!el) return;
    const s = container.__hlx, stats = portfolioStats(ctx.portfolio), acct = stats.acct;
    const ms = acct && acct.marginSummary;
    const av = ms ? ms.accountValue : null, tn = ms ? ms.totalNtlPos : null, tmu = ms ? ms.totalMarginUsed : null;
    const totLev = (av && tn) ? tn / av : null, free = (av != null && tmu != null) ? av - tmu : null;
    const util = (av > 0 && tmu != null) ? tmu / av : null;
    const hCls = util == null ? '' : (util >= 0.85 ? 'hlx-neg' : util >= 0.6 ? 'hlx-warn' : 'hlx-pos');
    let html = '<div class="hlx-pf-head">' +
      '<span class="hlx-pf-kv">acct <b>' + VM.fmtUsd(av) + '</b></span>' +
      '<span class="hlx-pf-kv">ntl <b>' + VM.fmtUsd(tn) + '</b></span>' +
      '<span class="hlx-pf-kv">lev <b>' + (totLev != null ? totLev.toFixed(1) + '×' : '—') + '</b></span>' +
      '<span class="hlx-pf-kv">free <b>' + VM.fmtUsd(free) + '</b></span></div>' +
      '<div class="hlx-pf-health" title="Margin used ' + (util != null ? (util * 100).toFixed(0) + '%' : '—') + ' of account value"><span class="hlx-pf-health-fill ' + hCls + '" style="width:' + (util != null ? Math.min(100, util * 100).toFixed(0) : 0) + '%"></span></div>';
    // account-wide cross liquidation — the hero
    const cl = crossLiq(stats);
    if (cl) {
      if (cl.none) html += '<div class="hlx-pf-cross hlx-pos">✓ all positions isolated — no shared-margin risk</div>';
      else if (cl.hedged) html += '<div class="hlx-pf-cross hlx-pos">✓ cross book is net-flat — hedged, no directional shared-margin liq</div>';
      else if (cl.unknown) html += '<div class="hlx-pf-cross hlx-dim">cross margin data unavailable</div>';
      else {
        const pct = cl.mLiq * 100, cls = pct < 8 ? 'hlx-neg' : pct < 20 ? 'hlx-warn' : 'hlx-pos';
        html += '<div class="hlx-pf-cross ' + cls + '" title="First-order estimate: cross buffer (equity − maintenance) ÷ |net cross notional|. Assumes a correlated move with maintenance margin held ~constant — real liquidation is path-dependent.">⚠ CROSS BOOK liquidates on a ~' + (pct < 1 ? '<1' : pct.toFixed(0)) + '% ' + cl.dir + ' market move' + (cl.drag ? ' · biggest drag <b>' + cl.drag.coin + '</b> (' + (cl.dragShare * 100).toFixed(0) + '%)' : '') + '</div>';
      }
    }
    // net exposure + correlation flag (the degen killer)
    const ne = netExposure(stats);
    if (ne) {
      html += '<div class="hlx-pf-net">net <b class="' + (ne.side === 'long' ? 'hlx-pos' : 'hlx-neg') + '">' + (Math.abs(ne.netPct) * 100).toFixed(0) + '% ' + ne.side + '</b> of notional</div>';
      if (ne.flagged) html += '<div class="hlx-pf-corr hlx-neg">⚠ ' + (Math.abs(ne.majNet) * 100).toFixed(0) + '% net ' + ne.majSide + ' across correlated majors — one market dump hits the whole book</div>';
    }
    // HEDGE-LEG AMPUTATION (Oct-10 failure mode): offsetting legs + the winning
    // leg ADL-exposed → the hedge can be force-closed out from under the book.
    const hr = hedgeRisk(stats);
    if (hr) html += '<div class="hlx-pf-corr hlx-neg" title="ADL force-closes the PROFITABLE leg of a hedge first (that is what happened Oct 10 2025) — the rest of the book is left directional. Estimated from profit×leverage ranking vs the tracked whale set — not an official queue position.">⚠ hedge risk: your ' + hr.legSide.toUpperCase() + ' leg (' + hr.leg.coin + ') is ADL-exposed — a squeeze can amputate it and leave you naked ' + hr.nakedSide + '</div>';
    // positions, risk-sorted (closest to liq first; unknown-distance last)
    const rows = stats.positions.slice().sort((a, b) => (a.moves == null ? 1e9 : a.moves) - (b.moves == null ? 1e9 : b.moves));
    html += '<div class="hlx-pf-list">';
    for (const p of rows) {
      const color = posRiskColor(p), pnlCls = p.unrealizedPnl >= 0 ? 'hlx-pos' : 'hlx-neg';
      const mv = p.moves != null ? p.moves.toFixed(1) + 'mv' : '—';
      const adl = p.adl && p.adl.ok && p.adl.tier && p.adl.tier !== 'none' && p.adl.tier !== 'unknown' && !p.adl.loading
        ? '<span class="hlx-pf-adl hlx-' + (p.adl.tier === 'high' ? 'neg' : p.adl.tier === 'elevated' ? 'warn' : 'pos') + '" title="Estimated ADL exposure: top ' + p.adl.topPct + '% profit×lev among tracked ' + p.coin + ' ' + p.side + 's — estimated from HL&#39;s documented ADL priority, not an official queue position.">ADL</span>' : '';
      html += '<div class="hlx-pf-row" data-coin="' + p.coin + '" title="Switch the chart to ' + p.coin + ' (guardian)">' +
        '<span class="hlx-pf-dot hlx-risk-' + color + '"></span>' +
        '<span class="hlx-pf-coin">' + p.coin + '</span>' +
        '<span class="hlx-pf-side ' + (p.side === 'long' ? 'hlx-pos' : 'hlx-neg') + '">' + p.side + (p.leverage ? ' ' + p.leverage + '×' : '') + '</span>' +
        '<span class="hlx-pf-tag' + (p.levType === 'cross' ? ' hlx-pf-crosstag' : '') + '">' + (p.levType === 'cross' ? 'CROSS' : 'ISO') + '</span>' + adl +
        '<span class="hlx-pf-pnl ' + pnlCls + '">' + VM.fmtUsd(p.unrealizedPnl) + '</span>' +
        '<span class="hlx-pf-liq">liq ' + VM.fmtPrice(p.liquidationPx) + '</span>' +
        '<span class="hlx-pf-mv hlx-' + (color === 'red' ? 'neg' : color === 'orange' ? 'warn' : 'pos') + '">' + mv + '</span></div>';
    }
    html += '</div>';
    // what-if stress (down-move presets)
    const sx = (s && s._stressX != null) ? s._stressX : 0.1, st = stressTest(stats, sx, cl);
    html += '<div class="hlx-pf-stress"><span class="hlx-pf-stress-lbl">market</span>' +
      [0.05, 0.10, 0.20].map((x) => '<button class="hlx-pf-sbtn ' + (Math.abs(x - sx) < 1e-6 ? 'on' : '') + '" data-x="' + x + '">−' + (x * 100) + '%</button>').join('') +
      '<span class="hlx-pf-stress-res">' + (st.newBuffer != null ? 'cross buffer ' + VM.fmtUsd(st.newBuffer) : '') +
      (st.liq.length ? ' · <b class="hlx-neg">' + st.liq.slice(0, 4).join(', ') + (st.liq.length > 4 ? '…' : '') + ' liq</b>' : ' · <span class="hlx-pos">none liq</span>') + '</span></div>';
    el.innerHTML = html;
  }

  // STRUCTURE-RATCHET trail: the suggested level to move your stop to — just
  // beyond the nearest big wall on the PROFIT-protecting side of price (below
  // for a long, above for a short), + buffer. Recomputes live as walls are
  // consumed. HL has no native trailing orders — descriptive only.
  function trailLevel(vm, ctx, s) {
    const plan = clusterPlan(vm, ctx, s); if (!plan) return null;
    const wall = nearestBig(getProfile(s, ctx), vm.markPx, plan.isLong);
    if (!wall) return null;
    const px = plan.isLong ? wall.price - plan.hw - plan.buf : wall.price + plan.hw + plan.buf;
    return { px, wall };
  }
  // ONE quiet cluster-aware line: read the stop vs the walls + a one-tap snap
  // (planner), plus the ratchet-trail line (both modes — guardian recomputes
  // live as walls get consumed).
  function updateGuide(container, ctx) {
    const el = container.querySelector('.hlx-guide'); if (!el) return;
    const s = container.__hlx, vm = ctx.vm;
    const plan = clusterPlan(vm, ctx, s);
    if (!plan) { el.innerHTML = ''; return; }
    const guard = guardianActive(ctx);
    const tr = trailLevel(vm, ctx, s);
    const trailHtml = tr ? '<div class="hlx-trail-line" title="Suggested structure-ratchet: as price moves your way and walls get consumed, move your stop to just behind the nearest big wall. Hyperliquid has no native trailing orders — this is the suggested level to move your stop to (descriptive, not advice).">trail stop → <b>' + VM.fmtPrice(tr.px) + '</b> <span class="hlx-dim">(behind the ' + usdM(tr.wall.total) + ' wall)</span></div>' : '';
    if (guard) { el.innerHTML = trailHtml; return; }   // guardian: just the ratchet line
    const r = ctx.risk || {}; r.dir = ctx.lev.dir;
    const curStop = stopPrice(vm, r);
    const es = curStop != null ? evalStop(plan, curStop) : null;
    const word = plan.isLong ? 'below' : 'above';
    const sSug = VM.fmtPrice(plan.suggestedStop);
    let msg, cls;
    if (!es) { msg = 'no stop set — snap ' + word + ' the wall at ' + sSug; cls = 'hlx-dim'; }
    else if (es.level === 'ok') { msg = '✓ stop clear of the walls'; cls = 'hlx-pos'; }
    else { msg = '⚠ stop in the sweep path — move ' + word + ' to ' + sSug; cls = es.color === 'red' ? 'hlx-neg' : 'hlx-warn'; }
    el.innerHTML = '<div class="hlx-guide-row"><span class="hlx-guide-txt ' + cls + '">' + msg + '</span>' +
      '<button class="hlx-snap" title="Move SL & TP to the cluster-aware prices (read-only — no order placed)">snap</button></div>' + trailHtml;
  }

  // ---- Lightweight Charts lifecycle (LWC provides the price/time scale + native
  // scroll/zoom; we draw the heat + candles + overlay lines positioned via its
  // priceToCoordinate / timeToCoordinate). ----
  function candleData(ctx) { const cd = ctx.candles; if (!cd || !cd.candles) return []; return cd.candles.map((k) => ({ time: Math.floor(k.t / 1000), open: k.o, high: k.h, low: k.l, close: k.c })); }
  function desiredRange(ctx) {
    const vm = ctx.vm, cd = ctx.candles; let lo = Infinity, hi = -Infinity;
    if (cd && cd.candles) for (const k of cd.candles) { if (k.l < lo) lo = k.l; if (k.h > hi) hi = k.h; }
    // pull the major NEARBY liquidation walls into view (within ±9% of mark) so
    // the profile's actionable clusters are on-screen even on tight candle ranges.
    if (vm.markPx && Array.isArray(vm.liqLevels)) {
      for (const l of vm.liqLevels) { if (l.price == null) continue; if (Math.abs(l.price - vm.markPx) / vm.markPx <= 0.09) { if (l.price < lo) lo = l.price; if (l.price > hi) hi = l.price; } }
    }
    const ev = levEval(vm, ctx.lev); const extra = [vm.markPx];
    if (guardianActive(ctx)) {                 // real position: keep its liq + entry on-screen
      if (ctx.position.liquidationPx != null) extra.push(ctx.position.liquidationPx);
      if (ctx.position.entryPx != null) extra.push(ctx.position.entryPx);
    } else if (ev && ev.liqPx != null) extra.push(ev.liqPx);
    const r = ctx.risk || {}; r.dir = guardianActive(ctx) ? ctx.position.side : ctx.lev.dir;
    const sp = stopPrice(vm, r); if (sp != null) extra.push(sp);
    const tp = tpPrice(vm, r); if (tp != null) extra.push(tp);
    if (r.trailPct) extra.push(vm.markPx * (leverIsLong(r) ? 1 - r.trailPct / 100 : 1 + r.trailPct / 100));
    for (const v of extra) { if (v == null) continue; if (v < lo) lo = v; if (v > hi) hi = v; }
    if (!(hi > lo)) { hi = vm.markPx * 1.05; lo = vm.markPx * 0.95; }
    const pad = (hi - lo) * 0.08; return { lo: lo - pad, hi: hi + pad };
  }
  function setAnchor(ctx, s) {
    if (!s.anchor || !ctx.candles || !ctx.candles.candles || !ctx.candles.candles.length) return;
    const cs = ctx.candles.candles, t0 = Math.floor(cs[0].t / 1000), t1 = Math.floor(cs[cs.length - 1].t / 1000), r = desiredRange(ctx);
    try { s.anchor.setData([{ time: t0, value: r.lo }, { time: t1, value: r.hi }]); } catch {}
  }
  function mountChart(container, ctx, s) {
    const host = container.querySelector('.hlx-chart-lwc');
    if (!host) return;
    const Lib = LC();
    if (!Lib || typeof Lib.createChart !== 'function') { host.innerHTML = '<div class="hlx-chart-err">chart engine failed to load</div>'; try { console.error('[HypeLens] LightweightCharts missing'); } catch {} return; }
    // Defer creation until the just-shown window has REAL layout dimensions.
    s.mounting = true; let tries = 0;
    const build = () => {
      if (container.__hlx !== s || s.chart) return;
      if (!document.body.contains(container)) { s.mounting = false; return; }
      const W = host.clientWidth, H = host.clientHeight;
      if ((!W || !H) && tries < 40) { tries++; requestAnimationFrame(build); return; }
      try { console.log('[HypeLens] mountChart: host', W, '×', H, '(after ' + tries + ' frames)'); } catch {}
      createChartNow(container, s.ctx || ctx, s, host, W || 360, H || 300);
    };
    requestAnimationFrame(build);
  }
  function createChartNow(container, ctx, s, host, W, H) {
    const Lib = LC(); if (!Lib) { s.mounting = false; return; }
    const chart = Lib.createChart(host, {
      width: W, height: H,
      layout: { background: { color: 'transparent' }, textColor: '#5A6472', fontSize: 10, fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.045)' }, horzLines: { color: 'rgba(255,255,255,0.045)' } },
      rightPriceScale: { borderColor: '#21262F', scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderColor: '#21262F', timeVisible: false, secondsVisible: false, rightOffset: 4 },
      crosshair: { mode: 0, horzLine: { color: 'rgba(255,255,255,0.25)', labelVisible: false, style: 2 }, vertLine: { color: 'rgba(255,255,255,0.2)', labelVisible: false, style: 2 } },
      handleScroll: true, handleScale: true
    });
    // Transparent LWC candle series — kept for the price/time scale + native
    // scroll/zoom + coordinate maps. The candles the user SEES are drawn by us,
    // opaque, on the overlay (drawCandles), positioned via priceToCoordinate.
    const TR = 'rgba(0,0,0,0)';
    const series = chart.addCandlestickSeries({ upColor: TR, downColor: TR, wickUpColor: TR, wickDownColor: TR, borderVisible: false, priceLineVisible: false, lastValueVisible: false });
    const initData = candleData(ctx);
    series.setData(initData);
    s.hadData = initData.length > 0;
    if (s.hadData) { try { chart.timeScale().fitContent(); } catch {} }
    try { console.log('[HypeLens] chart created with', initData.length, 'candles at', W, '×', H); } catch {}
    const anchor = chart.addLineSeries({ color: 'rgba(0,0,0,0)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    s.chart = chart; s.series = series; s.anchor = anchor;
    s.heat = container.querySelector('.hlx-heat'); s.overlay = container.querySelector('.hlx-overlay'); s.lwcEl = host; s.cross = container.querySelector('.hlx-cross');
    setAnchor(ctx, s);
    // floating crosshair readout: price + real liq notional at that level
    try {
      chart.subscribeCrosshairMove((param) => {
        const tip = s.cross; if (!tip) return;
        if (!param || !param.point || param.point.y == null) { tip.style.display = 'none'; return; }
        const price = s.series.coordinateToPrice(param.point.y); if (price == null) { tip.style.display = 'none'; return; }
        const b = s.profile ? profileAt(s.profile, price) : null;
        const pct = (b && b.total > 0) ? ' <span class="hlx-dim">' + (b.side === 'long' ? 'long-liq ' : 'short-liq ') + VM.fmtUsd(b.total) + '</span>' : '';
        tip.innerHTML = VM.fmtPrice(price) + pct;
        const wrap = container.querySelector('.hlx-chart-wrap'), wr = wrap.getBoundingClientRect();
        tip.style.display = 'block';
        tip.style.left = Math.min(wr.width - 130, param.point.x + 12) + 'px';
        tip.style.top = Math.max(2, param.point.y - 26) + 'px';
      });
    } catch {}
    const ro = new ResizeObserver(() => { const w = host.clientWidth || W, h = host.clientHeight || H; try { chart.applyOptions({ width: w, height: h }); } catch (e) {} s.heatDirty = true; });
    ro.observe(host); const wrapEl = container.querySelector('.hlx-chart-wrap'); if (wrapEl) try { ro.observe(wrapEl); } catch (e) {}
    s.ro = ro;
    s.mounting = false;
    startLoop(container, s);
    attachInteraction(container, s);
    s.heatDirty = true;
    try { console.log('[HypeLens] chart mounted & drawing'); } catch {}
  }
  function updateChartData(container, ctx, s) {
    if (!s.series) return;
    const data = candleData(ctx);
    const ts = s.chart.timeScale(), range = s.hadData ? ts.getVisibleLogicalRange() : null;
    s.series.setData(data); setAnchor(ctx, s);
    s.heatDirty = true;
    if (data.length && !s.hadData) {
      s.hadData = true; try { ts.fitContent(); } catch {}
      try { console.log('[HypeLens] candles set:', data.length, '→ fitContent (scale established)'); } catch {}
    } else if (range) { try { ts.setVisibleLogicalRange(range); } catch {} }
  }

  // ===== VPVR-STYLE LIQUIDATION PROFILE (REAL positions) =====
  // Like TradingView's Volume Profile, but for LIQUIDATIONS. We take the REAL
  // liquidation levels (top-wallet open positions: each an [liqPx, notional,
  // side]), bucket them by price (~0.4% of mark), and sum notional per bucket.
  // Each bucket = a horizontal bar whose LENGTH ∝ real liquidation notional
  // stacked at that price → you READ the liquidation walls directly. LONG-liq
  // (below mark) = red downside-cascade fuel · SHORT-liq (above mark) = teal
  // upside-squeeze fuel. The biggest bucket = Point of Control.
  const PROFILE_BAND = 0.40;                 // ±40% of mark considered
  function levelsHash(levels) { let h = 0; for (const l of levels) { h = (h * 31 + ((l.price || 0) | 0) + ((l.sizeUsd || 0) | 0)) | 0; } return h; }
  function profileKey(ctx) {
    const lv = ctx.vm.liqLevels || [];
    return ctx.vm.coin + '|' + lv.length + '|' + levelsHash(lv) + '|' + ctx.vm.markPx;
  }
  function buildProfile(ctx) {
    const vm = ctx.vm, mark = vm.markPx; if (!mark) return null;
    const levels = vm.liqLevels || [];
    const bucketW = mark * 0.004;             // ~0.4% price buckets
    const bins = new Map();
    for (const lv of levels) {
      const px = lv.price; if (px == null || px <= 0) continue;
      if (Math.abs(px - mark) / mark > PROFILE_BAND) continue;
      const k = Math.round(px / bucketW);
      const b = bins.get(k) || { long: 0, short: 0 };
      if (lv.side === 'long') b.long += lv.sizeUsd; else b.short += lv.sizeUsd;
      bins.set(k, b);
    }
    const buckets = []; let maxUsd = 0, totalLong = 0, totalShort = 0;
    for (const [k, b] of bins) {
      const price = k * bucketW, total = b.long + b.short, side = b.long >= b.short ? 'long' : 'short';
      buckets.push({ price, long: b.long, short: b.short, total, side });
      if (total > maxUsd) maxUsd = total; totalLong += b.long; totalShort += b.short;
    }
    buckets.sort((a, b) => a.price - b.price);
    const ranked = buckets.slice().sort((a, b) => b.total - a.total);
    return { mark, bucketW, buckets, ranked, poc: ranked[0] || null, maxUsd,
      totalLong, totalShort, sig: 0.12 * (maxUsd || 1), source: vm.liqLevelsSource || null, n: levels.length };
  }
  function getProfile(s, ctx) {
    if (!s) return buildProfile(ctx);
    const key = profileKey(ctx);
    if (s.profKey !== key || !s.profile) { s.profile = buildProfile(ctx); s.profKey = key; }
    return s.profile;
  }
  // notional bucket at a price (for the crosshair readout)
  function profileAt(profile, price) {
    if (!profile || price == null) return null;
    const k = Math.round(price / profile.bucketW);
    for (const b of profile.buckets) if (Math.round(b.price / profile.bucketW) === k) return b;
    return null;
  }
  // visible buckets (with their y coordinate) for the current price axis
  function visClusters(profile, series, H) {
    const out = [];
    for (const b of profile.buckets) { const y = series.priceToCoordinate(b.price); if (y == null || y < -4 || y > H + 4) continue; out.push({ b, y }); }
    return out;
  }
  // ---- OFF-SCREEN WALL CONTEXT (v0.21.2): a truthfully-sparse visible range
  // must not read as "broken/empty" — big walls OUTSIDE the viewport become
  // edge chips, and a thin book gets ONE honest context line. NO fake density,
  // no smoothing — context only. ----
  // Pure: which ≥$10M walls sit outside the visible price range {lo,hi}?
  // ≤2 per side → one chip each; >2 → ONE aggregate chip per side.
  function edgeChips(profile, mark, range) {
    if (!profile || !mark || !range || !(range.hi > range.lo)) return { top: [], bottom: [] };
    const walls = profile.buckets.filter((b) => b.total >= BIG_WALL);
    const mk = (b) => ({ price: b.price, usd: b.total, agg: false });
    const side = (arr, above) => {
      if (!arr.length) return [];
      if (arr.length <= 2) return arr.slice().sort((a, b) => b.total - a.total).map(mk);
      // >2 walls beyond this edge → aggregate into one chip (drill opens the biggest)
      const total = arr.reduce((s2, b) => s2 + b.total, 0);
      const biggest = arr.slice().sort((a, b) => b.total - a.total)[0];
      const nearest = above ? Math.min.apply(null, arr.map((b) => b.price)) : Math.max.apply(null, arr.map((b) => b.price));
      return [{ price: biggest.price, usd: total, agg: true, count: arr.length, nearest, side: above ? 'short' : 'long' }];
    };
    return { top: side(walls.filter((b) => b.price > range.hi), true), bottom: side(walls.filter((b) => b.price < range.lo), false) };
  }
  function edgeChipHtml(chip, above, mark) {
    const arrow = above ? '▲' : '▼', cls = above ? 'hlx-pos' : 'hlx-neg';
    const pct = mark ? (((chip.agg ? chip.nearest : chip.price) - mark) / mark) * 100 : null;
    const pctTxt = pct != null ? ' (' + (pct > 0 ? '+' : '−') + Math.abs(pct).toFixed(0) + '%)' : '';
    const body = chip.agg
      ? usdM(chip.usd) + ' ' + (above ? 'shorts' : 'longs') + ' ' + shortPx(chip.nearest) + (above ? '+' : '−') + pctTxt
      : usdM(chip.usd) + ' @ ' + shortPx(chip.price) + pctTxt;
    return '<button class="hlx-wall-chip hlx-edge-chip ' + cls + '" data-price="' + chip.price + '" title="' +
      (chip.agg ? chip.count + ' walls ≥$10M beyond this edge (' + usdM(chip.usd) + ' total) — off-screen, not gone. Tap for the biggest wall&#39;s wallets.' :
        usdM(chip.usd) + ' in real liqs at ' + VM.fmtPrice(chip.price) + ' — outside the visible range. Tap for the wallets behind it.') +
      '">' + arrow + ' ' + body + '</button>';
  }
  function renderEdgeChips(container, ctx, s) {
    const top = container.querySelector('.hlx-edge-top'), bot = container.querySelector('.hlx-edge-bot');
    if (!top || !bot) return;
    let range = null;
    try {
      const H = s && s.lwcEl ? s.lwcEl.clientHeight : 0;
      if (s && s.series && H > 10) {
        const a = s.series.coordinateToPrice(0), b = s.series.coordinateToPrice(H);
        if (a != null && b != null) range = { lo: Math.min(a, b), hi: Math.max(a, b) };
      }
    } catch (e) {}
    if (!range) { top.innerHTML = ''; bot.innerHTML = ''; return; }
    const ec = edgeChips(getProfile(s, ctx), ctx.vm.markPx, range);
    top.innerHTML = ec.top.map((c) => edgeChipHtml(c, true, ctx.vm.markPx)).join('');
    bot.innerHTML = ec.bottom.map((c) => edgeChipHtml(c, false, ctx.vm.markPx)).join('');
  }
  // Pure: thin-book read — fewer than 2 walls ≥$10M within ±15% of mark.
  // Returns null on a dense book; else the honest context numbers.
  function thinBook(profile, mark) {
    if (!profile || !mark) return null;
    const walls = profile.buckets.filter((b) => b.total >= BIG_WALL);
    const inRange = walls.filter((b) => Math.abs(b.price - mark) / mark <= 0.15);
    if (inRange.length >= 2) return null;
    const below = walls.filter((b) => b.price < mark).sort((a, b) => b.price - a.price)[0] || null;
    const above = walls.filter((b) => b.price > mark).sort((a, b) => a.price - b.price)[0] || null;
    return { inRange: inRange.length, nearBelow: below, nearAbove: above, anyWalls: walls.length > 0 };
  }
  function thinBookHtml(tb) {
    if (!tb) return '';
    const near = [tb.nearBelow, tb.nearAbove].filter(Boolean).map((w) => shortPx(w.price)).join(' / ');
    const tail = tb.anyWalls && near ? ' · whales are low-leverage, nearest liqs ' + near : ' · tracked whales carry no big liq walls here';
    return '<div class="hlx-thinbook" title="Not a bug — the tracked whale set genuinely has ' + (tb.inRange === 0 ? 'no' : 'only ' + tb.inRange) + ' liquidation wall' + (tb.inRange === 1 ? '' : 's') + ' ≥$10M within ±15% of price. Sparse liqs = whales running LOW leverage — that is itself a market read. No fake density is drawn.">thin book — ' + tb.inRange + ' wall' + (tb.inRange === 1 ? '' : 's') + ' in range' + tail + '</div>';
  }
  function usdM(n) { const m = n / 1e6; return '$' + (m >= 100 ? Math.round(m) : m >= 10 ? Math.round(m) : m.toFixed(1)) + 'M'; }
  const BIG_WALL = 10e6;   // a bucket ≥ $10M counts as a real wall
  const HEAT_HI = 0.5, HEAT_MED = 0.25;   // normalized heat-field intensity thresholds
  // ONE shared sweep horizon (daily moves): a wall within this range of entry is
  // sweep-relevant — the placer stops BEYOND it and the evaluator flags stops
  // parked in front of it. Farther walls are noise for stop placement. Used by
  // BOTH computePlaceLevels and evalStop so they can never contradict.
  const SWEEP_HORIZON = 2.5;
  const LIQ_STOP_RATIO = 1.5;   // ordering rule: liq distance must be ≥ 1.5× stop distance
  // COMBINED danger verdict — a READOUT OF THE RENDERED HEAT the user sees.
  // We sample the SAME viridis field at the liq price (on-cluster) and along the
  // path from mark→liq (cluster-in-path), so the words can NEVER contradict the
  // bright bands. Combined with the proximity check (daily-move volatility).
  function dangerVerdict(vm, ctx, s, liqPx, dir) {
    const mark = vm.markPx, dm = ctx.candles ? ctx.candles.dmp : null;
    const field = getHeatField(s, ctx), profile = getProfile(s, ctx);
    const moves = (dm && dm > 0 && liqPx != null && mark) ? Math.abs(liqPx - mark) / mark / dm : null;
    // NO DATA IS NOT SAFETY: without candles (no vol read) AND without a heat
    // field (no wall read) every check below vacuously passes — that must read
    // as UNKNOWN, never 'clear' (which would greenlight any leverage + share card).
    if (moves == null && !field) return { level: 'unknown', color: 'dim', text: 'DATA LOADING — NO READ YET', moves: null, onI: 0, pathI: 0 };
    const mt = moves == null ? '?' : moves.toFixed(1);
    const onI = heatAt(field, liqPx);                       // intensity AT the liq (what's painted)
    const path = heatPathMax(field, mark, liqPx);           // brightest band between mark & liq
    const onLabel = (function () { const n = localNotional(profile, liqPx, 0.008); return n > 0 ? usdM(n) + ' CLUSTER' : 'A CLUSTER'; })();
    // 1) proximity — normal volatility alone reaches the liq (dominant at high lev)
    if (moves != null && moves < 1.2) return { level: 'critical', color: 'red', text: '⚠ LIQ ONLY ' + mt + ' DAILY MOVES AWAY', moves, onI, pathI: path.max };
    // 2) liq sits ON a bright band
    if (onI >= HEAT_HI) return { level: 'critical', color: 'red', text: '⚠ LIQ ON ' + onLabel, moves, onI, pathI: path.max };
    // 3) a bright band lies in the path between mark and the liq
    if (path.max >= HEAT_HI) { const pn = localNotional(profile, path.price, 0.008); return { level: 'warn', color: 'orange', text: '⚠ ' + (pn > 0 ? usdM(pn) + ' ' : '') + 'CLUSTER IN PATH', moves, onI, pathI: path.max }; }
    // 4) liq near a moderate band
    if (onI >= HEAT_MED) return { level: 'warn', color: 'orange', text: '⚠ LIQ NEAR ' + onLabel, moves, onI, pathI: path.max };
    // 5) moderate proximity
    if (moves != null && moves < 2.5) return { level: 'warn', color: 'orange', text: 'LIQ ' + mt + ' DAILY MOVES AWAY', moves, onI, pathI: path.max };
    // CLEAR — heat genuinely low AT the liq AND all along the path
    return { level: 'clear', color: 'green', text: '✓ CLEAR · ' + mt + ' MOVES, NO WALLS', moves, onI, pathI: path.max };
  }
  // ---- CASCADE: the predictive "gravity" read — ONE line, both sides. ----
  // compact price: $57.5k for ≥1000, else the normal price format.
  function shortPx(p) { const a = Math.abs(p); return a >= 1000 ? '$' + (p / 1000).toFixed(a >= 100000 ? 0 : 1) + 'k' : VM.fmtPrice(p); }
  function cascadeSeg(c) {
    const down = c.dir === 'down', arrow = down ? '▼' : '▲', cls = down ? 'hlx-neg' : 'hlx-pos';
    const label = c.chain ? (down ? 'cascade' : 'squeeze') : 'wall';
    return '<span class="hlx-casc-seg ' + cls + '">' + arrow + ' <b>' + usdM(c.totalLiqUsd) + '</b> ' + label +
      ' @ ' + VM.fmtPrice(c.triggerPx) + ' → ' + shortPx(c.terminalPx) + '</span>';
  }
  function renderCascadeCard(container, ctx) {
    const el = container.querySelector('.hlx-cascade'); if (!el) return;
    const vm = ctx.vm;
    if (!vm || !vm.markPx || !Array.isArray(vm.liqLevels) || !vm.liqLevels.length) { el.innerHTML = ''; return; }
    const down = VM.computeCascade(vm, 'down'), up = VM.computeCascade(vm, 'up');
    // prefer the chaining side(s); if neither chains, show the single biggest wall.
    const chains = [down, up].filter((c) => c && c.chain);
    let show = chains;
    if (!show.length) { const big = [down, up].filter(Boolean).sort((a, b) => b.totalLiqUsd - a.totalLiqUsd)[0]; show = big ? [big] : []; }
    if (!show.length) { el.innerHTML = ''; return; }
    // PROXY-DEPTH honesty (review F3): without real OI/volume the depth proxy
    // overstates impact by 1/(4·coverage) — nearly everything "chains". Badge it.
    // STALE-DATA honesty (v0.21.1): bundled walls >24h old → dim + stale suffix,
    // never an alarming red cascade built from a fossil snapshot.
    const proxy = show.some((c) => c.depthSource === 'proxy');
    const stale = dataStale(vm);
    el.innerHTML = '<div class="hlx-casc-line' + (proxy || stale ? ' hlx-dim' : '') + '" title="Modeled cascade · real positions, estimated impact. Price entering a real liq cluster forces those liquidations → forced orders push price further → can reach the next cluster. The impact is an ESTIMATE, not a certain price.' + (proxy ? ' LOW CONFIDENCE: no open-interest/volume data for this coin — impact modeled from tracked liqs only and likely overstated.' : '') + (stale ? ' STALE: walls are from an offline snapshot older than 24h — positions have moved; wait for the live crawl.' : '') + '">' +
      show.map(cascadeSeg).join('<span class="hlx-casc-dot"> · </span>') + (proxy ? '<span class="hlx-casc-tag"> · low confidence</span>' : '') + (stale ? '<span class="hlx-casc-tag"> · stale data</span>' : '') + '</div>';
  }

  // ===== ADL EXPOSURE (estimated · profit×lev rank — HL's documented ADL =====
  // priority is (mark/entry)·(notional/account_value); no public API field
  // exposes the official tier, so this is clearly labeled an ESTIMATE).
  function adlSeg(pos, coin) {
    const a = pos && pos.adl; if (!a || !a.ok) return '';
    const side = (pos.side || 'long') + 's';
    if (a.loading) return '<span class="hlx-adl hlx-dim" title="Estimated ADL exposure — crawling the whale set…">ADL …</span>';
    if (a.eligible === false) return '<span class="hlx-adl hlx-pos" title="Estimated ADL exposure: none — ADL force-closes PROFITABLE positions first and this position is not in profit. Estimated from profit×leverage ranking (HL&#39;s documented ADL priority), not an official queue position.">ADL none</span>';
    if (a.tier === 'unknown') return '<span class="hlx-adl hlx-dim" title="Estimated ADL exposure — too few comparable whale positions to rank yet.">ADL ?</span>';
    const cls = a.tier === 'high' ? 'hlx-neg' : a.tier === 'elevated' ? 'hlx-warn' : 'hlx-pos';
    return '<span class="hlx-adl ' + cls + '" title="Estimated ADL exposure: top ' + a.topPct + '% profit×lev among tracked ' + coin + ' ' + side + ' (n=' + a.n + '). If the other side blows through the backstop, the MOST profitable · most leveraged get force-closed first (Oct 10 failure mode). Estimated from HL&#39;s documented ADL priority — not an official queue position.">ADL ' + a.tier + (a.tier !== 'low' ? ' · top ' + a.topPct + '%' : '') + '</span>';
  }
  // HEDGE-LEG AMPUTATION (the exact Oct-10 failure mode): the book holds
  // offsetting long+short legs across correlated majors AND the profitable leg
  // is ADL-exposed → a squeeze can force-close that leg and leave the book
  // naked on the other side.
  function hedgeRisk(stats) {
    if (!stats || !stats.positions) return null;
    const majors = stats.positions.filter((p) => CORR_MAJORS.has((p.coin || '').toUpperCase()));
    let mLong = 0, mShort = 0;
    for (const p of majors) { if (p.szi > 0) mLong += p.ntl; else mShort += p.ntl; }
    const gross = mLong + mShort;
    if (!(gross > 0) || !(Math.min(mLong, mShort) / gross >= 0.25)) return null;   // not a real hedge
    const exposed = majors.filter((p) => p.adl && p.adl.tier === 'high');
    if (!exposed.length) return null;
    const leg = exposed.sort((a, b) => b.ntl - a.ntl)[0];
    const nakedSide = leg.szi > 0 ? 'short' : 'long';
    return { leg, legSide: leg.side, nakedSide };
  }

  // ===== NAMED-WHALE LIQ DRILL-DOWN: which wallets compose a cluster? =====
  const EXPLORER = 'https://hypurrscan.io/address/';
  function renderWalls(container, ctx) {
    const el = container.querySelector('.hlx-walls'), tw = container.querySelector('.hlx-thinwrap');
    if (!el) return;
    const s = container.__hlx;
    // needs the drill data source (content script); the popup has none → hide
    if (!ctx.onClusterWallets || !ctx.vm || !ctx.vm.markPx) { el.innerHTML = ''; if (tw) tw.innerHTML = ''; return; }
    const profile = getProfile(s, ctx);
    if (!profile || !profile.ranked || !profile.ranked.length) { el.innerHTML = ''; if (tw) tw.innerHTML = ''; return; }
    // THIN-BOOK context line (v0.21.2): a sparse book is information, not a bug.
    if (tw) tw.innerHTML = thinBookHtml(thinBook(profile, ctx.vm.markPx));
    const top = profile.ranked.filter((b) => b.total >= BIG_WALL).slice(0, 3);
    if (!top.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<span class="hlx-walls-lbl" title="The biggest real liquidation walls near price — tap one to see WHICH wallets compose it (top-wallet crawl).">walls</span>' +
      top.map((b) => {
        const below = b.price < ctx.vm.markPx;
        return '<button class="hlx-wall-chip ' + (below ? 'hlx-neg' : 'hlx-pos') + '" data-price="' + b.price + '" title="' + usdM(b.total) + ' in real liqs at ' + VM.fmtPrice(b.price) + ' — tap for the wallets behind it">' + (below ? '▼' : '▲') + ' ' + usdM(b.total) + ' @ ' + shortPx(b.price) + '</button>';
      }).join('');
  }
  async function openDrill(container, ctx, s, price) {
    const el = container.querySelector('.hlx-drill'); if (!el || !ctx.onClusterWallets) return;
    // second tap on the same wall closes it
    if (s && s._drill && Math.abs(s._drill.price - price) < 1e-9) { closeDrill(container, s); return; }
    el.innerHTML = '<div class="hlx-drill-panel"><span class="hlx-dim">looking up wallets…</span></div>';
    let r = null;
    try { r = await ctx.onClusterWallets(ctx.vm.coin, price); } catch (e) {}
    if (!r || !r.ok) { el.innerHTML = ''; if (s) s._drill = null; return; }
    if (s) s._drill = { price, data: r };
    if (r.loading || !r.count) {
      el.innerHTML = '<div class="hlx-drill-panel"><span class="hlx-drill-title">' + VM.fmtPrice(price) + '</span><span class="hlx-dim">' + (r.loading ? 'crawling top wallets — try again in a moment' : 'no tracked wallets in this band') + '</span><button class="hlx-drill-close" title="Close">×</button></div>';
      return;
    }
    const rows = r.wallets.map((w) =>
      '<div class="hlx-drill-row">' +
        '<a class="hlx-drill-addr" href="' + EXPLORER + w.addr + '" target="_blank" rel="noopener noreferrer" title="Open ' + w.addr + ' on Hypurrscan (new tab)">' + w.short + '</a>' +
        '<span class="hlx-drill-side ' + (w.side === 'long' ? 'hlx-pos' : 'hlx-neg') + '">' + w.side + '</span>' +
        '<span class="hlx-drill-val">' + VM.fmtUsd(w.posVal) + '</span>' +
        '<span class="hlx-drill-liq">liq ' + VM.fmtPrice(w.liqPx) + '</span>' +
        '<span class="hlx-drill-dist">' + (w.distPct != null ? (w.distPct > 0 ? '+' : '') + w.distPct.toFixed(1) + '%' : '') + '</span>' +
      '</div>').join('');
    const more = r.count > r.wallets.length ? '<div class="hlx-drill-more">' + (r.count - r.wallets.length) + ' more wallets · ' + usdM(r.totalUsd) + ' total</div>' : '<div class="hlx-drill-more">' + usdM(r.totalUsd) + ' total in this band</div>';
    el.innerHTML = '<div class="hlx-drill-panel">' +
      '<div class="hlx-drill-head"><span class="hlx-drill-title" title="Real per-wallet liquidation prices from the top-wallet crawl — the wallets whose liqs stack at this level.">' + usdM(r.totalUsd) + ' WALL @ ' + VM.fmtPrice(price) + ' · ' + r.count + ' wallets</span>' +
      '<button class="hlx-drill-share" title="Share this wall — branded PNG (levels only, never your own position)">⇪</button><button class="hlx-drill-close" title="Close">×</button></div>' +
      rows + more + '</div>';
  }
  function closeDrill(container, s) { const el = container.querySelector('.hlx-drill'); if (el) el.innerHTML = ''; if (s) s._drill = null; }
  // branded share card for a wall drill-down — cluster levels only, no user data.
  function drawDrillCard(ctx, s, drill) {
    const vm = ctx.vm, W = 1200, H = 675;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const g2 = canvas.getContext('2d');
    const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
    const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    const MINT = '#4FE3C1', RED = '#ff5f6e';
    const d = drill.data, price = drill.price, below = price < vm.markPx, hex = below ? RED : MINT;
    g2.fillStyle = '#08090B'; g2.fillRect(0, 0, W, H);
    g2.fillStyle = '#0C0E12'; g2.fillRect(0, 0, W, 44);
    g2.fillStyle = MINT; g2.beginPath(); g2.arc(38, 22, 5, 0, Math.PI * 2); g2.fill();
    g2.fillStyle = '#9AA4B2'; g2.font = '700 14px ' + MONO; g2.textBaseline = 'middle';
    g2.fillText('HYPELENS · REAL LIQUIDATION WALL · TOP WALLETS · HYPELENS.APP', 56, 23);
    g2.textBaseline = 'alphabetic';
    g2.fillStyle = '#EDF1F6'; g2.font = '900 54px ' + SANS;
    g2.fillText(vm.coin, 60, 122);
    g2.fillStyle = hex; g2.font = '900 40px ' + MONO;
    g2.fillText(usdM(d.totalUsd) + ' IN LIQS STACKED AT ' + VM.fmtPrice(price), 60, 185);
    g2.fillStyle = '#5A6472'; g2.font = '700 15px ' + MONO;
    g2.fillText((below ? 'LONG' : 'SHORT') + ' LIQUIDATION WALL · ' + d.count + ' TRACKED WALLETS · ' + new Date().toISOString().slice(0, 10), 60, 215);
    // wallet rows
    let y = 275;
    g2.font = '700 22px ' + MONO;
    for (const w of d.wallets.slice(0, 6)) {
      g2.fillStyle = '#9AA4B2'; g2.fillText(w.short, 60, y);
      g2.fillStyle = w.side === 'long' ? MINT : RED; g2.fillText(w.side.toUpperCase(), 320, y);
      g2.fillStyle = '#EDF1F6'; g2.fillText(VM.fmtUsd(w.posVal), 480, y);
      g2.fillStyle = hex; g2.fillText('liq ' + VM.fmtPrice(w.liqPx), 740, y);
      g2.fillStyle = '#5A6472'; g2.fillText(w.distPct != null ? (w.distPct > 0 ? '+' : '') + w.distPct.toFixed(1) + '%' : '', 1010, y);
      y += 44;
    }
    if (d.count > d.wallets.length) { g2.fillStyle = '#5A6472'; g2.font = '700 18px ' + MONO; g2.fillText('+ ' + (d.count - d.wallets.length) + ' more wallets', 60, y + 6); }
    g2.fillStyle = '#5A6472'; g2.font = '600 14px ' + MONO;
    g2.fillText('real per-wallet liquidation prices · top-wallet crawl · hypelens.app', 60, H - 40);
    return canvas;
  }
  // SAFE LEVERAGE (the defensive hero): the HIGHEST leverage whose liq is BOTH
  // (a) ≥ ~2 daily moves from mark (beyond normal volatility) AND (b) NOT sitting
  // ON a bright cluster (rendered-heat intensity at the liq < the on-cluster
  // threshold — i.e. the liq lands in a darker GAP, not on a band). A cluster in
  // the PATH is common and does NOT disqualify (that stays a secondary note), so
  // this returns a real number on most coins. null only when even 1× can't get
  // the liq into a gap ≥2 moves out (rare).
  function safeLeverage(vm, ctx, s) {
    const maxL = Math.floor(vm.maxLeverage || 50), dir = ctx.lev.dir, entry = vm.markPx;
    if (!entry) return null;
    for (let L = maxL; L >= 1; L--) if (levClear(vm, ctx, s, L, dir)) return L;
    return null;
  }
  // Is a GIVEN leverage's liq clear? SINGLE SOURCE OF TRUTH: the liq at this
  // leverage must earn the SAME 'clear' verdict the readout shows — not on a
  // wall, no wall in its path, and ≥ ~2.5 daily moves out. Per-leverage (clusters
  // make this NON-monotonic — a lower leverage can be worse than a higher one).
  // Path-inclusive on purpose: if it weren't, "Set N×" could snap you to a
  // leverage the readout then flags "cluster in path", reintroducing the exact
  // hero↔verdict contradiction this whole feature exists to kill.
  function levClear(vm, ctx, s, L, dir) {
    const entry = vm.markPx; if (!entry) return false;
    const lp = VM.liqPrice(entry, L, dir, vm.mmf);
    return dangerVerdict(vm, ctx, s, lp, dir).level === 'clear';
  }
  // NEAREST clear leverage to `curL`, searching BOTH directions. At each radius
  // the DOWN step (farther liq = safer proximity) is preferred over the UP step.
  // null if no leverage 1..maxL is clear.
  function nearestClearLev(vm, ctx, s, curL, dir) {
    const maxL = Math.floor(vm.maxLeverage || 50);
    for (let r = 1; r <= maxL; r++) {
      const dn = curL - r, up = curL + r;
      if (dn >= 1 && levClear(vm, ctx, s, dn, dir)) return dn;
      if (up <= maxL && levClear(vm, ctx, s, up, dir)) return up;
    }
    return null;
  }

  // ===== CLUSTER-AWARE STOP / TP PLACEMENT =====
  // Clusters are MAGNETS: price is pulled INTO them then often bounces. So:
  //  • correct STOP = on the COLD side, BEYOND the nearest big cluster in the
  //    stop direction (+buffer) — only a full cascade THROUGH it invalidates you.
  //  • correct TP = just BEFORE the nearest big cluster in the profit direction
  //    (take profit INTO the magnet where the move exhausts, not through it).
  function bigClusters(profile) { return profile ? profile.buckets.filter((b) => b.total >= BIG_WALL) : []; }
  // nearest big cluster strictly BELOW (dirBelow=true) or ABOVE the entry price.
  function nearestBig(profile, entry, dirBelow) {
    let best = null, bd = Infinity;
    for (const b of bigClusters(profile)) {
      if (dirBelow ? b.price >= entry : b.price <= entry) continue;
      const d = Math.abs(b.price - entry); if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  function clusterPlan(vm, ctx, s) {
    const f = getProfile(s, ctx); if (!f) return null;
    const entry = vm.markPx; if (!entry) return null;
    const dir = guardianActive(ctx) ? ctx.position.side : ctx.lev.dir, isLong = dir !== 'short', dm = ctx.candles ? ctx.candles.dmp : null;
    const buf = entry * Math.max(0.3 * (dm || 0), 0.004);   // overshoot buffer ≈ 0.3·DMOVE or 0.4%
    const hw = f.bucketW / 2;
    const move = entry * (dm || 0.02);                      // one daily move in $
    // stop side = the losing direction; profit side = the winning direction.
    // Only a wall within SWEEP_HORIZON is sweep-relevant (shared w/ evalStop).
    const rawStopCl = nearestBig(f, entry, isLong);         // long: nearest cluster below
    const stopCl = (rawStopCl && Math.abs(rawStopCl.price - entry) <= SWEEP_HORIZON * move) ? rawStopCl : null;
    const tpCl = nearestBig(f, entry, !isLong);             // long: nearest cluster above
    let suggestedStop, tpPrice;
    if (stopCl) suggestedStop = isLong ? (stopCl.price - hw - buf) : (stopCl.price + hw + buf);
    else suggestedStop = isLong ? entry - 1.2 * move : entry + 1.2 * move;   // volatility stop (matches the placer)
    if (tpCl) tpPrice = isLong ? (tpCl.price - hw - buf * 0.5) : (tpCl.price + hw + buf * 0.5);
    else tpPrice = isLong ? entry * (1 + Math.max(2.5 * (dm || 0.02), 0.02)) : entry * (1 - Math.max(2.5 * (dm || 0.02), 0.02));
    // SIDE CHECK (review F1): a magnet a hair beyond entry front-runs to the wrong
    // side of entry — fall back to the no-magnet default rather than a negative TP.
    if (isLong ? tpPrice <= entry : tpPrice >= entry) tpPrice = isLong ? entry * (1 + Math.max(2.5 * (dm || 0.02), 0.02)) : entry * (1 - Math.max(2.5 * (dm || 0.02), 0.02));
    return { entry, dir, isLong, buf, hw, dm, move, stopCl, tpCl, suggestedStop, tpPrice, field: getHeatField(s, ctx) };
  }
  // Evaluate the user's CURRENT stop — cluster geometry AND the rendered heat
  // field (so a stop on a visibly bright band always reads as hunted).
  // stopCl is already horizon-filtered by clusterPlan (SWEEP_HORIZON): a wall
  // 3+ moves away is noise and never triggers a sweep-path warning.
  function evalStop(plan, stopPx) {
    if (!plan || stopPx == null) return null;
    const { isLong, stopCl, hw, field } = plan;
    const bandI = heatAt(field, stopPx);
    if (bandI >= HEAT_HI) return { level: 'critical', color: 'red', text: '⚠ stop ON a bright liquidation cluster — likely hunted' };
    if (!stopCl) return bandI >= HEAT_MED
      ? { level: 'warn', color: 'orange', text: '⚠ stop near a liquidation cluster' }
      : { level: 'ok', color: 'green', text: '✓ no big cluster in the stop path' };
    const lo = stopCl.price - hw, hi = stopCl.price + hw;
    if (stopPx >= lo && stopPx <= hi) return { level: 'critical', color: 'red', text: '⚠ stop ON the ' + usdM(stopCl.total) + ' cluster — likely hunted', cluster: stopCl };
    const beyond = isLong ? (stopPx < lo) : (stopPx > hi);   // cold side, past the far edge
    if (beyond) return { level: 'ok', color: 'green', text: '✓ stop clear beyond the ' + usdM(stopCl.total) + ' cluster', cluster: stopCl };
    return { level: 'warn', color: 'orange', text: '⚠ stop in sweep path before ' + usdM(stopCl.total) + ' cluster — likely hunted', cluster: stopCl };
  }
  // ordering rule: max leverage whose liq distance ≥ LIQ_STOP_RATIO × stop distance
  //   long liqDist = entry·(1/L − mmf)  →  L ≤ 1 / (ratio·stopFrac + mmf)
  function maxLevForStop(stopFrac, mmf) {
    if (!(stopFrac > 0)) return null;
    return Math.max(1, Math.floor(1 / (LIQ_STOP_RATIO * stopFrac + (mmf || 0))));
  }

  // ===== VIRIDIS HEAT FIELD from REAL liquidation levels =====
  // Each REAL level deposits a Gaussian HEAT KERNEL centered at its liq price,
  // weight = its real notional $. Summed over all levels → a smooth vertical
  // density profile that GLOWS bright at the real clusters ($47k, $65.5k, $80k…)
  // and fades between. Baked into a viridis bitmap and stretched across the
  // chart (uniform in time) = the loved glowing heat field, now real-data-driven.
  const HROWS = 280;
  function heatKey(ctx) {
    const lv = ctx.vm.liqLevels || [];
    return 'H|' + ctx.vm.coin + '|' + lv.length + '|' + levelsHash(lv) + '|' + ctx.vm.markPx;
  }
  function buildHeatField(ctx) {
    const vm = ctx.vm, mark = vm.markPx; if (!mark) return null;
    const levels = vm.liqLevels || []; if (!levels.length) return null;
    const lo = mark * (1 - 0.42), hi = mark * (1 + 0.42), span = hi - lo;
    const rowOf = (p) => (hi - p) / span * (HROWS - 1);
    const col = new Float32Array(HROWS);
    const sigmaRows = Math.max(2.5, (mark * 0.007) / span * HROWS);   // ~0.7% price kernel → merges into a field
    const reach = Math.ceil(sigmaRows * 3.2), inv2s2 = 1 / (2 * sigmaRows * sigmaRows);
    for (const lv of levels) {
      const p = lv.price; if (p == null || p < lo || p > hi) continue;
      const w = lv.sizeUsd || 0; if (w <= 0) continue;
      const c = rowOf(p), r0 = Math.max(0, Math.floor(c - reach)), r1 = Math.min(HROWS - 1, Math.ceil(c + reach));
      for (let r = r0; r <= r1; r++) { const dz = r - c; col[r] += w * Math.exp(-dz * dz * inv2s2); }
    }
    // high-percentile normalization so one giant cluster doesn't wash the rest
    const vals = []; for (let r = 0; r < HROWS; r++) if (col[r] > 0) vals.push(col[r]);
    vals.sort((a, b) => a - b);
    const p95 = vals.length ? (vals[Math.floor(vals.length * 0.97)] || vals[vals.length - 1]) : 1;
    return { rows: HROWS, lo, hi, col, p95: p95 || 1 };
  }
  function getHeatField(s, ctx) {
    if (!s) return buildHeatField(ctx);
    const key = heatKey(ctx);
    if (s.heatKey !== key || !s.heatField) { s.heatField = buildHeatField(ctx); s.heatKey = key; s.heatBmpInt = null; }
    return s.heatField;
  }
  // THE shared heat sampler used by liq / stop / TP alike: the MAX normalized
  // intensity (0..1 = col/p95) in a small ± window around a price. The window
  // matches the WIDTH of the glowing band the user actually sees, so a level a
  // hair off a cluster's center still reads as "on the band" (fixes the liq that
  // sat just above a big cluster yet reported clear). halfFrac default ≈ ±1.2%.
  function heatAt(field, price, halfFrac) {
    if (!field || price == null) return 0;
    const span = field.hi - field.lo; if (span <= 0) return 0;
    const hf = halfFrac == null ? 0.012 : halfFrac;
    const rowAt = (p) => Math.round((field.hi - p) / span * (field.rows - 1));
    let r0 = rowAt(price * (1 + hf)), r1 = rowAt(price * (1 - hf));
    if (r0 > r1) { const t = r0; r0 = r1; r1 = t; }
    r0 = Math.max(0, r0); r1 = Math.min(field.rows - 1, r1);
    let mx = 0; for (let r = r0; r <= r1; r++) { if (field.col[r] > mx) mx = field.col[r]; }
    return Math.min(1, mx / (field.p95 || 1));
  }
  // Brightest band strictly BETWEEN a and b. Walks the field's NATIVE rows (not a
  // fixed-count sample grid) so it can NEVER step over a wall — a fixed 32-pt grid
  // skipped the top ~9% of the span, missing walls when mark→liq is a big gap
  // (low leverage). Endpoints trimmed ~0.4% so this complements, not duplicates,
  // the on-cluster check at the ends.
  function heatPathMax(field, a, b) {
    if (!field || a == null || b == null || a === b) return { max: 0, price: null };
    const span = field.hi - field.lo; if (span <= 0) return { max: 0, price: null };
    let lo = Math.min(a, b) * 1.004, hi = Math.max(a, b) * 0.996;
    if (lo >= hi) return { max: 0, price: null };
    const rowAt = (p) => Math.round((field.hi - p) / span * (field.rows - 1));
    let r0 = Math.max(0, rowAt(hi)), r1 = Math.min(field.rows - 1, rowAt(lo));
    if (r0 > r1) { const t = r0; r0 = r1; r1 = t; }
    let mx = 0, mr = -1;
    for (let r = r0; r <= r1; r++) { if (field.col[r] > mx) { mx = field.col[r]; mr = r; } }
    return { max: Math.min(1, mx / (field.p95 || 1)), price: mr < 0 ? null : field.hi - (mr / (field.rows - 1)) * span };
  }
  // Real notional summed in a small ± band around a price (for the $ label — ties
  // the number to the same aggregated density the field glows from).
  function localNotional(profile, price, halfFrac) {
    if (!profile || price == null) return 0;
    let sum = 0; const lo = price * (1 - halfFrac), hi = price * (1 + halfFrac);
    for (const bk of profile.buckets) if (bk.price >= lo && bk.price <= hi) sum += bk.total;
    return sum;
  }
  // bake the vertical density → a 1×rows viridis bitmap (rebuilt on intensity)
  function buildHeatBmp(f, intensity) {
    // intensity slider = contrast: low → soft/washed (gamma ~1.05), high → punchy
    // glowing clusters (gamma ~0.30). Wide range so every step is visible.
    const gamma = 1.28 - intensity * 1.08;
    const off = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(1, f.rows) : Object.assign(document.createElement('canvas'), { width: 1, height: f.rows });
    off.width = 1; off.height = f.rows;
    const octx = off.getContext('2d'); const img = octx.createImageData(1, f.rows), data = img.data, p95 = f.p95 || 1;
    const BASE = 0.05;                                  // faint viridis floor → no black patches
    for (let r = 0; r < f.rows; r++) {
      const raw = Math.pow(Math.min(1, f.col[r] / p95), gamma);
      const I = BASE + (1 - BASE) * raw, idx = (Math.min(1, I) * 255) | 0, o = idx * 4, p = r * 4;
      data[p] = LUT_VIRIDIS[o]; data[p + 1] = LUT_VIRIDIS[o + 1]; data[p + 2] = LUT_VIRIDIS[o + 2]; data[p + 3] = LUT_VIRIDIS[o + 3];
    }
    octx.putImageData(img, 0, 0); return off;
  }
  // width of the plotting area (chart width minus the right price-axis gutter)
  function plotWidth(s, W) {
    let axisW = 0; try { axisW = s.chart.priceScale('right').width() || 0; } catch {}
    return Math.max(20, W - axisW);
  }
  // ---- render the smooth full-width viridis liquidation heat field (positioned
  // by LWC priceToCoordinate) ----
  function drawHeat(container, ctx, s) {
    const heat = s.heat, lwc = s.lwcEl; if (!heat || !lwc || !s.series) return;
    const opacity = (ctx.heat && ctx.heat.opacity != null) ? ctx.heat.opacity : 0.5;   // candles show through
    const inten = (ctx.heat && ctx.heat.intensity != null) ? ctx.heat.intensity : 0.5;
    const W = lwc.clientWidth, H = lwc.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!W || !H) { s.heatDirty = true; return; }
    heat.style.opacity = 1;
    heat.style.width = W + 'px'; heat.style.height = H + 'px'; heat.width = Math.round(W * dpr); heat.height = Math.round(H * dpr);
    const gg = heat.getContext('2d'); gg.setTransform(dpr, 0, 0, dpr, 0, 0);
    const plotW = plotWidth(s, W);
    // solid --bg-1 EVERYWHERE first (the right price-axis gutter keeps this opaque dark)
    gg.globalCompositeOperation = 'source-over'; gg.globalAlpha = 1;
    gg.fillStyle = '#0C0E12'; gg.fillRect(0, 0, W, H);
    // heat wash + field CLIPPED to the plot area
    gg.save(); gg.beginPath(); gg.rect(0, 0, plotW, H); gg.clip();
    { const bg = gg.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0A0B10'); bg.addColorStop(0.5, '#141328'); bg.addColorStop(1, '#0A0B10'); gg.fillStyle = bg; gg.fillRect(0, 0, plotW, H); }
    const f = getHeatField(s, ctx);
    if (f) {
      if (!s.heatBmp || s.heatBmpInt !== inten) { s.heatBmp = buildHeatBmp(f, inten); s.heatBmpInt = inten; }
      const yTop = s.series.priceToCoordinate(f.hi), yBot = s.series.priceToCoordinate(f.lo);
      if (yTop != null && yBot != null && yBot > yTop) {
        gg.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in gg) gg.imageSmoothingQuality = 'high';
        gg.globalCompositeOperation = 'lighter'; gg.globalAlpha = opacity;
        try { gg.drawImage(s.heatBmp, 0, yTop, plotW, yBot - yTop); } catch {}
        gg.globalAlpha = 1; gg.globalCompositeOperation = 'source-over';
      } else { s.heatDirty = true; }
    }
    gg.restore();
  }
  // WE draw the candles ourselves — opaque, on the overlay (z2), positioned via
  // LWC timeToCoordinate / priceToCoordinate. Per candle: dark halo THEN colored.
  function drawCandles(gx, ctx, s, W, H) {
    const cd = ctx.candles; if (!cd || !cd.candles || !cd.candles.length) return false;
    const ts = s.chart.timeScale(), cs = cd.candles;
    let bw = 6; try { const bs = ts.options().barSpacing; if (bs) bw = Math.max(1, bs); } catch {}
    const bodyW = Math.max(1, bw * 0.72), half = bodyW / 2;
    let drew = false;
    gx.globalAlpha = 1; gx.setLineDash([]);
    for (const k of cs) {
      const x = ts.timeToCoordinate(Math.floor(k.t / 1000)); if (x == null || x < -bw || x > W + bw) continue;
      const yH = s.series.priceToCoordinate(k.h), yL = s.series.priceToCoordinate(k.l);
      const yO = s.series.priceToCoordinate(k.o), yC = s.series.priceToCoordinate(k.c);
      if (yH == null || yL == null || yO == null || yC == null) continue;
      drew = true;
      const up = k.c >= k.o, col = up ? '#2bf5ae' : '#ff5f6e';
      const bodyTop = Math.min(yO, yC), bodyBot = Math.max(yO, yC), bh = Math.max(1, bodyBot - bodyTop);
      gx.strokeStyle = 'rgba(4,6,10,0.7)'; gx.lineWidth = 3; gx.beginPath(); gx.moveTo(x, yH); gx.lineTo(x, yL); gx.stroke();
      gx.fillStyle = 'rgba(4,6,10,0.6)'; gx.fillRect(x - half - 1.2, bodyTop - 1.2, bodyW + 2.4, bh + 2.4);
      gx.strokeStyle = col; gx.lineWidth = 1.3; gx.beginPath(); gx.moveTo(x, yH); gx.lineTo(x, yL); gx.stroke();
      gx.fillStyle = col; gx.fillRect(x - half, bodyTop, bodyW, bh);
    }
    return drew;
  }

  // ---- candles + gridlines + cluster chips + SL/TP/liq lines + price axis, all
  // from OUR mapping (view). Drawn on the overlay (z2) above the heat. ----
  function drawOverlay(container, ctx, s) {
    const cv = s.overlay, lwc = s.lwcEl; if (!cv || !s.series) return;
    const W = lwc.clientWidth, H = lwc.clientHeight, dpr = window.devicePixelRatio || 1;
    if (!W || !H) return;
    cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const gx = cv.getContext('2d'); gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.clearRect(0, 0, W, H);
    gx.font = '600 9px "JetBrains Mono", ui-monospace, Menlo, monospace'; gx.textBaseline = 'middle';
    const plotW = plotWidth(s, W);
    const vm = ctx.vm, mark = vm.markPx, ev = levEval(vm, ctx.lev);
    const MINT = '#4FE3C1';
    const py = (p) => { const c = s.series.priceToCoordinate(p); return c == null ? null : c; };
    const f = getProfile(s, ctx);
    const field = getHeatField(s, ctx);
    const atWall = (price) => heatAt(field, price) >= HEAT_HI;   // on a bright band (field-consistent)
    // CLIP everything but the current-price pill to the plot area.
    gx.save(); gx.beginPath(); gx.rect(0, 0, plotW, H); gx.clip();
    // OUR opaque candles (below the lines/labels), on top of the heat.
    const drew = drawCandles(gx, ctx, s, W, H);
    if (!drew) { gx.fillStyle = 'rgba(154,164,178,0.8)'; gx.textAlign = 'center'; gx.fillText('loading price…', plotW / 2, H / 2); gx.textAlign = 'left'; }
    // REAL liq-cluster $ labels (POC + the top walls), just left of the axis.
    if (f) {
      const xR = plotW;
      const vis = visClusters(f, s.series, H).sort((a, b) => b.b.total - a.b.total);
      const vmaxL = vis.length ? vis[0].b.total : 0; const used = [];
      for (const { b, y } of vis) {
        if (b.total < Math.max(f.sig, 0.18 * vmaxL)) break;
        if (used.length >= 5 || used.some((ly) => Math.abs(ly - y) < 13)) continue;
        used.push(y);
        const isPoc = b === vis[0].b, col = b.side === 'long' ? '#F6465D' : '#17C784';
        const txt = (isPoc ? '◆ ' : '') + VM.fmtUsd(b.total);
        gx.font = (isPoc ? '800 10px ' : '700 9px ') + '"JetBrains Mono", ui-monospace, Menlo, monospace';
        const tw = gx.measureText(txt).width, w = tw + 10, x = xR - w - 3;
        gx.fillStyle = 'rgba(8,9,11,0.82)'; roundRect(gx, x, y - 8, w, 16, 4); gx.fill();
        if (isPoc) { gx.strokeStyle = col; gx.lineWidth = 1; roundRect(gx, x, y - 8, w, 16, 4); gx.stroke(); }
        gx.fillStyle = col; gx.textAlign = 'left'; gx.fillText(txt, x + 5, y + 0.5);
      }
      gx.textAlign = 'left';
    }
    const guard = guardianActive(ctx), pos = ctx.position;
    // SL/TP lines draw in BOTH modes once set (PLACE LEVELS or manual/drag) —
    // in guardian they're the exit plan around the real position.
    {
      const r = ctx.risk || {}; r.dir = guard ? pos.side : ctx.lev.dir;
      const plan = clusterPlan(vm, ctx, s);
      const sp = stopPrice(vm, r);
      if (sp != null) { const y = py(sp); if (y != null) {
        const es = plan ? evalStop(plan, sp) : null;
        const col = es ? (es.color === 'red' ? '#ff5f6e' : es.color === 'orange' ? '#F0B90B' : MINT) : '#8A93A0';
        drawLine(gx, 0, plotW, y, col, [4, 3], 1.2); drawPill(gx, 3, y, 'SL ' + VM.fmtPrice(sp), col);
        if (es && es.level !== 'ok') drawMini(gx, 3, y, 'sweep', col, 'SL ' + VM.fmtPrice(sp));
      } }
      const tp = tpPrice(vm, r);
      if (tp != null) { const y = py(tp); if (y != null) { const hot = atWall(tp); drawLine(gx, 0, plotW, y, MINT, [4, 3], 1.2); drawPill(gx, 3, y, 'TP ' + VM.fmtPrice(tp), MINT); if (hot) drawMini(gx, 3, y, 'magnet', MINT, 'TP ' + VM.fmtPrice(tp)); } }
    }
    if (guard) {
      // GUARDIAN: mark the REAL entry (subtle line, no size shown).
      if (pos.entryPx != null) { const y = py(pos.entryPx); if (y != null) { drawLine(gx, 0, plotW, y, 'rgba(154,164,178,0.55)', [2, 3], 1); drawTag(gx, 3, y, 'entry ' + VM.fmtPrice(pos.entryPx), '#9AA4B2', 'left'); } }
    }
    // LIQ LINE — the hero. GUARDIAN uses the REAL liquidationPx (exact, from the
    // API); PLANNER the hypothetical. Coloured by the COMBINED verdict.
    const liqPx = guard ? pos.liquidationPx : (ev && ev.liqPx != null ? ev.liqPx : null);
    const liqDir = guard ? pos.side : ctx.lev.dir;
    if (liqPx != null) { const y = py(liqPx); if (y != null) {
      const gctx = guard ? Object.assign({}, ctx, { lev: Object.assign({}, ctx.lev, { dir: liqDir }) }) : ctx;
      const v = dangerVerdict(vm, gctx, s, liqPx, liqDir);
      const hex = v.color === 'red' ? '#ff5f6e' : v.color === 'orange' ? '#F0B90B' : MINT;
      gx.save(); gx.shadowColor = hex; gx.shadowBlur = 15; drawLine(gx, 0, plotW, y, hex, [8, 4], 2.4); gx.restore();
      const gl = v.level === 'clear' ? '✓ ' : '⚠ ';
      drawPill(gx, 3, y, gl + (guard ? 'YOUR LIQ ' : 'LIQ ') + VM.fmtPrice(liqPx), hex, true, true);
    } }
    gx.restore();   // end plot-area clip — the current-price pill sits in the gutter
    // CURRENT PRICE — 1px accent rule ~40% across + filled accent pill (right).
    const ym = py(mark); if (ym != null) {
      gx.strokeStyle = 'rgba(79,227,193,0.55)'; gx.lineWidth = 1; gx.setLineDash([]); gx.beginPath(); gx.moveTo(0, Math.round(ym) + 0.5); gx.lineTo(W * 0.4, Math.round(ym) + 0.5); gx.stroke();
      gx.font = '700 10px "JetBrains Mono", ui-monospace, Menlo, monospace';
      const t = VM.fmtPrice(mark), tw = gx.measureText(t).width, pw = tw + 12, px = W - pw - 2;
      gx.save(); gx.shadowColor = MINT; gx.shadowBlur = 8; gx.fillStyle = MINT; roundRect(gx, px, ym - 9, pw, 18, 5); gx.fill(); gx.restore();
      gx.fillStyle = '#08090B'; gx.textAlign = 'left'; gx.fillText(t, px + 6, ym + 0.5);
    }
    // OFF-SCREEN WALL edge chips — tracks the CURRENT visible range (zoom/pan
    // re-runs drawOverlay), so "empty" viewports always say what lies beyond.
    renderEdgeChips(container, ctx, s);
  }
  function drawLine(gx, x0, x1, y, color, dash, w) { gx.strokeStyle = color; gx.lineWidth = w || 1; gx.setLineDash(dash || []); gx.beginPath(); gx.moveTo(x0, y); gx.lineTo(x1, y); gx.stroke(); gx.setLineDash([]); }
  function drawTag(gx, x, y, text, color, align) { gx.font = '600 9px "JetBrains Mono", ui-monospace, Menlo, monospace'; const tw = gx.measureText(text).width, bx = align === 'right' ? x - tw - 5 : x; gx.fillStyle = 'rgba(8,9,11,0.78)'; gx.fillRect(bx - 1, y - 7, tw + 6, 14); gx.fillStyle = color; gx.textAlign = align; gx.fillText(text, align === 'right' ? x - 3 : x + 2, y); gx.textAlign = 'left'; }
  function drawMini(gx, x, y, text, hex, pillText) { gx.font = '800 11px "JetBrains Mono", ui-monospace, Menlo, monospace'; const pw = pillText ? gx.measureText(pillText).width + 16 : 64; gx.font = '700 8px "JetBrains Mono", ui-monospace, Menlo, monospace'; const tw = gx.measureText(text).width; const bx = x + pw + 6; gx.fillStyle = hex; roundRect(gx, bx, y - 7, tw + 8, 14, 3); gx.fill(); gx.fillStyle = '#08090B'; gx.textAlign = 'left'; gx.fillText(text, bx + 4, y + 0.5); gx.font = '600 9px "JetBrains Mono", ui-monospace, Menlo, monospace'; }
  function drawPill(gx, x, y, text, hex, glow, hero) { gx.font = (hero ? '800 11px ' : '700 10px ') + '"JetBrains Mono", ui-monospace, Menlo, monospace'; const tw = gx.measureText(text).width, w = tw + (hero ? 16 : 12), h = hero ? 19 : 17; gx.save(); if (glow) { gx.shadowColor = hex; gx.shadowBlur = hero ? 13 : 9; } gx.fillStyle = hex; roundRect(gx, x, y - h / 2, w, h, hero ? 6 : 5); gx.fill(); gx.restore(); gx.fillStyle = '#08090B'; gx.textAlign = 'left'; gx.fillText(text, x + (hero ? 8 : 6), y + 0.5); gx.font = '600 9px "JetBrains Mono", ui-monospace, Menlo, monospace'; }
  function roundRect(gx, x, y, w, h, r) { r = Math.min(r, h / 2, w / 2); gx.beginPath(); gx.moveTo(x + r, y); gx.arcTo(x + w, y, x + w, y + h, r); gx.arcTo(x + w, y + h, x, y + h, r); gx.arcTo(x, y + h, x, y, r); gx.arcTo(x, y, x + w, y, r); gx.closePath(); }

  // The injected pill mounts LWC into a host that may not be laid out yet, so
  // priceToCoordinate returns null intermittently. Only DRAW once the chart is
  // truly ready (host sized + series has candle data + priceToCoordinate(mark)
  // non-null); until then keep NUDGING LWC to (re)size + (re)set data and retry —
  // never "draw once blank and give up".
  function chartReady(s) {
    if (!s.chart || !s.series || !s.lwcEl) return false;
    const W = s.lwcEl.clientWidth, H = s.lwcEl.clientHeight;
    if (!W || !H || !s.hadData) return false;
    const mark = s.ctx && s.ctx.vm ? s.ctx.vm.markPx : null; if (mark == null) return false;
    let c = null; try { c = s.series.priceToCoordinate(mark); } catch (e) {}
    return c != null;
  }
  function startLoop(container, s) {
    let lastHeat = 0, lastNudge = 0;
    function loop(ts) {
      if (!s.chart || !document.body.contains(container)) { if (s.raf) cancelAnimationFrame(s.raf); s.raf = null; return; }
      if (chartReady(s)) {
        drawOverlay(container, s.ctx, s);
        if (ts - lastHeat > 110 || s.heatDirty) { lastHeat = ts; s.heatDirty = false; drawHeat(container, s.ctx, s); }
      } else if (ts - lastNudge > 100) {
        // not ready — force LWC to recompute size + re-seat candle data, then retry.
        lastNudge = ts;
        const W = s.lwcEl ? s.lwcEl.clientWidth : 0, H = s.lwcEl ? s.lwcEl.clientHeight : 0;
        if (W && H) { try { s.chart.applyOptions({ width: W, height: H }); } catch (e) {} }
        try { updateChartData(container, s.ctx, s); } catch (e) {}   // (re)setData + fitContent when data present
        s.heatDirty = true;
      }
      s.raf = requestAnimationFrame(loop);
    }
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(loop);
  }

  // ---- draggable SL/TP lines (hover near a line → grab → slide). The overlay is
  // pointer-events:none except while hovering a line, so LWC keeps its native
  // scroll/zoom (the events pass through to the LWC canvas below). ----
  function attachInteraction(container, s) {
    const wrap = container.querySelector('.hlx-chart-wrap'), lwc = s.lwcEl, cv = s.overlay;
    if (!wrap || !cv) return;
    function lineYs() {
      const ctx = s.ctx, vm = ctx.vm, r = ctx.risk || {}; const arr = [];
      r.dir = guardianActive(ctx) ? ctx.position.side : ctx.lev.dir;   // draggable in BOTH modes
      const sp = stopPrice(vm, r); if (sp != null) { const c = s.series.priceToCoordinate(sp); if (c != null) arr.push({ key: 'stop', y: c + lwc.offsetTop }); }
      const tp = tpPrice(vm, r); if (tp != null) { const c = s.series.priceToCoordinate(tp); if (c != null) arr.push({ key: 'tp', y: c + lwc.offsetTop }); }
      return arr;
    }
    wrap.addEventListener('mousemove', (e) => {
      if (s.dragging) return;
      const wr = wrap.getBoundingClientRect(), y = e.clientY - wr.top; let hot = null;
      for (const l of lineYs()) { if (Math.abs(l.y - y) < 7) { if (!hot || Math.abs(l.y - y) < Math.abs(hot.y - y)) hot = l; } }
      if (hot) { wrap.style.cursor = 'ns-resize'; cv.style.pointerEvents = 'auto'; s.hot = hot.key; }
      else { wrap.style.cursor = ''; cv.style.pointerEvents = 'none'; s.hot = null; }
    });
    wrap.addEventListener('mouseleave', () => { if (!s.dragging) { wrap.style.cursor = ''; cv.style.pointerEvents = 'none'; s.hot = null; } });
    cv.addEventListener('pointerdown', (e) => { if (!s.hot) return; s.dragging = s.hot; try { cv.setPointerCapture(e.pointerId); } catch {} e.preventDefault(); });
    cv.addEventListener('pointermove', (e) => { if (!s.dragging) return; const lr = lwc.getBoundingClientRect(); const price = s.series.coordinateToPrice(e.clientY - lr.top); if (price == null) return; applyDrag(container, s, price); });
    cv.addEventListener('pointerup', (e) => { if (!s.dragging) return; s.dragging = null; try { cv.releasePointerCapture(e.pointerId); } catch {} });
  }
  function applyDrag(container, s, price) {
    const ctx = s.ctx, vm = ctx.vm, r = ctx.risk = ctx.risk || {}, mark = vm.markPx;
    const isLong = (guardianActive(ctx) ? ctx.position.side : ctx.lev.dir) !== 'short';
    if (price == null || !isFinite(price)) return;
    if (s.dragging === 'stop') { const pct = isLong ? (mark - price) / mark * 100 : (price - mark) / mark * 100; r.stopPct = Math.max(0.1, +pct.toFixed(2)); const el = container.querySelector('.hlx-stop-in'); if (el) el.value = r.stopPct; }
    else if (s.dragging === 'tp') { const pct = isLong ? (price - mark) / mark * 100 : (mark - price) / mark * 100; r.tpPct = Math.max(0.1, +pct.toFixed(2)); const el = container.querySelector('.hlx-tp-in'); if (el) el.value = r.tpPct; }
    updateReadout(container, ctx); setAnchor(ctx, s);
    if (s.opts && s.opts.onChange) s.opts.onChange();
  }

  function destroyChart(s) { if (!s) return; if (s.raf) { cancelAnimationFrame(s.raf); s.raf = null; } if (s.ro) { try { s.ro.disconnect(); } catch {} s.ro = null; } if (s.chart) { try { s.chart.remove(); } catch {} s.chart = null; s.series = null; s.anchor = null; } }

  // One-tap SNAP: move SL & TP to the cluster-aware suggested prices (read-only).
  function snapToSuggested(container, s) {
    const ctx = s.ctx, vm = ctx.vm, plan = clusterPlan(vm, ctx, s); if (!plan) return;
    const entry = plan.entry; ctx.risk = ctx.risk || {};
    ctx.risk.stopPct = +(Math.abs((entry - plan.suggestedStop) / entry) * 100).toFixed(2);
    ctx.risk.tpPct = +(Math.abs((plan.tpPrice - entry) / entry) * 100).toFixed(2);
    const si = container.querySelector('.hlx-stop-in'), ti = container.querySelector('.hlx-tp-in');
    if (si) si.value = ctx.risk.stopPct; if (ti) ti.value = ctx.risk.tpPct;
    updateReadout(container, ctx); setAnchor(ctx, s);
    if (s.opts && s.opts.onChange) s.opts.onChange();
  }

  // ===== PLACE LEVELS — one tap, complete cluster-aware plan =====
  // Composes the pieces we already compute: SL beyond the nearest big wall in
  // the LOSS direction (+overshoot buffer; volatility stop if no wall within
  // ~1.5 daily moves; verified against the rendered heat — never ON a band, and
  // nudged past if needed) · TP front-running the nearest magnet in the PROFIT
  // direction by ~0.25% (2:1 from the stop if no magnet within ~3 moves) ·
  // leverage = safeLeverage (planner mode only). DRAWS lines only — no orders.
  function computePlaceLevels(vm, ctx, s) {
    const guard = guardianActive(ctx), pos = ctx.position;
    const dir = guard ? pos.side : ctx.lev.dir, isLong = dir !== 'short';
    const entry = vm.markPx; if (!entry) return null;
    const dm = ctx.candles ? ctx.candles.dmp : null;
    const f = getProfile(s, ctx), field = getHeatField(s, ctx);
    const gctx = guard ? Object.assign({}, ctx, { lev: Object.assign({}, ctx.lev, { dir }) }) : ctx;
    const buf = entry * Math.max(0.3 * (dm || 0), 0.004);       // overshoot buffer ≈ 0.3·DMOVE or 0.4%
    const move = entry * (dm || 0.02);                           // one daily move in $
    const hw = f ? f.bucketW / 2 : entry * 0.002;
    // --- STOP (loss direction) — SAME SWEEP_HORIZON as evalStop, so they agree ---
    const stopCl = f ? nearestBig(f, entry, isLong) : null;
    const clDist = stopCl ? Math.abs(stopCl.price - entry) : Infinity;
    const wallInHorizon = stopCl && clDist <= SWEEP_HORIZON * move;
    let stopPx, stopNote, stopWarn = null;
    if (wallInHorizon) {
      stopPx = isLong ? stopCl.price - hw - buf : stopCl.price + hw + buf;   // cold side, beyond the wall
      stopNote = 'beyond ' + usdM(stopCl.total) + ' wall';
    } else {
      stopPx = isLong ? entry - 1.2 * move : entry + 1.2 * move;             // volatility stop (no wall in horizon)
      stopNote = 'volatility stop';
    }
    // verify with the SAME heat sampling: never ON a bright band — nudge past.
    let nudges = 0;
    while (field && heatAt(field, stopPx) >= HEAT_HI && nudges < 8) { stopPx = isLong ? stopPx - buf : stopPx + buf; nudges++; }
    // INVARIANT (self-check): the placer's output must pass its own evaluator
    // clean. Run it through evalStop; nudge cold-side until ok (bounded).
    const plan = clusterPlan(vm, gctx, s);
    if (plan) {
      let es = evalStop(plan, stopPx), tries = 0;
      while (es && es.level !== 'ok' && tries < 8) { stopPx = isLong ? stopPx - buf : stopPx + buf; es = evalStop(plan, stopPx); tries++; }
      if (es && es.level !== 'ok') stopWarn = 'no clear stop — clusters stack ' + (isLong ? 'below' : 'above');
      else if (tries > 0) stopNote += ' (nudged clear)';
    }
    if (!stopWarn && field && heatAt(field, stopPx) >= HEAT_HI) stopWarn = 'no clear stop — clusters stack ' + (isLong ? 'below' : 'above');
    else if (!stopWarn && nudges > 0 && stopNote.indexOf('nudged') < 0) stopNote += ' (nudged past heat)';
    const stopDist = Math.abs(entry - stopPx), stopFrac = stopDist / entry;
    // size-to-hold-risk: wall-stop farther than the 1.2-move vol baseline → show
    // the notional that keeps $risk constant (adjust size, not the stop).
    let sizeDown = null;
    const notional = guard ? (pos.positionValue || 0) : (ctx.lev.sizeUsd || 1000);
    if (stopDist > 1.2 * move * 1.02 && notional > 0) {
      const baseRisk = notional * (1.2 * move / entry);          // $risk at the vol-stop baseline
      sizeDown = { riskUsd: baseRisk, sizeUsd: baseRisk / stopFrac };
    }
    // --- STOP vs LIQ ordering rule: liqDist ≥ LIQ_STOP_RATIO × stopDist ---
    const capLev = maxLevForStop(stopFrac, vm.mmf);              // max leverage for THIS stop
    let liqWarn = null;
    if (guard && pos.liquidationPx != null) {
      const liqDist = Math.abs(pos.liquidationPx - entry);
      if (liqDist < LIQ_STOP_RATIO * stopDist) liqWarn = 'your liq ' + VM.fmtPrice(pos.liquidationPx) + ' is inside ' + LIQ_STOP_RATIO + '× the stop range';
    }
    // --- TP (profit direction, INTO the magnet not through it) ---
    const tpCl = f ? nearestBig(f, entry, !isLong) : null;
    const tpDist = tpCl ? Math.abs(tpCl.price - entry) : Infinity;
    let tpPx, tpNote;
    if (tpCl && tpDist <= 3 * move) {
      tpPx = isLong ? tpCl.price * (1 - 0.0025) : tpCl.price * (1 + 0.0025);  // front-run ~0.25%
      tpNote = 'into ' + usdM(tpCl.total) + ' magnet';
    } else {
      tpPx = isLong ? entry + 2 * stopDist : entry - 2 * stopDist;            // default 2:1
      tpNote = '2:1 (no magnet within 3 moves)';
    }
    // SIDE CHECK (review F1): a magnet a hair beyond entry front-runs to the WRONG
    // side (long TP below entry) — the abs-% storage then mirrors it and the drawn
    // line disagrees with the printed price. Wrong-side/degenerate TP → 2:1 default.
    if (isLong ? tpPx <= entry : tpPx >= entry) {
      tpPx = isLong ? entry + 2 * stopDist : entry - 2 * stopDist;
      tpNote = '2:1 (magnet too close to front-run)';
    }
    const rr = stopDist > 0 ? Math.abs(tpPx - entry) / stopDist : null;
    // --- REGIME-AWARE RUNNER (TP2, informational only): directional lean in our
    // direction AND a second big cluster beyond the first magnet within ~5 moves.
    let tp2 = null;
    try {
      const lean = marketLean(vm, ctx);
      if (tpCl && lean && lean.dir === dir) {
        let next = null, bd = Infinity;
        if (f) for (const b of f.buckets) {
          if (b.total < BIG_WALL) continue;
          if (isLong ? b.price <= tpCl.price + hw : b.price >= tpCl.price - hw) continue;
          const dd = Math.abs(b.price - entry); if (dd <= 5 * move && dd < bd) { bd = dd; next = b; }
        }
        if (next) {
          const tp2Px = isLong ? next.price * (1 - 0.0025) : next.price * (1 + 0.0025);
          tp2 = { px: tp2Px, wall: next.total, firstWall: tpCl.total, rr: stopDist > 0 ? Math.abs(tp2Px - entry) / stopDist : null };
        }
      }
    } catch (e) {}
    // --- LEVERAGE: planner = min(safeLeverage, maxLevForStop); guardian = untouched ---
    const safe = guard ? null : safeLeverage(vm, gctx, s);
    const lev = guard ? null : (safe != null && capLev != null ? Math.min(safe, capLev) : (safe != null ? safe : null));
    return { guard, dir, isLong, entry, stopPx, tpPx, stopNote, tpNote, stopWarn, rr, lev, safe, capLev, sizeDown, liqWarn, tp2 };
  }
  function placeLevels(container, s) {
    const ctx = s.ctx, vm = ctx.vm;
    const out = container.querySelector('.hlx-place-result');
    const r = computePlaceLevels(vm, ctx, s);
    if (!r) { if (out) { out.className = 'hlx-place-result hlx-warn'; out.textContent = 'no market data yet'; } return; }
    // APPLY exactly as if dragged: risk state + inputs + (planner) leverage slider.
    ctx.risk = ctx.risk || {};
    ctx.risk.stopPct = +(Math.abs((r.entry - r.stopPx) / r.entry) * 100).toFixed(2);
    ctx.risk.tpPct = +(Math.abs((r.tpPx - r.entry) / r.entry) * 100).toFixed(2);
    const si = container.querySelector('.hlx-stop-in'), ti = container.querySelector('.hlx-tp-in');
    if (si) si.value = ctx.risk.stopPct; if (ti) ti.value = ctx.risk.tpPct;
    if (!r.guard && r.lev != null) {
      ctx.lev.leverage = r.lev;
      const sl = container.querySelector('.hlx-lev-slider'), v = container.querySelector('.hlx-lev-val');
      if (sl) sl.value = r.lev; if (v) v.textContent = r.lev + '×';
    }
    // result + honesty lines (all values are our own numbers — no user HTML)
    if (out) {
      const rrTxt = r.rr != null ? '1:' + r.rr.toFixed(1) : '—';
      const tight = r.rr != null && r.rr < 1;
      let main = 'your edge · R:R ' + rrTxt + ' · SL ' + VM.fmtPrice(r.stopPx) + ' (stop ' + r.stopNote + ') · TP ' + VM.fmtPrice(r.tpPx) + ' (TP ' + r.tpNote + ')';
      if (tight) main += ' — tight, size small';
      if (r.stopWarn) main = 'levels set · ⚠ ' + r.stopWarn + ' · TP ' + VM.fmtPrice(r.tpPx) + ' into the magnet · R:R ' + rrTxt;
      const extra = [];
      if (r.sizeDown) extra.push('size ↓ to ' + VM.fmtUsd(r.sizeDown.sizeUsd) + ' to hold ' + VM.fmtUsd(r.sizeDown.riskUsd) + ' risk');
      if (!r.guard) {
        if (r.lev == null) extra.push('⚠ no safe leverage');
        else if (r.capLev != null && r.safe != null && r.capLev < r.safe) extra.push('lev capped at ' + r.lev + '× so liq stays ≥ ' + LIQ_STOP_RATIO + '× the stop');
      }
      if (r.liqWarn) extra.push('⚠ ' + r.liqWarn);
      if (r.tp2) extra.push('runner: TP2 ' + VM.fmtPrice(r.tp2.px) + ' into ' + usdM(r.tp2.wall) + ' wall if the ' + usdM(r.tp2.firstWall) + ' magnet is consumed' + (r.tp2.rr != null ? ' · R:R 1:' + r.tp2.rr.toFixed(1) + ' with trail' : ''));
      out.className = 'hlx-place-result ' + (r.stopWarn || r.liqWarn ? 'hlx-neg' : tight ? 'hlx-warn' : 'hlx-pos');
      out.innerHTML = main + extra.map((t) => '<br><span class="hlx-place-extra">' + t + '</span>').join('');
    }
    updateReadout(container, ctx); setAnchor(ctx, s); s.heatDirty = true;
    if (s.opts && s.opts.onChange) s.opts.onChange();
  }

  // ===== SHARE CARD (1200×675 canvas PNG — PolyParlay's canvas-card pattern) =====
  // Levels + verdict ONLY — no position sizes / PnL (privacy by default).
  function viridisCss(I, a) {
    const idx = Math.max(0, Math.min(255, (I * 255) | 0)) * 4;
    return 'rgba(' + LUT_VIRIDIS[idx] + ',' + LUT_VIRIDIS[idx + 1] + ',' + LUT_VIRIDIS[idx + 2] + ',' + (a != null ? a : (LUT_VIRIDIS[idx + 3] / 255)) + ')';
  }
  function drawShareCard(ctx, s, cardOpts) {
    cardOpts = cardOpts || {};
    const wick = cardOpts.wick || null;
    const vm = ctx.vm, mark = vm.markPx;
    const W = 1200, H = 675;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const g2 = canvas.getContext('2d');
    const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
    const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    const MINT = '#4FE3C1', RED = '#ff5f6e', AMBER = '#F0B90B';
    // the same read the window shows (guardian = real liq, planner = hypothetical)
    const guard = guardianActive(ctx), pos = ctx.position;
    const dir = wick ? (wick.isLong ? 'long' : 'short') : (guard ? pos.side : ctx.lev.dir);
    const liqPx = wick ? wick.liqPx : (guard ? pos.liquidationPx : ((levEval(vm, ctx.lev) || {}).liqPx));
    const gctx = Object.assign({}, ctx, { lev: Object.assign({}, ctx.lev, { dir }) });
    const v = liqPx != null ? dangerVerdict(vm, gctx, s, liqPx, dir) : null;
    const safe = safeLeverage(vm, gctx, s);
    const field = getHeatField(s, ctx);
    // background
    g2.fillStyle = '#08090B'; g2.fillRect(0, 0, W, H);
    // top ticker strip
    g2.fillStyle = '#0C0E12'; g2.fillRect(0, 0, W, 44);
    g2.fillStyle = wick ? AMBER : MINT; g2.beginPath(); g2.arc(38, 22, 5, 0, Math.PI * 2); g2.fill();
    g2.fillStyle = '#9AA4B2'; g2.font = '700 14px ' + MONO; g2.textBaseline = 'middle';
    g2.fillText(wick ? 'HYPELENS · SURVIVED THE WICK · REAL LIQ HEATMAP · HYPELENS.APP' : 'LIVE · HYPELENS LIQ DEFENSE · REAL POSITIONS · HYPELENS.APP', 56, 23);
    g2.textBaseline = 'alphabetic';
    // header: coin + price + mode
    g2.fillStyle = '#EDF1F6'; g2.font = '900 54px ' + SANS;
    g2.fillText(vm.coin, 60, 122);
    g2.fillStyle = wick ? AMBER : MINT; g2.font = '700 34px ' + MONO;
    g2.fillText(VM.fmtPrice(mark), 60 + g2.measureText('').width + Math.max(120, vm.coin.length * 38 + 40), 120);
    g2.fillStyle = '#5A6472'; g2.font = '700 15px ' + MONO;
    g2.fillText(wick ? ('🔥 SURVIVED THE WICK · ' + dir.toUpperCase() + ' · ' + new Date().toISOString().slice(0, 10)) : ((guard ? 'GUARDIAN · ' + dir.toUpperCase() : 'PLANNER · ' + dir.toUpperCase()) + ' · ' + new Date().toISOString().slice(0, 10)), 60, 152);
    // heat panel (price ±18% of mark, vertical price axis) — the real cluster bands
    const px0 = 60, px1 = W - 240, py0 = 185, py1 = H - 120;
    const lo = mark * 0.82, hi = mark * 1.18;
    const yOf = (p) => py0 + (hi - p) / (hi - lo) * (py1 - py0);
    g2.fillStyle = '#0A0B10'; roundRect(g2, px0, py0, px1 - px0, py1 - py0, 10); g2.fill();
    g2.save(); g2.beginPath(); roundRect(g2, px0, py0, px1 - px0, py1 - py0, 10); g2.clip();
    if (field) {
      for (let y = py0; y <= py1; y += 2) {
        const p = hi - (y - py0) / (py1 - py0) * (hi - lo);
        const I = heatAt(field, p, 0.004);
        if (I <= 0.02) continue;
        g2.fillStyle = viridisCss(Math.pow(I, 0.8), Math.min(0.9, 0.15 + I));
        g2.fillRect(px0, y, px1 - px0, 2);
      }
    }
    g2.restore();
    const label = (y, text, color, boldPx) => {
      g2.font = '800 ' + (boldPx || 20) + 'px ' + MONO;
      const tw = g2.measureText(text).width;
      g2.fillStyle = '#08090B'; roundRect(g2, px1 + 10, y - 16, tw + 22, 32, 7); g2.fill();
      g2.strokeStyle = color; g2.lineWidth = 2; roundRect(g2, px1 + 10, y - 16, tw + 22, 32, 7); g2.stroke();
      g2.fillStyle = color; g2.textBaseline = 'middle'; g2.fillText(text, px1 + 21, y + 1); g2.textBaseline = 'alphabetic';
    };
    const line = (p, color, dash, wpx) => {
      const y = yOf(p); if (y < py0 + 4 || y > py1 - 4) return null;
      g2.strokeStyle = color; g2.lineWidth = wpx || 3; g2.setLineDash(dash || []);
      g2.beginPath(); g2.moveTo(px0, y); g2.lineTo(px1, y); g2.stroke(); g2.setLineDash([]);
      return y;
    };
    // mark line + label
    let y = line(mark, 'rgba(79,227,193,0.9)', [], 2); if (y != null) label(y, VM.fmtPrice(mark), MINT);
    // liq line (verdict color) + SL/TP (planner only; levels, not sizes)
    if (liqPx != null && v) { const hex = v.color === 'red' ? RED : v.color === 'orange' ? AMBER : MINT; y = line(liqPx, hex, [14, 8], 4); if (y != null) label(y, 'LIQ ' + VM.fmtPrice(liqPx), hex); }
    if (wick) {
      // mark the wick that stabbed toward liq and held
      const wy = line(wick.wickPx, AMBER, [4, 5], 3); if (wy != null) label(wy, 'WICK ' + VM.fmtPrice(wick.wickPx), AMBER);
    } else if (!guard) {
      const r = ctx.risk || {}; r.dir = ctx.lev.dir;
      const sp = stopPrice(vm, r); if (sp != null) { y = line(sp, '#8A93A0', [8, 6], 2); if (y != null) label(y, 'SL ' + VM.fmtPrice(sp), '#8A93A0'); }
      const tp = tpPrice(vm, r); if (tp != null) { y = line(tp, MINT, [8, 6], 2); if (y != null) label(y, 'TP ' + VM.fmtPrice(tp), MINT); }
    }
    // bottom row: verdict / wick headline + safe leverage + wordmark
    const by = H - 66;
    if (wick) {
      g2.fillStyle = AMBER; g2.font = '900 30px ' + MONO;
      g2.fillText('SURVIVED THE WICK', 60, by);
      g2.fillStyle = '#EDF1F6'; g2.font = '700 18px ' + MONO;
      g2.fillText(vm.coin + ' wicked to ' + VM.fmtPrice(wick.wickPx) + ' — ' + wick.distPct.toFixed(1) + '% from my liq — and held', 60, by + 30);
    } else {
      if (v) { const hex = v.level === 'unknown' ? '#5A6472' : v.color === 'red' ? RED : v.color === 'orange' ? AMBER : MINT; g2.fillStyle = hex; g2.font = '900 30px ' + MONO; g2.fillText(v.text, 60, by); }
      // second line mirrors the window: clear → affirm current lev; else nearest clear.
      const curL = guard ? (pos.leverage || null) : Math.round(levLeverage(vm, ctx.lev));
      let sub, subOk;
      if (v && v.level === 'unknown') { subOk = false; sub = ''; }   // no verdict claim on no data (review F2)
      else if (v && v.level === 'clear') { subOk = true; sub = '✓ ' + (curL != null ? curL + '× ' : '') + 'LIQ CLEAR OF THE WALLS'; }
      else { const nc = curL != null ? nearestClearLev(vm, gctx, s, curL, dir) : safe; subOk = false; sub = nc != null ? '⚡ CLEAR IT → ' + nc + '×' : '⚠ NO CLEAR LEVERAGE'; }
      if (sub) { g2.fillStyle = subOk ? MINT : RED; g2.font = '800 22px ' + MONO; g2.fillText(sub, 60, by + 34); }
    }
    g2.fillStyle = '#EDF1F6'; g2.font = '900 26px ' + SANS; g2.textAlign = 'right';
    g2.fillText('HypeLens', W - 60, by + 6);
    g2.fillStyle = '#5A6472'; g2.font = '700 15px ' + MONO;
    g2.fillText('hypelens.app · not financial advice', W - 60, by + 32);
    g2.textAlign = 'left';
    return canvas;
  }

  function wireControls(container, ctx, s, opts) {
    const p = container.querySelector('.hlx-panel');
    const slider = p.querySelector('.hlx-lev-slider'), val = p.querySelector('.hlx-lev-val'), size = p.querySelector('.hlx-lev-size');
    const after = () => { updateReadout(container, s.ctx); setAnchor(s.ctx, s); if (opts && opts.onChange) opts.onChange(); };
    // snap + "Set N×" buttons are re-rendered inside the panel each update → delegate.
    p.addEventListener('click', (e) => {
      if (e.target.closest('.hlx-placelev')) { e.preventDefault(); placeLevels(container, s); return; }
      if (e.target.closest('.hlx-snap')) { e.preventDefault(); snapToSuggested(container, s); return; }
      const mode = e.target.closest('.hlx-modes button');
      if (mode) { e.preventDefault(); if (s.opts && s.opts.onMode) s.opts.onMode(mode.getAttribute('data-mode')); else if (ctx.onMode) ctx.onMode(mode.getAttribute('data-mode')); return; }
      // PORTFOLIO: tap a position row → switch chart/guardian to that coin
      const row = e.target.closest('.hlx-pf-row');
      if (row) { e.preventDefault(); const c = row.getAttribute('data-coin'); if (c && s.ctx.onCoin) s.ctx.onCoin(c); return; }
      // PORTFOLIO: what-if stress preset → recompute + re-render the card only
      const sb = e.target.closest('.hlx-pf-sbtn');
      if (sb) { e.preventDefault(); s._stressX = parseFloat(sb.getAttribute('data-x')); updatePortfolio(container, s.ctx); return; }
      const set = e.target.closest('.hlx-setlev');
      if (set && slider) { e.preventDefault(); const L = parseInt(set.getAttribute('data-lev'), 10); if (L >= 1) { s.ctx.lev.leverage = L; slider.value = L; if (val) val.textContent = L + '×'; after(); } }
    });
    // planner inputs only exist in planner mode — guard everything (guardian panel omits them)
    if (slider) slider.addEventListener('input', () => { ctx.lev.leverage = Number(slider.value); if (val) val.textContent = slider.value + '×'; after(); });
    if (size) size.addEventListener('input', () => { ctx.lev.sizeUsd = Math.max(1, Number(size.value) || 1000); after(); });
    p.querySelectorAll('.hlx-lev-dir button').forEach((b) => b.addEventListener('click', () => { ctx.lev.dir = b.getAttribute('data-dir'); p.querySelectorAll('.hlx-lev-dir button').forEach((x) => x.classList.toggle('on', x === b)); after(); }));
    p.querySelectorAll('.hlx-lev-margin button').forEach((b) => b.addEventListener('click', () => { ctx.lev.margin = b.getAttribute('data-margin'); p.querySelectorAll('.hlx-lev-margin button').forEach((x) => x.classList.toggle('on', x === b)); after(); }));
    const stopIn = p.querySelector('.hlx-stop-in'), tpIn = p.querySelector('.hlx-tp-in'), trailIn = p.querySelector('.hlx-trail-in');
    ctx.risk = ctx.risk || {};
    if (stopIn) stopIn.addEventListener('input', () => { const v = parseFloat(stopIn.value); ctx.risk.stopPct = isFinite(v) && v > 0 ? v : null; after(); });
    if (tpIn) tpIn.addEventListener('input', () => { const v = parseFloat(tpIn.value); ctx.risk.tpPct = isFinite(v) && v > 0 ? v : null; after(); });
    if (trailIn) trailIn.addEventListener('input', () => { const v = parseFloat(trailIn.value); ctx.risk.trailPct = isFinite(v) && v > 0 ? v : null; after(); });
    const inten = container.querySelector('.hlx-intensity'), opac = container.querySelector('.hlx-opacity');
    // INT = heat contrast: mutate value, INVALIDATE the cached bitmap so it
    // re-bakes at the new gamma, and redraw immediately (not just next throttle).
    if (inten) inten.addEventListener('input', () => {
      ctx.heat = ctx.heat || {}; ctx.heat.intensity = Number(inten.value);
      s.heatBmp = null; s.heatBmpInt = null; s.heatDirty = true;
      drawHeat(container, s.ctx, s);
      if (opts && opts.onHeat) opts.onHeat();
    });
    // OPAC = heat layer opacity (baked as globalAlpha in drawHeat): redraw now.
    if (opac) opac.addEventListener('input', () => {
      ctx.heat = ctx.heat || {}; ctx.heat.opacity = Number(opac.value);
      s.heatDirty = true;
      drawHeat(container, s.ctx, s);
      if (opts && opts.onHeat) opts.onHeat();
    });
    // TRADE EXPANDER: order-entry (SL/TP · Place · wizard) is collapsed by default.
    // The container-level `.hlx-trade-open` class gates the trade body AND the
    // externally-appended X3 wizard mount (both descendants of the window).
    const applyTradeOpen = () => {
      // PLANNER-ONLY (review F4): guardian/portfolio render no toggle — applying
      // the class there would expose the X3 wizard with no way to close it AND
      // with the planner's direction (long) under a possibly-short real position.
      const inPlanner = !!container.querySelector('.hlx-trade-toggle');
      container.classList.toggle('hlx-trade-open', _tradeOpen && inPlanner);
      const tt = container.querySelector('.hlx-trade-toggle');
      if (tt) tt.textContent = 'Trade ' + (_tradeOpen ? '▾' : '▸');
    };
    applyTradeOpen();
    const tradeToggle = container.querySelector('.hlx-trade-toggle');
    if (tradeToggle) tradeToggle.addEventListener('click', (e) => { e.preventDefault(); _tradeOpen = !_tradeOpen; applyTradeOpen(); });
    const place = container.querySelector('.hlx-place');
    if (place) place.addEventListener('click', () => {
      // Trading build: jump to the real one-click placement section below.
      const x3 = container.querySelector('.hlx-x3-mount');
      if (x3 && window.HLX3) { x3.scrollIntoView({ behavior: 'smooth', block: 'center' }); x3.classList.add('hlx-x3-flash'); setTimeout(() => x3.classList.remove('hlx-x3-flash'), 1200); return; }
      // Read-only build: honest state — placement exists but is not in this build.
      const a = container.querySelector('.hlx-sizing-action');
      if (a) a.innerHTML = '<div class="hlx-place-stub">This build is read-only — copy these levels into Hyperliquid yourself. One-click placement (entry + SL/TP, builder code) ships in the trading build.</div>';
    });
    if (opts && opts.showClose && opts.onClose) { const cl = container.querySelector('.hlx-win-close'); if (cl) cl.addEventListener('click', opts.onClose); }
    container.querySelectorAll('.hlx-tf button').forEach((b) => b.addEventListener('click', () => { if (opts && opts.onTf) opts.onTf(b.getAttribute('data-tf')); }));
    // GUARDIAN fallback: paste-your-address when DOM detection fails (read-only)
    const wa = container.querySelector('.hlx-watchaddr');
    if (wa) wa.addEventListener('click', () => { const a = prompt('Paste your wallet address (0x…) to watch your REAL positions — read-only, public API, never a wallet connection:'); if (a != null && s.ctx.onAddr) s.ctx.onAddr(a); });
    // SHARE: render the branded card → copy to clipboard + download PNG.
    async function doShare(btn, restore, cardOpts) {
      try {
        btn.textContent = '…';
        const canvas = (cardOpts && cardOpts.drill) ? drawDrillCard(s.ctx, s, cardOpts.drill) : drawShareCard(s.ctx, s, cardOpts);
        let copied = false;
        try {
          const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
          if (blob && typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); copied = true;
          }
        } catch (e) {}
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = url; a.download = 'hypelens-' + (cardOpts && cardOpts.wick ? 'wick-' : cardOpts && cardOpts.drill ? 'wall-' : '') + s.ctx.vm.coin.toLowerCase() + '-' + Date.now() + '.png';
          document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        }, 'image/png');
        btn.textContent = copied ? '✓' : '⇩';
        setTimeout(() => { btn.textContent = restore; }, 1600);
      } catch (e) { btn.textContent = restore; try { console.warn('[HypeLens] share failed', e); } catch (x) {} }
    }
    const shareBtn = container.querySelector('.hlx-share');
    if (shareBtn) shareBtn.addEventListener('click', () => doShare(shareBtn, '⇪', null));
    const wickBtn = container.querySelector('.hlx-share-wick');
    if (wickBtn) wickBtn.addEventListener('click', () => { const w = detectWick(s.ctx); doShare(wickBtn, '🔥', { wick: w }); });
    // WHALE DRILL-DOWN: wall chips + panel controls live OUTSIDE the panel div —
    // delegate at the container level (re-rendered on every data refresh).
    container.addEventListener('click', (e) => {
      const chip = e.target.closest('.hlx-wall-chip');
      if (chip) { e.preventDefault(); const px = parseFloat(chip.getAttribute('data-price')); if (isFinite(px)) openDrill(container, s.ctx, s, px); return; }
      if (e.target.closest('.hlx-drill-close')) { e.preventDefault(); closeDrill(container, s); return; }
      const ds = e.target.closest('.hlx-drill-share');
      if (ds && s._drill && s._drill.data && !s._drill.data.loading) { e.preventDefault(); doShare(ds, '⇪', { drill: s._drill }); return; }
    });
  }

  function render(container, ctx, opts) {
    opts = opts || {}; ctx.heat = ctx.heat || { intensity: 0.5, opacity: 0.5 };
    let s = container.__hlx;
    const emode = currentMode(ctx);   // 'portfolio' | 'guardian' | 'planner' → panel identity
    const mount = !s || s.coin !== ctx.vm.coin || s.tf !== ctx.tf || s.loading !== Boolean(ctx.vm.loading) || s.emode !== emode || (!s.chart && !s.mounting);
    if (mount) {
      if (s) { const keepStress = s._stressX; destroyChart(s); s = null; container.innerHTML = bodyHtml(ctx, opts); s = container.__hlx = { coin: ctx.vm.coin, tf: ctx.tf, loading: Boolean(ctx.vm.loading), emode, guard: guardianActive(ctx), ctx, opts, heatDirty: true, _stressX: keepStress }; }
      else { container.innerHTML = bodyHtml(ctx, opts); s = container.__hlx = { coin: ctx.vm.coin, tf: ctx.tf, loading: Boolean(ctx.vm.loading), emode, guard: guardianActive(ctx), ctx, opts, heatDirty: true }; }
      mountChart(container, ctx, s);
      wireControls(container, ctx, s, opts);
    } else { s.ctx = ctx; s.opts = opts; s.heatDirty = true; updateChartData(container, ctx, s); }
    s.ctx = ctx; s.opts = opts;
    updateReadout(container, ctx); updatePortfolio(container, ctx); renderWalls(container, ctx); updateSrcBadge(container, ctx); setAnchor(ctx, s);
    return { mounted: mount, dragHandle: container.querySelector('[data-drag]') };
  }

  g.HLHUD = { render, updateReadout, levEval, levLeverage, marketLean, positionRead, DISCLAIMER,
    // read-only test hooks (leverage-safety invariants; no side effects)
    _t: { levClear, nearestClearLev, safeLeverage, dangerVerdict, heatAt, getHeatField, buildHeatField, bodyHtml, renderCascadeCard, adlSeg, hedgeRisk, portfolioStats, renderWalls, dataStale, srcBadgeHtml, edgeChips, edgeChipHtml, thinBook, thinBookHtml, getProfile, HEAT_HI, HEAT_MED, BIG_WALL } };
})(window);
