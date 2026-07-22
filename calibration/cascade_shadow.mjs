// HypeLens cascade/magnet SHADOW CALIBRATION — collector + scorer.
// See PREREG.md (frozen hypotheses/scoring). No trading, no writes anywhere
// but calibration/data + calibration/reports. Runs the SHIPPED model:
// extension/viewmodel.js computeCascade is eval'd, never reimplemented.
//
//   node calibration/cascade_shadow.mjs --collect   # snapshot predictions (cron */30)
//   node calibration/cascade_shadow.mjs --score     # score snapshots ≥25h old
//   node calibration/cascade_shadow.mjs --report    # rebuild report only
import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));           // calibration/
const REPO = join(ROOT, '..');
const DATA = join(ROOT, 'data'), REPORTS = join(ROOT, 'reports');
const SNAPS = join(DATA, 'snapshots.jsonl'), SCORES = join(DATA, 'scores.jsonl');
const INFO = 'https://api.hyperliquid.xyz/info';
const BIG_WALL = 10e6, MAGNET_NEAR = 0.015, BAND = 0.0035;      // frozen per PREREG
const MIN_AGE_H = 25, H2_WINDOW_H = 6, H3_WINDOW_H = 4, TOUCH_WINDOW_H = 24;
const DEDUP_H = 6;
for (const d of [DATA, REPORTS]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

// ---- prereg hash (write once, verify every run) ----
const preregHash = createHash('sha256').update(readFileSync(join(ROOT, 'PREREG.md'))).digest('hex');
const hashFile = join(DATA, 'prereg.hash');
if (!existsSync(hashFile)) writeFileSync(hashFile, preregHash + '\n');
else if (readFileSync(hashFile, 'utf8').trim() !== preregHash) {
  console.error('FATAL: PREREG.md changed after registration — run invalid. Revert or start a new registered run.');
  process.exit(2);
}

// ---- load the SHIPPED model ----
const g = globalThis; g.window = g;
eval(readFileSync(join(REPO, 'extension', 'viewmodel.js'), 'utf8'));
const VM = g.HLVM;

const post = async (body) => {
  const r = await fetch(INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(body.type + ' HTTP ' + r.status);
  return r.json();
};
const readLines = (f) => existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const wilson = (k, n, z = 1.96) => {
  if (!n) return { lo: 0, hi: 1 };
  const p = k / n, z2 = z * z, den = 1 + z2 / n;
  const c = p + z2 / (2 * n), m = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return { lo: (c - m) / den, hi: (c + m) / den };
};

// ================= COLLECT =================
async function collect() {
  // 1. whale crawl via the existing aggregator (same data path the extension uses).
  // method:2 (PREREG-ADDENDUM-2): v0.22 aggregator writes docs/feed/hypelens-intel.json
  // and logs to stderr only — read the feed file, not stdout.
  execFileSync(process.execPath, [join(REPO, 'worker', 'aggregate-intel.mjs')], { stdio: ['ignore', 'ignore', 'inherit'], maxBuffer: 64e6 });
  const intel = JSON.parse(readFileSync(join(REPO, 'docs', 'feed', 'hypelens-intel.json'), 'utf8'));
  // 2. oiNtl / dayNtlVlm per coin from one metaAndAssetCtxs call
  const [meta, ctxs] = await post({ type: 'metaAndAssetCtxs' });
  const rowByCoin = {};
  meta.universe.forEach((u, i) => {
    const c = ctxs[i] || {};
    const mark = parseFloat(c.markPx), oi = parseFloat(c.openInterest), vlm = parseFloat(c.dayNtlVlm);
    rowByCoin[u.name] = { markPx: mark, oiNtl: isNaN(oi) || isNaN(mark) ? null : oi * mark, dayNtlVlm: isNaN(vlm) ? null : vlm };
  });
  const ts = Date.now();
  let n = 0;
  for (const [coin, d] of Object.entries(intel.coins || {})) {
    const row = rowByCoin[coin]; if (!row || !row.markPx) continue;
    // feed positions are [liqPx, notionalUsd, sideIdx, addr, entryPx, ...]
    const liqLevels = (d.positions || []).map((p) => ({ price: p[0], sizeUsd: p[1] }));
    if (!liqLevels.length) continue;
    const vm = { coin, markPx: row.markPx, oiNtl: row.oiNtl, dayNtlVlm: row.dayNtlVlm, liqLevels };
    const down = VM.computeCascade(vm, 'down'), up = VM.computeCascade(vm, 'up');
    // nearest ≥$10M wall within MAGNET_NEAR of mark (H1/H3 event)
    let magnet = null;
    for (const l of liqLevels) {
      if (l.sizeUsd < BIG_WALL) continue;
      const dist = Math.abs(l.price - row.markPx) / row.markPx;
      if (dist <= MAGNET_NEAR && (!magnet || l.sizeUsd > magnet.sizeUsd)) magnet = { price: l.price, sizeUsd: l.sizeUsd, distFrac: dist, side: l.price < row.markPx ? 'below' : 'above' };
    }
    const slim = (c) => c && { chain: c.chain, triggerPx: c.triggerPx, terminalPx: c.terminalPx, totalLiqUsd: c.totalLiqUsd, hops: c.hops.length, depthSource: c.depthSource, dropFrac: c.dropFrac };
    appendFileSync(SNAPS, JSON.stringify({ ts, coin, method: 2, markPx: row.markPx, oiNtl: row.oiNtl, dayNtlVlm: row.dayNtlVlm, nLevels: liqLevels.length, totalLiqUsd: liqLevels.reduce((s, l) => s + l.sizeUsd, 0), down: slim(down), up: slim(up), magnet }) + '\n');
    n++;
  }
  console.log('collected ' + n + ' coin snapshots @ ' + new Date(ts).toISOString());
}

// ================= SCORE =================
const touchIn = (candles, t0, t1, lo, hi) => {
  for (const k of candles) { const t = k.t; if (t < t0 || t > t1) continue; if (parseFloat(k.l) <= hi && parseFloat(k.h) >= lo) return t; }
  return null;
};
async function score() {
  const snaps = readLines(SNAPS), scored = new Set(readLines(SCORES).map((s) => s.id));
  const now = Date.now(), due = snaps.filter((s) => now - s.ts >= MIN_AGE_H * 3600e3 && !scored.has(s.ts + '|' + s.coin));
  if (!due.length) return console.log('nothing due');
  // event dedup (PREREG): skip same-coin snapshots within DEDUP_H of an already-scored armed event
  const lastArmed = {};   // coin -> ts of last SCORED armed(H2/H3-eligible) event
  for (const s of readLines(SCORES)) if (s.armed) lastArmed[s.coin] = Math.max(lastArmed[s.coin] || 0, s.ts);
  const candleCache = {};
  const candlesFor = async (coin, t0, t1) => {
    const key = coin + '|' + Math.floor(t0 / 3600e3);
    if (!candleCache[key]) candleCache[key] = await post({ type: 'candleSnapshot', req: { coin, interval: '1h', startTime: t0 - 3600e3, endTime: t1 + 3600e3 } });
    return candleCache[key];
  };
  let n = 0;
  for (const s of due.slice(0, 120)) {   // cap per run — cron catches up
    try {
      const t0 = s.ts, tEnd = t0 + TOUCH_WINDOW_H * 3600e3;
      const cs = await candlesFor(s.coin, t0, tEnd + H2_WINDOW_H * 3600e3);
      if (!Array.isArray(cs) || cs.length < 3) continue;
      const out = { id: s.ts + '|' + s.coin, ts: s.ts, coin: s.coin, armed: false };
      // H1 magnet vs control (only when a magnet existed)
      if (s.magnet) {
        const m = s.magnet, mark = s.markPx;
        const magLo = m.price * (1 - BAND), magHi = m.price * (1 + BAND);
        const anti = m.side === 'below' ? mark * (1 + m.distFrac) : mark * (1 - m.distFrac);
        out.h1 = {
          distFrac: m.distFrac, sizeUsd: m.sizeUsd,
          touchedMagnet: touchIn(cs, t0, tEnd, magLo, magHi) != null,
          touchedControl: touchIn(cs, t0, tEnd, anti * (1 - BAND), anti * (1 + BAND)) != null
        };
        // H3 sweep-and-reverse (dedup with lastArmed)
        const tTouch = touchIn(cs, t0, tEnd, magLo, magHi);
        if (tTouch != null && !(lastArmed[s.coin] && s.ts - lastArmed[s.coin] < DEDUP_H * 3600e3)) {
          out.armed = true; lastArmed[s.coin] = s.ts;
          const approach = Math.abs(mark - m.price);
          const revTarget = m.side === 'below' ? m.price + 0.5 * approach : m.price - 0.5 * approach;
          out.h3 = { reversed: touchIn(cs, tTouch, tTouch + H3_WINDOW_H * 3600e3, Math.min(revTarget, revTarget), Math.max(revTarget, revTarget)) != null };
        }
      }
      // H2 cascade calibration (armed chains with real depth only)
      for (const side of ['down', 'up']) {
        const c = s[side]; if (!c || !c.chain || c.depthSource === 'proxy') continue;
        const trigLo = c.triggerPx * (1 - BAND), trigHi = c.triggerPx * (1 + BAND);
        const tTrig = touchIn(cs, t0, tEnd, trigLo, trigHi);
        if (tTrig == null) { out['h2_' + side] = { triggered: false }; continue; }
        const t1 = tTrig + H2_WINDOW_H * 3600e3;
        // furthest excursion beyond trigger toward terminal within the window
        let ext = 0;
        for (const k of cs) { if (k.t < tTrig || k.t > t1) continue; const px = side === 'down' ? parseFloat(k.l) : parseFloat(k.h); const d = side === 'down' ? c.triggerPx - px : px - c.triggerPx; if (d > ext) ext = d; }
        const span = Math.abs(c.terminalPx - c.triggerPx);
        out['h2_' + side] = { triggered: true, reach: span > 0 ? +(ext / span).toFixed(3) : null, halfway: span > 0 && ext / span >= 0.5 };
        out.armed = true;
      }
      appendFileSync(SCORES, JSON.stringify(out) + '\n'); n++;
    } catch (e) { console.error('score fail', s.coin, e.message); }
  }
  console.log('scored ' + n + ' snapshots');
  report();
}

// ================= REPORT =================
function report() {
  const sc = readLines(SCORES);
  const h1 = sc.filter((s) => s.h1);
  const kM = h1.filter((s) => s.h1.touchedMagnet).length, kC = h1.filter((s) => s.h1.touchedControl).length;
  const wM = wilson(kM, h1.length), wC = wilson(kC, h1.length);
  const h2 = sc.flatMap((s) => [s.h2_down, s.h2_up].filter(Boolean));
  const trig = h2.filter((x) => x.triggered), half = trig.filter((x) => x.halfway);
  const reaches = trig.map((x) => x.reach).filter((x) => x != null).sort((a, b) => a - b);
  const med = reaches.length ? reaches[Math.floor(reaches.length / 2)] : null;
  const h3 = sc.filter((s) => s.h3), rev = h3.filter((s) => s.h3.reversed);
  const wH3 = wilson(rev.length, h3.length);
  const gate = (n) => n >= 100 ? '' : ' — **below n gate (100), NO CLAIMS**';
  const md = `# Cascade/magnet calibration — ${new Date().toISOString().slice(0, 16)}
Prereg sha256 ${preregHash.slice(0, 12)}… · snapshots ${readLines(SNAPS).length} · scored ${sc.length}

## H1 magnet (wall ≥$10M within 1.5%) — n=${h1.length}${gate(h1.length)}
touch magnet 24h: ${kM}/${h1.length} (Wilson ${(wM.lo * 100).toFixed(0)}–${(wM.hi * 100).toFixed(0)}%)
touch control  : ${kC}/${h1.length} (Wilson ${(wC.lo * 100).toFixed(0)}–${(wC.hi * 100).toFixed(0)}%)
PASS requires lower(magnet) > upper(control): **${h1.length >= 100 && wM.lo > wC.hi ? 'PASS' : 'not yet'}**

## H2 cascade calibration — armed ${h2.length}, trigger-hit ${trig.length}${gate(trig.length >= 50 ? 100 : trig.length)}
halfway-to-terminal after trigger: ${half.length}/${trig.length}
terminal-reach median: ${med == null ? '—' : med} (k retune allowed at n≥50 trigger-hits, prospectively only)

## H3 sweep-and-reverse — n=${h3.length}${gate(h3.length)}
reversed ≥50% of approach in 4h: ${rev.length}/${h3.length} (Wilson ${(wH3.lo * 100).toFixed(0)}–${(wH3.hi * 100).toFixed(0)}%)
`;
  writeFileSync(join(REPORTS, 'calibration_latest.md'), md);
  console.log(md);
}

const mode = process.argv[2] || '--collect';
if (mode === '--collect') collect().catch((e) => { console.error(e.message); process.exit(1); });
else if (mode === '--score') score().catch((e) => { console.error(e.message); process.exit(1); });
else if (mode === '--report') report();
else { console.error('usage: --collect | --score | --report'); process.exit(1); }
