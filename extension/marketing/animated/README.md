# Animated Marketing Cards

Self-contained HTML files of the PolyParlay popup animation, sized for the
major social platforms. Open in Chrome/Safari, screen-record one full loop
(~7s), export as MP4. Post directly.

## Files

| File | Dimensions | Platforms | Aspect |
|------|------------|-----------|--------|
| `twitter-card.html` | 1200×675 | X/Twitter video, LinkedIn, Discord, Facebook | 16:9 |
| `tiktok-vertical.html` | 1080×1920 | TikTok, Reels, Shorts, X vertical, LinkedIn vertical | 9:16 |

## What the animation does

A 6-second loop. Walks through the actual user journey:

1. **0.0s – 1.5s** — Raw 3-leg slip. Leg 3 outlined red, marked "WEAK LEG". Monte Carlo tile reads `36% WR` in red.
2. **1.5s – 2.7s** — Indigo "Improve Odds: flip BTC leg → 57% WR" prompt slides in.
3. **2.7s – 4.8s** — Leg 3 swaps: BTC YES @ $0.29 → BTC NO @ $0.71. Border flips red → green. WR jumps to `57% WR +21pp` (green).
4. **4.8s – 6.0s** — Amber Half-Kelly stake card slides in: "$58 / $500."

The loop sells the product in 6 seconds with zero voiceover or text overlay needed.

## How to record (macOS, zero new tools)

1. Open the HTML in **Chrome** (cleaner rendering than Safari for animations).
2. **Hide the URL bar** for a clean capture:
   - View → Always Show Toolbar (uncheck)
   - Or use full-screen mode: `Cmd + Ctrl + F`
3. **Zoom the page to 100%** (`Cmd+0`) so the rendered size matches the CSS pixel dimensions.
4. Open **Screenshot** (`Cmd + Shift + 5`).
5. Click **"Record Selected Portion"**.
6. Drag the selection box to exactly cover the rendered card. For pixel-perfect framing, use Chrome DevTools (`Cmd+Opt+I`) → device toolbar (`Cmd+Shift+M`) → enter the exact dimensions (1200×675 or 1080×1920).
7. Click **Record**.
8. Wait through **at least 6 full seconds** so the loop completes once. Recording 7-8s and trimming gives you wiggle room.
9. Click the stop icon in the menu bar.
10. The MP4 lands on your Desktop. Trim it in QuickTime (`Cmd + T`) if needed.

## Posting checklist

**X/Twitter:**
- Use `twitter-card.html` (1200×675)
- Upload MP4 directly to the composer
- Tweet copy in `../launch-tweet.md` or `../social/POST-COPY.md`

**TikTok:**
- Use `tiktok-vertical.html` (1080×1920)
- Add to TikTok app → upload from Photos → speed 1x → no filters needed (already styled)
- Caption with the 3-step value prop, hashtags: `#polymarket #parlay #montecarlo #predictionmarkets`
- Add captions/text overlay in TikTok if you want — the animation is silent so captions help

**Instagram Reels:**
- Same `tiktok-vertical.html` file works
- Upload from Photos, no audio

**YouTube Shorts:**
- Same `tiktok-vertical.html`
- Title with hook ("Watch my parlay win rate jump 21pp"), description with link

**LinkedIn:**
- `twitter-card.html` for horizontal feed posts
- `tiktok-vertical.html` for the vertical native video format

## Want a GIF instead of MP4?

GIFs are larger files and lower quality but autoplay everywhere. Convert from your MP4 with `ffmpeg`:

```bash
ffmpeg -i recording.mov -vf "fps=24,scale=600:-1:flags=lanczos" -loop 0 polyparlay.gif
```

(Install ffmpeg with `brew install ffmpeg` if needed.)

## Static frames (for image-only posts)

If you want static screenshots instead of video, open the HTML in Chrome and use `Cmd+Shift+P` → "Capture full size screenshot" at these animation timestamps:

- **0.5s** — Raw state (36% WR, weak leg)
- **2.0s** — Improve Odds prompt visible
- **3.5s** — Just after the flip (57% WR, leg flipped)
- **5.0s** — Stake card visible (full state)

Post as a 4-image carousel on X or Instagram for users who don't play video.
