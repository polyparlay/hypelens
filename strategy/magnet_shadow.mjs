// MAGNET-V1 strategy SHADOW — scan / resolve / report. NO order placement.
// Frozen spec: strategy/PREREG-MAGNET-V1.md (hash-guarded below).
//   node strategy/magnet_shadow.mjs --scan      # arm intents from new calibration snapshots
//   node strategy/magnet_shadow.mjs --resolve   # simulate due intents on real candles+funding
//   node strategy/magnet_shadow.mjs --report    # gate status → strategy/reports/magnet_latest.md
//   node strategy/magnet_shadow.mjs --selftest  # simulator smoke on synthetic intent (writes nothing)
import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));            // strategy/
const REPO = join(ROOT, '..');
const DATA = join(ROOT, 'data'), REPORTS = join(ROOT, 'reports');
const SNAPS = join(REPO, 'calibration', 'data', 'snapshots.jsonl');
const INTENTS = join(DATA, 'magnet_intents.jsonl'), RESULTS = join(DATA, 'magnet_results.jsonl');
const INFO = 'https://api.hyperliquid.xyz/info';
const BAND = 0.0035, MIN_DIST = 0.004, NOTIONAL = 1000, DEDUP_H = 24;
const FEE = 0.00045, SLIP = 0.00015;                              // per side
const A_WINDOW_H = 24, B_WINDOW_H = 4, RESOLVE_AFTER_H = 28.5;
const DEADLINE = '2026-10-05';
const PREREG_TS = Date.parse('2026-08-23T23:00:00Z');             // gates: prospective cohort only
for (const d of [DATA, REPORTS]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

// prereg hash guard (write once, verify every run)
const preregHash = createHash('sha256').update(readFileSync(join(ROOT, 'PREREG-MAGNET-V1.md'))).digest('hex');
const hashFile = join(DATA, 'prereg.hash');
if (!existsSync(hashFile)) writeFileSync(hashFile, preregHash + '\n');
else if (readFileSync(hashFile, 'utf8').trim() !== preregHash) {
  console.error('FATAL: PREREG-MAGNET-V1.md changed after registration — run invalid.');
  process.exit(2);
}

const lines = (f) => existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
async function post(body, tries = 4) {
  for (let a = 1; ; a++) {
    try {
      const r = await fetch(INFO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(body.type + ' HTTP ' + r.status);
      return r.json();
    } catch (e) { if (a >= tries) throw e; await new Promise((res) => setTimeout(res, 1000 * a * a)); }
  }
}
const wilsonLo = (k, n, z = 1.96) => {
  if (!n) return 0;
  const p = k / n, z2 = z * z, den = 1 + z2 / n;
  return ((p + z2 / (2 * n)) - z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / den;
};

// ================= SCAN =================
function scan() {
  const cursorFile = join(DATA, 'scan.cursor');
  const cursor = existsSync(cursorFile) ? parseInt(readFileSync(cursorFile, 'utf8')) : 0;
  const snaps = lines(SNAPS).filter((s) => s.ts > cursor && s.method === 2 && s.magnet);
  const intents = lines(INTENTS);
  let armed = 0, maxTs = cursor;
  for (const s of snaps) {
    maxTs = Math.max(maxTs, s.ts);
    const m = s.magnet;
    if (m.distFrac < MIN_DIST || !s.markPx) continue;
    const bucket = Math.round(m.price / (m.price * 0.004));
    const key = s.coin + '|' + bucket;
    if (intents.some((i) => i.key === key && s.ts - i.t0 < DEDUP_H * 3600e3)) continue;
    const it = { id: s.ts + '|' + s.coin, key, t0: s.ts, coin: s.coin, mark0: s.markPx, wall: m.price, wallUsd: m.sizeUsd, side: m.side, distFrac: m.distFrac, status: 'armed' };
    appendFileSync(INTENTS, JSON.stringify(it) + '\n');
    intents.push(it); armed++;
  }
  writeFileSync(cursorFile, String(maxTs));
  console.log('scan: ' + snaps.length + ' magnet snapshots, ' + armed + ' new intents armed');
}

// ================= SIMULATOR (pure — candle-walk both variants) =================
// dirToWall: 'down' (wall below mark) → A shorts; 'up' → A longs. exec() applies slip.
export function simulate(it, candles, fundingRows) {
  const down = it.wall < it.mark0;                                 // approaching from above
  const dist = Math.abs(it.mark0 - it.wall);
  const wallNear = down ? it.wall * (1 + BAND) : it.wall * (1 - BAND); // near band edge
  const wallLo = it.wall * (1 - BAND), wallHi = it.wall * (1 + BAND);
  const cs = candles.map((k) => ({ t: k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c })).sort((a, b) => a.t - b.t);
  const exec = (px, sideBuy) => px * (sideBuy ? 1 + SLIP : 1 - SLIP);
  const pnl = (entryPx, exitPx, long) => {
    const gross = (long ? (exitPx - entryPx) / entryPx : (entryPx - exitPx) / entryPx) * NOTIONAL;
    return { gross, fees: FEE * NOTIONAL * 2 };
  };
  const funding = (t1, t2, long) => {
    let f = 0;
    for (const r of fundingRows || []) if (r.time >= t1 && r.time < t2) f += parseFloat(r.fundingRate) * NOTIONAL * (long ? 1 : -1);
    return f;                                                      // positive = cost
  };

  // --- Variant A: enter at arm toward wall, TP wallNear, SL symmetric, 24h stop
  const aLong = !down;
  const aEntry = exec(it.mark0, aLong);
  const aTP = wallNear, aSL = down ? it.mark0 + dist : it.mark0 - dist;
  let A = null;
  const aEnd = it.t0 + A_WINDOW_H * 3600e3;
  for (const k of cs) {
    if (k.t < it.t0 || k.t > aEnd) continue;
    const hitTP = down ? k.l <= aTP : k.h >= aTP;
    const hitSL = down ? k.h >= aSL : k.l <= aSL;
    if (hitSL) { A = { exit: exec(aSL, !aLong), at: k.t, how: 'sl' }; break; }   // conservative: SL first
    if (hitTP) { A = { exit: exec(aTP, !aLong), at: k.t, how: 'tp' }; break; }
  }
  if (!A) {
    const last = cs.filter((k) => k.t <= aEnd).pop();
    A = last ? { exit: exec(last.c, !aLong), at: last.t, how: 'timeout' } : null;
  }
  let resA = null;
  if (A) {
    const { gross, fees } = pnl(aEntry, A.exit, aLong);
    const fund = funding(it.t0, A.at, aLong);
    resA = { variant: 'A', how: A.how, gross: +gross.toFixed(2), fees: +fees.toFixed(2), funding: +fund.toFixed(2), net: +(gross - fees - fund).toFixed(2), holdH: +((A.at - it.t0) / 3600e3).toFixed(1) };
  }

  // --- Variant B: first touch of band within 24h → fade, TP 50% retrace, SL 0.5·dist beyond, 4h stop
  let touch = null;
  for (const k of cs) { if (k.t < it.t0 || k.t > aEnd) continue; if (k.l <= wallHi && k.h >= wallLo) { touch = k.t; break; } }
  let resB;
  if (!touch) resB = { variant: 'B', how: 'no_trade' };
  else {
    const bLong = down;                                            // fade a down-approach = long
    const bEntry = exec(it.wall, bLong);
    const bTP = down ? it.wall + 0.5 * dist : it.wall - 0.5 * dist;
    const bSL = down ? it.wall - 0.5 * dist : it.wall + 0.5 * dist;
    const bEnd = touch + B_WINDOW_H * 3600e3;
    let B = null;
    for (const k of cs) {
      if (k.t <= touch || k.t > bEnd) continue;
      const hitTP = down ? k.h >= bTP : k.l <= bTP;
      const hitSL = down ? k.l <= bSL : k.h >= bSL;
      if (hitSL) { B = { exit: exec(bSL, !bLong), at: k.t, how: 'sl' }; break; }
      if (hitTP) { B = { exit: exec(bTP, !bLong), at: k.t, how: 'tp' }; break; }
    }
    if (!B) {
      const last = cs.filter((k) => k.t <= bEnd).pop();
      B = last ? { exit: exec(last.c, !bLong), at: last.t, how: 'timeout' } : { exit: bEntry, at: bEnd, how: 'no_candles' };
    }
    const { gross, fees } = pnl(bEntry, B.exit, bLong);
    const fund = funding(touch, B.at, bLong);
    resB = { variant: 'B', how: B.how, touchH: +((touch - it.t0) / 3600e3).toFixed(1), gross: +gross.toFixed(2), fees: +fees.toFixed(2), funding: +fund.toFixed(2), net: +(gross - fees - fund).toFixed(2), holdH: +((B.at - touch) / 3600e3).toFixed(1) };
  }
  return { A: resA, B: resB };
}

// ================= RESOLVE =================
async function resolve() {
  const intents = lines(INTENTS), done = new Set(lines(RESULTS).map((r) => r.id));
  const due = intents.filter((i) => !done.has(i.id) && Date.now() - i.t0 >= RESOLVE_AFTER_H * 3600e3);
  if (!due.length) return console.log('resolve: nothing due');
  for (const it of due.slice(0, 20)) {
    try {
      const t1 = it.t0 + RESOLVE_AFTER_H * 3600e3;
      const candles = await post({ type: 'candleSnapshot', req: { coin: it.coin, interval: '5m', startTime: it.t0 - 300e3, endTime: t1 } });
      if (!Array.isArray(candles) || candles.length < 10) { console.log('resolve: thin candles for ' + it.coin + ' — retry later'); continue; }
      const fundingRows = await post({ type: 'fundingHistory', coin: it.coin, startTime: it.t0 - 3600e3, endTime: t1 }).catch(() => []);
      const { A, B } = simulate(it, candles, fundingRows);
      appendFileSync(RESULTS, JSON.stringify({ id: it.id, coin: it.coin, t0: it.t0, wallUsd: it.wallUsd, distFrac: it.distFrac, A, B }) + '\n');
      console.log('resolved ' + it.id + ' A:' + (A && A.how) + ' ' + (A && A.net) + ' B:' + B.how + ' ' + (B.net ?? ''));
    } catch (e) { console.log('resolve error ' + it.id + ': ' + e.message); }
  }
}

// ================= REPORT =================
function agg(rs, v) {
  const fires = rs.map((r) => r[v]).filter((x) => x && x.how !== 'no_trade' && x.net != null);
  const wins = fires.filter((f) => f.net > 0), losses = fires.filter((f) => f.net <= 0);
  const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
  const n = fires.length, net = sum(fires, 'net');
  const avgWin = wins.length ? sum(wins, 'net') / wins.length : 0;
  const avgLoss = losses.length ? -sum(losses, 'net') / losses.length : 0;
  const beWR = (avgWin + avgLoss) > 0 ? avgLoss / (avgWin + avgLoss) : 1;
  const wLo = wilsonLo(wins.length, n);
  const roiPerFire = n ? net / (n * NOTIONAL) : 0;
  return {
    n, wins: wins.length, wr: n ? wins.length / n : 0, wilsonLo: wLo, netUsd: +net.toFixed(2),
    fees: +sum(fires, 'fees').toFixed(2), funding: +sum(fires, 'funding').toFixed(2),
    avgWin: +avgWin.toFixed(2), avgLoss: +avgLoss.toFixed(2), breakevenWR: +beWR.toFixed(3),
    roiPerFirePct: +(roiPerFire * 100).toFixed(3),
    G1: n >= 30, G2: roiPerFire >= 0.001, G3: wLo > beWR,
    KILL: n >= 20 && roiPerFire <= -0.01,
    PASS: n >= 30 && roiPerFire >= 0.001 && wLo > beWR
  };
}
function report() {
  const all = lines(RESULTS), intents = lines(INTENTS);
  const rs = all.filter((r) => r.t0 >= PREREG_TS);                // gated cohort
  const ins = all.filter((r) => r.t0 < PREREG_TS);                // context only
  const A = agg(rs, 'A'), B = agg(rs, 'B');
  const iA = agg(ins, 'A'), iB = agg(ins, 'B');
  const noTrades = rs.filter((r) => r.B && r.B.how === 'no_trade').length;
  const md = ['# MAGNET-V1 shadow — ' + new Date().toISOString().slice(0, 16),
    'Prereg sha ' + preregHash.slice(0, 12) + '… · intents ' + intents.length + ' · resolved ' + all.length + ' (prospective ' + rs.length + ', insample ' + ins.length + ') · deadline ' + DEADLINE, '',
    '_Insample context (EXCLUDED from gates): A n=' + iA.n + ' ROI/fire ' + iA.roiPerFirePct + '% · B n=' + iB.n + ' ROI/fire ' + iB.roiPerFirePct + '%_', '',
    ...[['A (approach)', A], ['B (fade)', B]].map(([name, g]) =>
      `## Variant ${name}\nn=${g.n} wins=${g.wins} WR=${(g.wr * 100).toFixed(1)}% (Wilson-lo ${(g.wilsonLo * 100).toFixed(1)}%) · net $${g.netUsd} (fees $${g.fees}, funding $${g.funding}) · ROI/fire ${g.roiPerFirePct}% · avgW $${g.avgWin} avgL $${g.avgLoss} · breakeven WR ${(g.breakevenWR * 100).toFixed(1)}%\nG1(n≥30)=${g.G1} G2(ROI≥0.10%)=${g.G2} G3(WilsonLo>BE)=${g.G3} → **${g.KILL ? 'KILL' : g.PASS ? 'PASS' : 'COLLECTING'}**\n`),
    'B no-trade (never touched): ' + noTrades,
    '', 'Live fire remains BLOCKED regardless of PASS until: deadline report + operator testnet proof + explicit mainnet flip (see PREREG).'].join('\n');
  writeFileSync(join(REPORTS, 'magnet_latest.md'), md);
  appendFileSync(join(REPORTS, 'magnet_history.jsonl'), JSON.stringify({ ts: Date.now(), A, B }) + '\n');
  console.log(md);
}

// ================= SELFTEST (writes nothing) =================
async function selftest() {
  const t0 = Date.now() - 30 * 3600e3;
  const meta = await post({ type: 'metaAndAssetCtxs' });
  const btcIdx = meta[0].universe.findIndex((u) => u.name === 'BTC');
  const mark = parseFloat(meta[1][btcIdx].markPx);
  const candles = await post({ type: 'candleSnapshot', req: { coin: 'BTC', interval: '5m', startTime: t0 - 300e3, endTime: t0 + RESOLVE_AFTER_H * 3600e3 } });
  const c0 = +candles[0].c;
  const it = { id: 'selftest', t0, coin: 'BTC', mark0: c0, wall: c0 * 0.992, wallUsd: 15e6, side: 'below', distFrac: 0.008 };
  const out = simulate(it, candles, []);
  console.log('selftest BTC synthetic wall @ -0.8% (mark now ' + mark + '):');
  console.log(JSON.stringify(out, null, 1));
  if (!out.A || !out.B) throw new Error('selftest: simulator returned incomplete result');
  console.log('selftest OK (nothing written)');
}

const arg = process.argv[2];
if (arg === '--scan') scan();
else if (arg === '--resolve') await resolve();
else if (arg === '--report') report();
else if (arg === '--selftest') await selftest();
else console.log('usage: --scan | --resolve | --report | --selftest');
