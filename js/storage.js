// ============================================
// STORAGE SERVICE
// Cloudflare Pages Functions + KV in production, localStorage fallback locally.
// ============================================

const StorageService = {
    MAX_HIGH_SCORES: 10,
    apiBase: '/api/scores',
    isRemoteAvailable: false,

    cache: {
        galaga: [],
        pacman: [],
        mspacman: [],
        digdug: [],
        centipede: []
    },

    init() {
        this.apiBase = window.ARCADE_SCORE_API_URL || this.apiBase;
        this.isRemoteAvailable = window.location.protocol !== 'file:';
        return true;
    },

    async fetchHighScores(gameId = 'galaga') {
        const normalizedGameId = this.normalizeGameId(gameId);

        if (this.isRemoteAvailable) {
            try {
                const response = await fetch(`${this.apiBase}?game=${encodeURIComponent(normalizedGameId)}`, {
                    headers: { Accept: 'application/json' }
                });
                if (!response.ok) throw new Error(`Score fetch failed: ${response.status}`);

                const payload = await response.json();
                const scores = Array.isArray(payload.scores) ? payload.scores : [];
                this.cache[normalizedGameId] = scores.slice(0, this.MAX_HIGH_SCORES);
                return this.cache[normalizedGameId];
            } catch (error) {
                console.warn('Remote scores unavailable, using local cache:', error);
            }
        }

        return this.fetchLocalScores(normalizedGameId);
    },

    async submitHighScore(gameId, name, score, level, stats = {}) {
        const normalizedGameId = this.normalizeGameId(gameId);
        const scoreData = this.buildScoreData(normalizedGameId, name, score, level, stats);
        if (!scoreData) return false;

        if (this.isRemoteAvailable) {
            try {
                const response = await fetch(this.apiBase, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify(scoreData)
                });
                if (!response.ok) throw new Error(`Score submit failed: ${response.status}`);

                const payload = await response.json();
                this.cache[normalizedGameId] = Array.isArray(payload.scores) ? payload.scores : [];
                return true;
            } catch (error) {
                console.warn('Remote score submit unavailable, saving locally:', error);
            }
        }

        this.saveLocalScore(normalizedGameId, scoreData);
        return true;
    },

    buildScoreData(gameId, name, score, level, stats = {}) {
        const normalizedScore = Math.floor(Number(score));
        const normalizedLevel = Math.max(1, Math.floor(Number(level) || 1));
        if (!Number.isFinite(normalizedScore) || normalizedScore <= 0) return null;

        return {
            gameId,
            name: this.normalizeInitials(name),
            score: Math.min(normalizedScore, 9999999),
            level: Math.min(normalizedLevel, 999),
            timestamp: Date.now(),
            stats: {
                enemiesDestroyed: Math.max(0, Math.floor(Number(stats.enemiesDestroyed) || 0)),
                shotsFired: Math.max(0, Math.floor(Number(stats.shotsFired) || 0)),
                shotsHit: Math.max(0, Math.floor(Number(stats.shotsHit) || 0)),
                accuracy: String(stats.accuracy || '0'),
                pelletsEaten: Math.max(0, Math.floor(Number(stats.pelletsEaten) || 0)),
                ghostsEaten: Math.max(0, Math.floor(Number(stats.ghostsEaten) || 0)),
                survivalTime: Math.max(0, Number(stats.survivalTime) || 0)
            }
        };
    },

    fetchLocalScores(gameId) {
        let scores = [];
        try {
            const stored = localStorage.getItem(this.localStorageKey(gameId));
            scores = stored ? JSON.parse(stored) : [];
        } catch {
            scores = [];
        }
        this.cache[gameId] = Array.isArray(scores) ? scores.slice(0, this.MAX_HIGH_SCORES) : [];
        return this.cache[gameId];
    },

    saveLocalScore(gameId, scoreData) {
        const scores = this.fetchLocalScores(gameId)
            .concat(scoreData)
            .sort((a, b) => b.score - a.score || a.timestamp - b.timestamp)
            .slice(0, this.MAX_HIGH_SCORES);

        localStorage.setItem(this.localStorageKey(gameId), JSON.stringify(scores));
        this.cache[gameId] = scores;
    },

    normalizeGameId(gameId) {
        return ['galaga', 'pacman', 'mspacman', 'digdug', 'centipede'].includes(gameId) ? gameId : 'galaga';
    },

    normalizeInitials(name) {
        const initials = String(name || 'AAA').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
        return initials.padEnd(3, 'A');
    },

    localStorageKey(gameId) {
        return `arcade_scores_${gameId}`;
    },

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}