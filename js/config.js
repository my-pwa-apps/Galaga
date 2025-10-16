// ============================================
// GAME CONFIGURATION
// ============================================

const GameConfig = {
    // Canvas dimensions
    CANVAS_WIDTH: 480,
    CANVAS_HEIGHT: 640,
    
    // Game constants
    MAX_HIGH_SCORES: 10,
    MAX_ENEMIES: 32,
    NUM_STARS: 100,
    
    // Pool sizes
    POOL: {
        MAX_BULLETS: 50,
        MAX_ENEMY_BULLETS: 100,
        MAX_PARTICLES: 250
    },
    
    // Player configuration
    PLAYER: {
        SPEED: 300,
        WIDTH: 30,
        HEIGHT: 30,
        START_X: 240,
        START_Y: 550,
        COOLDOWN: 0.15,
        COOLDOWN_SPEED: 0.1
    },
    
    // Powerup configuration
    POWERUP: {
        SPAWN_INTERVAL: 15,
        DROP_CHANCE: 0.1,
        DURATION: {
            DOUBLE: 10,
            SPEED: 10,
            SHIELD: 15
        }
    },
    
    // Difficulty scaling
    DIFFICULTY: {
        BASE_ATTACK_CHANCE: 0.0008,
        MAX_ATTACKERS: 2,
        GROUP_ATTACK_CHANCE: 0.05,
        DIVING_SPEED: 150,
        BULLET_SPEED: 120,
        FORMATION_SHOOT_CHANCE: 0.005,
        ATTACKING_SHOOT_CHANCE: 0.015,
        RETURN_TO_FORMATION_CHANCE: 0.7,
        ATTACK_CURVE_INTENSITY: 1
    },
    
    // Enemy configuration
    ENEMIES: {
        bee: { 
            hp: 1, speed: 100, score: 100, shootChance: 0.01, 
            w: 20, h: 20, color: '#ffff00', name: 'Bee' 
        },
        butterfly: { 
            hp: 1, speed: 80, score: 200, shootChance: 0.012, 
            w: 24, h: 24, color: '#ff00ff', name: 'Butterfly' 
        },
        scorpion: { 
            hp: 2, speed: 120, score: 250, shootChance: 0.015, 
            w: 22, h: 22, color: '#ff6600', name: 'Scorpion' 
        },
        moth: { 
            hp: 1, speed: 150, score: 150, shootChance: 0.01, 
            w: 22, h: 22, color: '#808080', name: 'Moth' 
        },
        dragonfly: { 
            hp: 1, speed: 140, score: 180, shootChance: 0.011, 
            w: 24, h: 28, color: '#00ff88', name: 'Dragonfly' 
        },
        wasp: { 
            hp: 2, speed: 110, score: 280, shootChance: 0.018, 
            w: 20, h: 24, color: '#ffaa00', name: 'Wasp' 
        },
        beetle: { 
            hp: 3, speed: 70, score: 350, shootChance: 0.013, 
            w: 26, h: 26, color: '#6633cc', name: 'Beetle' 
        },
        boss: { 
            hp: 3, speed: 60, score: 500, shootChance: 0.02, 
            w: 32, h: 32, color: '#00ffff', name: 'Boss' 
        }
    },
    
    // Enemy unlock levels
    ENEMY_UNLOCKS: {
        1: ['bee'],
        2: ['butterfly', 'dragonfly'],
        3: ['scorpion'],
        4: ['moth', 'wasp'],
        6: ['beetle'],
        8: ['boss']
    },
    
    // Colors
    COLORS: {
        BACKGROUND: '#000',
        PLAYER: '#00ff00',
        PLAYER_BULLET: '#ffff00',
        ENEMY_BULLET: '#fff',
        TEXT: '#ffffff',
        TEXT_SECONDARY: '#00ffff',
        POWERUP: {
            DOUBLE: '#ffff00',
            SPEED: '#00ffff',
            SHIELD: '#ff00ff',
            HEALTH: '#00ff00'
        }
    },
    
    // Graphics quality presets
    QUALITY_PRESETS: {
        low: {
            starMultiplier: 0.5,
            particleMultiplier: 0.5,
            useBatching: true,
            usePathCaching: false,
            useGradientCaching: false
        },
        medium: {
            starMultiplier: 0.75,
            particleMultiplier: 0.75,
            useBatching: true,
            usePathCaching: true,
            useGradientCaching: true
        },
        high: {
            starMultiplier: 1.0,
            particleMultiplier: 1.0,
            useBatching: true,
            usePathCaching: true,
            useGradientCaching: true
        }
    },
    
    // Game states
    STATE: {
        SPLASH: 'splash',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver',
        ENTER_HIGH_SCORE: 'enterHighScore'
    },
    
    // Enemy states
    ENEMY_STATE: {
        ENTRANCE: 'entrance',
        FORMATION: 'formation',
        ATTACK: 'attack'
    }
};

// Make config immutable
Object.freeze(GameConfig);
Object.freeze(GameConfig.POOL);
Object.freeze(GameConfig.PLAYER);
Object.freeze(GameConfig.POWERUP);
Object.freeze(GameConfig.DIFFICULTY);
Object.freeze(GameConfig.ENEMIES);
Object.freeze(GameConfig.ENEMY_UNLOCKS);
Object.freeze(GameConfig.COLORS);
Object.freeze(GameConfig.QUALITY_PRESETS);
Object.freeze(GameConfig.STATE);
Object.freeze(GameConfig.ENEMY_STATE);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
