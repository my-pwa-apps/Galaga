// Galaga-inspired Arcade Game
// All assets generated from code

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_STATE = {
    SPLASH: 'splash',
    PLAYING: 'playing',
    GAME_OVER: 'gameover',
};

let state = GAME_STATE.SPLASH;
let splashTimer = 0;
let keys = {};

// Arcade splash colors
const arcadeColors = ['#0ff', '#f0f', '#ff0', '#fff', '#0f0', '#f00', '#00f'];

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    w: 32,
    h: 24,
    speed: 5,
    cooldown: 0,
    alive: true,
    power: 'normal', // 'normal', 'double', 'shield', 'speed'
    powerTimer: 0,
    shield: false,
};

// Bullets

let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let score = 0;
let lives = 3;
let level = 1;
let levelTransition = 0;

// Galaga-style enemy states
const ENEMY_STATE = {
    ENTRANCE: 'entrance',
    FORMATION: 'formation',
    ATTACK: 'attack',
};
let formationSpots = [];
let attackQueue = [];

// Add particle array
let particles = [];

// Add boss Galaga and captured ship mechanics
let bossGalaga = null;
let capturedShip = false;
let dualShip = false;
let highScore = 0;
let challengeStage = false;
let screenShake = 0; // Initialize screen shake variable

function drawArcadeSplash() {
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Neon border
    ctx.strokeStyle = arcadeColors[Math.floor(Date.now()/200)%arcadeColors.length];
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, canvas.width-20, canvas.height-20);
    // Title
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = arcadeColors[Math.floor(Date.now()/400)%arcadeColors.length];
    ctx.textAlign = 'center';
    ctx.fillText('GALAGA', canvas.width/2, 120);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('ARCADE TRIBUTE', canvas.width/2, 160);
    // Insert coin
    ctx.font = '18px monospace';
    ctx.fillStyle = arcadeColors[Math.floor(Date.now()/100)%arcadeColors.length];
    ctx.fillText('PRESS SPACE TO START', canvas.width/2, canvas.height-100);
    ctx.restore();
}

// Enhanced Player ship drawing with authentic Galaga fighter style and thruster animation
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Draw thruster animation - more dynamic flame effect
    ctx.save();
    const flameColor = ctx.createLinearGradient(0, 8, 0, 20);
    flameColor.addColorStop(0, '#ff4');
    flameColor.addColorStop(0.5, '#f84');
    flameColor.addColorStop(1, '#f42');
    ctx.fillStyle = flameColor;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 50);
    
    // Main flame
    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.quadraticCurveTo(0, 20 + Math.sin(Date.now() / 80) * 5, 5, 8);
    ctx.closePath();
    ctx.fill();
    
    // Secondary flames
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 70);
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.quadraticCurveTo(-6, 16 + Math.sin(Date.now() / 90) * 3, -4, 8);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(4, 8);
    ctx.quadraticCurveTo(6, 16 + Math.sin(Date.now() / 90) * 3, 8, 8);
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
    ctx.save();
    ctx.translate(boss.x, boss.y);
    
    // Create patterns and gradients for the boss
    const bodyGradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
    bodyGradient.addColorStop(0, '#f0f');
    bodyGradient.addColorStop(0.6, '#b0b');
    bodyGradient.addColorStop(1, '#808');
    
    // Apply oscillating rotation for menacing effect
    ctx.rotate(Math.sin(Date.now() / 1000) * 0.05);
    
    // Draw glowing aura
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 15 + 5 * Math.sin(Date.now() / 200);
    ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Main body with detailed segments - authentic Galaga boss shape
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
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 300);
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
      // Captured ship (if present) with enhanced tractor beam and captured fighter
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

// Enhanced enemy drawing with authentic Galaga designs and animations
function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    
    // Apply subtle wobble/animation based on type
    if (e.state === ENEMY_STATE.FORMATION) {
        const wobbleAmount = (e.type === 'basic') ? 0.05 : 
                            (e.type === 'fast') ? 0.08 : 
                            (e.type === 'zigzag') ? 0.1 : 0.03;
        ctx.rotate(Math.sin(Date.now() / 500 + e.x/20) * wobbleAmount);
    }
    
    ctx.save();
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    
    // Draw different shapes for each type - using authentic Galaga enemy designs
    if (e.type === 'basic') {
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
        
    } else if (e.type === 'fast') {
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
        
    } else if (e.type === 'tank') {
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
        
    } else if (e.type === 'sniper') {
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
          } else if (e.type === 'zigzag') {
        // Galaga-style dragonfly/zigzag enemy
        ctx.restore();
        
        // Segmented body
        const bodySegments = 3;
        const segmentSize = 6;
        const wavePhase = Date.now() / 300;
        
        for (let i = 0; i < bodySegments; i++) {
            // Each segment moves with a delay for wave effect
            const offsetX = Math.sin(wavePhase - i * 0.5) * (i * 2);
            
            ctx.save();
            ctx.translate(offsetX, i * segmentSize);
            
            // Body segment
            ctx.fillStyle = i === 0 ? '#f00' : (i === 1 ? '#ff0' : '#0f0');
            ctx.beginPath();
            ctx.ellipse(0, 0, 8 - i, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            if (i === 0) { // Head segment
                // Eyes
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(-4, -1, 2, 0, Math.PI * 2);
                ctx.arc(4, -1, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Antennas
                ctx.strokeStyle = '#ff0';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-3, -3);
                ctx.lineTo(-8, -8);
                ctx.moveTo(3, -3);
                ctx.lineTo(8, -8);
                ctx.stroke();
            }
            
            // Wings for middle segment
            if (i === 1) {
                const wingBeat = Math.sin(Date.now() / 150) * 0.3;
                
                // Left wing
                ctx.save();
                ctx.rotate(-Math.PI/4 - wingBeat);
                ctx.fillStyle = '#0ff';
                ctx.beginPath();
                ctx.ellipse(-8, 0, 10, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                // Right wing
                ctx.save();
                ctx.rotate(Math.PI/4 + wingBeat);
                ctx.fillStyle = '#0ff';
                ctx.beginPath();
                ctx.ellipse(8, 0, 10, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            ctx.restore();
        }
        
        // Electric trail effect
        if (e.state === ENEMY_STATE.ATTACK && Math.random() < 0.6) {
            ctx.save();
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = Math.random() * 0.5;
            ctx.beginPath();
            
            // Zigzag pattern behind the enemy
            const startX = -Math.random() * 10;
            const startY = bodySegments * segmentSize + Math.random() * 10;
            ctx.moveTo(startX, startY);
            
            const points = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < points; i++) {
                const zigX = (Math.random() - 0.5) * 20;
                const zigY = startY + 5 + i * 5;
                ctx.lineTo(zigX, zigY);
            }
              ctx.stroke();
            ctx.restore();
        }
    } else {
        // Default enemy drawing for any unmatched enemy type
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

// Enhanced bullet drawing with authentic Galaga visuals and effects
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
        
        // Create authentic Galaga shot
        ctx.fillStyle = bulletGradient;
        
        // Classic bullet shape
        ctx.beginPath();
        ctx.rect(b.x - 1.5, b.y - 12, 3, 10);
        ctx.fill();
        
        // Bullet tip
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - 14);
        ctx.lineTo(b.x + 2, b.y - 10);
        ctx.lineTo(b.x - 2, b.y - 10);
        ctx.closePath();
        ctx.fill();
        
        // Add flash effect
        if (Math.random() < 0.3) {
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(b.x, b.y - 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

// Enhanced powerup drawing with animations and effects
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

// Function to draw the game HUD (score, lives, etc.)
function drawHUD() {
    ctx.save();
    
    // Draw score
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 30);
    
    // Draw high score
    ctx.textAlign = 'center';
    ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, 30);
    
    // Draw level
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL: ${level}`, canvas.width - 20, 30);
    
    // Draw lives
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES: ${lives}`, 20, canvas.height - 20);
    
    // Draw ship icons for lives
    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(90 + i * 25, canvas.height - 25);
        ctx.scale(0.5, 0.5);
        
        // Draw mini ships for lives
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
    
    ctx.restore();
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
    ctx.fillText('GAME OVER', canvas.width/2, 200);
    
    // Score display
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`FINAL SCORE: ${score}`, canvas.width/2, 260);
    
    if (score > highScore) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('NEW HIGH SCORE!', canvas.width/2, 300);
    } else {
        ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width/2, 300);
    }
    
    // Restart instructions
    ctx.font = '18px monospace';
    ctx.fillStyle = '#0ff';
    ctx.fillText('PRESS SPACE TO RESTART', canvas.width/2, canvas.height-100);
    
    ctx.restore();
    
    // Listen for space to restart
    if (keys['Space']) {
        state = GAME_STATE.SPLASH;
        if (score > highScore) highScore = score;
    }
}

// Add event listeners for keyboard input
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    
    // Handle splash screen transition
    if (state === GAME_STATE.SPLASH && event.code === 'Space') {
        state = GAME_STATE.PLAYING;
        // Initialize game elements when transitioning to playing state
        console.clear();
        console.log("Game starting - initializing game elements...");
        resetGame();
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Function to reset the game state
function resetGame() {
    // Reset player
    player.x = canvas.width / 2;
    player.y = canvas.height - 60;
    player.alive = true;
    player.shield = false;
    player.power = 'normal';
    
    // Clear arrays
    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    
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

// Function for enemies to fire bullets
function fireEnemyBullet(enemy) {
    // Don't fire if already too many bullets on screen (performance optimization)
    if (enemyBullets.length >= 15) return;
    
    // Different bullet properties based on enemy type
    let bulletSpeed = 5;
    let bulletColor = '#fff';
    let bulletType = 'straight'; // Default bullet type
    
    // Customize bullet based on enemy type
    switch(enemy.type) {
        case 'basic':
            bulletSpeed = 5;
            bulletColor = '#ff0'; // Yellow bullet
            break;
        case 'fast':
            bulletSpeed = 7;
            bulletColor = '#0ff'; // Cyan bullet
            bulletType = 'fast';
            break;
        case 'zigzag':
            bulletSpeed = 4;
            bulletColor = '#f0f'; // Purple bullet
            bulletType = 'zigzag';
            break;
        case 'tank':
            bulletSpeed = 4;
            bulletColor = '#f00'; // Red bullet
            bulletType = 'split';
            break;
        default:
            bulletSpeed = 5;
            bulletColor = '#fff';
    }
    
    // Create the bullet
    const bullet = {
        x: enemy.x,
        y: enemy.y + 20,
        w: 4,
        h: 12,
        speed: bulletSpeed + (level * 0.3), // Speed increases with level
        damage: 1,
        type: bulletType,
        from: 'enemy',
        color: bulletColor,
        age: 0, // Track bullet age for special patterns
        angle: Math.atan2(player.y - enemy.y, player.x - enemy.y), // Angle towards player
        wobble: Math.random() * Math.PI * 2 // Random starting phase for wobble movement
    };
    
    // For split bullet type, create multiple bullets in a spread pattern
    if (bulletType === 'split' && Math.random() < 0.3) {
        // Create a spread of 3 bullets
        for (let i = -1; i <= 1; i++) {
            const splitBullet = { ...bullet };
            splitBullet.angle += i * 0.3; // Add spread angle
            enemyBullets.push(splitBullet);
        }
    } else {
        // Just push the single bullet
        enemyBullets.push(bullet);
    }
}

// Function to update all bullets
function updateBullets() {
    // Update player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Move bullet
        bullet.y -= bullet.speed;
        
        // Check if bullet is offscreen
        if (bullet.y < -20) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check for collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (checkCollision(bullet, enemy)) {
                // Create explosion effect
                createExplosion(enemy.x, enemy.y, enemy.color);
                
                // Add score
                score += 100;
                
                // Random chance for powerup
                if (Math.random() < 0.1) {
                    const powerupTypes = ['double', 'shield', 'speed'];
                    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                    
                    powerups.push({
                        x: enemy.x,
                        y: enemy.y,
                        w: 20,
                        h: 16,
                        speed: 2,
                        type: randomType
                    });
                }
                
                // Remove bullet and enemy
                bullets.splice(i, 1);
                
                // If enemy was in formation, free up the spot
                if (enemy.targetX && enemy.targetY) {
                    for (const spot of formationSpots) {
                        if (spot.x === enemy.targetX && spot.y === enemy.targetY) {
                            spot.taken = false;
                            break;
                        }
                    }
                }
                
                enemies.splice(j, 1);
                break;
            }
        }
    }
      // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        // Increment bullet age
        bullet.age++;
        
        // Move bullet based on its type
        switch(bullet.type) {
            case 'straight':
                // Standard straight-line movement
                bullet.y += bullet.speed;
                break;
            
            case 'fast':
                // Faster bullet that slightly adjusts towards player
                bullet.y += bullet.speed;
                // Slight homing effect every 10 frames
                if (bullet.age % 10 === 0 && player.alive) {
                    const angle = Math.atan2(player.y - bullet.y, player.x - bullet.x);
                    const targetX = bullet.x + Math.cos(angle) * bullet.speed;
                    bullet.x = bullet.x * 0.9 + targetX * 0.1; // 10% adjustment towards player
                }
                break;
            
            case 'zigzag':
                // Zig-zag movement pattern
                bullet.y += bullet.speed;
                bullet.x += Math.sin(bullet.age / 5 + bullet.wobble) * 2;
                break;
            
            case 'split':
                // Movement based on angle
                bullet.x += Math.cos(bullet.angle) * bullet.speed * 0.5;
                bullet.y += Math.sin(bullet.angle) * bullet.speed * 0.5;
                break;
                
            default:
                // Default straight movement
                bullet.y += bullet.speed;
        }
        
        // Check if bullet is offscreen
        if (bullet.x < -20 || bullet.x > canvas.width + 20 || 
            bullet.y < -20 || bullet.y > canvas.height + 20) {
            enemyBullets.splice(i, 1);
            continue;
        }
        
        // Check for collision with player
        if (player.alive && !player.shield && checkCollision(bullet, player)) {
            // Create explosion effect
            createExplosion(player.x, player.y, '#f00');
            
            // Remove bullet
            enemyBullets.splice(i, 1);
            
            // Reduce lives
            lives--;
            
            // Add screen shake for impact
            screenShake = 10;
            
            if (lives <= 0) {
                // Game over
                state = GAME_STATE.GAME_OVER;
            } else {
                // Player hit but not dead
                player.alive = false;
                
                // Respawn player after delay
                setTimeout(() => {
                    player.alive = true;
                    player.x = canvas.width / 2;
                    player.y = canvas.height - 60;
                    player.shield = true; // Brief invulnerability
                    
                    // Disable shield after a short time
                    setTimeout(() => {
                        player.shield = false;
                    }, 2000);
                }, 1000);
            }
        }
    }
}

// Function to update powerups
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        // Move powerup down
        powerup.y += powerup.speed;
        
        // Check if powerup is offscreen
        if (powerup.y > canvas.height + 20) {
            powerups.splice(i, 1);
            continue;
        }
        
        // Check for collision with player
        if (player.alive && checkCollision(powerup, player)) {
            // Apply powerup effect
            if (powerup.type === 'double') {
                player.power = 'double';
                player.powerTimer = 500; // 500 frames ~ 8.3 seconds at 60fps
            } else if (powerup.type === 'shield') {
                player.shield = true;
                player.powerTimer = 600; // 600 frames = 10 seconds
            } else if (powerup.type === 'speed') {
                player.power = 'speed';
                player.speed = 8; // Temporary speed boost
                player.powerTimer = 450; // 450 frames = 7.5 seconds
            }
            
            // Remove powerup
            powerups.splice(i, 1);
        }
    }
    
    // Update power timer
    if (player.powerTimer > 0) {
        player.powerTimer--;
        
        if (player.powerTimer <= 0) {
            // Reset power
            player.power = 'normal';
            player.speed = 5;
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
        obj.x > canvas.width ||
        obj.y + obj.h < 0 ||
        obj.y > canvas.height + 50 // Allow a bit of buffer below the screen
    );
}

// Function to create explosion particles
function createExplosion(x, y, color) {
    // Add screen shake effect for explosions
    screenShake = 5;
    
    // Create particles
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: Math.random() * 4 + 2,
            color: color,
            life: Math.random() * 30 + 10
        });
    }
}

// Function to update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Move particle
        p.x += p.vx;
        p.y += p.vy;
        
        // Reduce life
        p.life--;
        
        // Remove if dead
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw particle
        ctx.globalAlpha = p.life / 40; // Fade out as life decreases
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1; // Reset alpha
}

// Function to update gameplay
// Main update function for gameplay
function updateGameplay() {
    // This function is called once per frame to update all game elements
    // Player movement and firing is handled in the game loop
}

// Update game loop to include gameplay logic
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === GAME_STATE.SPLASH) {
        drawArcadeSplash();
    } else if (state === GAME_STATE.PLAYING) {
        // Apply screen shake if active
        if (screenShake > 0) {
            ctx.save();
            ctx.translate(
                Math.random() * screenShake - screenShake / 2,
                Math.random() * screenShake - screenShake / 2
            );
            screenShake *= 0.9; // Reduce shake effect over time
            if (screenShake < 0.5) screenShake = 0;
        }

        // Update all gameplay elements
        updateGameplay();

        // Draw bullets (both player and enemy)
        for (const bullet of bullets) {
            drawBullet(bullet);
        }
        for (const bullet of enemyBullets) {
            drawBullet(bullet);
        }
        
        // Draw enemies explicitly
        for (const enemy of enemies) {
            drawEnemy(enemy);
        }

        // Draw powerups
        for (const powerup of powerups) {
            drawPowerup(powerup);
        }

        // Draw boss if present
        if (bossGalaga) {
            drawBossGalaga(bossGalaga);
        }

        // Draw player
        if (player.alive) {
            drawPlayer();
        }

        // Draw level transition message if applicable
        if (levelTransition > 0) {
            ctx.font = 'bold 30px monospace';
            ctx.fillStyle = '#ff0';
            ctx.textAlign = 'center';
            ctx.fillText(`LEVEL ${level} COMPLETE!`, canvas.width / 2, canvas.height / 2);
            ctx.font = '20px monospace';
            ctx.fillStyle = '#0ff';
            ctx.fillText(`NEXT LEVEL STARTING...`, canvas.width / 2, canvas.height / 2 + 40);
        }

        if (screenShake > 0) {
            ctx.restore();
        }

        // Game HUD (score, lives, etc.)
        drawHUD();
    } else if (state === GAME_STATE.GAME_OVER) {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Function to spawn enemies in Galaga style
function spawnEnemies() {
    // Always spawn a new wave when called
    console.log("Spawning new wave of enemies for level: " + level);
    
    // Clear any existing enemies first
    enemies = [];
    
    // Reset attack queue and ensure no leftover state
    attackQueue = [];
    levelTransition = 0;
    
    // Setup fresh formation for the new wave
    setupFormation();
    
    const totalEnemies = Math.min(5 + level * 2, formationSpots.length); // Limit to available formation spots

    // Create entrance paths in authentic Galaga style
    // Each path is a series of bezier curve control points
    const entrancePaths = [
        // Path 1: Swooping in from left
        [
            {x: -50, y: 100}, // Start off-screen left
            {x: 100, y: 50},  // Control point 1
            {x: 200, y: 200}, // Control point 2
            {x: 300, y: 100}  // End point (formation spot)
        ],
        // Path 2: Swooping in from right
        [
            {x: canvas.width + 50, y: 100}, // Start off-screen right
            {x: canvas.width - 100, y: 50},  // Control point 1
            {x: canvas.width - 200, y: 200}, // Control point 2
            {x: canvas.width - 300, y: 100}  // End point (formation spot)
        ],
        // Path 3: Loop from top
        [
            {x: canvas.width / 2, y: -50}, // Start off-screen top
            {x: canvas.width / 2 - 100, y: 100},  // Control point 1
            {x: canvas.width / 2 + 100, y: 200}, // Control point 2
            {x: canvas.width / 2, y: 120}  // End point (formation spot)
        ],
        // Path 4: Figure-8 from top-left
        [
            {x: -50, y: -50}, // Start off-screen top-left
            {x: 100, y: 150},  // Control point 1
            {x: 200, y: 50}, // Control point 2
            {x: 250, y: 150}  // End point (formation spot)
        ],
        // Path 5: Figure-8 from top-right
        [
            {x: canvas.width + 50, y: -50}, // Start off-screen top-right
            {x: canvas.width - 100, y: 150},  // Control point 1
            {x: canvas.width - 200, y: 50}, // Control point 2
            {x: canvas.width - 250, y: 150}  // End point (formation spot)
        ]
    ];

    for (let i = 0; i < totalEnemies; i++) {
        const spot = formationSpots[i];
        spot.taken = true;

        // Assign enemy types with more variety as level increases
        let enemyType = 'basic';
        if (level > 1) {
            const typeRoll = Math.random();
            if (level >= 3 && typeRoll > 0.7) {
                enemyType = 'fast';
            } else if (level >= 4 && typeRoll > 0.85) {
                enemyType = 'tank';
            } else if (level >= 2 && typeRoll > 0.4) {
                enemyType = 'zigzag';
            }
        }

        // Choose an entrance path for this enemy
        const pathIndex = i % entrancePaths.length;
        const entrancePath = entrancePaths[pathIndex];
        
        // Create the enemy with assigned formation spot and path
        const enemy = {
            x: entrancePath[0].x, // Start position from path
            y: entrancePath[0].y,
            w: 32,
            h: 32,
            speed: 2 + (level * 0.2), // Increase speed slightly with level
            type: enemyType,
            state: ENEMY_STATE.ENTRANCE,
            targetX: spot.x,
            targetY: spot.y,
            color: enemyType === 'basic' ? '#0f8' : 
                   enemyType === 'fast' ? '#f80' :
                   enemyType === 'tank' ? '#f44' : '#f0f',
            entranceDelay: i * 15, // Stagger the entrance
            id: i, // Unique ID for debugging
            path: entrancePath, // Store the path for this enemy
            pathProgress: 0, // Progress along the path (0.0 to 1.0)
            pathSpeed: 0.01 + (Math.random() * 0.005), // Variable speed for more natural movement
            attackCooldown: Math.floor(Math.random() * 120) + 60, // Initialize with cooldown
            attackChance: enemyType === 'basic' ? 0.002 : 
                          enemyType === 'fast' ? 0.005 :
                          enemyType === 'tank' ? 0.003 : 0.004, // Chance to break formation and attack
            attackPattern: Math.floor(Math.random() * 3) // Random attack pattern (0, 1, or 2)
        };

        enemies.push(enemy);
        console.log(`Spawned enemy #${i}: type=${enemyType} at (${enemy.x},${enemy.y}) → (${spot.x},${spot.y})`);
    }

    console.log(`Total enemies created: ${enemies.length}`);
}

function spawnEnemyWave(waveSize) {
    const startX = canvas.width / 2; // Start from the center horizontally
    const entryY = -50; // Start slightly above the canvas

    // Choose a primary enemy type for this wave
    const enemyTypes = ['basic', 'fast', 'zigzag'];
    const waveType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    for (let i = 0; i < waveSize; i++) {
        const enemy = {
            x: startX + (i % 5) * 40 - 80, // Spread enemies horizontally in rows
            y: entryY - Math.floor(i / 5) * 40, // Stack enemies vertically
            w: 32,
            h: 32,
            speed: 1.5 + level * 0.1, // Start slower and increase speed slightly with each level
            type: waveType,
            state: ENEMY_STATE.ENTRANCE,
            color: waveType === 'basic' ? '#0f8' : 
                   waveType === 'fast' ? '#f80' : '#f0f',
            entranceDelay: i * 10, // Delay each enemy slightly
            waveIndex: i
        };

        enemies.push(enemy);
    }
}

// Function to calculate a point along a cubic bezier curve
function bezierPoint(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return {
        x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
        y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y
    };
}

// Function to update all enemies
function updateEnemies() {
    let allEnemiesInFormation = true; // Track if all enemies are in formation
    let enemiesRemaining = enemies.length; // Track how many enemies are left
    
    // Pick a random enemy to potentially break formation and attack
    if (Math.random() < 0.01 + (level * 0.005)) {
        const formationEnemies = enemies.filter(e => e.state === ENEMY_STATE.FORMATION);
        if (formationEnemies.length > 0) {
            const randomEnemy = formationEnemies[Math.floor(Math.random() * formationEnemies.length)];
            // Only attack if cooldown is zero
            if (randomEnemy.attackCooldown <= 0) {
                console.log(`Enemy #${randomEnemy.id} breaking formation to attack`); // Corrected template literal
                randomEnemy.state = ENEMY_STATE.ATTACK;
                randomEnemy.attackStage = 0; // Start of attack sequence
                randomEnemy.attackTime = 0; // Track the attack time
                randomEnemy.attackPath = []; // Will store the attack path
                
                // Generate attack path based on enemy type and pattern
                switch (randomEnemy.attackPattern) {
                    case 0: // Direct dive at player
                        randomEnemy.attackPath = [
                            {x: randomEnemy.x, y: randomEnemy.y}, // Current position
                            {x: randomEnemy.x, y: randomEnemy.y + 50}, // Move down
                            {x: player.x, y: canvas.height / 2}, // Aim towards player
                            {x: player.x, y: canvas.height + 50} // Exit bottom
                        ];
                        break;
                    case 1: // S-curve attack
                        randomEnemy.attackPath = [
                            {x: randomEnemy.x, y: randomEnemy.y}, // Current position
                            {x: randomEnemy.x - 100, y: randomEnemy.y + 100}, // Curve left/down
                            {x: randomEnemy.x + 100, y: randomEnemy.y + 200}, // Curve right/down
                            {x: randomEnemy.x, y: canvas.height + 50} // Exit bottom
                        ];
                        break;
                    case 2: // Loop attack
                        randomEnemy.attackPath = [
                            {x: randomEnemy.x, y: randomEnemy.y}, // Current position
                            {x: randomEnemy.x + 100, y: randomEnemy.y + 100}, // Loop right
                            {x: randomEnemy.x, y: randomEnemy.y + 200}, // Loop bottom
                            {x: randomEnemy.x - 100, y: randomEnemy.y + 100}, // Loop left
                            {x: randomEnemy.x, y: randomEnemy.y}, // Return to start position
                            {x: randomEnemy.x, y: canvas.height + 50} // Exit bottom
                        ];
                        break;
                }
            }
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Decrement attack cooldown
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown--;
        }

        // Handle enemy entrance
        if (enemy.state === ENEMY_STATE.ENTRANCE) {
            if (enemy.entranceDelay > 0) {
                enemy.entranceDelay--;
                allEnemiesInFormation = false; // Not all enemies are in formation
                continue;
            }

            // Move along the bezier path
            if (enemy.pathProgress < 1) {
                // Get point along the path
                const point = bezierPoint(
                    enemy.path[0], enemy.path[1], enemy.path[2], enemy.path[3], 
                    enemy.pathProgress
                );
                
                // Update position
                enemy.x = point.x;
                enemy.y = point.y;
                
                // Advance along the path
                enemy.pathProgress += enemy.pathSpeed;
                allEnemiesInFormation = false; // Not all enemies are in formation
            } else {
                // Path completed, move directly to formation spot
                const dx = enemy.targetX - enemy.x;
                const dy = enemy.targetY - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > enemy.speed) {
                    enemy.x += dx / distance * enemy.speed;
                    enemy.y += dy / distance * enemy.speed;
                    allEnemiesInFormation = false; // Not all enemies are in formation
                } else {
                    // Reached formation position
                    enemy.x = enemy.targetX;
                    enemy.y = enemy.targetY;
                    enemy.state = ENEMY_STATE.FORMATION;
                    enemy.attackCooldown = Math.floor(Math.random() * 120) + 60; // Random cooldown
                }
            }
        }
        // Handle enemy in formation - subtle hover movement
        else if (enemy.state === ENEMY_STATE.FORMATION) {
            // Add slight hover movement in formation
            enemy.x = enemy.targetX + Math.sin(Date.now() / 1000 + enemy.id) * 3;
            enemy.y = enemy.targetY + Math.sin(Date.now() / 1500 + enemy.id * 2) * 2;
            
            // Chance to fire while in formation
            if (Math.random() < enemy.attackChance / 2) {
                fireEnemyBullet(enemy);
            }
        }
        // Handle enemy attack behavior
        else if (enemy.state === ENEMY_STATE.ATTACK) {
            enemy.attackTime++;
            
            // Calculate the position on the attack path
            const pathLength = enemy.attackPath.length - 1; // Number of segments
            const segmentTime = 100; // Time to complete each segment
            const totalPathTime = pathLength * segmentTime;
            
            if (enemy.attackTime < totalPathTime) {
                // Determine which segment we're in
                const segment = Math.min(Math.floor(enemy.attackTime / segmentTime), pathLength - 1);
                const segmentProgress = (enemy.attackTime % segmentTime) / segmentTime;
                
                // Get start and end points for the current segment
                const p0 = enemy.attackPath[segment];
                const p3 = enemy.attackPath[segment + 1];
                
                // Generate control points for smooth movement
                const p1 = {
                    x: p0.x + (p3.x - p0.x) * 0.3,
                    y: p0.y + (p3.y - p0.y) * 0.1
                };
                const p2 = {
                    x: p0.x + (p3.x - p0.x) * 0.7,
                    y: p0.y + (p3.y - p0.y) * 0.9
                };
                
                // Calculate the current position
                const point = bezierPoint(p0, p1, p2, p3, segmentProgress);
                enemy.x = point.x;
                enemy.y = point.y;
                
                // Higher chance to fire during attack
                if (Math.random() < enemy.attackChance * 2) {
                    fireEnemyBullet(enemy);
                }
            } else {
                // Path completed
                // If we're at the end of a looping path, return to formation
                if (enemy.attackPattern === 2 && enemy.attackTime < totalPathTime + 100) {
                    // Continue along path to return to formation position
                    const returnProgress = (enemy.attackTime - totalPathTime) / 100;
                    enemy.x = enemy.x * (1 - returnProgress) + enemy.targetX * returnProgress;
                    enemy.y = enemy.y * (1 - returnProgress) + enemy.targetY * returnProgress;
                    
                    if (returnProgress >= 0.99) {
                        enemy.state = ENEMY_STATE.FORMATION;
                        enemy.x = enemy.targetX;
                        enemy.y = enemy.targetY;
                        enemy.attackCooldown = Math.floor(Math.random() * 180) + 120; // Longer cooldown after attack
                    }
                }
                // For non-looping paths, just continue downwards
            }
        }

        // Remove enemy if it goes offscreen - enhanced logic
        if (isOffScreen(enemy)) {
            // If enemy was in formation, free up the spot
            if (enemy.targetX && enemy.targetY) {
                for (const spot of formationSpots) {
                    if (spot.x === enemy.targetX && spot.y === enemy.targetY) {
                        spot.taken = false;
                        break;
                    }
                }
            }
            
            // Track that this enemy left the screen
            console.log(`Enemy #${enemy.id} exited screen at (${enemy.x}, ${enemy.y})`);
            
            // Remove from array
            enemies.splice(i, 1);
            continue;
        }
    }
    
    // Check if all enemies are cleared to transition to the next level
    // This logging will help us diagnose the issue
    if (enemies.length === 0) {
        console.log("All enemies cleared, checking level transition state:", levelTransition);
        
        if (levelTransition === 0) {
            console.log("Starting level transition to level " + (level + 1));
            levelTransition = 60; // Add a delay before transitioning to the next level
            setTimeout(() => {
                level++;
                console.log("Spawning enemies for level " + level);
                spawnEnemies();
                levelTransition = 0;
            }, 2000); // 2-second delay before the next level starts
        }
    }
}

// Function to handle player movement and firing
function updatePlayer() {
    // Handle player movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= player.speed;
        if (player.x < player.w / 2) player.x = player.w / 2; // Prevent going offscreen
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += player.speed;
        if (player.x > canvas.width - player.w / 2) player.x = canvas.width - player.w / 2; // Prevent going offscreen
    }
    
    // Handle player firing
    if (keys['Space'] && player.cooldown <= 0 && player.alive) {
        const bullet = {
            x: player.x,
            y: player.y - player.h / 2,
            w: 3,
            h: 12,
            speed: 10,
            type: player.power === 'double' ? 'double' : 'normal',
            from: dualShip ? 'dual' : 'player'
        };
        bullets.push(bullet);
        updateBullets();
        // Dual ship fires an additional bullet
        player.cooldown--;
    }
}

// Function to update all gameplay elements
function updateGameplay() {
    // Update bullets
    updateBullets();
    
    // Update enemies
    updateEnemies();
    
    // Update player development (uncomment when needed)
    updatePlayer();
        // ctx.font = '12px monospace';
    // Update powerups
    updatePowerups();
}

// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === GAME_STATE.SPLASH) {
        drawArcadeSplash();
    } else if (state === GAME_STATE.PLAYING) {
        // Apply screen shake if active
        if (screenShake > 0) {
            ctx.save();
            ctx.translate(
                Math.random() * screenShake - screenShake / 2,
                Math.random() * screenShake - screenShake / 2
            );
            screenShake *= 0.9; // Reduce shake effect over time
            if (screenShake < 0.5) screenShake = 0;
        }

        // Update all gameplay elements
        updateGameplay();        

        // Draw bullets (both player and enemy)
        for (const bullet of bullets) {
            drawBullet(bullet);
        }
        for (const bullet of enemyBullets) {
            drawBullet(bullet);
        }
        
        // Draw enemies explicitly
        for (const enemy of enemies) {
            drawEnemy(enemy);
        }

        // Draw powerups
        for (const powerup of powerups) {
            drawPowerup(powerup);
        }

        // Draw boss if present
        if (bossGalaga) {
            drawBossGalaga(bossGalaga);
        }

        // Draw player
        if (player.alive) {
            drawPlayer();
        }

        // Draw level transition message if applicable
        if (levelTransition > 0) {
            ctx.font = 'bold 30px monospace';
            ctx.fillStyle = '#ff0';
            ctx.textAlign = 'center';
            ctx.fillText(`LEVEL ${level} COMPLETE!`, canvas.width / 2, canvas.height / 2);
            ctx.font = '20px monospace';
            ctx.fillStyle = '#0ff';
            ctx.fillText(`NEXT LEVEL STARTING...`, canvas.width / 2, canvas.height / 2 + 40);
        }

        if (screenShake > 0) {
            ctx.restore();
        }

        // Game HUD (score, lives, etc.)
        drawHUD();
    } else if (state === GAME_STATE.GAME_OVER) {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}