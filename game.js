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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let firebaseHighScores = [];
const MAX_HIGH_SCORES = 10; // Max number of scores to store/display

// Function to fetch high scores from Firebase
function fetchHighScores(callback) {
    database.ref('highscores').orderByChild('score').limitToLast(MAX_HIGH_SCORES).once('value', (snapshot) => {
        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push({
                key: childSnapshot.key,
                name: childSnapshot.val().name,
                score: childSnapshot.val().score
            });
        });
        firebaseHighScores = scores.sort((a, b) => b.score - a.score); // Sort descending
        if (firebaseHighScores.length > 0) {
            highScore = firebaseHighScores[0].score; // Update local high score
        } else {
            highScore = 0;
        }
        if (callback) callback();
    });
}

// Function to save a high score to Firebase
function saveHighScore(name, score) {
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


function drawArcadeSplash() {
    // Cached color calculation outside the rendering loop
    const colorIndex = Math.floor(Date.now() / 200) % arcadeColors.length;
    const titleColorIndex = Math.floor(Date.now() / 400) % arcadeColors.length;
    const textColorIndex = Math.floor(Date.now() / 100) % arcadeColors.length;
    
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Neon border
    ctx.strokeStyle = arcadeColors[colorIndex];
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    
    // Title
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = arcadeColors[titleColorIndex];
    ctx.textAlign = 'center';
    ctx.fillText('GALAGA', CANVAS_WIDTH / 2, 120);
    
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('ARCADE TRIBUTE', CANVAS_WIDTH / 2, 160);

    // Display High Scores on Splash Screen
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ff0';
    ctx.fillText('HIGH SCORES:', CANVAS_WIDTH / 2, 220);
    
    const centerX = CANVAS_WIDTH / 2;
    if (firebaseHighScores.length > 0) {
        // Precompute y positions to avoid calculations in loop
        const yPositions = [250, 275, 300, 325, 350];
        const scoreCount = Math.min(firebaseHighScores.length, 5);
        
        for (let i = 0; i < scoreCount; i++) {
            const entry = firebaseHighScores[i];
            ctx.fillText(`${i + 1}. ${entry.name.substring(0, 5)} - ${entry.score}`, centerX, yPositions[i]);
        }
    } else {
        ctx.fillStyle = '#aaa';
        ctx.fillText('No scores yet!', centerX, 250);
    }

    // Insert coin
    ctx.font = '18px monospace';
    ctx.fillStyle = arcadeColors[textColorIndex];
    ctx.fillText(isTouchDevice ? 'TAP SCREEN TO START' : 'PRESS SPACE TO START', centerX, CANVAS_HEIGHT - 100);
}

// Enhanced Player ship drawing with authentic Galaga fighter style and thruster animation
function drawPlayer() {
    if (!player.alive) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Draw thruster animation - more dynamic flame effect
    const thrusterAnimation = Math.sin(Date.now() / 50) * 0.3 + 0.7; // Precompute sine values
    const thruster2Animation = Math.sin(Date.now() / 70) * 0.3 + 0.5;
    const flameHeight = Math.sin(Date.now() / 80) * 5; // Precompute flame variation
    const flameHeight2 = Math.sin(Date.now() / 90) * 3;
    
    ctx.save();
    const flameColor = ctx.createLinearGradient(0, 8, 0, 20);
    flameColor.addColorStop(0, '#ff4');
    flameColor.addColorStop(0.5, '#f84');
    flameColor.addColorStop(1, '#f42');
    ctx.fillStyle = flameColor;
    ctx.globalAlpha = thrusterAnimation;
    
    // Main flame - optimized path drawing
    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.quadraticCurveTo(0, 20 + flameHeight, 5, 8);
    ctx.closePath();
    ctx.fill();
    
    // Secondary flames
    ctx.globalAlpha = thruster2Animation;
    
    // Left flame
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.quadraticCurveTo(-6, 16 + flameHeight2, -4, 8);
    ctx.closePath();
    ctx.fill();
    
    // Right flame
    ctx.beginPath();
    ctx.moveTo(4, 8);
    ctx.quadraticCurveTo(6, 16 + flameHeight2, 8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Authentic Galaga fighter - more detailed body with classic shape
    ctx.save();
    // Glow effect
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    
    // Main body - white center section
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -16);  // Top point
    ctx.lineTo(-5, -10); // Upper left corner
    ctx.lineTo(-8, 8);   // Lower left
    ctx.lineTo(8, 8);    // Lower right
    ctx.lineTo(5, -10);  // Upper right corner
    ctx.closePath();
    ctx.fill();
    
    // Red side wings with proper Galaga shape
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
    
    // Yellow wing accents
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.rect(-14, 2, 4, 4);
    ctx.rect(10, 2, 4, 4);
    ctx.fill();
    ctx.restore();    // Enhanced shield effect with pulsating animation
    if (player.shield) {
        ctx.save();
        const shieldGradient = ctx.createRadialGradient(0, 0, 15, 0, 0, 25);
        shieldGradient.addColorStop(0, 'rgba(0, 255, 255, 0.0)');
        shieldGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
        shieldGradient.addColorStop(0.8, 'rgba(0, 255, 255, 0.2)');
        shieldGradient.addColorStop(1, 'rgba(0, 255, 255, 0.0)');
        
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 200);
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI*2);
        ctx.fill();
        
        // Add shield ring
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22 + Math.sin(Date.now() / 300) * 2, 0, Math.PI*2);
        ctx.stroke();
        
        // Add hexagonal pattern to shield
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 18;
            const y = Math.sin(angle) * 18;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI*2);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // Draw dual ship if active - use classic Galaga dual fighter style
    if (dualShip) {
        ctx.save();
        ctx.translate(-24, 0);
        ctx.scale(0.75, 0.75);
        
        // Mini thruster - matches main thruster style
        const miniFlameColor = ctx.createLinearGradient(0, 8, 0, 18);
        miniFlameColor.addColorStop(0, '#ff4');
        miniFlameColor.addColorStop(0.5, '#f84');
        miniFlameColor.addColorStop(1, '#f42');
        ctx.fillStyle = miniFlameColor;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 60);
        
        ctx.beginPath();
        ctx.moveTo(-4, 8);
        ctx.quadraticCurveTo(0, 16 + Math.sin(Date.now() / 90) * 3, 4, 8);
        ctx.closePath();
        ctx.fill();
        
        // Mini ship body with authentic Galaga fighter shape
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        
        // White center section
        ctx.fillStyle = '#0f8'; // Different color to distinguish from main ship
        ctx.beginPath();
        ctx.moveTo(0, -16);   // Top point
        ctx.lineTo(-5, -10);  // Upper left corner
        ctx.lineTo(-8, 8);    // Lower left
        ctx.lineTo(8, 8);     // Lower right
        ctx.lineTo(5, -10);   // Upper right corner
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
        
        // Yellow connector beam between ships
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(Date.now() / 100);
        ctx.strokeStyle = '#ff0';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(16, 2);
        ctx.lineTo(32/0.75, 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    ctx.restore();
}

// Draw boss Galaga - enhanced with authentic style and more details
function drawBossGalaga(boss) {
    if (!boss) return;
    
    // Precompute animations outside the drawing code
    const rotationAmount = Math.sin(Date.now() / 1000) * 0.05;
    const auraSize = Math.sin(Date.now() / 200) * 5 + 15;
    const eyeGlowAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(rotationAmount);
    
    // Create patterns and gradients for the boss
    const bodyGradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    bodyGradient.addColorStop(0, '#f0f');
    bodyGradient.addColorStop(0.6, '#b0b');
    bodyGradient.addColorStop(1, '#808');
    
    // Draw glowing aura
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = auraSize;
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
    ctx.globalAlpha = eyeGlowAlpha;
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
        const cursorX = canvas.width / 2 - ctx.measureText(initialsDisplay).width / 2 + textWidth + (currentInitialIndex > 0 ? ctx.measureText(" ").width * currentInitialIndex : 0) ;
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

// Add event listeners for keyboard input
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    
    // Handle splash screen transition (keyboard only)
    if (!isTouchDevice && state === GAME_STATE.SPLASH && event.code === 'Space') {
        state = GAME_STATE.PLAYING;
        // Initialize game elements when transitioning to playing state
        console.clear();
        console.log("Game starting - initializing game elements...");
        resetGame();
    } else if (state === GAME_STATE.ENTER_HIGH_SCORE) {
        const key = event.key.toUpperCase();
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
            if (currentInitialIndex < playerInitials.length) {
                playerInitials[currentInitialIndex] = key;
                currentInitialIndex++;
            }
        } else if (event.code === 'Backspace') {
            if (currentInitialIndex > 0) {
                currentInitialIndex--;
                playerInitials[currentInitialIndex] = "_";
            }
        } else if (event.code === 'Enter') {
            // Check if all initials are filled or at least one is not "_"
            const enteredName = playerInitials.filter(char => char !== "_").join("");
            if (enteredName.length > 0) {
                saveHighScore(playerInitials.join(""), score);
                player.highScoreSubmitted = true;
                state = GAME_STATE.GAME_OVER; // Go back to game over to show updated scores
                fetchHighScores(); // Fetch scores immediately to update display
            }
        }
    } else if (event.code === 'KeyP') { // Pause and Resume with 'P' key
        if (state === GAME_STATE.PLAYING) {
            handlePause();
        } else if (state === GAME_STATE.PAUSED) {
            handleResume();
        }
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Function to reset the game state
function resetGame() {
    // Reset player position
    player.x = PLAYER_START_X;
    
    // Adjust player Y position if touch controls are active
    const buttonAreaHeight = isTouchDevice ? (CANVAS_HEIGHT * 0.12 + CANVAS_HEIGHT * 0.05) : 0;
    player.y = CANVAS_HEIGHT - (isTouchDevice ? (buttonAreaHeight + player.h + 15) : 60);

    player.alive = true;
    player.shield = false;
    player.power = 'normal';
    player.highScoreSubmitted = false;
    
    playerInitials = ["_", "_", "_", "_", "_"];
    currentInitialIndex = 0;
    autoShootActive = false;

    // Clear arrays - properly deactivate pooled objects
    bullets.length = 0;
    enemyBullets.length = 0;
    particles.length = 0;
    
    // Deactivate all pooled objects
    for (let i = 0; i < POOL.bullets.length; i++) {
        POOL.bullets[i].active = false;
    }
    for (let i = 0; i < POOL.enemyBullets.length; i++) {
        POOL.enemyBullets[i].active = false;
    }
    for (let i = 0; i < POOL.particles.length; i++) {
        POOL.particles[i].active = false;
    }
    
    // Clear other arrays
    enemies.length = 0;
    powerups.length = 0;
    
    // Reset game variables
    score = 0;
    lives = 3;
    level = 1;
    levelTransition = 0;
    
    // Reset other game elements
    formationSpots = [];
    attackQueue = [];
    bossGalaga = null;
    capturedShip = false;
    dualShip = false;
    screenShake = 0;
    
    // Setup formation spots for enemies
    setupFormation();
    
    // Spawn initial wave of enemies
    spawnEnemies();

    // Fetch high scores
    fetchHighScores(() => {
        console.log("High scores fetched on reset.");
    });
}

// Function to set up enemy formation positions
function setupFormation() {
    formationSpots = [];
    const rows = 5;
    const cols = 8;
    const startX = 80;
    const startY = 80;
    const spacingX = 40;
    const spacingY = 40;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            formationSpots.push({
                x: startX + col * spacingX,
                y: startY + row * spacingY,
                taken: false
            });
        }
    }
}

// Function to find an empty spot in the formation
function getEmptyFormationSpot() {
    const emptySpots = formationSpots.filter(spot => !spot.taken);
    if (emptySpots.length > 0) {
        return emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }
    return null;
}

// Optimized enemy bullet firing with object pooling
function fireEnemyBullet(enemy) {
    // Don't fire if already too many active bullets
    if (enemyBullets.length >= 15) return;
    
    // Different bullet properties based on enemy type
    let bulletSpeed = 150;
    let bulletColor = '#fff';
    let bulletType = 'straight';
    
    // Use switch for faster type comparison
    switch(enemy.type) {
        case ENEMY_TYPE.BASIC:
            bulletSpeed = 150;
            bulletColor = '#ff0';
            break;
        case ENEMY_TYPE.FAST:
            bulletSpeed = 200;
            bulletColor = '#0ff';
            bulletType = 'fast';
            break;
        case ENEMY_TYPE.ZIGZAG:
            bulletSpeed = 120;
            bulletColor = '#f0f';
            bulletType = 'zigzag';
            break;
        case ENEMY_TYPE.TANK:
            bulletSpeed = 150;
            bulletColor = '#f00';
            bulletType = 'split';
            break;
        default:
            bulletSpeed = 150;
            bulletColor = '#fff';
    }
    
    // Create the bullet from pool
    const createBullet = (angleOffset = 0) => {
        const bullet = getPoolObject('enemyBullets');
        if (!bullet) return; // No bullet available
        
        // Set bullet properties
        bullet.x = enemy.x;
        bullet.y = enemy.y + 20;
        bullet.w = 4;
        bullet.h = 12;
        bullet.speed = bulletSpeed + (level * 10);
        bullet.damage = 1;
        bullet.type = bulletType;
        bullet.from = 'enemy';
        bullet.color = bulletColor;
        bullet.age = 0;
        bullet.angle = Math.atan2(player.y - enemy.y, player.x - enemy.y) + angleOffset;
        bullet.wobble = Math.random() * Math.PI * 2;
        bullet.active = true;
        
        enemyBullets.push(bullet);
    };
    
    // For split bullet type, create multiple bullets in a spread pattern
    if (bulletType === 'split' && Math.random() < 0.3) {
        createBullet(-0.3);
        createBullet(0);
        createBullet(0.3);
    } else {
        createBullet();
    }
}

// Function to update all bullets
function updateBullets() {
    // Update player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Move bullet
        bullet.y -= bullet.speed * dt;
        
        // Check if bullet is offscreen
        if (bullet.y < -20) {
            bullet.active = false; // Mark as inactive in pool
            bullets.splice(i, 1); // Remove from active list
            continue;
        }
        
        // Check for collision with enemies - using optimized collision checks
        let hitEnemy = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            // Fast AABB collision check
            if (bullet.x < enemy.x + enemy.w &&
                bullet.x + bullet.w > enemy.x &&
                bullet.y < enemy.y + enemy.h &&
                bullet.y + bullet.h > enemy.y) {
                
                // Create explosion effect using object pool
                createExplosion(enemy.x, enemy.y, enemy.color);
                
                // Add score
                score += 100;
                
                // Random chance for powerup
                if (Math.random() < 0.1) {
                    const powerupTypes = ['double', 'shield', 'speed'];
                    powerups.push({
                        x: enemy.x,
                        y: enemy.y,
                        w: 20,
                        h: 16,
                        speed: 100,
                        type: powerupTypes[Math.floor(Math.random() * powerupTypes.length)]
                    });
                }
                
                // Mark bullet as inactive and remove from active list
                bullet.active = false;
                bullets.splice(i, 1);
                hitEnemy = true;
                
                // If enemy was in formation, free up the spot
                if (enemy.targetX && enemy.targetY) {
                    // Find and free the formation spot
                    for (let s = 0; s < formationSpots.length; s++) {
                        const spot = formationSpots[s];
                        if (spot.x === enemy.targetX && spot.y === enemy.targetY) {
                            spot.taken = false;
                            break;
                        }
                    }
                }
                
                // Remove enemy
                enemies.splice(j, 1);
                break;
            }
        }
        
        if (hitEnemy) continue;
    }
    
    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        // Increment bullet age
        bullet.age++;
        
        // Move bullet based on its type - switch for better performance
        switch(bullet.type) {
            case 'straight':
                bullet.y += bullet.speed * dt;
                break;
            
            case 'fast':
                bullet.y += bullet.speed * dt;
                // Slight homing effect
                if (bullet.age % 10 === 0 && player.alive) {
                    const angle = Math.atan2(player.y - bullet.y, player.x - bullet.x);
                    const targetX = bullet.x + Math.cos(angle) * bullet.speed * dt;
                    bullet.x = bullet.x * 0.9 + targetX * 0.1; 
                }
                break;
            
            case 'zigzag':
                bullet.y += bullet.speed * dt;
                bullet.x += Math.sin(bullet.age / 5 + bullet.wobble) * 100 * dt;
                break;
            
            case 'split':
                bullet.x += Math.cos(bullet.angle) * bullet.speed * dt;
                bullet.y += Math.sin(bullet.angle) * bullet.speed * dt;
                break;
                
            default:
                bullet.y += bullet.speed * dt;
        }
        
        // Check if bullet is offscreen using optimized boundary check
        if (bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20 || 
            bullet.y < -20 || bullet.y > CANVAS_HEIGHT + 20) {
            bullet.active = false; // Mark as inactive in pool
            enemyBullets.splice(i, 1); // Remove from active list
            continue;
        }
        
        // Check for collision with player - only if player is vulnerable
        if (player.alive && !player.shield) {
            // Fast AABB collision check
            if (bullet.x < player.x + player.w &&
                bullet.x + bullet.w > player.x &&
                bullet.y < player.y + player.h &&
                bullet.y + bullet.h > player.y) {
                
                // Create explosion effect
                createExplosion(player.x, player.y, '#f00');
                
                // Mark bullet as inactive and remove
                bullet.active = false;
                enemyBullets.splice(i, 1);
                
                // Reduce lives
                lives--;
                
                // Add screen shake for impact
                screenShake = 10;
                
                if (lives <= 0) {
                    state = GAME_STATE.GAME_OVER;
                } else {
                    // Player hit but not dead
                    player.alive = false;
                    
                    // Respawn player after delay
                    setTimeout(() => {
                        player.alive = true;
                        player.x = PLAYER_START_X;
                        // Adjust player Y position
                        const buttonAreaHeight = isTouchDevice ? (CANVAS_HEIGHT * 0.12 + CANVAS_HEIGHT * 0.05) : 0;
                        player.y = CANVAS_HEIGHT - (isTouchDevice ? (buttonAreaHeight + player.h + 15) : 60);
                        player.shield = true; // Brief invulnerability
                        
                        // Disable shield after a short time
                        setTimeout(() => player.shield = false, 2000);
                    }, 1000);
                }
            }
        }
    }
}

// Function to update powerups
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Move powerup down
        powerup.y += powerup.speed * dt; // Use dt
        
        // Check if powerup is offscreen
        if (powerup.y > CANVAS_HEIGHT + 20) {
            powerups.splice(i, 1);
            continue;
        }
        
        // Check for collision with player
        if (player.alive && checkCollision(powerup, player)) {
            // Apply powerup effect
            if (powerup.type === 'double') {
                player.power = 'double';
                player.powerTimer = 8.3; // Seconds
            } else if (powerup.type === 'shield') {
                player.shield = true;
                player.powerTimer = 10; // Seconds
            } else if (powerup.type === 'speed') {
                player.power = 'speed';
                player.speed = 400; // Temporary speed boost (pixels per second)
                player.powerTimer = 7.5; // Seconds
            }
            
            // Remove powerup
            powerups.splice(i, 1);
        }
    }
    
    // Update power timer
    if (player.powerTimer > 0) {
        player.powerTimer -= dt; // Use dt
        
        if (player.powerTimer <= 0) {
            // Reset power
            player.power = 'normal';
            player.speed = 250; // Reset to default pixels per second
            player.shield = false;
        }
    }
}

// Simple collision detection function
function checkCollision(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

// Enhanced function to check if an object is off-screen
function isOffScreen(obj) {
    return (
        obj.x + obj.w < 0 ||
        obj.x > CANVAS_WIDTH ||
        obj.y + obj.h < 0 ||
        obj.y > CANVAS_HEIGHT + 20
    );
}

// Optimized explosion creation using object pool
function createExplosion(x, y, color) {
    // Add screen shake effect for explosions
    screenShake = 5;
    
    // Create particles from pool
    const numParticles = 15; // Reduce for performance if needed
    for (let i = 0; i < numParticles; i++) {
        const particle = getPoolObject('particles');
        if (!particle) continue; // Skip if no particles available

        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 150;
        const initialLife = Math.random() * 0.4 + 0.2;

        // Set particle properties
        particle.x = x;
        particle.y = y;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.size = Math.random() * 3 + 1;
        particle.color = color;
        particle.life = initialLife;
        particle.initialLife = initialLife;
        particle.active = true;
        
        particles.push(particle);
    }
}

// Optimized particle update
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Move particle
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        // Reduce life
        p.life -= dt;
        
        // Remove if dead
        if (p.life <= 0) {
            p.active = false; // Mark as inactive in pool
            particles.splice(i, 1); // Remove from active list
            continue;
        }
        
        // Draw particle
        ctx.globalAlpha = p.life / p.initialLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1; // Reset alpha
}

// Main update function for gameplay
function updateGameplay() {
    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePowerups();
    updateParticles();
    
    // Update screen shake - use exponential decay for smoother effect
    if (screenShake > 0) {
        screenShake *= Math.pow(0.85, 60 * dt); // 60 * dt provides consistent decay rate
        if (screenShake < 0.5) screenShake = 0;
    }
}

// Draw game elements - optimized for fewer context state changes
function drawGameScreenElements() {
    // Apply screen shake if needed
    let shakeApplied = false;
    if (state === GAME_STATE.PLAYING && screenShake > 0) {
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
        shakeApplied = true;
    }

    // Batch similar drawing operations together
    // First draw bullets
    for (const bullet of bullets) {
        drawBullet(bullet);
    }
    for (const bullet of enemyBullets) {
        drawBullet(bullet);
    }
    
    // Then draw enemies
    for (const enemy of enemies) {
        drawEnemy(enemy);
    }

    // Then draw powerups
    for (const powerup of powerups) {
        drawPowerup(powerup);
    }

    // Draw boss if present
    if (bossGalaga) {
        drawBossGalaga(bossGalaga);
    }

    // Draw player last (on top)
    drawPlayer();

    // Draw level transition message if applicable
    if (state === GAME_STATE.PLAYING && levelTransition > 0 && enemies.length === 0) {
        ctx.font = 'bold 30px monospace';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${level} COMPLETE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        ctx.font = '20px monospace';
        ctx.fillStyle = '#0ff';
        ctx.fillText(`PREPARING LEVEL ${level + 1}...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    if (shakeApplied) {
        ctx.restore();
    }
}

// Optimized game loop with better timing
function gameLoop() {
    const currentTime = performance.now();
    // Delta time in seconds, capped to prevent spiral of death
    dt = Math.min((currentTime - lastTime) / 1000, 1/15);
    lastTime = currentTime;

    // Clear screen once per frame
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Handle current game state
    switch (state) {
        case GAME_STATE.SPLASH:
            drawArcadeSplash();
            break;
            
        case GAME_STATE.PLAYING:
            updateGameplay();
            drawGameScreenElements();
            drawHUD();
            if (isTouchDevice) {
                drawTouchControls();
            }
            break;
            
        case GAME_STATE.PAUSED:
            drawGameScreenElements();
            drawHUD();
            if (isTouchDevice) {
                drawTouchControls();
            }
            drawPauseScreen();
            break;
            
        case GAME_STATE.GAME_OVER:
            drawGameOver();
            break;
            
        case GAME_STATE.ENTER_HIGH_SCORE:
            drawEnterHighScoreScreen();
            break;
    }

    requestAnimationFrame(gameLoop);
}

// Initialize the game
function initGame() {
    initObjectPools();
    initTouchControls();
    fetchHighScores(() => {
        console.log("Game initialized and ready to start.");
        gameLoop();
    });
}

// Start the game
initGame();

// Enemy spawning, player movement, and other existing functions
// ...existing code...