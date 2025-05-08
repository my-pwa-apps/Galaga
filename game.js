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


function drawArcadeSplash() {
    console.log("drawArcadeSplash called"); // LOGGING
    // Cached color calculation outside the rendering loop
    const colorIndex = Math.floor(Date.now() / 200) % arcadeColors.length;
    const titleColorIndex = Math.floor(Date.now() / 400) % arcadeColors.length;
    const textColorIndex = Math.floor(Date.now() / 100) % arcadeColors.length;
    
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    console.log("Background drawn in drawArcadeSplash"); // LOGGING
    
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
    console.log("Text drawn in drawArcadeSplash"); // LOGGING
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
    let numEnemies = 16 + Math.min(32, level * 2); // Increases with level, caps at 48
    const enemyTypes = [
        ENEMY_TYPE.BASIC,
        ENEMY_TYPE.FAST,
        ENEMY_TYPE.TANK,
        ENEMY_TYPE.ZIGZAG,
        ENEMY_TYPE.SNIPER
    ];
    for (let i = 0; i < numEnemies; i++) {
        const spot = getEmptyFormationSpot();
        if (!spot) break;
        spot.taken = true;
        const enemyTypeIndex = Math.min(
            Math.floor(Math.random() * (2 + Math.floor(level / 2))),
            enemyTypes.length - 1
        );
        const enemyType = enemyTypes[enemyTypeIndex];
        let enemyColor = '#0f0';
        switch (enemyType) {
            case ENEMY_TYPE.FAST: enemyColor = '#0ff'; break;
            case ENEMY_TYPE.TANK: enemyColor = '#f00'; break;
            case ENEMY_TYPE.ZIGZAG: enemyColor = '#f0f'; break;
            case ENEMY_TYPE.SNIPER: enemyColor = '#ff0'; break;
        }
        let enemyW = 24, enemyH = 24;
        if (enemyType === ENEMY_TYPE.TANK) { enemyW = 28; enemyH = 28; }
        if (enemyType === ENEMY_TYPE.FAST) { enemyW = 22; enemyH = 22; }
        const startSide = Math.random() > 0.5 ? -50 : CANVAS_WIDTH + 50;
        const startY = -50;
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
            index: i
        });
    }
    // Add boss every 5 levels
    if (level % 5 === 0) {
        bossGalaga = {
            x: CANVAS_WIDTH / 2,
            y: 50,
            w: 60,
            h: 50,
            color: '#f0f',
            health: 10,
            timer: 2,
            state: 'idle',
            hasCaptured: false
        };
    }
}

// Function to update enemies
function updateEnemies() {
    // Check if level is completed
    if (enemies.length === 0 && !bossGalaga) { // Also check for boss
        if (levelTransition <= 0) {
            levelTransition = 3; // Show message for 3 seconds
        } else {
            levelTransition -= dt;
            if (levelTransition <= 0) {
                level++;
                spawnEnemies(); // Spawn next wave
            }
        }
        return;
    }
    
    // Update enemy positions and behaviors based on their state
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Skip if marked for removal (e.g. by collision)
        if (enemy.markedForRemoval) {
            // enemies.splice(i, 1); // Consider if splicing here is safe or if it should be done in a separate pass
            continue;
        }
        
        // Update based on state
        if (enemy.state === ENEMY_STATE.ENTRANCE) {
            // Move along entrance path
            enemy.pathTime += dt;
            const t = Math.min(1, enemy.pathTime / 3); // Complete path in 3 seconds
            
            // Move along entrance curve (quadratic Bezier)
            const curveX = (1-t) * (1-t) * enemy.startX + 2 * (1-t) * t * enemy.controlX + t * t * enemy.targetX;
            const curveY = (1-t) * (1-t) * enemy.startY + 2 * (1-t) * t * enemy.controlY + t * t * enemy.targetY;
            
            enemy.x = curveX;
            enemy.y = curveY;
            
            // Check if arrived at formation position
            if (t >= 1) {
                enemy.state = ENEMY_STATE.FORMATION;
            }
        } else if (enemy.state === ENEMY_STATE.FORMATION) {
            // Hover in formation
            const hoverSpeed = 0.5 + (level * 0.1); // Increase with level
            const hoverX = Math.sin(Date.now() / 1000 + enemy.index * 0.5) * 10; // Vary hover per enemy
            const hoverY = Math.cos(Date.now() / 1500 + enemy.index * 0.5) * 5;
            
            // Move toward target with slight hover (lerp for smooth movement)
            enemy.x = enemy.x * 0.95 + (enemy.targetX + hoverX) * 0.05;
            enemy.y = enemy.y * 0.95 + (enemy.targetY + hoverY) * 0.05;
            
            // Random chance to enter attack state
            const attackChance = 0.001 + (level * 0.0005); // Increases with level
            if (Math.random() < attackChance) {
                // Add to attack queue - only attacks if not too many are already attacking
                if (attackQueue.filter(e => e.state === ENEMY_STATE.ATTACK).length < (2 + Math.floor(level/3))) { // Max attackers increase with level
                    enemy.state = ENEMY_STATE.ATTACK;
                    // Define attack path properties (can be more complex)
                    enemy.attackTargetX = player.alive ? player.x : CANVAS_WIDTH / 2;
                    enemy.attackTargetY = CANVAS_HEIGHT + enemy.h; // Target below screen
                    attackQueue.push(enemy);
                }
            }
            
            // Random chance to fire
            const fireChance = 0.002 + (level * 0.0005); // Increases with level
            if (Math.random() < fireChance) {
                fireEnemyBullet(enemy);
            }
        } else if (enemy.state === ENEMY_STATE.ATTACK) {
            // Dive attack toward player or a designated path
            const attackSpeed = (enemy.type === ENEMY_TYPE.FAST ? 300 : 200) + (level * 15); // Faster for FAST type
            
            // Calculate direction to attack target
            const dx = enemy.attackTargetX - enemy.x;
            const dy = enemy.attackTargetY - enemy.y; // Target is usually below player or off-screen
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) { // Move if not at target
                const vx = dx / dist * attackSpeed;
                const vy = dy / dist * attackSpeed;
                enemy.x += vx * dt;
                enemy.y += vy * dt;
            } else { // Reached attack path end
                 enemy.y = CANVAS_HEIGHT + enemy.h * 2; // Ensure it's off-screen
            }
            
            // Fire at player occasionally during dive
            const diveFireChance = 0.015 + (level * 0.003);
            if (Math.random() < diveFireChance && enemy.y < player.y) { // Only fire if above player
                fireEnemyBullet(enemy);
            }
            
            // Check if enemy is offscreen - return to formation or remove
            if (isOffScreen(enemy)) {
                // Remove from attack queue
                const qIndex = attackQueue.indexOf(enemy);
                if (qIndex > -1) attackQueue.splice(qIndex, 1);

                // If enemy has a formation spot, try to return
                const spot = formationSpots.find(s => s.x === enemy.targetX && s.y === enemy.targetY);
                if (spot && !spot.taken) {
                    enemy.state = ENEMY_STATE.ENTRANCE; // Re-enter
                    enemy.startX = enemy.x < CANVAS_WIDTH / 2 ? -enemy.w : CANVAS_WIDTH + enemy.w; // Start from side
                    enemy.startY = Math.random() * CANVAS_HEIGHT / 2; // Random Y entry
                    enemy.pathTime = 0;
                    enemy.controlX = CANVAS_WIDTH / 2;
                    enemy.controlY = enemy.startY - 100;
                    spot.taken = true; // Re-claim spot
                } else {
                    // If no formation spot or spot is taken, remove enemy
                    enemies.splice(i, 1);
                }
            }
        }
    }
    
    // Update boss Galaga if present
    if (bossGalaga) {
        // Basic boss movement (e.g., side to side)
        bossGalaga.x += Math.sin(Date.now() / 2000) * 50 * dt;
        if (bossGalaga.x < bossGalaga.w / 2) bossGalaga.x = bossGalaga.w / 2;
        if (bossGalaga.x > CANVAS_WIDTH - bossGalaga.w / 2) bossGalaga.x = CANVAS_WIDTH - bossGalaga.w / 2;

        bossGalaga.timer -= dt;
        if (bossGalaga.timer <= 0) {
            fireEnemyBullet(bossGalaga);
            bossGalaga.timer = 1.5 - Math.min(1, level * 0.1); // Fires faster at higher levels
            
            // Boss capture attempt logic (simplified)
            if (!bossGalaga.hasCaptured && !capturedShip && Math.random() < 0.2) { // 20% chance to try capture
                // Placeholder for tractor beam animation start
                console.log("Boss attempting capture!");
                // Actual capture logic would involve player interaction/timing
                // For now, let's simulate a chance of capture if player is near
                if (player.alive && Math.abs(player.x - bossGalaga.x) < 100 && player.y > bossGalaga.y) {
                    // bossGalaga.hasCaptured = true;
                    // capturedShip = true;
                    // lives--; // Player loses a life (or ship is captured)
                    // console.log("Player ship captured by Boss!");
                }
            }
        }
    }
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

// Update bullets
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b.active) { // Remove inactive bullets from active list
            bullets.splice(i,1);
            continue;
        }
        b.y -= b.speed * dt;
        if (b.y < 0) {
            b.active = false; // Deactivate when off-screen
            bullets.splice(i, 1);
        }
    }
}

// Update enemy bullets
function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
         if (!eb.active) { // Remove inactive bullets from active list
            enemyBullets.splice(i,1);
            continue;
        }

        eb.age += dt;

        // Movement patterns
        switch (eb.type) {
            case 'zigzag':
                eb.x += Math.sin(eb.age * 10 + eb.wobble) * 100 * dt; // eb.wobble for variation
                eb.y += eb.speed * dt;
                break;
            case 'homing': // Simple homing
                if (player.alive) {
                    const dx = player.x - eb.x;
                    const dy = player.y - eb.y;
                    const angle = Math.atan2(dy, dx);
                    eb.x += Math.cos(angle) * eb.speed * dt;
                    eb.y += Math.sin(angle) * eb.speed * dt;
                } else {
                    eb.y += eb.speed * dt; // Fall straight if player is dead
                }
                break;
            case 'split':
                eb.y += eb.speed * dt;
                // Split condition (e.g., after some time or at certain y)
                if (eb.age > 0.5 && !eb.hasSplit) {
                    eb.hasSplit = true;
                    eb.active = false; // Original bullet deactivates
                    for (let j = -1; j <= 1; j += 2) { // Create two new bullets
                        const splitBullet = getPoolObject('enemyBullets');
                        if(splitBullet){
                            splitBullet.x = eb.x;
                            splitBullet.y = eb.y;
                            splitBullet.speed = eb.speed * 1.2;
                            splitBullet.type = 'fast'; // Or another type
                            splitBullet.color = '#f80'; // Orange
                            splitBullet.angle = Math.atan2(player.y - eb.y, player.x - eb.x) + j * 0.3; // Spread angle
                            splitBullet.from = 'enemy';
                            splitBullet.active = true;
                            enemyBullets.push(splitBullet);
                        }
                    }
                }
                break;
            case 'fast':
                 eb.x += Math.cos(eb.angle) * eb.speed * dt;
                 eb.y += Math.sin(eb.angle) * eb.speed * dt;
                break;
            default: // Straight
                eb.y += eb.speed * dt;
        }

        if (eb.y > CANVAS_HEIGHT || eb.x < -eb.w || eb.x > CANVAS_WIDTH + eb.w) {
            eb.active = false;
            enemyBullets.splice(i, 1);
        }
    }
}


// Update powerups
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += p.speed * dt;
        if (p.y > CANVAS_HEIGHT) {
            powerups.splice(i, 1);
        }
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p.active) {
             particles.splice(i,1); // Remove inactive from active list
             continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
            p.active = false;
            particles.splice(i, 1);
        }
    }
}

// Draw particle
function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.initialLife); // Fade out
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}


function checkCollisions() {
    // Player bullets vs enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b.active) continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.markedForRemoval) continue;

            if (b.x < e.x + e.w && b.x + b.w > e.x &&
                b.y < e.y + e.h && b.y + b.h > e.y) {
                b.active = false; // Deactivate bullet
                handleEnemyHit(e, j);
                break; 
            }
        }
        // Player bullets vs boss Galaga
        if (bossGalaga && b.active &&
            b.x < bossGalaga.x + bossGalaga.w/2 && b.x + b.w > bossGalaga.x - bossGalaga.w/2 &&
            b.y < bossGalaga.y + bossGalaga.h/2 && b.y + b.h > bossGalaga.y - bossGalaga.h/2) {
            b.active = false;
            bossGalaga.health--;
            createExplosion(b.x, b.y, bossGalaga.color, 10, 1.5);
            if (bossGalaga.health <= 0) {
                score += 1500; // Boss score
                createExplosion(bossGalaga.x, bossGalaga.y, bossGalaga.color, 50, 3);
                if (bossGalaga.hasCaptured) {
                    dualShip = true; // Rescue captured ship
                    capturedShip = false;
                }
                bossGalaga = null;
            }
        }
    }

    // Enemy bullets vs player
    if (player.alive && !player.shield) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const eb = enemyBullets[i];
            if (!eb.active) continue;

            if (eb.x < player.x + player.w/2 && eb.x + eb.w > player.x - player.w/2 &&
                eb.y < player.y + player.h/2 && eb.y + eb.h > player.y - player.h/2) {
                eb.active = false;
                handlePlayerDeath();
                break; 
            }
        }
    }

    // Enemies vs player (collision)
    if (player.alive && !player.shield) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.markedForRemoval) continue;

            if (player.x - player.w/2 < e.x + e.w && player.x + player.w/2 > e.x &&
                player.y - player.h/2 < e.y + e.h && player.y + player.h/2 > e.y) {
                handleEnemyHit(e, i); // Enemy also dies
                handlePlayerDeath();
                break;
            }
        }
        // Boss Galaga vs player
        if (bossGalaga && player.alive && !player.shield &&
            player.x - player.w/2 < bossGalaga.x + bossGalaga.w/2 && player.x + player.w/2 > bossGalaga.x - bossGalaga.w/2 &&
            player.y - player.h/2 < bossGalaga.y + bossGalaga.h/2 && player.y + player.h/2 > bossGalaga.y - bossGalaga.h/2) {
            handlePlayerDeath();
        }
    }
    
    // Player vs powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (player.x - player.w/2 < p.x + p.w && player.x + player.w/2 > p.x &&
            player.y - player.h/2 < p.y + p.h && player.y + player.h/2 > p.y) {
            
            player.power = p.type;
            player.powerTimer = 10; // 10 seconds
            if (p.type === 'shield') player.shield = true;
            if (p.type === 'speed') player.speed = 350; // Increase speed
            
            powerups.splice(i, 1);
            score += 50; // Score for powerup
        }
    }
}

// Handle enemy getting hit
function handleEnemyHit(enemy, index) {
    score += 100; // Base score
    if (enemy.type === ENEMY_TYPE.FAST) score += 50;
    if (enemy.type === ENEMY_TYPE.TANK) score += 100;
    if (enemy.state === ENEMY_STATE.ATTACK) score += 100; // Bonus for attacking enemy

    createExplosion(enemy.x, enemy.y, enemy.color);
    
    // Release formation spot
    const spot = formationSpots.find(s => s.x === enemy.targetX && s.y === enemy.targetY);
    if (spot) spot.taken = false;

    // Chance to drop powerup
    if (Math.random() < 0.1) { // 10% chance
        spawnPowerup(enemy.x, enemy.y);
    }
    
    // Mark for removal instead of immediate splice if iterating
    enemy.markedForRemoval = true; 
    enemies.splice(index, 1); // Or splice directly if safe
}

// Handle player death
function handlePlayerDeath() {
    if (!player.alive) return; // Already dead

    createExplosion(player.x, player.y, '#f00', 30, 2.5);
    player.alive = false;
    lives--;
    dualShip = false; // Lose dual ship on death
    capturedShip = false; // Lose captured ship status

    if (lives < 0) {
        state = GAME_STATE.GAME_OVER;
        player.highScoreSubmitted = false; // Ensure can submit new score
    } else {
        // Respawn delay or visual effect
        setTimeout(() => {
            player.x = PLAYER_START_X;
            player.y = PLAYER_START_Y;
            player.alive = true;
            player.shield = true; // Brief invincibility
            player.powerTimer = 2; // 2 seconds shield
        }, 2000); // 2 second respawn delay
    }
}

// Fire enemy bullet
function fireEnemyBullet(enemy) {
    const bullet = getPoolObject('enemyBullets');
    if (bullet) {
        bullet.x = enemy.x;
        bullet.y = enemy.y + enemy.h / 2;
        bullet.w = 4;
        bullet.h = 12;
        bullet.from = 'enemy';
        bullet.active = true;
        bullet.age = 0; // Reset age for patterns
        bullet.hasSplit = false; // Reset split flag

        // Determine bullet type and properties based on enemy type or state
        if (enemy === bossGalaga) {
            bullet.speed = 200;
            bullet.color = '#f0f';
            bullet.type = Math.random() < 0.3 ? 'split' : 'straight'; // Boss fires varied shots
        } else {
            switch (enemy.type) {
                case ENEMY_TYPE.SNIPER:
                    bullet.speed = 300;
                    bullet.color = '#ff0'; // Yellow
                    bullet.type = 'fast';
                    // Aim at player
                    const dx = player.x - enemy.x;
                    const dy = player.y - enemy.y;
                    bullet.angle = Math.atan2(dy, dx);
                    break;
                case ENEMY_TYPE.ZIGZAG:
                    bullet.speed = 120;
                    bullet.color = '#f0f'; // Magenta
                    bullet.type = 'zigzag';
                    bullet.wobble = Math.random() * Math.PI; // For variation in zigzag
                    break;
                case ENEMY_TYPE.FAST:
                    bullet.speed = 250;
                    bullet.color = '#0ff'; // Cyan
                    bullet.type = 'fast';
                    bullet.angle = Math.PI / 2; // Shoots straight down initially
                    break;
                default: // Basic, Tank
                    bullet.speed = 150;
                    bullet.color = '#fff'; // White
                    bullet.type = 'straight';
            }
        }
        enemyBullets.push(bullet);
    }
}

// Check if an entity is off-screen
function isOffScreen(entity) {
    return entity.y > CANVAS_HEIGHT + entity.h || 
           entity.y < -entity.h || 
           entity.x > CANVAS_WIDTH + entity.w || 
           entity.x < -entity.w;
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

// Get an empty spot in the formation
function getEmptyFormationSpot() {
    const availableSpots = formationSpots.filter(s => !s.taken);
    if (availableSpots.length > 0) {
        return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }
    return null; // No spot available
}


// Update game logic
function updateGameplay() {
    // console.log("updateGameplay called"); // LOGGING - Can be removed if too noisy
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
    // console.log("updateGameplay finished"); // LOGGING - Can be removed
}

// Draw game elements - optimized for fewer context state changes
function drawGameplay() {
    // Background can be more dynamic (e.g., starfield)
    // For now, it's cleared in gameLoop

    // Draw particles first (background elements)
    particles.forEach(p => {
        if (p.active) drawParticle(p);
    });

    powerups.forEach(drawPowerup);
    
    // Draw bullets - player and enemy
    bullets.forEach(b => {
        if (b.active) drawBullet(b);
    });
    enemyBullets.forEach(b => {
        if (b.active) drawBullet(b);
    });

    enemies.forEach(drawEnemy);
    
    if (bossGalaga) drawBossGalaga(bossGalaga);
    
    drawPlayer();
    drawHUD();

    // Level transition message
    if (levelTransition > 0) {
        ctx.font = 'bold 30px monospace';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}

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

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    // Handle pause toggle with 'P' key
    if (e.code === 'KeyP' && (state === GAME_STATE.PLAYING || state === GAME_STATE.PAUSED)) {
        if (state === GAME_STATE.PLAYING) {
            handlePause();
        } else {
            handleResume();
        }
    }

    if (state === GAME_STATE.ENTER_HIGH_SCORE) {
        e.preventDefault(); // Prevent default browser actions for keys like Backspace
        if (e.key.length === 1 && e.key.match(/[a-z0-9]/i) && currentInitialIndex < playerInitials.length) {
            playerInitials[currentInitialIndex] = e.key.toUpperCase();
            currentInitialIndex++;
        } else if (e.key === 'Backspace' && currentInitialIndex > 0) {
            currentInitialIndex--;
            playerInitials[currentInitialIndex] = "_";
        } else if (e.key === 'Enter' && currentInitialIndex > 0) { // Allow submit if at least one initial
            const finalInitials = playerInitials.join("").replace(/_/g, " ").trim(); // Clean up
            if (finalInitials.length > 0) {
                 saveHighScore(finalInitials, score);
                 player.highScoreSubmitted = true; // Mark as submitted
                 state = GAME_STATE.GAME_OVER; // Go back to game over to show scores
                 fetchHighScores(); // Re-fetch to show the new score immediately
            }
        }
    } else if (state === GAME_STATE.SPLASH && e.code === 'Space') {
        state = GAME_STATE.PLAYING;
        resetGame();
    } else if (state === GAME_STATE.GAME_OVER && e.code === 'Space') {
        state = GAME_STATE.SPLASH;
        fetchHighScores(); // Fetch scores when returning to splash
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});


// Initialize the game
function initGame() {
    console.log("initGame called"); // LOGGING
    initObjectPools();
    initTouchControls();
    lastTime = performance.now(); // Initialize lastTime here
    fetchHighScores(() => {
        console.log("Game initialized and ready to start. FetchHighScores callback executed."); // LOGGING
        gameLoop(); // Start the game loop
    });
}

// Start the game
initGame();