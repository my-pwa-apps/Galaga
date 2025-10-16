// ============================================
// GAME STATE MANAGER
// ============================================

const GameState = {
    // Current state
    current: 'splash',
    
    // Game variables
    score: 0,
    lives: 3,
    level: 1,
    levelTransition: 0,
    screenShake: 0,
    
    // Time tracking
    dt: 0,
    lastTime: 0,
    splashTimer: 0,
    
    // Player state
    player: {
        x: 240,
        y: 550,
        w: 30,
        h: 30,
        speed: 300,
        cooldown: 0,
        alive: true,
        power: 'normal',
        powerTimer: 0,
        shield: false
    },
    
    // Input state
    keys: {},
    
    // Touch controls
    touchControls: {
        active: false,
        buttons: {
            left: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'ArrowLeft', label: '<' },
            right: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'ArrowRight', label: '>' },
            fire: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'Space', label: 'O' }
        }
    },
    
    // Collections
    bullets: [],
    enemies: [],
    enemyBullets: [],
    powerups: [],
    particles: [],
    formationSpots: [],
    attackQueue: [],
    stars: [],
    starsBackground: [],
    
    // High score entry
    playerInitials: ['A', 'A', 'A'],
    initialIndex: 0,
    highScores: [],
    
    // Session tracking
    sessionId: null,
    
    // Statistics
    stats: {
        enemiesDestroyed: 0,
        shotsFired: 0,
        shotsHit: 0,
        powerupsCollected: 0,
        survivalTime: 0,
        accuracy: 0,
        gameStartTime: 0
    },
    
    // Boss mechanics
    bossGalaga: null,
    capturedShip: false,
    dualShip: false,
    challengeStage: false,
    
    // Flags
    hasKeyboard: false,
    autoShootActive: false,
    
    // Wave configuration (dynamic)
    waveConfig: {
        baseAttackChance: 0.0008,
        maxAttackers: 2,
        groupAttackChance: 0.05,
        divingSpeed: 150,
        bulletSpeed: 120,
        returnToFormationChance: 0.7,
        attackCurveIntensity: 1,
        formationShootChance: 0.005,
        attackingShootChance: 0.015
    },
    
    // Methods
    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.levelTransition = 0;
        this.screenShake = 0;
        this.splashTimer = 0;
        
        this.player = {
            x: GameConfig.PLAYER.START_X,
            y: GameConfig.PLAYER.START_Y,
            w: GameConfig.PLAYER.WIDTH,
            h: GameConfig.PLAYER.HEIGHT,
            speed: GameConfig.PLAYER.SPEED,
            cooldown: 0,
            alive: true,
            power: 'normal',
            powerTimer: 0,
            shield: false
        };
        
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.particles = [];
        this.attackQueue = [];
        
        this.playerInitials = ['A', 'A', 'A'];
        this.initialIndex = 0;
        
        // Reset statistics
        this.stats = {
            enemiesDestroyed: 0,
            shotsFired: 0,
            shotsHit: 0,
            powerupsCollected: 0,
            survivalTime: 0,
            accuracy: 0,
            gameStartTime: Date.now()
        };
        
        // Reset wave config to level 1
        this.waveConfig = {
            baseAttackChance: GameConfig.DIFFICULTY.BASE_ATTACK_CHANCE,
            maxAttackers: GameConfig.DIFFICULTY.MAX_ATTACKERS,
            groupAttackChance: GameConfig.DIFFICULTY.GROUP_ATTACK_CHANCE,
            divingSpeed: GameConfig.DIFFICULTY.DIVING_SPEED,
            bulletSpeed: GameConfig.DIFFICULTY.BULLET_SPEED,
            returnToFormationChance: GameConfig.DIFFICULTY.RETURN_TO_FORMATION_CHANCE,
            attackCurveIntensity: GameConfig.DIFFICULTY.ATTACK_CURVE_INTENSITY,
            formationShootChance: GameConfig.DIFFICULTY.FORMATION_SHOOT_CHANCE,
            attackingShootChance: GameConfig.DIFFICULTY.ATTACKING_SHOOT_CHANCE
        };
        
        console.log('Game state reset');
    },
    
    updateStats(dt) {
        this.stats.survivalTime = (Date.now() - this.stats.gameStartTime) / 1000;
        if (this.stats.shotsFired > 0) {
            this.stats.accuracy = ((this.stats.shotsHit / this.stats.shotsFired) * 100).toFixed(1);
        }
    },
    
    setState(newState) {
        console.log(`State change: ${this.current} → ${newState}`);
        this.current = newState;
    },
    
    isState(state) {
        return this.current === state;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
