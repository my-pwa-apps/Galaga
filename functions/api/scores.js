const ALLOWED_GAMES = new Set(['galaga', 'pacman', 'mspacman', 'digdug', 'centipede']);
const MAX_HIGH_SCORES = 10;
const MAX_SCORE = 9999999;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
    }
});

const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
};

const withCors = response => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, { status: response.status, headers });
};

const getScoresKey = gameId => `scores:${gameId}`;

const normalizeGameId = gameId => ALLOWED_GAMES.has(gameId) ? gameId : null;

const normalizeInitials = name => String(name || 'AAA')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, 'A');

const sanitizeNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const loadScores = async (env, gameId) => {
    const stored = await env.ARCADE_SCORES.get(getScoresKey(gameId), 'json');
    return Array.isArray(stored) ? stored : [];
};

const saveScores = async (env, gameId, scores) => {
    await env.ARCADE_SCORES.put(getScoresKey(gameId), JSON.stringify(scores));
};

const validateScore = payload => {
    const gameId = normalizeGameId(payload?.gameId);
    if (!gameId) return { error: 'Unsupported game.' };

    const score = Math.floor(sanitizeNumber(payload.score));
    if (score <= 0 || score > MAX_SCORE) return { error: 'Invalid score.' };

    const level = Math.floor(sanitizeNumber(payload.level, 1));
    if (level < 1 || level > 999) return { error: 'Invalid level.' };

    const stats = payload.stats || {};
    return {
        score: {
            id: crypto.randomUUID(),
            gameId,
            name: normalizeInitials(payload.name),
            score,
            level,
            timestamp: Date.now(),
            stats: {
                enemiesDestroyed: Math.max(0, Math.floor(sanitizeNumber(stats.enemiesDestroyed))),
                shotsFired: Math.max(0, Math.floor(sanitizeNumber(stats.shotsFired))),
                shotsHit: Math.max(0, Math.floor(sanitizeNumber(stats.shotsHit))),
                accuracy: String(stats.accuracy || '0').slice(0, 8),
                pelletsEaten: Math.max(0, Math.floor(sanitizeNumber(stats.pelletsEaten))),
                ghostsEaten: Math.max(0, Math.floor(sanitizeNumber(stats.ghostsEaten))),
                survivalTime: Math.max(0, sanitizeNumber(stats.survivalTime))
            }
        }
    };
};

export const onRequestOptions = async () => withCors(new Response(null, { status: 204 }));

export const onRequestGet = async ({ request, env }) => {
    if (!env.ARCADE_SCORES) {
        return withCors(json({ error: 'ARCADE_SCORES binding is not configured.' }, 500));
    }

    const url = new URL(request.url);
    const gameId = normalizeGameId(url.searchParams.get('game') || 'galaga');
    if (!gameId) return withCors(json({ error: 'Unsupported game.' }, 400));

    const scores = await loadScores(env, gameId);
    return withCors(json({ gameId, scores: scores.slice(0, MAX_HIGH_SCORES) }));
};

export const onRequestPost = async ({ request, env }) => {
    if (!env.ARCADE_SCORES) {
        return withCors(json({ error: 'ARCADE_SCORES binding is not configured.' }, 500));
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return withCors(json({ error: 'Invalid JSON.' }, 400));
    }

    const result = validateScore(payload);
    if (result.error) return withCors(json({ error: result.error }, 400));

    const scores = await loadScores(env, result.score.gameId);
    const rankedScores = scores
        .concat(result.score)
        .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp)
        .slice(0, MAX_HIGH_SCORES);

    await saveScores(env, result.score.gameId, rankedScores);
    return withCors(json({ gameId: result.score.gameId, scores: rankedScores }, 201));
};
