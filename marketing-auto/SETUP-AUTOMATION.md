# Zero-touch X auto-poster — setup guide

15-minute setup. After this, X posts go out every 4 hours automatically forever (or until you `launchctl unload` it).

## Step 1 — Get X API keys (5 min)

1. Go to **https://developer.x.com** → sign up for free tier (use your @polyparlay account)
2. Hit **"Create Project"** → name it `polyparlay-auto`
3. Inside the project → **"Add App"** → name it `polyparlay-poster`
4. App settings → **"User authentication settings"** → Set up:
   - **App permissions:** `Read and write` (required to post tweets)
   - **Type of App:** `Automated App or Bot`
   - **Callback URI:** `https://polyparlay.app` (placeholder — unused)
   - **Website URL:** `https://polyparlay.app`
   - Save
5. App page → **"Keys and tokens"** tab. You need 4 values:
   - **API Key** (also called Consumer Key)
   - **API Key Secret** (also called Consumer Secret)
   - Scroll to **Access Token and Secret** → click **"Generate"** → copy both immediately (won't show again)
     - Access Token
     - Access Token Secret

**Free tier limits:** 1,500 posts/month = ~50/day. We post ~6/day, well under cap.

## Step 2 — Install dependencies (1 min)

```bash
cd /Users/clawdlawd/polyparlay/marketing-auto
npm install
```

This installs `twitter-api-v2` + `dotenv` — both small, no surprises.

## Step 3 — Configure credentials (1 min)

```bash
cd /Users/clawdlawd/polyparlay/marketing-auto
cp .env.example .env
```

Open `.env` in your editor, paste the 4 keys from Step 1. Save.

`.env` is gitignored — keys stay local.

## Step 4 — Test (1 min)

Dry run (generates + formats but doesn't post):
```bash
cd /Users/clawdlawd/polyparlay/marketing-auto
node x-poster.mjs --dry
```

You should see a tweet preview with live PM markets + a shareable slip URL. If that looks good, fire a real one:

```bash
node x-poster.mjs --force
```

(The `--force` skips the 3.5h min-interval check since this is your first post.) Check x.com to see it land. The slip URL should auto-render the PolyParlay slip card.

## Step 5 — Install launchd schedule (3 min)

Schedules the script to fire every 4 hours, automatically, forever.

**First, fix the paths in the plist** — the file ships with paths that assume your project lives at `/Users/clawdlawd/polyparlay/`. If yours is elsewhere:

```bash
# Check your actual path
cd /Users/clawdlawd/polyparlay && pwd

# Edit the plist if different
open -e marketing-auto/app.polyparlay.x-poster.plist
```

**Find your node binary** — the plist defaults to `/usr/local/bin/node`. Homebrew on Apple Silicon installs at `/opt/homebrew/bin/node`. Check:

```bash
which node
```

If your `which node` returns a different path, edit the plist's `<ProgramArguments>` first string.

**Install:**

```bash
cp marketing-auto/app.polyparlay.x-poster.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/app.polyparlay.x-poster.plist
```

**Verify it loaded:**
```bash
launchctl list | grep polyparlay
# Should print something like: -    0    app.polyparlay.x-poster
```

A first post fires immediately (RunAtLoad). Subsequent posts every 4 hours while the Mac is awake.

## Managing the poster

**Stop autoposting:**
```bash
launchctl unload ~/Library/LaunchAgents/app.polyparlay.x-poster.plist
```

**Restart with new schedule:**
```bash
launchctl unload ~/Library/LaunchAgents/app.polyparlay.x-poster.plist
# Edit the plist (StartInterval = seconds between fires)
launchctl load ~/Library/LaunchAgents/app.polyparlay.x-poster.plist
```

**See recent posts:**
```bash
cat marketing-auto/.post-log.jsonl | tail -10
```

**See raw cron logs:**
```bash
tail -f ~/Library/Logs/polyparlay-x-poster.log
```

**Pause for a day (e.g., big news drowning out signal):**
```bash
launchctl unload ~/Library/LaunchAgents/app.polyparlay.x-poster.plist
# resume:
launchctl load ~/Library/LaunchAgents/app.polyparlay.x-poster.plist
```

## What gets posted

Every 4 hours, one tweet. Each tweet rotates through 8 template variants so nothing repeats verbatim. Each tweet contains:
- A real Polymarket parlay (3-5 legs, picked from highest-volume markets)
- Real Monte Carlo win rate (10K sims)
- A shareable polyparlay.app/slip URL → renders rich OG preview

Expected output: ~6 posts/day × 30 days = ~180 unique tweets/month, each a viral asset.

## When the Mac is asleep

launchd skips fires while asleep. If your Mac sleeps 8h overnight, you'll miss 2 posts/night. Two ways around it:

1. **Prevent sleep** for the relevant hours: `caffeinate -d` or System Settings → Energy.
2. **Move to GitHub Actions** (next section, optional).

## Alternative: GitHub Actions (always-on cloud cron)

If you don't want the Mac dependency, run on free GitHub Actions:

1. Push the project to a private GH repo.
2. Add the 4 X API keys as repo Secrets (Settings → Secrets and variables → Actions).
3. Add this workflow at `.github/workflows/x-poster.yml`:

```yaml
name: PolyParlay X auto-poster
on:
  schedule:
    - cron: '0 */4 * * *'  # every 4 hours UTC
  workflow_dispatch:        # also allow manual trigger from Actions tab
jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd marketing-auto && npm install
      - env:
          X_API_KEY: ${{ secrets.X_API_KEY }}
          X_API_SECRET: ${{ secrets.X_API_SECRET }}
          X_ACCESS_TOKEN: ${{ secrets.X_ACCESS_TOKEN }}
          X_ACCESS_SECRET: ${{ secrets.X_ACCESS_SECRET }}
        run: cd marketing-auto && node x-poster.mjs --force
```

GH Actions free tier covers 2,000 minutes/month — each post takes ~30s so 6/day = ~90 min/month. Comfortably free.

## Troubleshooting

**"Missing env vars" on first run** → make sure `.env` is in `marketing-auto/`, not the repo root.

**`Error 403` from X** → app permission is read-only. Go back to Step 1.4 and set to `Read and write`. After changing, REGENERATE the access tokens (old ones still encode old permissions).

**`Error 401`** → keys are wrong or the access tokens were generated before you set R/W permission. Regenerate access tokens.

**Tweets posting but no engagement** → check the slip URL renders correctly. Open one of the URLs from `.post-log.jsonl` in a browser. The page should show 10K Monte Carlo results + install CTA. If it shows "No slip data," the encoding is broken — file an issue.

**Mac asleep, no posts** → use GitHub Actions instead.

**Hit rate limit (1,500/mo on free tier)** → increase StartInterval to 21600 (6h between posts) or move to paid X tier.
