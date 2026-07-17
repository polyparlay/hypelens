# CWS Screenshots — capture instructions

7 HTML files at exact CWS asset dimensions. Open each in Chrome, screenshot with macOS Cmd+Shift+5 → "Capture Selected Window" or use the headless Chrome command below for pixel-perfect captures.

## Files + dimensions

| File | Dimensions | CWS field |
|------|------------|-----------|
| `screenshot-1-hero.html` | 1280×800 | Screenshot 1 — hero value-prop |
| `screenshot-2-popup.html` | 1280×800 | Screenshot 2 — pill on Polymarket page |
| `screenshot-3-montecarlo.html` | 1280×800 | Screenshot 3 — Monte Carlo results |
| `screenshot-4-improve-odds.html` | 1280×800 | Screenshot 4 — Improve Odds before/after |
| `screenshot-5-pricing.html` | 1280×800 | Screenshot 5 — pricing tiers |
| `promo-small-440x280.html` | 440×280 | Small promo tile |
| `promo-marquee-1400x560.html` | 1400×560 | Marquee promo tile |

All saved as **24-bit PNG, no alpha** as CWS requires.

## Capture method 1 — Chrome headless (recommended, pixel-perfect)

Run from this folder. Each command outputs a `.png` next to its source HTML.

```bash
cd /Users/clawdlawd/polyparlay/extension/marketing/screenshots

CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# 5 screenshots @ 1280x800
for n in 1-hero 2-popup 3-montecarlo 4-improve-odds 5-pricing; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1280,800 \
    --screenshot="screenshot-${n}.png" "file://$PWD/screenshot-${n}.html"
done

# Small promo @ 440x280
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=440,280 \
  --screenshot="promo-small-440x280.png" "file://$PWD/promo-small-440x280.html"

# Marquee @ 1400x560
"$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1400,560 \
  --screenshot="promo-marquee-1400x560.png" "file://$PWD/promo-marquee-1400x560.html"

# Strip alpha (CWS rejects PNGs with alpha channel)
for f in *.png; do
  sips -s format png --setProperty hasAlpha no "$f" --out "$f" 2>/dev/null
done

ls -la *.png
```

That outputs 7 PNGs, all alpha-stripped, ready to upload.

## Capture method 2 — Manual (if headless fails)

1. Open each `.html` file in Chrome (`open -a "Google Chrome" file.html`)
2. View → Always Show Toolbar (OFF) and zoom to 100% (Cmd+0)
3. DevTools → Toggle Device Toolbar (Cmd+Shift+M)
4. Set Responsive dimensions to exactly the target (e.g. 1280×800)
5. Cmd+Shift+P → "Capture full size screenshot"
6. Strip alpha: `sips -s format png --setProperty hasAlpha no input.png --out output.png`

## Upload to CWS

Go to https://chrome.google.com/webstore/devconsole → your item → **Store listing** tab → scroll to Global assets:

- **Screenshots** → upload all 5 `screenshot-*.png` (drag-drop, order matters: hero first)
- **Small promo tile** → upload `promo-small-440x280.png`
- **Marquee promo tile** → upload `promo-marquee-1400x560.png`
- **Store icon** → already uploaded (kept from prior submission), or re-upload from `../cws-submission/store-icon-128.png`

Hit **Save draft**. If CWS validates the upload (green checks next to each), you're done.

## Iterating on design

Each HTML uses `_styles.css` for shared palette tokens. Edit a single HTML file in your editor, refresh the file in Chrome, re-run the headless capture line for just that file. No build step.

To preview live in Chrome with dimensions enforced, open each HTML normally — body is sized to the exact pixel rect via CSS, so what you see in the viewport IS what gets captured (minus a tiny rendering buffer for the URL bar).
