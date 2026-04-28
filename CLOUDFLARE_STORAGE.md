# Cloudflare Storage Integration

The app stores global high scores through a Cloudflare Pages Function and KV namespace. The frontend uses `StorageService` in `js/storage.js`; it falls back to localStorage when the app is opened directly from disk or the remote API is unavailable.

## Frontend API

```js
await StorageService.fetchHighScores('galaga');
await StorageService.fetchHighScores('pacman');
await StorageService.submitHighScore('galaga', 'ABC', 12500, 3, GameState.stats);
```

Scores are per game. The app keeps only the top 10 scores for each game.

## Cloudflare Endpoint

The Pages Function is located at `functions/api/scores.js`.

Supported routes:

```text
GET  /api/scores?game=galaga
GET  /api/scores?game=pacman
POST /api/scores
```

The POST body must contain:

```json
{
  "gameId": "galaga",
  "name": "ABC",
  "score": 12500,
  "level": 3,
  "stats": {}
}
```

The function validates game IDs, initials, score ranges, level ranges, and stat fields before saving.

## Setup

Install Wrangler and create KV namespaces:

```powershell
npm install --save-dev wrangler@latest
npx wrangler kv namespace create ARCADE_SCORES
npx wrangler kv namespace create ARCADE_SCORES --preview
```

Copy the returned IDs into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "ARCADE_SCORES"
id = "your-production-id"
preview_id = "your-preview-id"
```

Run locally through Cloudflare Pages dev:

```powershell
npx wrangler pages dev .
```

Deploy through Cloudflare Pages after the KV IDs are configured.