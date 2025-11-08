// ============================================
// GAME CONFIGURATION
// ============================================

const GameConfig = {
    // Debug mode - set to false for production
    DEBUG_MODE: true,
    
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
        COOLDOWN_SPEED: 0.1,
        // Player bullet speed (was hardcoded in main.js)
        BULLET_SPEED: 400
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
    
    // Difficulty scaling - balanced progression
    DIFFICULTY: {
        BASE_ATTACK_CHANCE: 0.0008,
        MAX_ATTACKERS: 2,
        GROUP_ATTACK_CHANCE: 0.05,
        DIVING_SPEED: 150,
        BULLET_SPEED: 120,
        FORMATION_SHOOT_CHANCE: 0.005,
        ATTACKING_SHOOT_CHANCE: 0.015,
        RETURN_TO_FORMATION_CHANCE: 0.7,
        ATTACK_CURVE_INTENSITY: 1,
        // Scaling multipliers per level
        HP_SCALE_PER_LEVEL: 0.08,
        SPEED_SCALE_PER_LEVEL: 0.08,
        SPEED_SCALE_MAX: 1.4,
        SHOOT_SCALE_PER_LEVEL: 0.03,
        SHOOT_CHANCE_MAX: 0.06
    },
    
    // Enemy configuration
    ENEMIES: {
        skulker: { 
            hp: 1, speed: 100, score: 100, shootChance: 0.01, 
            w: 20, h: 20, color: '#cc0000', name: 'Skulker' 
        },
        butterfly: { 
            hp: 1, speed: 80, score: 200, shootChance: 0.012, 
            w: 24, h: 24, color: '#ff00ff', name: 'Butterfly' 
        },
        parasite: { 
            hp: 1, speed: 150, score: 150, shootChance: 0.01, 
            w: 22, h: 22, color: '#66ff33', name: 'Parasite' 
        },
        wraith: { 
            hp: 1, speed: 140, score: 180, shootChance: 0.011, 
            w: 24, h: 28, color: '#9966ff', name: 'Wraith' 
        },
        wasp: { 
            hp: 2, speed: 110, score: 280, shootChance: 0.018, 
            w: 20, h: 24, color: '#ffaa00', name: 'Wasp' 
        },
        beetle: { 
            hp: 3, speed: 70, score: 350, shootChance: 0.013, 
            w: 26, h: 26, color: '#6633cc', name: 'Beetle' 
        },
        octopus: { 
            hp: 2, speed: 90, score: 300, shootChance: 0.016, 
            w: 28, h: 28, color: '#ff6699', name: 'Octopus' 
        },
        boss: { 
            hp: 3, speed: 60, score: 500, shootChance: 0.02, 
            w: 32, h: 32, color: '#00ffff', name: 'Boss' 
        }
    },
    
    // Enemy unlock levels - Progressive difficulty like classic Galaga
    ENEMY_UNLOCKS: {
        1: ['skulker'],                    // Level 1: Only skulkers (like classic Bees)
        2: ['skulker', 'butterfly'],       // Level 2: Add butterfly
        3: ['skulker', 'butterfly', 'wraith'],  // Level 3: Add wraith
        4: ['skulker', 'butterfly', 'wraith', 'wasp'],  // Level 4: Add wasp
        5: ['skulker', 'butterfly', 'wraith', 'wasp', 'parasite'],  // Level 5: Add parasite
        6: ['skulker', 'butterfly', 'wraith', 'wasp', 'parasite', 'octopus'],  // Level 6: Add octopus
        7: ['skulker', 'butterfly', 'wraith', 'wasp', 'parasite', 'octopus', 'beetle'],  // Level 7: Add beetle
        10: ['skulker', 'butterfly', 'wraith', 'wasp', 'parasite', 'octopus', 'beetle', 'boss']  // Level 10: Boss
    },
    
    // Colors - Enhanced arcade aesthetic
    COLORS: {
        BACKGROUND: '#000000',
        PLAYER: '#00d4ff',
        PLAYER_BULLET: '#ffff00',
        ENEMY_BULLET: '#ff3366',
        TEXT: '#ffffff',
        TEXT_DIM: '#888888',
        TEXT_HIGHLIGHT: '#00ffff',
        SHIELD: '#00ffff',
        PARTICLE_HIT: '#ffaa00',
        PARTICLE_EXPLOSION_1: '#ff6600',
        PARTICLE_EXPLOSION_2: '#ffff00',
        POWERUP: {
            DOUBLE: '#00ff00',
            SPEED: '#ffff00',
            SHIELD: '#00ffff',
            HEALTH: '#ff0000'
        },
        UI: {
            OVERLAY_BG: 'rgba(0, 0, 0, 0.7)',
            BUTTON_BG: 'rgba(0, 255, 255, 0.2)',
            BUTTON_BORDER: '#00ffff',
            BUTTON_HOVER: 'rgba(255, 255, 0, 0.3)'
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
