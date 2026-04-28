# Retro Arcade Tribute

A browser-based retro arcade tribute with playable Galaga-inspired and Pac-Man-inspired games. The app is static HTML/CSS/JavaScript with a Cloudflare Pages Function for shared high scores and localStorage fallback for local development.

This is an unofficial fan project and is not affiliated with original publishers or rights holders.

The app is installable as a PWA on supported desktop and mobile browsers. It includes a web app manifest, app icon, and service worker app-shell cache.

## Run Locally

Open `index.html` directly in a browser for local play. Scores are saved to localStorage when the page is opened from `file://`.

For Cloudflare API testing, run the app with Wrangler Pages dev from the repository root after installing Wrangler:

```powershell
npm install --save-dev wrangler@latest
npx wrangler pages dev .
```

## Cloudflare Storage

High scores are stored through the Pages Function at `/api/scores` using the KV binding `ARCADE_SCORES`.

1. Create two KV namespaces in your Cloudflare account:

```powershell
npx wrangler kv namespace create ARCADE_SCORES
npx wrangler kv namespace create ARCADE_SCORES --preview
```

2. Replace the placeholder `id` and `preview_id` in `wrangler.toml` with the namespace IDs returned by Wrangler.

3. Deploy with Cloudflare Pages, using this repository as a static Pages project. The `functions/api/scores.js` file will serve:

```text
GET  /api/scores?game=galaga
GET  /api/scores?game=pacman
POST /api/scores
```

The API validates game IDs, initials, score ranges, level ranges, and stat payloads before writing to KV.

## Hosting Outside Cloudflare Pages

If the frontend is hosted somewhere else while the API lives on Cloudflare, define this before `js/storage.js` loads:

```html
<script>
  window.ARCADE_SCORE_API_URL = 'https://your-worker-or-pages-domain.example/api/scores';
</script>
```

## Manual Smoke Test

- Splash screen loads and shows only playable cabinets.
- Left/right selection switches between Galaga and Pac-Man.
- Galaga starts, spawns the full formation, fires, and reaches game over.
- Pac-Man starts, moves with keyboard and touch D-pad, eats pellets, and reaches game over.
- A qualifying score opens the initials screen, saves once, and returns to splash.
- Scores remain separate for Galaga and Pac-Man.
- On mobile, the D-pad is reachable with the left thumb and action is reachable with the right thumb.
