// Galaga-inspired Arcade Game
// All assets generated from code

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_STATE = {
    SPLASH: 'splash',
    PLAYING: 'playing',
    PAUSED: 'paused', // New state for pausing
    GAME_OVER: 'gameover',
    ENTER_HIGH_SCORE: 'enterhighscore', // New state for entering high score
};

// Game constants - consolidate frequently used values to avoid recalculations
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const PLAYER_START_X = CANVAS_WIDTH / 2;
const PLAYER_START_Y = CANVAS_HEIGHT - 60;

let state = GAME_STATE.SPLASH;
let splashTimer = 0;
let keys = {};
let previousStateBeforePause = null; // To store state before pausing
let lastTime = 0; // For delta time calculation
let dt = 0; // Store delta time for consistent usage

// Object pools for frequently created/destroyed objects
const POOL = {
    bullets: [],
    enemyBullets: [],
    particles: [],
    MAX_BULLETS: 50,
    MAX_ENEMY_BULLETS: 50,
    MAX_PARTICLES: 150
};

// Initialize object pools
function initObjectPools() {
    // Pre-allocate bullets
    for (let i = 0; i < POOL.MAX_BULLETS; i++) {
        POOL.bullets.push({
            active: false, x: 0, y: 0, w: 3, h: 12, 
            speed: 600, type: 'normal', from: 'player'
        });
    }
    
    // Pre-allocate enemy bullets
    for (let i = 0; i < POOL.MAX_ENEMY_BULLETS; i++) {
        POOL.enemyBullets.push({
            active: false, x: 0, y: 0, w: 4, h: 12,
            speed: 150, damage: 1, type: 'straight', from: 'enemy',
            color: '#fff', age: 0, angle: 0, wobble: 0
        });
    }
    
    // Pre-allocate particles
    for (let i = 0; i < POOL.MAX_PARTICLES; i++) {
        POOL.particles.push({
            active: false, x: 0, y: 0, vx: 0, vy: 0,
            size: 2, color: '#fff', life: 0, initialLife: 0
        });
    }
}

// Function to get an object from the pool
function getPoolObject(poolName) {
    const pool = POOL[poolName];
    for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
            pool[i].active = true;
            return pool[i];
        }
    }
    
    // If we can't find an inactive object, return the oldest one
    // This ensures we don't create new objects unnecessarily
    console.warn(`${poolName} pool exhausted, reusing oldest object`);
    return pool[0]; // Just reuse the first one as fallback
}

// Arcade splash colors
const arcadeColors = ['#0ff', '#f0f', '#ff0', '#fff', '#0f0', '#f00', '#00f'];

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    w: 32,
    h: 24,
    speed: 250, // Pixels per second
    cooldown: 0, // Seconds
    alive: true,
    power: 'normal', // 'normal', 'double', 'shield', 'speed'
    powerTimer: 0, // Seconds
    shield: false,
};

// Active game objects (using object pools for others)
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let score = 0;
let lives = 3;
let level = 1;
let levelTransition = 0; // Seconds for transition message

// Galaga-style enemy states
const ENEMY_STATE = {
    ENTRANCE: 'entrance',
    FORMATION: 'formation',
    ATTACK: 'attack',
};
let formationSpots = [];
let attackQueue = [];

// Add particle array - will reference active pooled objects
let particles = [];

// Add boss Galaga and captured ship mechanics
let bossGalaga = null;
let capturedShip = false;
let dualShip = false;
let highScore = 0;
let challengeStage = false;
let screenShake = 0; // Initialize screen shake variable

let playerInitials = ["_", "_", "_", "_", "_"]; // Increased to 5 initials
let currentInitialIndex = 0;
let autoShootActive = false; // For touch auto-shoot

// Touch Controls
let isTouchDevice = false;
const touchControls = {
    buttons: {
        left: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'ArrowLeft', label: '<' },
        right: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'ArrowRight', label: '>' },
        autoShoot: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: null, label: 'AUTO' }, // Key is null as it's a toggle
        fire: { x: 0, y: 0, w: 0, h: 0, pressed: false, key: 'Space', label: 'O' }
    }
};

// --- Firebase Setup ---
const firebaseConfig = {
    apiKey: "AIzaSyB6VUKC89covzLlhUO7UMeILVCJVy1SPdc", // Replace with your actual API key if this is a placeholder
    authDomain: "galaga-e7527.firebaseapp.com",
    databaseURL: "https://galaga-e7527-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "galaga-e7527",
    storageBucket: "galaga-e7527.appspot.com", 
    messagingSenderId: "983420615265",
    appId: "1:983420615265:web:77861c68c1b93f92dd4820",
    measurementId: "G-R9Z2YFQ30C"
};

// Initialize Firebase
let database; // Declare globally
try {
    if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
        firebase.initializeApp(firebaseConfig);
        if (typeof firebase.database === 'function') {
            database = firebase.database();
        } else {
            console.error("Firebase database service is not available.");
            database = null;
        }
    } else {
        console.error("Firebase core SDK is not loaded.");
        database = null;
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
    database = null; // Ensure database is null on error
}

let firebaseHighScores = [];
const MAX_HIGH_SCORES = 10; // Max number of scores to store/display

// Optimized game loop with better timing
function gameLoop() {
    console.log("gameLoop called, state:", state); // LOGGING
    const currentTime = performance.now();
    // Delta time in seconds, capped to prevent spiral of death
    dt = Math.min(0.1, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    // Clear canvas with a dark color
    ctx.fillStyle = '#000'; // Base background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply screen shake if active
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 2;
        const shakeY = (Math.random() - 0.5) * screenShake * 2;
        ctx.translate(shakeX, shakeY);
    }

    // Game state machine
    switch (state) {
        case GAME_STATE.SPLASH:
            drawArcadeSplash();
            break;
        case GAME_STATE.PLAYING:
            updateGameplay();
            drawGameplay();
            break;
        case GAME_STATE.PAUSED:
            // Draw the underlying game state (e.g., gameplay) then the pause overlay
            drawGameplay(); // Draw the game as it was
            drawPauseScreen();
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOver();
            break;
        case GAME_STATE.ENTER_HIGH_SCORE:
            drawEnterHighScoreScreen();
            break;
    }

    // Reset translation if screen shake was applied
    if (screenShake > 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to default transform
    }

    requestAnimationFrame(gameLoop);
}

// Function to fetch high scores from Firebase
function fetchHighScores(callback) {
    if (!database) { // Check if database was initialized or available
        console.warn("Firebase database not available. Skipping high score fetch.");
        firebaseHighScores = []; // Ensure it's an empty array
        highScore = 0;
        if (callback) {
            // Call callback asynchronously to maintain consistent behavior
            setTimeout(() => callback(), 0);
        }
        return;
    }

    database.ref('highscores').orderByChild('score').limitToLast(MAX_HIGH_SCORES).once('value', (snapshot) => {
        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push({
                key: childSnapshot.key,
                name: childSnapshot.val().name,
                score: childSnapshot.val().score
            });
        });
        firebaseHighScores = scores.sort((a, b) => b.score - a.score);
        if (firebaseHighScores.length > 0) {
            highScore = firebaseHighScores[0].score;
        } else {
            highScore = 0;
        }
        if (callback) callback();
    }, (error) => { // Error callback for .once()
        console.error("Error fetching high scores from Firebase:", error);
        firebaseHighScores = []; // Reset or handle as appropriate
        highScore = 0;
        if (callback) callback(); // IMPORTANT: Still call the main callback to allow game to proceed
    });
}

// Function to save a high score to Firebase
function saveHighScore(name, score) {
    if (!database) {
        console.warn("Firebase database not available. Cannot save high score.");
        // Optionally, save to localStorage as a fallback or inform the user.
        // For now, just log and don't save.
        fetchHighScores(); // Still call fetch to update local list (which will be empty or from previous successful fetches)
        return;
    }

    const newScoreRef = database.ref('highscores').push();
    newScoreRef.set({
        name: name,
        score: score,
        timestamp: firebase.database.ServerValue.TIMESTAMP // Optional: for ordering or info
    }).then(() => {
        console.log("High score saved!");
        fetchHighScores(); // Re-fetch to update the list
    }).catch((error) => {
        console.error("Error saving high score: ", error);
    });

    // Optional: Prune older/lower scores if list exceeds MAX_HIGH_SCORES
    // This is more complex and might be better handled with Firebase rules or cloud functions
    // For simplicity, we'll rely on limitToLast for fetching.
}

// Draw authentic Galaga logo
function drawGalagaLogo(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    
    // Logo outline glow effect
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 20;
    
    // Create rainbow gradient for logo
    const logoGradient = ctx.createLinearGradient(0, -30, 0, 30);
    logoGradient.addColorStop(0, '#f00');    // Red top
    logoGradient.addColorStop(0.5, '#ff0');  // Yellow middle
    logoGradient.addColorStop(1, '#f00');    // Red bottom
    
    ctx.fillStyle = logoGradient;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    // Draw "GALAGA" with proper spacing and styling
    ctx.font = 'bold 48px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GALAGA', 0, 0);
    ctx.strokeText('GALAGA', 0, 0);
    
    // Add the characteristic dots in the G and A letters
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-75, 0, 3, 0, Math.PI * 2); // Dot in G
    ctx.arc(40, 0, 3, 0, Math.PI * 2);  // Dot in A
    ctx.fill();
    
    ctx.restore();
}

function drawArcadeSplash() {
    // Clear to black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw animated starfield background
    drawStarfield(dt);
    
    // Classic arcade border - more subtle than current version
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    
    // Draw authentic Galaga logo
    drawGalagaLogo(CANVAS_WIDTH / 2, 120, 1.2);
    
    // Draw "ARCADE TRIBUTE" subtitle
    ctx.font = '18px monospace';
    ctx.fillStyle = '#0ff';
    ctx.textAlign = 'center';
    ctx.fillText('ARCADE TRIBUTE', CANVAS_WIDTH / 2, 170);
    
    // High Scores in more authentic arcade style
    const centerX = CANVAS_WIDTH / 2;
    
    // Blinking text effect for "HIGH SCORES"
    const blinkRate = Math.floor(Date.now() / 500) % 2 === 0;
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = blinkRate ? '#ff0' : '#f80';
    ctx.fillText('HIGH SCORES', centerX, 210);
    
    // Display top scores
    ctx.font = '16px monospace';
    if (firebaseHighScores.length > 0) {
        const scoreCount = Math.min(firebaseHighScores.length, 5);
        
        for (let i = 0; i < scoreCount; i++) {
            const entry = firebaseHighScores[i];
            const rankText = `${i + 1}.`;
            const nameText = entry.name.substring(0, 5).padEnd(5, ' ');
            const scoreText = entry.score.toString().padStart(6, ' ');
            
            // Draw rank number
            ctx.fillStyle = '#f00';
            ctx.textAlign = 'right';
            ctx.fillText(rankText, centerX - 70, 240 + i * 25);
            
            // Draw name
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(nameText, centerX - 60, 240 + i * 25);
            
            // Draw score
            ctx.fillStyle = '#ff0';
            ctx.fillText(scoreText, centerX + 70, 240 + i * 25);
        }
    } else {
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('NO RECORDS YET', centerX, 240);
    }
    
    // Draw enemy showcase on the right side
    drawEnemyShowcase(CANVAS_WIDTH - 140, 240);
    
    // Insert coin/start text - with classic arcade blinking
    const startBlinking = Math.floor(Date.now() / 400) % 2 === 0;
    if (startBlinking) {
        ctx.font = '18px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(isTouchDevice ? 'TAP TO START' : 'PRESS SPACE TO START', centerX, CANVAS_HEIGHT - 60);
    }
    
    // Copyright notice - for authenticity
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('© 1981 NAMCO - WEB TRIBUTE', centerX, CANVAS_HEIGHT - 30);
}

// Draw enemy showcase with point values
function drawEnemyShowcase(x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    // Title
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('CHARACTER ⨯ POINT', 0, 0);
    
    const spacing = 50;
    
    // Draw each enemy type with point value (simplified versions)
    // Boss Galaga
    ctx.translate(0, spacing);
    ctx.fillStyle = '#f0f';
    ctx.fillRect(-15, -15, 30, 30);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('= 150 PTS', 25, 5);
    
    // Butterfly/Fast enemy
    ctx.translate(0, spacing);
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('= 80 PTS', 25, 5);
    
    // Bee/Basic enemy
    ctx.translate(0, spacing);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(0, -15);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('= 50 PTS', 25, 5);
    
    ctx.restore();
}

// Add stars array for background starfield
const stars = [];
const NUM_STARS = 100;

// Initialize stars for background animation
function initStars() {
    stars.length = 0;
    starsBackground = [];
    
    // Create 3 layers of stars with different speeds
    for (let layer = 0; layer < 3; layer++) {
        const layerStars = [];
        const count = layer === 0 ? NUM_STARS / 2 : NUM_STARS / 4;
        const speedFactor = layer === 0 ? 1 : (layer === 1 ? 1.5 : 2.5);
        
        for (let i = 0; i < count; i++) {
            layerStars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: layer === 0 ? Math.random() * 1 + 0.5 : 
                      layer === 1 ? Math.random() * 1.3 + 0.8 :
                      Math.random() * 1.8 + 1,
                speed: (Math.random() * 15 + 15) * speedFactor,
                brightness: layer === 0 ? Math.random() * 0.3 + 0.2 :
                           layer === 1 ? Math.random() * 0.6 + 0.3 :
                           Math.random() * 0.8 + 0.6
            });
        }
        starsBackground.push(layerStars);
    }
}

// Draw enhanced starfield with parallax scrolling effect
function drawStarfield(dt) {
    starsBackground.forEach((layer, layerIndex) => {
        layer.forEach(star => {
            // Move star downward at layer speed
            star.y += star.speed * dt;
            
            // Wrap around screen
            if (star.y > CANVAS_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * CANVAS_WIDTH;
            }
            
            // Twinkle effect - more subtle for background stars
            const twinkle = layerIndex === 2 ? 
                0.7 + 0.3 * Math.sin(Date.now() / (800 + star.speed * 10)) : 1.0;
            
            // Draw star with size and brightness variations
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

// Define formationMovement for controlling enemy formation movement
let formationMovement = {
    speed: 15, // Initial speed
    amplitude: 20 // Initial amplitude
};

// Setup wave patterns for more authentic Galaga behavior
function setupWavePatterns() {
    const baseAttackChance = 0.0005 + (Math.min(level, 10) * 0.0001);
    
    // Every 3rd level is a challenge stage
    challengeStageActive = level % 3 === 0;
    
    waveConfig = {
        baseAttackChance: baseAttackChance,
        maxAttackers: Math.min(2 + Math.floor(level/2), 6), // Cap at 6 simultaneous attackers
        groupAttackChance: level > 2 ? 0.01 : 0, // Chance for synchronized group attacks in higher levels
        divingSpeed: 180 + (level * 10), // Base diving speed increases with level
        returnToFormationChance: 0.7 - (Math.min(level, 10) * 0.04), // Higher levels reduce return likelihood
        attackCurveIntensity: 1 + (level * 0.2), // Controls how curved the attack paths are
    };
    
    // In challenge stages, enemies don't shoot but move faster
    if (challengeStageActive) {
        waveConfig.baseAttackChance *= 2;
        waveConfig.divingSpeed *= 1.5;
        waveConfig.maxAttackers += 2;
    }
    
    // Formation movement adjusts with level
    formationMovement.speed = 15 + (level * 2);
    formationMovement.amplitude = 20 + (level * 3);
}

// Setup enemy formation spots
function setupFormation() {
    formationSpots = [];
    const rows = 4;
    const cols = 8;
    const spacingX = 40;
    const spacingY = 30;
    const startX = (CANVAS_WIDTH - (cols - 1) * spacingX) / 2;
    const startY = 60;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            formationSpots.push({
                x: startX + c * spacingX,
                y: startY + r * spacingY,
                taken: false
            });
        }
    }
}

// Enhanced enemy spawning for more authentic waves
function spawnEnemies() {
    setupFormation();
    enemies = [];
    setupWavePatterns();
    
    // Base number of enemies
    let numEnemies = 16 + Math.min(32, level * 2); 
    
    // Challenge stages have a special formation
    if (challengeStageActive) {
        numEnemies = 40; // More enemies in challenge stages
    }
    
    const enemyTypes = [
        ENEMY_TYPE.BASIC,
        ENEMY_TYPE.FAST,
        ENEMY_TYPE.TANK,
        ENEMY_TYPE.ZIGZAG,
        ENEMY_TYPE.SNIPER
    ];
    
    // Place enemies in formation with appropriate types per row
    // First two rows are typically basic
    // Third row typically has faster enemies
    // Bottom row typically has the tougher enemies
    for (let i = 0; i < numEnemies; i++) {
        const spot = getEmptyFormationSpot();
        if (!spot) break;
        spot.taken = true;
        
        // Determine enemy type by position (row) - more authentic to Galaga
        // In Galaga, different rows have different enemy types
        const row = Math.floor((spot.y - 60) / 30); // Calculate row based on y position
        
        let enemyType;
        if (row === 0) {
            // Top row - mostly basic enemies
            enemyType = Math.random() < 0.8 ? ENEMY_TYPE.BASIC : ENEMY_TYPE.FAST;
        } else if (row === 1) {
            // Second row - mix of basic and fast
            enemyType = Math.random() < 0.6 ? ENEMY_TYPE.BASIC : ENEMY_TYPE.FAST;
        } else if (row === 2) {
            // Third row - mostly fast with some zigzag
            enemyType = Math.random() < 0.7 ? ENEMY_TYPE.FAST : ENEMY_TYPE.ZIGZAG;
        } else {
            // Bottom row - tougher enemies
            const r = Math.random();
            if (r < 0.4) enemyType = ENEMY_TYPE.TANK;
            else if (r < 0.7) enemyType = ENEMY_TYPE.SNIPER;
            else enemyType = ENEMY_TYPE.ZIGZAG;
        }
        
        let enemyColor = '#0f0';
        switch (enemyType) {
            case ENEMY_TYPE.FAST: enemyColor = '#0ff'; break;
            case ENEMY_TYPE.TANK: enemyColor = '#f00'; break;
            case ENEMY_TYPE.ZIGZAG: enemyColor = '#f0f'; break;
            case ENEMY_TYPE.SNIPER: enemyColor = '#ff0'; break;
        }
        
        // Adjust enemy size based on type
        let enemyW = 24, enemyH = 24;
        if (enemyType === ENEMY_TYPE.TANK) { enemyW = 28; enemyH = 28; }
        if (enemyType === ENEMY_TYPE.FAST) { enemyW = 22; enemyH = 22; }
        
        const startSide = Math.random() > 0.5 ? -50 : CANVAS_WIDTH + 50;
        const startY = -50;
        
        // Enhanced entrance behavior with formation systems
        enemies.push({
            x: startSide,
            y: startY,
            w: enemyW,
            h: enemyH,
            type: enemyType,
            color: enemyColor,
            state: ENEMY_STATE.ENTRANCE,
            startX: startSide,
            startY: startY,
            targetX: spot.x,
            targetY: spot.y,
            controlX: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200,
            controlY: CANVAS_HEIGHT / 3,
            pathTime: 0,
            index: i,
            formationOffset: {
                x: Math.random() * 4 - 2,
                y: Math.random() * 4 - 2
            },
            attackPath: [], // Will store attack path points
            attackIndex: 0,
            attackTime: 0,
            canFire: !challengeStageActive, // No firing in challenge stages
            points: enemyType === ENEMY_TYPE.BASIC ? 50 :
                   enemyType === ENEMY_TYPE.FAST ? 80 :
                   enemyType === ENEMY_TYPE.TANK ? 150 :
                   enemyType === ENEMY_TYPE.ZIGZAG ? 100 :
                   enemyType === ENEMY_TYPE.SNIPER ? 120 : 50
        });
    }
    
    // Boss Galaga every 5 levels or special encounters
    if (level % 5 === 0 || (level > 10 && Math.random() < 0.3)) {
        bossGalaga = {
            x: CANVAS_WIDTH / 2,
            y: 40,
            w: 60,
            h: 50,
            color: '#f0f',
            health: 10 + Math.floor(level / 5),
            timer: 2,
            state: 'idle',
            hasCaptured: false,
            tractorBeamActive: false,
            points: 150 + (level * 10)
        };
    }
    
    // Reset attack queue
    attackQueue = [];
}

// Enhanced enemy update function with authentic Galaga behavior
function updateEnemies() {
    // Check if level is completed
    if (enemies.length === 0 && !bossGalaga) { // Also check for boss
        if (levelTransition <= 0) {
            levelTransition = 3; // Show message for 3 seconds
        } else {
            levelTransition -= dt;
            if (levelTransition <= 0) {
                level++;
                gameStage++;
                spawnEnemies(); // Spawn next wave with updated patterns
            }
        }
        return;
    }
    
    // Handle formation movement (the entire formation moves side to side)
    let formationX = Math.sin(Date.now() / 2000) * formationMovement.amplitude;
    
    // Update enemy positions and behaviors based on their state
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Skip if marked for removal
        if (enemy.markedForRemoval) continue;
        
        // Update based on state
        if (enemy.state === ENEMY_STATE.ENTRANCE) {
            // Move along entrance path
            enemy.pathTime += dt;
            const t = Math.min(1, enemy.pathTime / 2.5); // Complete path in 2.5 seconds
            
            // Enhanced bezier curve entrance (more like original Galaga)
            const p0 = { x: enemy.startX, y: enemy.startY };
            const p1 = { x: enemy.controlX, y: enemy.controlY };
            const p2 = { x: enemy.targetX, y: enemy.targetY };
            
            // Quadratic bezier
            enemy.x = Math.pow(1-t, 2) * p0.x + 2 * Math.pow(1-t, 1) * t * p1.x + Math.pow(t, 2) * p2.x;
            enemy.y = Math.pow(1-t, 2) * p0.y + 2 * Math.pow(1-t, 1) * t * p1.y + Math.pow(t, 2) * p2.y;
            
            // Check if arrived at formation position
            if (t >= 1) {
                enemy.state = ENEMY_STATE.FORMATION;
            }
        } else if (enemy.state === ENEMY_STATE.FORMATION) {
            // In formation - apply the overall formation movement + individual offsets
            const targetX = enemy.targetX + formationX + enemy.formationOffset.x;
            const targetY = enemy.targetY + enemy.formationOffset.y;
            
            // Move toward target with slight hover (lerp for smooth movement)
            enemy.x = enemy.x * 0.95 + targetX * 0.05;
            enemy.y = enemy.y * 0.95 + targetY * 0.05;
            
            // Chance for individual attack
            if (!challengeStageActive || (challengeStageActive && gameStage < 3)) {
                const attackChance = waveConfig.baseAttackChance;
                if (Math.random() < attackChance) {
                    // Only attack if not too many are already attacking
                    if (attackQueue.filter(e => e.state === ENEMY_STATE.ATTACK).length < waveConfig.maxAttackers) {
                        enemy.state = ENEMY_STATE.ATTACK;
                        
                        // Generate authentic Galaga attack path
                        generateAttackPath(enemy);
                        
                        attackQueue.push(enemy);
                    }
                }
            }
            
            // Chance for synchronized group attack
            if (Math.random() < waveConfig.groupAttackChance) {
                launchGroupAttack();
            }
            
            // Fire at player (except in challenge stages)
            if (enemy.canFire && Math.random() < 0.002 + (level * 0.0004)) {
                fireEnemyBullet(enemy);
            }
        } else if (enemy.state === ENEMY_STATE.ATTACK) {
            // Follow attack path more accurately
            enemy.attackTime += dt;
            
            // Move along predefined attack path
            if (enemy.attackPath && enemy.attackPath.length > 0) {
                const pathLength = enemy.attackPath.length - 1;
                // Calculate current position in path (0 to 1)
                const pathPosition = Math.min(enemy.attackTime * waveConfig.divingSpeed / 200, 1);
                
                // Find the right segment
                const segmentIndex = Math.floor(pathPosition * pathLength);
                const segmentPos = (pathPosition * pathLength) - segmentIndex;
                
                if (segmentIndex < pathLength) {
                    // Interpolate between path points
                    const p0 = enemy.attackPath[segmentIndex];
                    const p1 = enemy.attackPath[segmentIndex + 1];
                    
                    enemy.x = p0.x + (p1.x - p0.x) * segmentPos;
                    enemy.y = p0.y + (p1.y - p0.y) * segmentPos;
                } else {
                    // Reached end of path
                    enemy.y = CANVAS_HEIGHT + enemy.h * 2; // Ensure it's off-screen
                }
            }
            
            // Fire during attack dive
            if (enemy.canFire && Math.random() < 0.03 && enemy.y < player.y) {
                fireEnemyBullet(enemy);
            }
            
            // Check if enemy has completed attack
            if (isOffScreen(enemy)) {
                // Remove from attack queue
                const qIndex = attackQueue.indexOf(enemy);
                if (qIndex > -1) attackQueue.splice(qIndex, 1);

                // Chance to return to formation instead of disappearing
                const shouldReturn = Math.random() < waveConfig.returnToFormationChance;
                
                // Check if there's an available spot
                const spot = formationSpots.find(s => s.x === enemy.targetX && s.y === enemy.targetY);
                if (shouldReturn && spot && !spot.taken) {
                    enemy.state = ENEMY_STATE.ENTRANCE; // Re-enter
                    enemy.startX = enemy.x < CANVAS_WIDTH / 2 ? -enemy.w : CANVAS_WIDTH + enemy.w;
                    enemy.startY = -enemy.h;
                    enemy.pathTime = 0;
                    enemy.controlX = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200;
                    enemy.controlY = enemy.startY + 150;
                    spot.taken = true; // Re-claim spot
                    
                    // Reset attack properties
                    enemy.attackPath = [];
                    enemy.attackTime = 0;
                } else {
                    // Remove the enemy if they won't return
                    enemies.splice(i, 1);
                }
            }
        }
    }
    
    // Update boss Galaga with more authentic behavior
    if (bossGalaga) {
        // Smooth side-to-side movement
        bossGalaga.x += Math.sin(Date.now() / 3000) * 30 * dt;
        
        // Keep within bounds
        if (bossGalaga.x < bossGalaga.w / 2) bossGalaga.x = bossGalaga.w / 2;
        if (bossGalaga.x > CANVAS_WIDTH - bossGalaga.w / 2) bossGalaga.x = CANVAS_WIDTH - bossGalaga.w / 2;

        // Timer for actions
        bossGalaga.timer -= dt;
        if (bossGalaga.timer <= 0) {
            if (!bossGalaga.tractorBeamActive) {
                // Either fire or attempt capture
                if (!bossGalaga.hasCaptured && !capturedShip && Math.random() < 0.15) {
                    // Try to capture if player is nearby
                    if (player.alive && Math.abs(player.x - bossGalaga.x) < 120) {
                        bossGalaga.tractorBeamActive = true;
                        bossGalaga.timer = 2.5; // Tractor beam duration
                        
                        // Play tractor beam sound if available
                        // if (sounds.tractorBeam) sounds.tractorBeam.play();
                    } else {
                        fireEnemyBullet(bossGalaga);
                        bossGalaga.timer = 1.2 - Math.min(0.6, level * 0.05);
                    }
                } else {
                    fireEnemyBullet(bossGalaga);
                    bossGalaga.timer = 1.2 - Math.min(0.6, level * 0.05);
                }
            } else {
                // End tractor beam sequence
                bossGalaga.tractorBeamActive = false;
                
                // Check for successful capture
                if (player.alive && Math.abs(player.x - bossGalaga.x) < 50) {
                    bossGalaga.hasCaptured = true;
                    capturedShip = true;
                    lives--;
                    
                    // Player temporarily dies but will respawn
                    createExplosion(player.x, player.y, '#ff0', 15, 1.5);
                    player.alive = false;
                    
                    setTimeout(() => {
                        player.alive = true;
                        player.x = PLAYER_START_X;
                        player.y = PLAYER_START_Y;
                    }, 2000);
                }
                
                bossGalaga.timer = 2.0; // Cooldown after tractor beam
            }
        }
    }
}

// Generate realistic attack path for enemy diving
function generateAttackPath(enemy) {
    const pathPoints = [];
    const steps = 20; // Number of points in the path
    
    // Starting position
    pathPoints.push({x: enemy.x, y: enemy.y});
    
    // Target position (player's current position or slightly off for a miss)
    let targetX = player.x;
    if (!player.alive || Math.random() < 0.3) {
        // Target random spot if player is dead or sometimes deliberately miss
        targetX = CANVAS_WIDTH * (0.2 + Math.random() * 0.6);
    }
    
    // Control points for bezier curve
    const cp1 = {
        x: enemy.x + (targetX - enemy.x) * 0.3 + (Math.random() * 200 - 100),
        y: enemy.y + 80
    };
    
    const cp2 = {
        x: targetX + (Math.random() * 200 - 100),
        y: player.y - 80
    };
    
    // Final point below screen
    const finalY = CANVAS_HEIGHT + 50;
    
    // Generate cubic bezier path points
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        
        // Cubic bezier formula
        const x = Math.pow(1-t, 3) * enemy.x + 
                 3 * Math.pow(1-t, 2) * t * cp1.x + 
                 3 * (1-t) * Math.pow(t, 2) * cp2.x + 
                 Math.pow(t, 3) * targetX;
        
        const y = Math.pow(1-t, 3) * enemy.y + 
                 3 * Math.pow(1-t, 2) * t * cp1.y + 
                 3 * (1-t) * Math.pow(t, 2) * cp2.y + 
                 Math.pow(t, 3) * finalY;
        
        pathPoints.push({x, y});
    }
    
    enemy.attackPath = pathPoints;
    enemy.attackTime = 0;
}

// Launch coordinated group attack like original Galaga
function launchGroupAttack() {
    // Find eligible enemies in formation that aren't already attacking
    const eligibleEnemies = enemies.filter(e => 
        e.state === ENEMY_STATE.FORMATION && 
        !attackQueue.includes(e)
    );
    
    if (eligibleEnemies.length < 3) return; // Need enough enemies
    
    // Select enemies in same row for authentic group dive
    const referenceY = eligibleEnemies[0].targetY;
    const sameRowEnemies = eligibleEnemies.filter(e => 
        Math.abs(e.targetY - referenceY) < 5
    );
    
    // Take 2-4 enemies from the row
    const groupSize = Math.min(Math.floor(Math.random() * 3) + 2, sameRowEnemies.length);
    const attackGroup = [];
    
    // Pick random enemies from the row
    while (attackGroup.length < groupSize && sameRowEnemies.length > 0) {
        const index = Math.floor(Math.random() * sameRowEnemies.length);
        attackGroup.push(sameRowEnemies.splice(index, 1)[0]);
    }
    
    // Set them all to attack mode with slight delays
    attackGroup.forEach((enemy, index) => {
        setTimeout(() => {
            if (enemy.state === ENEMY_STATE.FORMATION) {
                enemy.state = ENEMY_STATE.ATTACK;
                generateAttackPath(enemy);
                attackQueue.push(enemy);
            }
        }, index * 200);
    });
}

// Enhanced draw boss function with tractor beam effect
function drawBossGalaga(boss) {
    if (!boss) return;
    
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(Math.sin(Date.now() / 1000) * 0.05);
    
    // Create patterns and gradients for the boss
    const bodyGradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    bodyGradient.addColorStop(0, '#f0f');
    bodyGradient.addColorStop(0.6, '#b0b');
    bodyGradient.addColorStop(1, '#808');
    
    // Draw glowing aura
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Draw the boss body and details
    ctx.save();
    ctx.fillStyle = bodyGradient;
    // Central body section
    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.lineTo(-22, 4);
    ctx.lineTo(-14, 12);
    ctx.lineTo(14, 12);
    ctx.lineTo(22, 4);
    ctx.lineTo(18, -12);
    ctx.closePath();
    ctx.fill();
    
    // Top head section
    ctx.fillStyle = '#d0d';
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(-16, -2);
    ctx.lineTo(16, -2);
    ctx.lineTo(12, -12);
    ctx.closePath();
    ctx.fill();
    
    // Detail lines
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(-14, 6);
    ctx.lineTo(14, 6);
    ctx.stroke();
    ctx.restore();
    
    // Detailed wings with proper Galaga shape
    ctx.fillStyle = '#ff0'; 
    // Left wing
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-28, -2);
    ctx.lineTo(-30, 10);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.fill();
    
    // Right wing
    ctx.beginPath();
    ctx.moveTo(18, -8);
    ctx.lineTo(28, -2);
    ctx.lineTo(30, 10);
    ctx.lineTo(18, 6);
    ctx.closePath();
    ctx.fill();
    
    // Wing details
    ctx.fillStyle = '#f0f';
    ctx.beginPath();
    ctx.rect(-26, 0, 4, 4);
    ctx.rect(22, 0, 4, 4);
    ctx.fill();
    
    // Crown - more detailed with accurate Galaga boss antenna
    ctx.fillStyle = '#0ff';
    // Center spike
    ctx.beginPath();
    ctx.moveTo(-2, -18);
    ctx.lineTo(0, -28);
    ctx.lineTo(2, -18);
    ctx.closePath();
    ctx.fill();
    
    // Side antennas
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(-16, -20);
    ctx.lineTo(-10, -16);
    ctx.closePath();
    ctx.moveTo(12, -12);
    ctx.lineTo(16, -20);
    ctx.lineTo(10, -16);
    ctx.closePath();
    ctx.fill();
    
    // Glowing eyes with animation
    const eyeGlow = ctx.createRadialGradient(0, -6, 1, 0, -6, 6);
    eyeGlow.addColorStop(0, '#fff');
    eyeGlow.addColorStop(0.6, '#ff0');
    eyeGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');

    ctx.fillStyle = eyeGlow;
    ctx.globalAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(-8, -6, 4, 0, Math.PI * 2);
    ctx.arc(8, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner eyes
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(-8, -6, 2, 0, Math.PI * 2);
    ctx.arc(8, -6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Captured ship (if present)
    if (boss.hasCaptured) {
        ctx.save();
        ctx.translate(0, 22);
        
        // Enhanced tractor beam
        const tractorGradient = ctx.createLinearGradient(0, -20, 0, 10);
        tractorGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        tractorGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)');
        tractorGradient.addColorStop(1, 'rgba(255, 255, 0, 0.1)');
        
        // Main beam
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 150);
        ctx.fillStyle = tractorGradient;
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(14, -14);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        
        // Animated beam particles
        ctx.fillStyle = '#ff0';
        for (let i = 0; i < 5; i++) {
            const offset = (Date.now() / 300 + i * 0.2) % 1;
            const y = -14 + offset * 24;
            const width = 20 - offset * 10;
            ctx.globalAlpha = 0.7 - offset * 0.5;
            ctx.fillRect(-width/2, y, width, 1.5);
        }
        
        // Captured ship - using the authentic Galaga fighter design
        ctx.scale(0.7, 0.7);
        ctx.translate(0, 4);
        ctx.globalAlpha = 1.0;
        
        // Draw captured ship rotating slowly for dramatic effect
        ctx.save();
        ctx.rotate(Math.sin(Date.now() / 2000) * 0.2);
        
        // Main body with authentic Galaga fighter shape
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        
        // White center section
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -16);  // Top point
        ctx.lineTo(-5, -10); // Upper left corner
        ctx.lineTo(-8, 8);   // Lower left
        ctx.lineTo(8, 8);    // Lower right
        ctx.lineTo(5, -10);  // Upper right corner
        ctx.closePath();
        ctx.fill();
        
        // Red side wings
        ctx.fillStyle = '#f00';
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-16, 8);
        ctx.lineTo(-8, 8);
        ctx.closePath();
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(5, -10);
        ctx.lineTo(16, 0);
        ctx.lineTo(16, 8);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        
        // Blue cockpit detail
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(3, -6);
        ctx.lineTo(-3, -6);
        ctx.closePath();
        ctx.fill();
        
        // Special pulsating glow effect for captured ship
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(Date.now() / 200);
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-20, -20, 40, 40);
        ctx.stroke();
        ctx.restore();
        
        ctx.restore();
        ctx.restore();
    }
    
    ctx.restore();
}

// Enhanced enemy drawing with enum-based type checks for better performance
const ENEMY_TYPE = {
    BASIC: 'basic',
    FAST: 'fast',
    TANK: 'tank',
    ZIGZAG: 'zigzag',
    SNIPER: 'sniper'
};

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    
    // Apply subtle wobble/animation based on type
    if (e.state === ENEMY_STATE.FORMATION) {
        let wobbleAmount = 0.05; // Default
        
        // Switch is faster than multiple if/else for type comparison
        switch (e.type) {
            case ENEMY_TYPE.FAST:
                wobbleAmount = 0.08;
                break;
            case ENEMY_TYPE.ZIGZAG:
                wobbleAmount = 0.1;
                break;
            case ENEMY_TYPE.TANK:
                wobbleAmount = 0.03;
                break;
        }
        
        // Precompute sin value
        const wobble = Math.sin(Date.now() / 500 + e.x / 20) * wobbleAmount;
        ctx.rotate(wobble);
    }
    
    ctx.save();
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    
    // Switch for faster type comparison
    switch (e.type) {
        case ENEMY_TYPE.BASIC:
            // Classic Galaga Bee/Hornet enemy
            ctx.restore(); // No need for shadow on body
            
            // Create body with patterns
            const wingsAnim = Math.sin(Date.now() / 150) * 0.2;
            
            // Blue body parts
            ctx.fillStyle = '#0f8';
            // Main body
            ctx.beginPath();
            ctx.moveTo(-10, -8);
            ctx.lineTo(10, -8);
            ctx.lineTo(14, 0);
            ctx.lineTo(10, 8);
            ctx.lineTo(-10, 8);
            ctx.lineTo(-14, 0);
            ctx.closePath();
            ctx.fill();
            
            // Yellow stripes/segments
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(-8, -6);
            ctx.lineTo(8, -6);
            ctx.lineTo(10, 0);
            ctx.lineTo(8, 6);
            ctx.lineTo(-8, 6);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fill();
            
            // Red center
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Moving wings
            ctx.save();
            ctx.fillStyle = '#0cf';
            // Left wing
            ctx.translate(-14, 0);
            ctx.rotate(wingsAnim);
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 12, Math.PI/3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Right wing
            ctx.save();
            ctx.fillStyle = '#0cf';
            ctx.translate(14, 0);
            ctx.rotate(-wingsAnim);
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 12, -Math.PI/3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Antenna with animation
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.rect(-1, -15, 2, 7 + Math.sin(Date.now() / 200) * 2);
            ctx.fill();
            
            // Eyes with glow effect
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-6, -3, 2, 0, Math.PI * 2);
            ctx.arc(6, -3, 2, 0, Math.PI * 2);
            ctx.fill();
            
            break;
            
        case ENEMY_TYPE.FAST:
            // Butterfly/fast enemy in authentic Galaga style
            ctx.fillStyle = e.color;
            
            // Main body
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(8, -4);
            ctx.lineTo(8, 4);
            ctx.lineTo(0, 12);
            ctx.lineTo(-8, 4);
            ctx.lineTo(-8, -4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Wings with animation
            const wingPulse = 0.8 + 0.2 * Math.sin(Date.now() / 200);
            
            // Left wing
            ctx.save();
            ctx.translate(-10, 0);
            ctx.scale(wingPulse, 1);
            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(-10, -5);
            ctx.lineTo(-12, 5);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Right wing
            ctx.save();
            ctx.translate(10, 0);
            ctx.scale(wingPulse, 1);
            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(10, -5);
            ctx.lineTo(12, 5);
            ctx.lineTo(0, 10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Center detail - authentic Galaga pattern
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(4, -2);
            ctx.lineTo(4, 2);
            ctx.lineTo(0, 6);
            ctx.lineTo(-4, 2);
            ctx.lineTo(-4, -2);
            ctx.closePath();
            ctx.fill();
            
            // Eyes/sensors
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-3, -4, 2, 0, Math.PI * 2);
            ctx.arc(3, -4, 2, 0, Math.PI * 2);
            ctx.fill();
            
            break;
            
        case ENEMY_TYPE.TANK:
            // Tank/boss minion in Galaga style
            ctx.fillStyle = e.color;
            
            // Main body with authentic Galaga shape
            ctx.beginPath();
            ctx.moveTo(-14, -10);
            ctx.lineTo(-10, -14);
            ctx.lineTo(10, -14);
            ctx.lineTo(14, -10);
            ctx.lineTo(14, 10);
            ctx.lineTo(10, 14);
            ctx.lineTo(-10, 14);
            ctx.lineTo(-14, 10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Armor pattern
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(-10, -10, 20, 20);
            ctx.stroke();
            
            // Inner core detail
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.rect(-6, -6, 12, 12);
            ctx.fill();
            
            // Corner details
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(-10, -10, 3, 0, Math.PI * 2);
            ctx.arc(10, -10, 3, 0, Math.PI * 2);
            ctx.arc(-10, 10, 3, 0, Math.PI * 2);
            ctx.arc(10, 10, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Pulsing center
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 300);
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            break;
            
        case ENEMY_TYPE.SNIPER:
            // Scorpion/sniper in authentic Galaga style
            ctx.fillStyle = e.color;
            
            // Body
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(8, -8);
            ctx.lineTo(14, 0);
            ctx.lineTo(8, 8);
            ctx.lineTo(0, 14);
            ctx.lineTo(-8, 8);
            ctx.lineTo(-14, 0);
            ctx.lineTo(-8, -8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Segments
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -4);
            ctx.lineTo(10, -4);
            ctx.moveTo(-10, 4);
            ctx.lineTo(10, 4);
            ctx.stroke();
            
            // Pincers with animation
            const pincerAnim = Math.sin(Date.now() / 400) * 0.3;
            
            // Left pincer
            ctx.save();
            ctx.translate(-14, 0);
            ctx.rotate(-Math.PI/4 + pincerAnim);
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, -6);
            ctx.lineTo(-12, 0);
            ctx.lineTo(-10, 6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Right pincer
            ctx.save();
            ctx.translate(14, 0);
            ctx.rotate(Math.PI/4 - pincerAnim);
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(10, -6);
            ctx.lineTo(12, 0);
            ctx.lineTo(10, 6);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Eye/targeting system
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            
            break;
            
        default:
            // Draw default enemy if type doesn't match
            ctx.restore();
            
            // Basic geometric shape with the enemy's color
            ctx.fillStyle = e.color || '#f00';
            ctx.beginPath();
            ctx.rect(-12, -12, 24, 24);
            ctx.fill();
            
            // Add some details
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-4, -4, 3, 0, Math.PI * 2);
            ctx.arc(4, -4, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Add contrast line
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 4);
            ctx.lineTo(10, 4);
            ctx.stroke();
    }
    
    ctx.restore();
}

// Optimized bullet drawing with type caching for better performance
function drawBullet(b) {
    ctx.save();
    
    // Create bullet gradient and glow
    const bulletGradient = ctx.createLinearGradient(b.x, b.y - 8, b.x, b.y + 8);
    
    if (dualShip && b.from === 'dual') {
        // Dual ship bullet - green energy
        bulletGradient.addColorStop(0, '#8f8');
        bulletGradient.addColorStop(0.5, '#0f8');
        bulletGradient.addColorStop(1, '#0f4');
        
        ctx.shadowColor = '#0f8';
        ctx.shadowBlur = 10;
        
        // Create energy bullet with pulsing effect
        ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 50);
        ctx.fillStyle = bulletGradient;
        
        // Dual fire bullet shape
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - 8); 
        ctx.lineTo(b.x + 3, b.y - 2);
        ctx.lineTo(b.x + 1, b.y + 4);
        ctx.lineTo(b.x - 1, b.y + 4);
        ctx.lineTo(b.x - 3, b.y - 2);
        ctx.closePath();
        ctx.fill();
        
        // Energy trail
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++) {
            const trailY = b.y + 5 + i * 3;
            const size = 3 - i * 0.8;
            ctx.beginPath();
            ctx.arc(b.x + Math.sin(Date.now() / 100 + i) * 1.5, trailY, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
    } else if (b.type === 'double') {
        // Double power bullet - cyan energy
        bulletGradient.addColorStop(0, '#8ff');
        bulletGradient.addColorStop(0.5, '#0ff');
        bulletGradient.addColorStop(1, '#08f'); 
        
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 12;
        
        // Create double shot with particle effects
        ctx.fillStyle = bulletGradient;
        
        // Main bullet shape
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - 10);
        ctx.lineTo(b.x + 4, b.y);
        ctx.lineTo(b.x + 2, b.y + 6);
        ctx.lineTo(b.x - 2, b.y + 6);
        ctx.lineTo(b.x - 4, b.y);
        ctx.closePath();
        ctx.fill();
        
        // Particle glow
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 80);
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (b.from === 'enemy') {
        // Enemy bullet - use the bullet's color
        const color = b.color || '#f00'; // Default to red if no color specified
        
        // Extract color components for gradient
        let baseColor = color;
        let lightColor = '#fff';
        
        bulletGradient.addColorStop(0, lightColor);
        bulletGradient.addColorStop(0.5, baseColor);
        bulletGradient.addColorStop(1, baseColor);
        
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 8;
        
        // Create enemy bullet based on type
        ctx.fillStyle = bulletGradient;
        
        if (b.type === 'zigzag') {
            // Zigzag bullet has rhombus shape
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - 6);
            ctx.lineTo(b.x + 4, b.y);
            ctx.lineTo(b.x, b.y + 6);
            ctx.lineTo(b.x - 4, b.y);
            ctx.closePath();
            ctx.fill();
            
            // Trailing effect
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - 3);
            ctx.lineTo(b.x + 2, b.y);
            ctx.lineTo(b.x, b.y + 8);
            ctx.lineTo(b.x - 2, b.y);
            ctx.closePath();
            ctx.fill();
        } else if (b.type === 'split') {
            // Split bullet has triangular shape
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - 8);
            ctx.lineTo(b.x + 5, b.y + 4);
            ctx.lineTo(b.x - 5, b.y + 4);
            ctx.closePath();
            ctx.fill();
            
            // Pulsing glow effect
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 100);
            ctx.beginPath();
            ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (b.type === 'fast') {
            // Fast bullet has a streamlined shape
            ctx.beginPath();
            ctx.moveTo(b.x, b.y - 8);
            ctx.lineTo(b.x + 3, b.y);
            ctx.lineTo(b.x, b.y + 8);
            ctx.lineTo(b.x - 3, b.y);
            ctx.closePath();
            ctx.fill();
            
            // Motion blur
            ctx.globalAlpha = 0.4;
            for (let i = 1; i <= 3; i++) {
                ctx.fillRect(b.x - 1, b.y - 8 - i * 3, 2, 2);
            }
        } else {
            // Default enemy bullet (circular with trail)
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Trailing effect
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(b.x, b.y - 6, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(b.x, b.y - 12, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Regular player bullet - classic Galaga yellow shot
        bulletGradient.addColorStop(0, '#fff');
        bulletGradient.addColorStop(0.5, '#ff0');
        bulletGradient.addColorStop(1, '#fb0');
        
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 8;
        ctx.fillStyle = bulletGradient;
        
        // Use a single path for better performance
        ctx.beginPath();
        // Bullet body
        ctx.rect(b.x - 1.5, b.y - 12, 3, 10);
        // Bullet tip (triangle)
        ctx.moveTo(b.x, b.y - 14);
        ctx.lineTo(b.x + 2, b.y - 10);
        ctx.lineTo(b.x - 2, b.y - 10);
        ctx.closePath();
        ctx.fill();
        
        // Add flash effect - only do 30% of the time
        if (Math.random() < 0.3) {
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(b.x, b.y - 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

// Optimized powerup drawing
function drawPowerup(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    
    // Subtle rotation for all powerups
    const rotationSpeed = p.type === 'speed' ? 0.005 : 0.002;
    ctx.rotate(Date.now() * rotationSpeed);
    
    // Glowing outer ring common to all powerups
    const outerGlow = ctx.createRadialGradient(0, 0, 6, 0, 0, 15);
    outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    outerGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    outerGlow.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
    outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    
    ctx.beginPath();
    ctx.fillStyle = outerGlow;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 400);
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Capsule base
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 2;
    
    if (p.type === 'double') {
        // Double fire powerup
        const doubleGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
        doubleGradient.addColorStop(0, '#fff');
        doubleGradient.addColorStop(0.6, '#0ff');
        doubleGradient.addColorStop(1, '#08f');
        
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        
        // Main capsule
        ctx.fillStyle = doubleGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dual shot symbol
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.moveTo(4, -4);
        ctx.lineTo(4, 4);
        ctx.stroke();
        
        // Animated particles
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 5; i++) {
            const angle = (Date.now() / 1000 + i) % (Math.PI * 2);
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
    } else if (p.type === 'shield') {
        // Shield powerup
        const shieldGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
        shieldGradient.addColorStop(0, '#fff');
        shieldGradient.addColorStop(0.6, '#0ef');
        shieldGradient.addColorStop(1, '#08a');
        
        ctx.shadowColor = '#0ef';
        ctx.shadowBlur = 10;
        
        // Main capsule
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shield symbol - hexagon
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 5;
            const y = Math.sin(angle) * 5;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        // Pulsing shield effect
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(Date.now() / 300);
        ctx.beginPath();
        ctx.arc(0, 0, 6 + Math.sin(Date.now() / 400), 0, Math.PI * 2);
        ctx.stroke();
        
    } else if (p.type === 'speed') {
        // Speed powerup
        const speedGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
        speedGradient.addColorStop(0, '#fff');
        speedGradient.addColorStop(0.6, '#ff0');
        speedGradient.addColorStop(1, '#f80');
        
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 10;
        
        // Main capsule
        ctx.fillStyle = speedGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Speed symbol - lightning bolt
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-4, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-3, 0);
        ctx.lineTo(4, 5);
        ctx.lineTo(1, 1);
        ctx.lineTo(4, 1);
        ctx.closePath();
        ctx.fill();
        
        // Speed trail
        ctx.globalAlpha = 0.5;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 0, ' + (0.8 - i * 0.2) + ')';
            ctx.ellipse(-i * 4, 0, 10 - i * 2, 8 - i * 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

// Optimized HUD drawing with cached text
function drawHUD() {
    const scoreText = `SCORE: ${score}`;
    const highScoreText = `HIGH SCORE: ${highScore}`;
    const levelText = `LEVEL: ${level}`;
    
    ctx.font = '14px monospace';
    ctx.fillStyle = '#fff';
    
    // Draw score
    ctx.textAlign = 'left';
    ctx.fillText(scoreText, 15, 25);
    
    // Draw high score
    ctx.textAlign = 'center';
    ctx.fillText(highScoreText, CANVAS_WIDTH / 2, 25);
    
    // Draw level
    ctx.textAlign = 'right';
    ctx.fillText(levelText, CANVAS_WIDTH - 80, 25);
    
    // Draw lives (mini ships at top right)
    const shipX = CANVAS_WIDTH - 60;
    const shipY = 20;
    const shipSpacing = 20;
    
    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(shipX + i * shipSpacing, shipY);
        ctx.scale(0.4, 0.4);
        
        // Draw mini ship icon - simplified for performance
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -8); 
        ctx.lineTo(-4, 0);
        ctx.lineTo(-4, 8);
        ctx.lineTo(4, 8);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Function to draw game over screen
function drawGameOver() {
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Over text
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, 150); // Adjusted Y
    
    // Score display
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`FINAL SCORE: ${score}`, canvas.width/2, 200); // Adjusted Y
    
    let isNewHighScore = false;
    if (firebaseHighScores.length < MAX_HIGH_SCORES) {
        isNewHighScore = true;
    } else if (firebaseHighScores.length > 0 && score > firebaseHighScores[firebaseHighScores.length - 1].score) {
        // If table is full, score must be greater than the lowest score in the table
        isNewHighScore = true;
    }
    // Also consider the case where firebaseHighScores is empty, any score is a high score.
    if (firebaseHighScores.length === 0 && score > 0) {
        isNewHighScore = true;
    }


    if (isNewHighScore && !player.highScoreSubmitted) {
        // Transition to enter high score state instead of prompt
        state = GAME_STATE.ENTER_HIGH_SCORE;
        playerInitials = ["_", "_", "_", "_", "_"];
        currentInitialIndex = 0;
        // No need to call drawEnterHighScoreScreen here, gameLoop will handle it
        ctx.restore(); // Restore context before early exit
        return; 
    }

    // Display High Scores on Game Over Screen (if not entering new one)
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ff0';
    ctx.fillText('HIGH SCORES:', canvas.width / 2, 260); // Adjusted Y position
    if (firebaseHighScores.length > 0) {
        firebaseHighScores.slice(0, 5).forEach((entry, index) => { // Display top 5
            ctx.fillText(`${index + 1}. ${entry.name.substring(0,5)} - ${entry.score}`, canvas.width / 2, 290 + index * 25);
        });
    } else {
        ctx.fillStyle = '#aaa';
        ctx.fillText('No scores yet!', canvas.width / 2, 290);
    }
    
    // Restart instructions
    ctx.font = '18px monospace';
    ctx.fillStyle = '#0ff';

    if (isTouchDevice) {
        ctx.fillText('TAP SCREEN TO RESTART', canvas.width/2, canvas.height-100);
    } else {
        ctx.fillText('PRESS SPACE TO RESTART', canvas.width/2, canvas.height-100);
    }
    
    ctx.restore();
    
    // Listen for space to restart (keyboard only)
    if (!isTouchDevice && keys['Space']) {
        state = GAME_STATE.SPLASH;
        fetchHighScores(); // Fetch scores when returning to splash
    }
}

function drawEnterHighScoreScreen() {
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, 150);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`YOUR SCORE: ${score}`, canvas.width / 2, 200);

    ctx.fillText('ENTER YOUR INITIALS:', canvas.width / 2, 250);

    // Display initials input
    let initialsDisplay = playerInitials.join(" ");
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText(initialsDisplay, canvas.width / 2, 320);

    // Blinking cursor effect for the current initial
    if (Math.floor(Date.now() / 500) % 2 === 0 && currentInitialIndex < playerInitials.length) {
        const textWidth = ctx.measureText(playerInitials.slice(0, currentInitialIndex).join(" ")).width;
        const singleCharWidth = ctx.measureText("_").width;
        const cursorX = canvas.width /  2 - ctx.measureText(initialsDisplay).width / 2 + textWidth + (currentInitialIndex > 0 ? ctx.measureText(" ").width * currentInitialIndex : 0) ;
        ctx.fillText("_", cursorX + singleCharWidth / 2, 320);
    }


    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('USE A-Z, BACKSPACE TO DELETE', canvas.width / 2, 380);
    ctx.fillText('PRESS ENTER TO SUBMIT', canvas.width / 2, 410);

    ctx.restore();
}

function drawPauseScreen() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent overlay
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    if (!isTouchDevice) {
        ctx.fillText('PRESS P TO RESUME', canvas.width / 2, canvas.height / 2 + 40);
    } else {
        ctx.fillText('TAP SCREEN OR FOCUS WINDOW TO RESUME', canvas.width / 2, canvas.height / 2 + 40);
    }
    ctx.restore();
}

// Function to check if we're on a touch device
function detectTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

// Initialize touch controls
function initTouchControls() {
    // Detect if we're on a touch device
    isTouchDevice = detectTouchDevice();
    
    if (isTouchDevice) {
        console.log("Touch device detected, initializing touch controls");
        
        // Layout touch controls
        layoutTouchButtons();
        
        // Add touch event listeners
        canvas.addEventListener('touchstart', handleTouchStart, false);
        canvas.addEventListener('touchend', handleTouchEnd, false);
        canvas.addEventListener('touchmove', handleTouchMove, false);
        
        // Handle visibility change (pause when tab/app is not visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state === GAME_STATE.PLAYING) {
                handlePause();
            }
        });
    }
}

// Handle touch start events
function handleTouchStart(e) {
    e.preventDefault();
    
    // Handle different states
    if (state === GAME_STATE.SPLASH) {
        state = GAME_STATE.PLAYING;
        resetGame();
        return;
    } else if (state === GAME_STATE.GAME_OVER) {
        state = GAME_STATE.SPLASH;
        return;
    } else if (state === GAME_STATE.PAUSED) {
        handleResume();
        return;
    }
    
    const touches = e.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Check which button was touched
        for (const [key, button] of Object.entries(touchControls.buttons)) {
            if (touchX >= button.x && 
                touchX <= button.x + button.w && 
                touchY >= button.y && 
                touchY <= button.y + button.h) {
                
                // Special handling for auto-shoot toggle
                if (key === 'autoShoot') {
                    autoShootActive = !autoShootActive;
                } else {
                    button.pressed = true;
                    // Store touch ID to track this specific touch
                    button.touchId = touch.identifier;
                }
            }
        }
    }
}

// Handle touch end events
function handleTouchEnd(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        
 
        
        // Check which button was released
        for (const button of Object.values(touchControls.buttons)) {
            if (button.touchId === touch.identifier) {
                button.pressed = false;
                button.touchId = null;
            }
        }
    }
}

// Handle touch move events
function handleTouchMove(e) {
    e.preventDefault();
    
    const touches = e.changedTouches;
    
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Check if the touch is still on the same button
        for (const button of Object.values(touchControls.buttons)) {
            if (button.touchId === touch.identifier) {
                // If touch moved outside the button, release it
                if (touchX < button.x || touchX > button.x + button.w || 
                    touchY < button.y || touchY > button.y + button.h) {
                    button.pressed = false;
                    button.touchId = null;
                }
            }
        }
    }
}

// Layout the touch control buttons based on canvas size
function layoutTouchButtons() {
    const buttonSize = CANVAS_HEIGHT * 0.12; // 12% of canvas height
    const margin = CANVAS_HEIGHT * 0.05; // 5% margin
    
    // Left button (bottom left)
    touchControls.buttons.left.x = margin;
    touchControls.buttons.left.y = CANVAS_HEIGHT - buttonSize - margin;
    touchControls.buttons.left.w = buttonSize;
    touchControls.buttons.left.h = buttonSize;
    
    // Right button (bottom left + buttonSize + gap)
    touchControls.buttons.right.x = margin * 2 + buttonSize;
    touchControls.buttons.right.y = CANVAS_HEIGHT - buttonSize - margin;
    touchControls.buttons.right.w = buttonSize;
    touchControls.buttons.right.h = buttonSize;
    
    // AutoShoot button (bottom center)
    touchControls.buttons.autoShoot.x = (CANVAS_WIDTH - buttonSize) / 2;
    touchControls.buttons.autoShoot.y = CANVAS_HEIGHT - buttonSize - margin;
    touchControls.buttons.autoShoot.w = buttonSize;
    touchControls.buttons.autoShoot.h = buttonSize;
    
    // Fire button (bottom right)
    touchControls.buttons.fire.x = CANVAS_WIDTH - buttonSize - margin;
    touchControls.buttons.fire.y = CANVAS_HEIGHT - buttonSize - margin;
    touchControls.buttons.fire.w = buttonSize;
    touchControls.buttons.fire.h = buttonSize;
}

// Draw touch controls on screen
function drawTouchControls() {
    // Draw background for control area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, CANVAS_HEIGHT - CANVAS_HEIGHT * 0.12 - CANVAS_HEIGHT * 0.05 * 2, 
                 CANVAS_WIDTH, CANVAS_HEIGHT * 0.12 + CANVAS_HEIGHT * 0.05);
    
    // Draw each button
    for (const [key, button] of Object.entries(touchControls.buttons)) {
        // Button background
        ctx.fillStyle = button.pressed ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
        
        // Special style for auto-shoot when active
        if (key === 'autoShoot' && autoShootActive) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        }
        
        // Draw button
        ctx.beginPath();
        ctx.roundRect(button.x, button.y, button.w, button.h, 8);
        ctx.fill();
        
        // Button label
        ctx.fillStyle = '#fff';
        ctx.font = `${button.w * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2);
    }
}

// Handle pause
function handlePause() {
    if (state === GAME_STATE.PLAYING) {
        previousStateBeforePause = state;
        state = GAME_STATE.PAUSED;
    }
}

// Handle resume
function handleResume() {
    if (state === GAME_STATE.PAUSED && previousStateBeforePause) {
        state = previousStateBeforePause;
        previousStateBeforePause = null;
    }
}

// --- Core Game Logic Functions (Should be placed before initGame) ---

// Reset game state
function resetGame() {
    player.x = PLAYER_START_X;
    player.y = PLAYER_START_Y;
    player.alive = true;
    player.power = 'normal';
    player.powerTimer = 0;
    player.shield = false;
    player.speed = 250;
    player.highScoreSubmitted = false; // Reset submission flag

    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    particles = []; // Clear particles

    score = 0;
    lives = 3;
    level = 1;
    levelTransition = 0;
    bossGalaga = null;
    capturedShip = false;
    dualShip = false;
    challengeStage = false;
    
    // Reset object pools by marking all objects as inactive
    POOL.bullets.forEach(b => b.active = false);
    POOL.enemyBullets.forEach(b => b.active = false);
    POOL.particles.forEach(p => p.active = false);

    spawnEnemies();
}

// Create explosion particles
function createExplosion(x, y, color = '#ff0', count = 20, size = 2, speed = 150) {
    for (let i = 0; i < count; i++) {
        const p = getPoolObject('particles');
        if (p) {
            p.x = x;
            p.y = y;
            const angle = Math.random() * Math.PI * 2;
            const currentSpeed = Math.random() * speed + 50;
            p.vx = Math.cos(angle) * currentSpeed;
            p.vy = Math.sin(angle) * currentSpeed;
            p.size = Math.random() * size + 1;
            p.color = color;
            p.initialLife = Math.random() * 0.5 + 0.3; // Shorter life for explosions
            p.life = p.initialLife;
            p.active = true;
            particles.push(p);
        }
    }
    screenShake = 5 + Math.random() * 5; // Add screen shake on explosion
}

// Spawn powerup
function spawnPowerup(x, y) {
    const types = ['double', 'shield', 'speed'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({
        x: x,
        y: y,
        w: 16,
        h: 16,
        type: type,
        speed: 80 // Speed at which powerup falls
    });
}

// Spawns a new wave of enemies based on the current level
function spawnEnemies() {
    setupFormation();
    enemies = [];
    setupWavePatterns();
    
    // Base number of enemies
    let numEnemies = 16 + Math.min(32, level * 2); 
    
    // Challenge stages have a special formation
    if (challengeStageActive) {
        numEnemies = 40; // More enemies in challenge stages
    }
    
    const enemyTypes = [
        ENEMY_TYPE.BASIC,
        ENEMY_TYPE.FAST,
        ENEMY_TYPE.TANK,
        ENEMY_TYPE.ZIGZAG,
        ENEMY_TYPE.SNIPER
    ];
    
    // Place enemies in formation with appropriate types per row
    // First two rows are typically basic
    // Third row typically has faster enemies
    // Bottom row typically has the tougher enemies
    for (let i = 0; i < numEnemies; i++) {
        const spot = getEmptyFormationSpot();
        if (!spot) break;
        spot.taken = true;
        
        // Determine enemy type by position (row) - more authentic to Galaga
        // In Galaga, different rows have different enemy types
        const row = Math.floor((spot.y - 60) / 30); // Calculate row based on y position
        
        let enemyType;
        if (row === 0) {
            // Top row - mostly basic enemies
            enemyType = Math.random() < 0.8 ? ENEMY_TYPE.BASIC : ENEMY_TYPE.FAST;
        } else if (row === 1) {
            // Second row - mix of basic and fast
            enemyType = Math.random() < 0.6 ? ENEMY_TYPE.BASIC : ENEMY_TYPE.FAST;
        } else if (row === 2) {
            // Third row - mostly fast with some zigzag
            enemyType = Math.random() < 0.7 ? ENEMY_TYPE.FAST : ENEMY_TYPE.ZIGZAG;
        } else {
            // Bottom row - tougher enemies
            const r = Math.random();
            if (r < 0.4) enemyType = ENEMY_TYPE.TANK;
            else if (r < 0.7) enemyType = ENEMY_TYPE.SNIPER;
            else enemyType = ENEMY_TYPE.ZIGZAG;
        }
        
        let enemyColor = '#0f0';
        switch (enemyType) {
            case ENEMY_TYPE.FAST: enemyColor = '#0ff'; break;
            case ENEMY_TYPE.TANK: enemyColor = '#f00'; break;
            case ENEMY_TYPE.ZIGZAG: enemyColor = '#f0f'; break;
            case ENEMY_TYPE.SNIPER: enemyColor = '#ff0'; break;
        }
        
        // Adjust enemy size based on type
        let enemyW = 24, enemyH = 24;
        if (enemyType === ENEMY_TYPE.TANK) { enemyW = 28; enemyH = 28; }
        if (enemyType === ENEMY_TYPE.FAST) { enemyW = 22; enemyH = 22; }
        
        const startSide = Math.random() > 0.5 ? -50 : CANVAS_WIDTH + 50;
        const startY = -50;
        
        // Enhanced entrance behavior with formation systems
        enemies.push({
            x: startSide,
            y: startY,
            w: enemyW,
            h: enemyH,
            type: enemyType,
            color: enemyColor,
            state: ENEMY_STATE.ENTRANCE,
            startX: startSide,
            startY: startY,
            targetX: spot.x,
            targetY: spot.y,
            controlX: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200,
            controlY: CANVAS_HEIGHT / 3,
            pathTime: 0,
            index: i,
            formationOffset: {
                x: Math.random() * 4 - 2,
                y: Math.random() * 4 - 2
            },
            attackPath: [], // Will store attack path points
            attackIndex: 0,
            attackTime: 0,
            canFire: !challengeStageActive, // No firing in challenge stages
            points: enemyType === ENEMY_TYPE.BASIC ? 50 :
                   enemyType === ENEMY_TYPE.FAST ? 80 :
                   enemyType === ENEMY_TYPE.TANK ? 150 :
                   enemyType === ENEMY_TYPE.ZIGZAG ? 100 :
                   enemyType === ENEMY_TYPE.SNIPER ? 120 : 50
        });
    }
    
    // Boss Galaga every 5 levels or special encounters
    if (level % 5 === 0 || (level > 10 && Math.random() < 0.3)) {
        bossGalaga = {
            x: CANVAS_WIDTH / 2,
            y: 40,
            w: 60,
            h: 50,
            color: '#f0f',
            health: 10 + Math.floor(level / 5),
            timer: 2,
            state: 'idle',
            hasCaptured: false,
            tractorBeamActive: false,
            points: 150 + (level * 10)
        };
    }
    
    // Reset attack queue
    attackQueue = [];
}

// Updates player movement and powerup timers
function updatePlayer() {
    if (!player.alive) return;
    let moveX = 0;
    if (keys['ArrowLeft']) moveX -= 1;
    if (keys['ArrowRight']) moveX += 1;
    if (isTouchDevice) {
        if (touchControls.buttons.left.pressed) moveX -= 1;
        if (touchControls.buttons.right.pressed) moveX += 1;
    }
    player.x += moveX * player.speed * dt;
    if (player.x < player.w / 2) player.x = player.w / 2;
    if (player.x > CANVAS_WIDTH - player.w / 2) player.x = CANVAS_WIDTH - player.w / 2;
    if (player.cooldown > 0) player.cooldown -= dt;
    let shouldFire = false;
    if (keys['Space']) shouldFire = true;
    if (isTouchDevice && (touchControls.buttons.fire.pressed || autoShootActive)) shouldFire = true;
    if (shouldFire && player.cooldown <= 0) {
        player.cooldown = player.power === 'double' ? 0.20 : 0.35;
        const bullet = getPoolObject('bullets');
        if (bullet) {
            bullet.x = player.x;
            bullet.y = player.y - 15;
            bullet.w = 3;
            bullet.h = 12;
            bullet.speed = 600;
            bullet.type = player.power === 'double' ? 'double' : 'normal';
            bullet.from = 'player';
            bullet.active = true;
            bullets.push(bullet);
            if (dualShip) {
                const dualBullet = getPoolObject('bullets');
                if (dualBullet) {
                    dualBullet.x = player.x - 24;
                    dualBullet.y = player.y - 15;
                    dualBullet.w = 3;
                    dualBullet.h = 12;
                    dualBullet.speed = 600;
                    dualBullet.type = 'normal';
                    dualBullet.from = 'dual';
                    dualBullet.active = true;
                    bullets.push(dualBullet);
                }
            }
        }
    }
}

// Update game logic
function updateGameplay() {
    updatePlayer();
    updateEnemies();
    updateBullets();
    updateEnemyBullets();
    updatePowerups();
    updateParticles(); // Update particles
    checkCollisions();

    // Update powerup timer
    if (player.powerTimer > 0) {
        player.powerTimer -= dt;
        if (player.powerTimer <= 0) {
            player.power = 'normal';
            player.shield = false; // Ensure shield is off when timer ends
            player.speed = 250; // Reset speed
        }
    }

    // Update screen shake - use exponential decay for smoother effect
    if (screenShake > 0) {
        screenShake *= Math.pow(0.85, 60 * dt); // 60 * dt provides consistent decay rate
        if (screenShake < 0.5) screenShake = 0;
    }
}

// Initialize game with optimized settings
function initGame() {
    console.log("initGame called"); // LOGGING
    initObjectPools();
    initTouchControls();
    initStars(); // Initialize enhanced starfield
    gameStage = 0;
    lastTime = performance.now(); // Initialize lastTime here
    fetchHighScores(() => {
        console.log("Game initialized and ready to start. FetchHighScores callback executed."); // LOGGING
        gameLoop(); // Start the game loop
    });
}

// Start the game
initGame();