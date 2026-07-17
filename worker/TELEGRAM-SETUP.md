# Telegram alerts — 10-min setup

The extension is wired. The Worker is wired. You just need to do the **manual** Telegram + Cloudflare KV steps below, then the feature goes live.

## Step 1 — Create the Telegram bot (3 min)

1. Open Telegram → search for `@BotFather` → start chat
2. Send `/newbot`
3. Name: `PolyParlay Alerts` (or whatever)
4. Username: must end in `bot` and be unique. Try `polyparlay_alerts_bot`. If taken, vary.
5. BotFather replies with a **token** like `1234567890:AAEhBP-XXXXXXXXXXXXXX`. **Copy it.**
6. Optional: `/setdescription` to add "Price alerts for Polymarket parlay legs"
7. Optional: `/setuserpic` and upload `extension/icons/icon128.png`

## Step 2 — Save bot token as Worker secret (1 min)

```bash
cd /Users/clawdlawd/polyparlay/worker
wrangler secret put TELEGRAM_BOT_TOKEN
# paste the token from Step 1.5 when prompted
```

Also save the bot username (without `@`) so the connect deep-link works:

```bash
wrangler secret put TELEGRAM_BOT_NAME
# enter "polyparlay_alerts_bot" (or whatever username you picked)
```

## Step 3 — Create the Cloudflare KV namespace (2 min)

The leaderboard + telegram alerts both use the same KV.

```bash
wrangler kv namespace create LEADERBOARD
```

Output looks like:
```
🌀 Creating namespace with title "polyparlay-verify-LEADERBOARD"
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "LEADERBOARD"
id = "abcdef1234567890..."
```

Open `wrangler.toml` and **uncomment** the `[[kv_namespaces]]` block at the bottom, paste the `id`:

```toml
[[kv_namespaces]]
binding = "LEADERBOARD"
id = "abcdef1234567890..."   # ← from the wrangler output above
```

Also **uncomment** the cron trigger:

```toml
[triggers]
crons = ["*/15 * * * *"]
```

## Step 4 — Deploy

```bash
wrangler deploy
```

Output includes a line like `Schedules: */15 * * * *` confirming the cron is active. The worker URL stays the same (`polyparlay-verify.z-lew87.workers.dev`).

## Step 5 — Tell Telegram where to deliver webhook events

```bash
TOKEN='your_token_from_step_1'
WORKER='https://polyparlay-verify.z-lew87.workers.dev'
curl -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook?url=${WORKER}/telegram/webhook"
```

Should return `{"ok":true,"result":true}`. Now when a user messages your bot, Telegram POSTs the message to your worker.

## Step 6 — User flow (verify with yourself first)

1. Open Telegram → search `@polyparlay_alerts_bot` (or whatever you named it)
2. Send `/start`
3. Bot replies: `👋 Connected. Your chat ID is *12345678*.`
4. Open the PolyParlay extension popup → Settings → paste that chat ID
5. On any saved slip, click 🔔 "Alert me" → set threshold price
6. Every 15 min the worker polls; when threshold crosses, bot DMs you

## Bot commands available to users

| Command | What it does |
|---|---|
| `/start` | Shows their chat ID |
| `/alerts` | Lists their active alerts |
| `/stop` | Clears all their alerts |

## Verifying it works

```bash
# Manually fire the cron handler to test the polling logic without waiting 15 min:
wrangler dev --test-scheduled --port 8788
# Then: curl http://localhost:8788/cdn-cgi/handler/scheduled
```

Or just set an alert on a market whose price you know is about to cross, then wait for the cron fire.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Webhook returns ok but bot never replies | Check `TELEGRAM_BOT_TOKEN` secret with `wrangler secret list` |
| `/start` works but alerts never fire | Check cron is set: `wrangler triggers list`. Should show `*/15 * * * *` |
| Alerts fire but message has Markdown junk | Telegram is rejecting parse mode — verify your slug doesn't contain `_` or `*` (escape if needed) |
| 503 "feature unavailable" from extension | KV namespace binding name is `LEADERBOARD` — must match exactly |
