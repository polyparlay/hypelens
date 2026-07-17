#!/usr/bin/env node
/**
 * PolyParlay daily content generator
 *
 * Pulls live Polymarket markets, picks 3-5 high-volume + interesting-price
 * markets, builds parlays from them, computes the same Monte Carlo win-rate
 * the extension does, generates shareable slip URLs, and outputs ready-to-post
 * tweet copy.
 *
 * Run: `node marketing-auto/generate-content.mjs`
 * Or:  `node marketing-auto/generate-content.mjs --json > today.json` for piping.
 *
 * No deps — pure Node 18+ (uses built-in fetch).
 */

const GAMMA = 'https://gamma-api.polymarket.com';
const ARGS = new Set(process.argv.slice(2));
const JSON_MODE = ARGS.has('--json');

// === MARKET SELECTION ======================================================
// We want markets that make INTERESTING parlay material:
//   - end date within ~14 days (so the parlay has a near-term resolution)
//   - YES/NO prices between 0.30 and 0.70 (50/50ish — boring 90/10 markets
//     make for trivial parlays no one shares)
//   - 24h volume > $5,000 (active enough that the price means something)
//   - binary outcomes only (skip n-way markets — extension only supports binary)
async function fetchCandidateMarkets() {
  const url = `${GAMMA}/markets?active=true&closed=false&limit=100&order=volume24hr&ascending=false`;
  const res = await fetch(url, { headers: { 'User-Agent': 'polyparlay-content-gen/1.0' } });
  if (!res.ok) throw new Error(`Gamma fetch failed: ${res.status}`);
  const list = await res.json();
  const now = Date.now();
  const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

  return list.filter((m) => {
    const prices = parseOutcomePrices(m.outcomePrices);
    if (!prices || prices.length !== 2) return false;
    const p = prices[0];
    if (p < 0.30 || p > 0.70) return false;
    const vol24 = pickNumber([m.volume24hr, m.volume24Hr, m.volume_24h]) || 0;
    if (vol24 < 5000) return false;
    if (!m.endDate) return false;
    const ends = new Date(m.endDate).getTime();
    if (isNaN(ends) || ends - now > TWO_WEEKS || ends - now < 24 * 60 * 60 * 1000) return false;
    if (!m.question || !m.slug) return false;
    return true;
  }).map((m) => {
    const prices = parseOutcomePrices(m.outcomePrices);
    const outcomes = parseOutcomes(m.outcomes);
    return {
      slug: m.slug,
      question: m.question,
      yesPrice: prices[0],
      noPrice: prices[1],
      outcomes,
      endDate: m.endDate,
      vol24: pickNumber([m.volume24hr, m.volume24Hr, m.volume_24h]) || 0
    };
  });
}

function parseOutcomePrices(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.map(Number);
  try { return JSON.parse(raw).map(Number); } catch { return null; }
}
function parseOutcomes(raw) {
  if (!raw) return ['YES', 'NO'];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return ['YES', 'NO']; }
}
function pickNumber(values) {
  for (const v of values) {
    if (v == null) continue;
    const n = parseFloat(v);
    if (!isNaN(n) && isFinite(n)) return n;
  }
  return null;
}

// === PARLAY CONSTRUCTION ===================================================
// For each generated parlay, pick the SIDE (YES or NO) per leg that maximizes
// the joint win rate, since that's what Improve Odds would do. This shows the
// extension's value: it's not random parlays, it's optimized ones.
function buildParlay(markets) {
  const legs = markets.map((m) => {
    // Pick the side with higher implied probability so the parlay isn't a
    // pure long-shot. (Improve Odds in the extension does this same thing.)
    if (m.yesPrice >= m.noPrice) {
      return { ...m, side: 'YES', price: m.yesPrice };
    } else {
      return { ...m, side: 'NO', price: m.noPrice };
    }
  });
  const cost = legs.reduce((a, l) => a * l.price, 1);
  const multiplier = cost > 0 ? 1 / cost : 0;
  // 10K Monte Carlo, identical algorithm to the extension + slip.html
  let wins = 0;
  const RUNS = 10000;
  for (let i = 0; i < RUNS; i++) {
    let ok = true;
    for (const l of legs) {
      if (Math.random() > l.price) { ok = false; break; }
    }
    if (ok) wins++;
  }
  return { legs, multiplier, winRate: wins / RUNS };
}

// === SLIP URL ENCODING =====================================================
// Matches the format slip.html expects + the extension's encodeSlipForSharing.
// Base64url-encoded { l: [{q,d,p,e,u}], s }
function encodeSlipUrl(parlay, stake = 25) {
  const payload = {
    l: parlay.legs.map((l) => ({
      q: l.question,
      d: l.side,
      p: l.price,
      e: l.endDate,
      u: `https://polymarket.com/event/${l.slug}`
    })),
    s: stake
  };
  const b64 = Buffer.from(JSON.stringify(payload), 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://polyparlay.app/slip#${b64}`;
}

// === TWEET COPY ============================================================
// Pre-rotated templates so a daily cron doesn't post the same copy every day.
const TWEET_TEMPLATES = [
  ({ n, wr, mult, payout, url }) =>
    `${n}-leg Polymarket parlay I built today.\n\n` +
    `→ ${wr}% real win rate (10K Monte Carlo)\n` +
    `→ ${mult}× combined multiplier\n` +
    `→ $${payout} max payout from $25\n\n` +
    `Full breakdown ↓\n${url}`,

  ({ n, wr, payout, url }) =>
    `Stacked ${n} Polymarket markets, ran 10K sims.\n\n` +
    `Real win rate: ${wr}%\n` +
    `Max payout (if all hit): $${payout}\n\n` +
    `The legs + Monte Carlo distribution → ${url}`,

  ({ n, wr, mult, url }) =>
    `Most parlay tools just multiply prices.\n\n` +
    `This one runs 10,000 simulations + flips your weakest leg.\n\n` +
    `Here's a ${n}-leg parlay at ${wr}% WR (${mult}× multiplier) →\n${url}`,

  ({ n, wr, url }) =>
    `${n} live Polymarket markets, parlayed.\n${wr}% win rate after Improve Odds rebalanced the slip.\n\nFork it (free): ${url}`,

  ({ n, wr, mult, payout, url }) =>
    `If I'm right on all ${n}: $${payout} from $25.\n` +
    `Monte Carlo says I'm right ${wr}% of the time.\n` +
    `Combined: ${mult}× → ${url}\n\n` +
    `Built with @polyparlay (free up to 3 legs)`
];

function rotateTemplate(parlay, url, indexHint = 0) {
  const t = TWEET_TEMPLATES[indexHint % TWEET_TEMPLATES.length];
  return t({
    n: parlay.legs.length,
    wr: Math.round(parlay.winRate * 1000) / 10,
    mult: parlay.multiplier.toFixed(2),
    payout: (25 * parlay.multiplier).toFixed(0),
    url
  });
}

// === MAIN ==================================================================
async function main() {
  if (!JSON_MODE) {
    console.log('\n=== PolyParlay daily content ===');
    console.log('Fetching live Polymarket markets...\n');
  }

  let candidates;
  try {
    candidates = await fetchCandidateMarkets();
  } catch (e) {
    console.error('Failed to fetch markets:', e.message);
    console.error('Network may be blocked (check ISP DNS / VPN). Try again later.');
    process.exit(1);
  }

  if (candidates.length < 3) {
    console.error(`Only ${candidates.length} qualifying markets found (need ≥3). Try later or relax filters.`);
    process.exit(1);
  }

  // Build 3 parlays: 3-leg, 4-leg, and 5-leg sampled from top markets
  // (sorted by volume). Variety so we have content for different post types.
  candidates.sort((a, b) => b.vol24 - a.vol24);

  const parlays = [];
  if (candidates.length >= 3) parlays.push(buildParlay(candidates.slice(0, 3)));
  if (candidates.length >= 4) parlays.push(buildParlay(candidates.slice(0, 4)));
  if (candidates.length >= 5) parlays.push(buildParlay(candidates.slice(0, 5)));

  const today = new Date().toISOString().slice(0, 10);
  const output = parlays.map((p, i) => {
    const url = encodeSlipUrl(p);
    return {
      legs: p.legs.map((l) => `${l.side} ${l.question} @ $${l.price.toFixed(2)}`),
      winRate: Math.round(p.winRate * 1000) / 10,
      multiplier: Number(p.multiplier.toFixed(2)),
      maxPayoutFrom25: Number((25 * p.multiplier).toFixed(2)),
      shareUrl: url,
      tweets: TWEET_TEMPLATES.map((_, idx) => rotateTemplate(p, url, idx))
    };
  });

  if (JSON_MODE) {
    console.log(JSON.stringify({ date: today, parlays: output }, null, 2));
    return;
  }

  console.log(`Generated ${output.length} parlays for ${today}\n`);
  output.forEach((p, i) => {
    console.log(`────────────────────────────────────────────────────────`);
    console.log(`Parlay ${i + 1}: ${p.legs.length} legs · ${p.winRate}% WR · ${p.multiplier}× · $${p.maxPayoutFrom25} max`);
    console.log(`────────────────────────────────────────────────────────`);
    console.log('LEGS:');
    p.legs.forEach((leg, idx) => console.log(`  ${idx + 1}. ${leg}`));
    console.log(`\nSHARE URL:\n${p.shareUrl}`);
    console.log(`\n--- TWEET OPTION A ---\n${p.tweets[0]}`);
    console.log(`\n--- TWEET OPTION B ---\n${p.tweets[1]}`);
    console.log('');
  });
  console.log(`────────────────────────────────────────────────────────`);
  console.log('Copy any tweet above → paste in X composer → post. Or pipe with --json for automation.\n');
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
