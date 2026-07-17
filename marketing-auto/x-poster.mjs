#!/usr/bin/env node
/**
 * PolyParlay autonomous X poster
 *
 * Runs on a schedule (every 4-8 hours via launchd / GH Actions / Vercel Cron).
 * Each run:
 *   1. Pulls live Polymarket markets (gamma-api)
 *   2. Generates a parlay + Monte Carlo win rate + slip URL
 *   3. Picks a rotating tweet template
 *   4. Posts to X using OAuth 1.0a User Context
 *   5. Logs to .post-log.jsonl for dedup + analytics
 *
 * Setup:
 *   1. cd marketing-auto && npm i twitter-api-v2 dotenv
 *   2. Create .env in marketing-auto/ with:
 *      X_API_KEY=your_consumer_key
 *      X_API_SECRET=your_consumer_secret
 *      X_ACCESS_TOKEN=your_access_token
 *      X_ACCESS_SECRET=your_access_secret
 *   3. Test: node marketing-auto/x-poster.mjs --dry  (no post, just print)
 *   4. Live: node marketing-auto/x-poster.mjs
 *   5. Cron: see SETUP-AUTOMATION.md
 *
 * Flags:
 *   --dry          Generate + format but don't post
 *   --force        Bypass min-interval dedup check (for manual fires)
 *   --thread N     Post a multi-tweet thread (max 4)
 */

import { TwitterApi } from 'twitter-api-v2';
import { config as dotenv } from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv({ path: join(__dirname, '.env') });

const ARGS = new Set(process.argv.slice(2));
const DRY = ARGS.has('--dry');
const FORCE = ARGS.has('--force');
const LOG_PATH = join(__dirname, '.post-log.jsonl');

// Minimum hours between posts — prevents accidental spam if cron misfires.
// X free tier: 17 posts/day. We aim for 4-6/day = every 4-6 hours.
const MIN_HOURS_BETWEEN_POSTS = 3.5;

// === MARKET FETCH (mirrors generate-content.mjs) ============================
const GAMMA = 'https://gamma-api.polymarket.com';
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
const ONE_DAY   =      24 * 60 * 60 * 1000;

async function fetchCandidates() {
  const res = await fetch(
    `${GAMMA}/markets?active=true&closed=false&limit=100&order=volume24hr&ascending=false`,
    { headers: { 'User-Agent': 'polyparlay-x-poster/1.0' } }
  );
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const list = await res.json();
  const now = Date.now();
  return list.filter((m) => {
    const prices = parsePrices(m.outcomePrices);
    if (!prices || prices.length !== 2) return false;
    if (prices[0] < 0.30 || prices[0] > 0.70) return false;
    const vol24 = numOr(m.volume24hr, m.volume24Hr, m.volume_24h);
    if (!vol24 || vol24 < 5000) return false;
    if (!m.endDate) return false;
    const ends = new Date(m.endDate).getTime();
    if (isNaN(ends) || ends - now > TWO_WEEKS || ends - now < ONE_DAY) return false;
    if (!m.question || !m.slug) return false;
    return true;
  }).map((m) => ({
    slug: m.slug,
    question: m.question,
    yesPrice: parsePrices(m.outcomePrices)[0],
    noPrice:  parsePrices(m.outcomePrices)[1],
    endDate: m.endDate,
    vol24: numOr(m.volume24hr, m.volume24Hr, m.volume_24h)
  })).sort((a, b) => b.vol24 - a.vol24);
}

function parsePrices(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.map(Number);
  try { return JSON.parse(raw).map(Number); } catch { return null; }
}
function numOr(...vals) {
  for (const v of vals) { const n = parseFloat(v); if (!isNaN(n) && isFinite(n)) return n; }
  return null;
}

// === PARLAY + SIM ==========================================================
function buildParlay(markets) {
  const legs = markets.map((m) => {
    if (m.yesPrice >= m.noPrice) return { ...m, side: 'YES', price: m.yesPrice };
    return { ...m, side: 'NO', price: m.noPrice };
  });
  const cost = legs.reduce((a, l) => a * l.price, 1);
  const multiplier = cost > 0 ? 1 / cost : 0;
  let wins = 0;
  for (let i = 0; i < 10000; i++) {
    let ok = true;
    for (const l of legs) { if (Math.random() > l.price) { ok = false; break; } }
    if (ok) wins++;
  }
  return { legs, multiplier, winRate: wins / 10000 };
}

function encodeSlipUrl(parlay, stake = 25) {
  const payload = {
    l: parlay.legs.map((l) => ({
      q: l.question, d: l.side, p: l.price, e: l.endDate,
      u: `https://polymarket.com/event/${l.slug}`
    })),
    s: stake
  };
  const b64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://polyparlay.app/slip#${b64}`;
}

// === TWEET TEMPLATES =======================================================
// Rotated so we don't post the same copy twice in a row. Index advances each
// post via the log file; falls back to random if log unavailable.
const TEMPLATES = [
  (p, url) => `${p.n}-leg Polymarket parlay I built today.

→ ${p.wr}% real win rate (10K Monte Carlo)
→ ${p.mult}× combined multiplier
→ $${p.payout} max payout from $25

Full breakdown ↓
${url}`,

  (p, url) => `Stacked ${p.n} Polymarket markets, ran 10K sims.

Real win rate: ${p.wr}%
Max payout: $${p.payout}

Legs + Monte Carlo distribution → ${url}`,

  (p, url) => `Most parlay tools just multiply prices.

This one runs 10,000 simulations + flips your weakest leg.

${p.n}-leg parlay, ${p.wr}% WR (${p.mult}× multiplier):
${url}`,

  (p, url) => `${p.n} live Polymarket markets, parlayed.
${p.wr}% win rate after Improve Odds rebalanced the slip.

Fork it (free): ${url}`,

  (p, url) => `If I'm right on all ${p.n}: $${p.payout} from $25.
Monte Carlo says I'm right ${p.wr}% of the time.
Combined: ${p.mult}× → ${url}

Built with @polyparlay`,

  (p, url) => `Polymarket parlay, optimized:

• ${p.n} legs
• ${p.wr}% real WR
• ${p.mult}× combined
• ${p.payout > 100 ? 'chase parlay' : 'compound grinder'}

${url}`,

  (p, url) => `Quick parlay drop:

${p.wr}% Monte Carlo win rate · ${p.mult}× combined

Built with PolyParlay (free up to 3 legs): ${url}`,

  (p, url) => `Fresh ${p.n}-leg Polymarket slip.

Multiplier: ${p.mult}×
Real WR (10K sim): ${p.wr}%
Max from $25: $${p.payout}

${url}`
];

function pickTemplate(parlay, url, index) {
  const t = TEMPLATES[index % TEMPLATES.length];
  return t({
    n: parlay.legs.length,
    wr: Math.round(parlay.winRate * 1000) / 10,
    mult: parlay.multiplier.toFixed(2),
    payout: (25 * parlay.multiplier).toFixed(0)
  }, url);
}

// === LOG / DEDUP ===========================================================
function readLog() {
  if (!existsSync(LOG_PATH)) return [];
  const lines = readFileSync(LOG_PATH, 'utf-8').trim().split('\n').filter(Boolean);
  return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
function appendLog(entry) {
  const line = JSON.stringify(entry) + '\n';
  if (existsSync(LOG_PATH)) {
    writeFileSync(LOG_PATH, readFileSync(LOG_PATH, 'utf-8') + line);
  } else {
    writeFileSync(LOG_PATH, line);
  }
}
function shouldSkipDueToInterval() {
  const log = readLog();
  if (!log.length) return false;
  const last = log[log.length - 1];
  if (!last.tsMs) return false;
  const ageHours = (Date.now() - last.tsMs) / (1000 * 60 * 60);
  return ageHours < MIN_HOURS_BETWEEN_POSTS;
}
function nextTemplateIndex() {
  const log = readLog();
  return log.length;
}

// === MAIN ==================================================================
async function main() {
  const needed = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'];
  const missing = needed.filter((k) => !process.env[k]);
  if (missing.length && !DRY) {
    console.error('Missing env vars: ' + missing.join(', '));
    console.error('Create marketing-auto/.env from the example in SETUP-AUTOMATION.md');
    process.exit(1);
  }

  if (!FORCE && shouldSkipDueToInterval()) {
    const last = readLog()[readLog().length - 1];
    const ageMin = Math.round((Date.now() - last.tsMs) / 60000);
    console.log(`Skipped — last post ${ageMin}m ago (min interval ${MIN_HOURS_BETWEEN_POSTS}h). Use --force to override.`);
    process.exit(0);
  }

  console.log('Fetching live Polymarket markets...');
  const candidates = await fetchCandidates();
  if (candidates.length < 3) {
    console.error(`Only ${candidates.length} qualifying markets. Skipping this cycle.`);
    process.exit(0);
  }

  // Vary parlay leg-count by template index so feed has shape variety
  const idx = nextTemplateIndex();
  const legCount = 3 + (idx % 3); // cycles 3, 4, 5
  const parlay = buildParlay(candidates.slice(0, legCount));
  const url = encodeSlipUrl(parlay);
  const tweetText = pickTemplate(parlay, url, idx);

  console.log('\n--- Tweet preview ---\n' + tweetText + '\n---------------------\n');

  if (DRY) {
    console.log('[DRY RUN] Not posting. Skip --dry to send live.');
    return;
  }

  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET
  });

  const { data } = await client.v2.tweet(tweetText);
  const tweetId = data.id;
  const tweetUrl = `https://x.com/i/web/status/${tweetId}`;

  const entry = {
    tsMs: Date.now(),
    tsIso: new Date().toISOString(),
    tweetId,
    tweetUrl,
    templateIndex: idx % TEMPLATES.length,
    legCount,
    winRate: Math.round(parlay.winRate * 1000) / 10,
    multiplier: Number(parlay.multiplier.toFixed(2)),
    slipUrl: url,
    legs: parlay.legs.map((l) => `${l.side} ${l.question} @ ${l.price.toFixed(2)}`)
  };
  appendLog(entry);
  console.log(`✓ Posted: ${tweetUrl}`);
}

main().catch((e) => {
  console.error('Fatal:', e.message || e);
  appendLog({ tsMs: Date.now(), tsIso: new Date().toISOString(), error: String(e.message || e) });
  process.exit(1);
});
