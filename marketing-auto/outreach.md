# Outreach templates — influencers, PM team, partnerships

Copy-paste, replace `{{tokens}}`, send. Each template is calibrated for a specific recipient type.

---

## 1. Polymarket builder program / team

**Channel:** Email to `builders@polymarket.com` (or DM their official X account)
**Goal:** Get featured in their newsletter, builder showcase, or an official tweet
**Frequency:** Send once, follow up after 14 days if no reply

### Template — initial email

```
Subject: PolyParlay — built the parlay-analytics layer Polymarket doesn't ship

Hi {{name or "Polymarket builder team"}},

Built a free Chrome extension that adds multi-leg parlay analytics to Polymarket — figured your team should see it.

Live at polyparlay.app. Quick summary:
- Floating "+ Add to slip" pill on every PM market page
- 10K Monte Carlo per slip → real win-rate distribution
- "Improve Odds" rebalancer auto-flips weakest legs
- Half-Kelly bet sizing recommendation
- Free up to 3 legs, $14.99/mo Pro for unlimited
- On-chain USDC payment on Polygon (no Stripe, no signup)

We position as complementary, not competitive — execution still happens on Polymarket. We're the calculator + sim layer that turns multi-market intuition into measurable EV.

Two specific asks:
1. Would you mention it in the next builder newsletter or showcase?
2. Any feedback on the gamma-api usage pattern? We hit /markets and /events; want to make sure we're being a good API citizen.

Happy to add a "Powered by Polymarket" footer, contribute to docs, or anything else useful.

— {{your name}}
{{your X handle}}
{{your email}}
```

### Follow-up after 14 days

```
Subject: Re: PolyParlay — friendly bump

Hi {{name}},

Bumping this — PolyParlay launched on Chrome Web Store {{date}} and we've had {{install count}} installs in the first week, mostly via Polymarket-adjacent X traffic. Would still love a quick look from your team.

Latest stats:
- {{installs}} active users
- {{paid}} Pro subscribers
- {{slips_shared}} shareable slip URLs posted to X (all linking back to polymarket.com)

If a quick mention isn't possible, I'd settle for confirmation that we're not violating any API/branding terms — want to play nice.

Thanks again,
{{your name}}
```

---

## 2. PM-focused X influencers (1K-50K followers)

**Channel:** X DM (or public reply with @mention if DMs closed)
**Goal:** Get them to try it + tweet about it
**Targets:** Search "polymarket" on X, filter by 1K-50K followers, identify accounts that tweet PM bets regularly
**Frequency:** Personalize to each recipient — don't batch-spam

### Template — initial DM (warm, with comp code)

```
Hey {{name}}, saw your {{recent PM bet/take they tweeted}} — built a tool for exactly that.

PolyParlay (Chrome extension) runs 10K Monte Carlo on PM parlays + has an Improve Odds button that finds your weakest leg + computes Half-Kelly stake.

Made you a sample slip from your last take: {{slip URL}}

You'd be one of the first PM accounts to try it, so here's a free Pro code (good for 1 year, normally $99):

  →  {{COMP_CODE from comp-codes.md}}

Paste it into the wallet field at polyparlay.app/upgrade — Pro unlocks instantly, no MetaMask required.

If it ends up useful, a tweet would mean a lot. If not, no worries — keep the code anyway.
```

**Replace before sending:**
- `{{name}}` → their handle (or first name if their bio shows it)
- `{{recent PM bet/take they tweeted}}` → 1 specific tweet of theirs (proves you actually read their account)
- `{{slip URL}}` → run `node marketing-auto/generate-content.mjs` and grab a slip URL, ideally constructed to match what they bet on
- `{{COMP_CODE}}` → next unassigned code from `comp-codes.md` — record assignment in that file

### Template — follow-up if they engage

```
Glad it was useful! One thing worth knowing — every slip you build generates a shareable URL with the Monte Carlo result embedded. So if you ever want to tweet a parlay take, the URL renders a rich preview with your win rate.

Example from my own feed: {{your tweet URL}}

Also: free tier covers up to 3 legs forever, no signup. Pro is $14.99/mo for unlimited + Kelly bet sizing. On-chain USDC if you go that route.

If you ever review tools, would love to be on the list.
```

### Template — for accounts with closed DMs (public reply)

```
@{{handle}} you'd like this — runs 10K Monte Carlo on PM parlays + auto-flips weak legs. Made you a sample of your last bet: {{slip URL}}

Free Chrome ext, no signup. polyparlay.app
```

---

## 3. r/PolyMarket and adjacent subreddits

**Channel:** Reddit posts (covered in templates.md) + Reddit DMs to active commenters
**Goal:** Drive installs via educational posts; build referral relationships with power users

### Template — DM to a recent thread commenter

```
Subject: Tool for your last parlay take

Saw your comment on the {{thread title}} thread — figured you might want this.

PolyParlay is a free Chrome extension that does Monte Carlo + Improve Odds on PM parlays. Built it solo, sharing with PM regulars who'd actually use it.

polyparlay.app

If it's not your thing no worries, won't follow up.
```

---

## 4. Discord server admins (Polymarket-adjacent communities)

**Channel:** DM the admin / mod team via Discord
**Goal:** Get an official server announcement or pinned message

### Template

```
Hey {{admin name}},

Built a free Chrome extension for Polymarket parlay analytics — wanted to see if it'd be useful to share in {{server name}}.

What it does: Monte Carlo sim on multi-leg PM slips, Improve Odds rebalancer, Kelly bet sizing. Free up to 3 legs.

Happy to send the install link in #tools or wherever fits, only if it's useful for your community — don't want to spam. polyparlay.app

Let me know how you'd like to handle it.
```

---

## 5. Crypto/DeFi podcasters + YouTubers

**Channel:** Email or X DM
**Goal:** Get a review video or podcast mention
**Best targets:** smaller channels (5K-100K subs) — they reply

### Template

```
Subject: Pure on-chain SaaS — would make a good "weird crypto product" segment

Hi {{name}},

Long-time {{podcast/channel name}} listener. Built something that might be a fit for your "interesting crypto products" segment:

PolyParlay (polyparlay.app) is a Chrome extension that adds Monte Carlo + Kelly bet sizing to Polymarket. The pricing model is the unusual part:

→ Free up to 3 legs
→ $14.99 USDC monthly OR $99 USDC annually on Polygon
→ Zero signup, zero email, zero credit card
→ Cloudflare Worker polls Polygonscan to verify payment

It's one of the few subscription tools that's actually pure on-chain payment, no Stripe shim. Might be worth a segment for the "what novel crypto-native business models look like" angle.

Free Pro lifetime if you want to try it. Happy to be on the show or just chat.

— {{your name}}
{{your X handle}}
```

---

## 6. Newsletter / Substack writers (prediction-markets / forecasting niche)

**Channel:** Email via Substack DM feature, or open contact
**Goal:** Inclusion in their "tools" roundup or a dedicated post

### Template

```
Subject: PolyParlay — for your "tools for forecasters" list

Hi {{name}},

Read {{their recent post title}} — appreciated {{specific insight}}.

I built PolyParlay (polyparlay.app), a free Chrome extension for multi-leg Polymarket parlays. Adds 10K Monte Carlo, Improve Odds rebalancer, and Kelly bet sizing to the PM UI.

If you're ever doing a tools roundup or covering quantitative forecasting, would love consideration. Happy to provide:
- A free Pro account for evaluation
- An honest "behind the design" interview if useful
- Source data / methodology details on how we compute sim WR vs. listed multipliers

Either way, keep up the good work — your post on {{topic}} influenced how I think about {{related angle}}.

— {{your name}}
```

---

## How to find recipients (quick research playbook)

**PM influencers on X:**
1. Search X for: `polymarket` (last 7 days)
2. Filter by followers: 1K-50K
3. Skip mega-accounts (>50K) — low reply rate
4. Skip bots — look for consistent posting + replies
5. Aim for 5-10 personalized DMs/week — quality over quantity

**Reddit power users:**
1. r/PolyMarket → sort by Top of week → look at top comment authors
2. Click profile → check post history → confirm they're active
3. DM via Reddit, not via the public thread

**PM team contacts:**
- builders@polymarket.com (official)
- Their X account: @Polymarket
- Their Discord: discord.gg/polymarket
- Their team accounts (search "polymarket" on LinkedIn)

**Crypto podcasters:**
- Bankless, Unchained, The Defiant, BellCurve, Lightspeed — these are the bigs
- Smaller and more responsive: Rollup, Wassies of the Day, The Network State (Balaji)
- Submit yourself via their websites' Contact pages
