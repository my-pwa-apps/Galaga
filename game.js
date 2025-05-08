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
        
    } else {
        // Regular bullet - classic Galaga yellow shot
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

// Enhanced enemy bullet drawing with different types based on enemy
function drawEnemyBullet(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    
    // Different bullet styles based on enemy type
    if (b.type === 'basic') {
        // Standard bullet
        const bulletGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, 5);
        bulletGlow.addColorStop(0, '#fff');
        bulletGlow.addColorStop(0.6, '#0ff');
        bulletGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = bulletGlow;
        ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 100);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (b.type === 'fast') {
        // Fast enemy bullet - yellow streak
        ctx.fillStyle = '#ff0';
        ctx.shadowColor = '#ff0';
        ctx.shadowBlur = 8;
        
        // Elongated shape
        ctx.beginPath();
        ctx.ellipse(0, 0, 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(3, -5);
        ctx.lineTo(0, 8);
        ctx.lineTo(-3, -5);
        ctx.closePath();
        ctx.fill();
        
    } else if (b.type === 'tank') {
        // Tank enemy bullet - large and slow
        ctx.fillStyle = '#f00';
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 10;
        
        // Heavy bullet
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing impact ring
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 200);
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        
    } else if (b.type === 'sniper') {
        // Sniper bullet - thin and precise
        ctx.strokeStyle = '#f0f';
        ctx.shadowColor = '#f0f';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        
        // Laser line
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 10);
        ctx.stroke();
        
        // Target point
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (b.type === 'zigzag') {
        // Zigzag bullet - electricity
        ctx.strokeStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        
        // Lightning pattern
        ctx.beginPath();
        ctx.moveTo(0, -12);
        
        for (let i = 1; i < 6; i++) {
            const xOffset = Math.sin((Date.now() / 100) + i) * 4;
            const yPos = -12 + i * 4;
            ctx.lineTo(xOffset, yPos);
        }
        
        ctx.stroke();
        
        // Sparks
        if (Math.random() < 0.5) {
            ctx.globalAlpha = Math.random() * 0.8;
            ctx.beginPath();
            const sparkX = (Math.random() - 0.5) * 10;
            const sparkY = (Math.random() - 0.5) * 10;
            ctx.moveTo(0, 0);
            ctx.lineTo(sparkX, sparkY);
            ctx.stroke();
        }
        
    } else {
        // Default bullet for other enemy types
        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 5;
        
        // Rectangle shape
        ctx.fillRect(-2, -8, 4, 16);
        
        // Pulsing effect
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 150);
        ctx.fillRect(-4, -4, 8, 8);
    }
    
    ctx.restore();
}

function drawHUD() {
    ctx.save();
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('SCORE: ' + score, 20, 30);
    ctx.fillText('HIGH: ' + highScore, 20, 50);
    ctx.fillText('LIVES: ' + lives, canvas.width-120, 30);
    ctx.fillText('LEVEL: ' + level, canvas.width/2, 30);
    
    // Display challenge stage text
    if (challengeStage) {
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ff0';
        ctx.fillText('CHALLENGE STAGE', canvas.width/2, 50);
    }
    
    if (player.power !== 'normal') {
        ctx.fillStyle = '#0ff';
        ctx.fillText('POWER: ' + player.power.toUpperCase(), canvas.width/2, 70);
    }
    
    if (dualShip) {
        ctx.fillStyle = '#0f8';
        ctx.fillText('DUAL FIGHTER', canvas.width/2, dualShip ? 90 : 70);
    }
    
    ctx.restore();
}

function spawnEnemies() {
    enemies = [];
    formationSpots = [];
    attackQueue = [];
    
    // Create authentic Galaga butterfly/bee formation pattern
    const classicFormation = (level <= 10);
    
    // Galaga uses different layouts based on level
    let baseCols, baseRows, xSpacing, yStart;
    
    if (classicFormation) {
        // Classic Galaga formation - dual wings with a center column
        baseCols = 8;
        baseRows = 5;
        xSpacing = 40;
        yStart = 60;
    } else {
        // Higher level formations get more complex and dense
        baseCols = 5 + Math.floor(level/3);
        baseRows = 3 + Math.floor(level/4);
        baseCols = Math.min(baseCols, 10);
        baseRows = Math.min(baseRows, 6);
        xSpacing = (canvas.width-100)/(baseCols);
        yStart = 50;
    }
    
    // Enemy types with authentic Galaga specifications
    let types = [
        {name: 'basic', color: '#0f8', fireRate: 0.5, speed: 0.9, hp: 1, points: 80},   // Base enemies (bees)
        {name: 'fast', color: '#ff0', fireRate: 0.25, speed: 1.3, hp: 1, points: 100},  // Fast enemies (butterflies)
        {name: 'tank', color: '#0ff', fireRate: 0.7, speed: 0.6, hp: 2, points: 150},   // Tanky enemies (galaxian)
        {name: 'sniper', color: '#f0f', fireRate: 0.1, speed: 0.8, hp: 1, points: 120}, // Precise enemies (hornets)
        {name: 'zigzag', color: '#f00', fireRate: 0.3, speed: 1.1, hp: 1, points: 150}  // Erratic enemies (scorpions)
    ];
    
    // Enemy types unlocked gradually by level
    let maxType = 1;
    if (level >= 3) maxType = 2;
    if (level >= 5) maxType = 3;
    if (level >= 7) maxType = 4;
    
    // Special challenge stage every 3 levels
    challengeStage = (level % 3 === 0 && level > 0);
    
    if (challengeStage) {
        // Challenge stage has unique formation and behavior
        setupChallengeStage();
        return;
    }
    
    // Set up authentic Galaga formation
    if (classicFormation) {
        // Classic butterfly wing formation from the original game
        const centerX = canvas.width / 2;
        
        // Top row - command ships (higher tier enemies)
        for (let i = 0; i < 4; i++) {
            const offset = i < 2 ? (i - 1.5) * xSpacing * 1.6 : (i - 2) * xSpacing * 1.6;
            formationSpots.push({
                x: centerX + offset,
                y: yStart,
                taken: false,
                row: 0,
                col: i,
                type: 'command'
            });
        }
        
        // Middle rows - escort ships in classic wing formation
        for (let j = 1; j < 4; j++) {
            for (let i = 0; i < 8; i++) {
                // Skip the center positions to create wing shape
                if ((j === 2 || j === 3) && (i === 3 || i === 4)) continue;
                
                let offset = (i - 3.5) * xSpacing;
                formationSpots.push({
                    x: centerX + offset,
                    y: yStart + j * 36,
                    taken: false,
                    row: j,
                    col: i,
                    type: 'escort'
                });
            }
        }
        
        // Bottom row - wide spread of basic enemies
        for (let i = 0; i < 8; i++) {
            const offset = (i - 3.5) * xSpacing;
            formationSpots.push({
                x: centerX + offset,
                y: yStart + 4 * 36,
                taken: false,
                row: 4,
                col: i,
                type: 'guard'
            });
        }
    } else {
        // Higher level formations - more complex patterns
        // Center-heavy diamond formation
        const centerX = canvas.width / 2;
        
        for (let j = 0; j < baseRows; j++) {
            // Diamond pattern gets wider in middle rows
            const rowWidth = Math.min(j, baseRows - j - 1) + 3;
            const startCol = Math.floor((baseCols - rowWidth) / 2);
            const endCol = Math.ceil((baseCols + rowWidth) / 2);
            
            for (let i = startCol; i < endCol; i++) {
                const offset = (i - baseCols/2) * xSpacing;
                formationSpots.push({
                    x: centerX + offset,
                    y: yStart + j * 40,
                    taken: false,
                    row: j,
                    col: i,
                    type: j === 0 ? 'command' : (j < 2 ? 'escort' : 'guard')
                });
            }
        }
    }
    
    // Spawn boss Galaga (appears in level 3 and above)
    if (level >= 3 && !bossGalaga && Math.random() < 0.7) {
        bossGalaga = {
            x: canvas.width + 60,
            y: 40,
            w: 40,
            h: 30,
            targetX: canvas.width / 2,
            targetY: 40,
            hp: 5,
            state: 'entering',
            hasCaptured: false,
            tractorBeam: false,
            captureTimer: 0
        };
    }
    
    // Spawn enemies offscreen with authentic Galaga entrance patterns
    for (let spotIdx = 0; spotIdx < formationSpots.length; spotIdx++) {
        const spot = formationSpots[spotIdx];
        
        // Determine enemy type based on position and level
        let enemyTypeIdx;
        if (spot.type === 'command') {
            // Top row bosses - higher tier enemies
            enemyTypeIdx = Math.min(maxType, 4);
        } else if (spot.type === 'escort') {
            // Middle row escorts - mid tier enemies
            enemyTypeIdx = Math.min(Math.max(1, maxType-1), 3);
        } else {
            // Bottom row guards - basic enemies with some variation
            enemyTypeIdx = Math.min(Math.floor(Math.random() * (maxType+1)), 2);
        }
        
        // Get enemy properties
        const t = types[enemyTypeIdx];
        
        // Classic Galaga entrance paths based on column
        const pathType = spotIdx % 4;
        let entrancePath;
        
        switch(pathType) {
            case 0:
                entrancePath = 'loop_left';
                break;
            case 1:
                entrancePath = 'dive_right';
                break;
            case 2:
                entrancePath = 'spiral';
                break;
            case 3:
                entrancePath = 'loop_right';
                break;
        }
        
        // Starting position based on entrance path
        let ex, ey;
        if (entrancePath.includes('left')) {
            ex = -40;
            ey = canvas.height * 0.3 + Math.random() * 40;
        } else {
            ex = canvas.width + 40;
            ey = canvas.height * 0.3 + Math.random() * 40;
        }
        
        // Delay entry based on formation position - recreates the classic Galaga entrance timing
        const entryDelay = spotIdx * 0.1;
        
        // Create the enemy with enhanced properties
        enemies.push({
            x: ex,
            y: ey,
            w: 32,
            h: 24,
            dx: 0,
            dy: 0,
            alive: true,
            color: t.color,
            type: t.name,
            hp: t.hp,
            points: t.points,
            row: spot.row,
            col: spot.col,
            zigzagPhase: Math.random() * Math.PI * 2,
            state: ENEMY_STATE.ENTRANCE,
            formationX: spot.x,
            formationY: spot.y,
            entranceT: -entryDelay, // Negative for delayed start
            entrancePath: entrancePath,
            speed: t.speed,
            fireRate: t.fireRate,
            fireCooldown: 60 + Math.random() * 60,
            attackTimer: 0,
            attackDelay: 0,
            attackPattern: spotIdx % 3, // Different attack patterns
            formationIndex: spotIdx
        });
    }
}

// Set up a special challenge stage with authentic Galaga mechanics
function setupChallengeStage() {
    // Challenge stages have special formations that fly in set patterns
    const centerX = canvas.width / 2;
    const rows = 3;
    const enemiesPerRow = 8;
    const xSpacing = 40;
    const yStart = 60;
    
    // No attacking in challenge stage, just formation flying
    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < enemiesPerRow; i++) {
            // Distribute enemies in a grid
            const x = centerX + (i - enemiesPerRow/2 + 0.5) * xSpacing;
            const y = yStart + j * 40;
            
            // Challenge stage uses 3 different enemy types in rows
            const rowEnemyType = j % 3;
            const t = [
                {name: 'basic', color: '#0f8', hp: 1, points: 100},
                {name: 'fast', color: '#ff0', hp: 1, points: 100},
                {name: 'sniper', color: '#f0f', hp: 1, points: 100}
            ][rowEnemyType];
            
            // Starting positions for challenge stage swarm
            let ex = (Math.random() > 0.5) ? -40 : canvas.width + 40;
            let ey = canvas.height * 0.2 + Math.random() * 40;
            
            // Add to enemy array with challenge stage properties
            enemies.push({
                x: ex,
                y: ey,
                w: 32,
                h: 24,
                dx: 0,
                dy: 0,
                alive: true,
                color: t.color,
                type: t.name,
                hp: t.hp,
                points: t.points * 2, // Double points in challenge stages
                row: j,
                col: i,
                zigzagPhase: Math.random() * Math.PI * 2,
                state: ENEMY_STATE.ENTRANCE,
                formationX: x,
                formationY: y,
                entranceT: -i * 0.05 - j * 0.2, // Timing for wave entrance
                entrancePath: 'challenge',
                isChallenge: true,
                patternPhase: 0,
                patternTimer: 0
            });
        }
    }
}

function resetGame() {
    player.x = canvas.width/2;
    player.y = canvas.height-60;
    player.alive = true;
    player.power = 'normal';
    player.powerTimer = 0;
    player.shield = false;
    bullets = [];
    enemyBullets = [];
    powerups = [];
    score = 0;
    lives = 3;
    level = 1;
    levelTransition = 0;
    bossGalaga = null;
    capturedShip = false;
    dualShip = false;
    challengeStage = false;
    spawnEnemies();
}

function drawStarfield() {
    ctx.save();
    
    // Create deep space background with subtle nebula effect
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#000');
    bgGradient.addColorStop(0.3, '#001');
    bgGradient.addColorStop(0.7, '#002');
    bgGradient.addColorStop(1, '#000');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant nebulae and galaxies in the background (subtle)
    ctx.save();
    ctx.globalAlpha = 0.05;
    
    // First nebula
    const nebulaGradient1 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.3, 10,
        canvas.width * 0.2, canvas.height * 0.3, 150
    );
    nebulaGradient1.addColorStop(0, '#f0f');
    nebulaGradient1.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = nebulaGradient1;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.3, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // Second nebula
    const nebulaGradient2 = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.7, 10,
        canvas.width * 0.8, canvas.height * 0.7, 180
    );
    nebulaGradient2.addColorStop(0, '#0ff');
    nebulaGradient2.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = nebulaGradient2;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.7, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Draw multiple layers of stars for parallax effect
    
    // Distant stars (small, slow)
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 80; i++) {
        const brightness = 0.5 + 0.5 * Math.sin(Date.now() / 3000 + i);
        const starColor = `rgba(255, 255, 255, ${brightness * 0.7})`;
        
        ctx.fillStyle = starColor;
        let sx = (i * 83 + Math.sin(i) * 30) % canvas.width;
        let sy = ((i * 127 + Date.now() / 40) % canvas.height);
        ctx.fillRect(sx, sy, 1, 1);
    }
    
    // Mid-distance stars (medium, moderate speed)
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 60; i++) {
        const brightness = 0.6 + 0.4 * Math.sin(Date.now() / 2000 + i);
        const idx = i % arcadeColors.length;
        const starColor = arcadeColors[idx];
        
        ctx.fillStyle = starColor;
        ctx.globalAlpha = brightness * 0.6;
        
        let sx = (i * 67 + Math.sin(i) * 20) % canvas.width;
        let sy = ((i * 101 + Date.now() / 20) % canvas.height);
        ctx.fillRect(sx, sy, 2, 2);
    }
    
    // Close stars (large, fast, colorful)
    for (let i = 0; i < 40; i++) {
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 500 + i);
        const idx = i % arcadeColors.length;
        const starColor = arcadeColors[idx];
        
        ctx.fillStyle = starColor;
        ctx.globalAlpha = pulse;
        
        let sx = (i * 59 + Math.sin(i) * 10) % canvas.width;
        let sy = ((i * 97 + Date.now() / 10) % canvas.height);
        
        // Occasionally draw a "twinkle" effect
        if (Math.random() < 0.03) {
            ctx.save();
            ctx.globalAlpha = Math.random() * 0.8;
            ctx.beginPath();
            ctx.arc(sx, sy, 3 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            const size = 2 + pulse;
            ctx.fillRect(sx, sy, size, size);
        }
    }
    
    // Occasional shooting stars
    if (Math.random() < 0.01) {
        ctx.save();
        const shootX = Math.random() * canvas.width;
        const shootY = Math.random() * canvas.height / 3;
        const length = 20 + Math.random() * 30;
        const angle = Math.PI / 4 + Math.random() * Math.PI / 4;
        
        const shootGradient = ctx.createLinearGradient(
            shootX, shootY,
            shootX + Math.cos(angle) * length,
            shootY + Math.sin(angle) * length
        );
        shootGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        shootGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = shootGradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(shootX, shootY);
        ctx.lineTo(
            shootX + Math.cos(angle) * length,
            shootY + Math.sin(angle) * length
        );
        ctx.stroke();
        ctx.restore();
    }
    
    ctx.globalAlpha = 1;
    ctx.restore();
}

// Add shooting logic function
function updateShooting() {
    // Main ship shooting
    if (keys[' '] && player.cooldown <= 0 && player.alive) {
        if (player.power === 'double') {
            bullets.push({x: player.x-7, y: player.y-16, vy: -9, type: 'double'});
            bullets.push({x: player.x+7, y: player.y-16, vy: -9, type: 'double'});
        } else {
            bullets.push({x: player.x, y: player.y-16, vy: -8, type: 'normal'});
        }
        player.cooldown = player.power === 'double' ? 10 : 16;
        playShootSound();
        
        // Dual ship fires simultaneously if active
        if (dualShip) {
            bullets.push({x: player.x-20, y: player.y-12, vy: -8, type: 'normal', from: 'dual'});
            playShootSound();
        }
    }
    
    if (player.cooldown > 0) player.cooldown--;
}

function updateGame() {
    // Apply screen shake effect
    if (screenShake > 0) {
        ctx.save();
        ctx.translate(
            Math.random() * screenShake - screenShake/2,
            Math.random() * screenShake - screenShake/2
        );
        screenShake -= 0.5;
        // Don't forget to restore after applying translation
    }
    
    // Player movement
    let moveSpeed = player.speed + (player.power === 'speed' ? 2 : 0);
    if (keys['ArrowLeft'] && player.x > 20) player.x -= moveSpeed;
    if (keys['ArrowRight'] && player.x < canvas.width-20) player.x += moveSpeed;
    // Powerup timer
    if (player.power !== 'normal') {
        player.powerTimer--;
        if (player.powerTimer <= 0) {
            player.power = 'normal';
            player.shield = false;
        }
    }
    // Updated shooting logic
    updateShooting();
    // Bullets
    bullets.forEach(b => b.y += b.vy);
    bullets = bullets.filter(b => b.y > -20);

    // --- Galaga-style enemy logic ---
    // 1. ENTRANCE: Enemies fly in a curve to their formation spot
    let allInFormation = true;
    enemies.forEach((e, idx) => {
        if (!e.alive) return;
        if (e.state === ENEMY_STATE.ENTRANCE) {
            e.entranceT += 0.018 + 0.002*level;
            // Swoop: parametric curve from (e.x, e.y) to (formationX, formationY)
            let t = e.entranceT;
            let sx = (idx%2===0) ? -40 : canvas.width+40;
            let sy = e.formationY + Math.sin(idx)*30;
            // Swoop in a loop
            e.x = sx + (e.formationX-sx)*0.5*(1-Math.cos(Math.PI*t));
            e.y = sy + (e.formationY-sy)*0.5*(1-Math.cos(Math.PI*t)) + Math.sin(Math.PI*t*2+idx)*10;
            if (t >= 1) {
                e.x = e.formationX;
                e.y = e.formationY;
                e.state = ENEMY_STATE.FORMATION;
            } else {
                allInFormation = false;
            }
        }
    });
    // 2. FORMATION: Enemies hold position, some break off to attack
    if (allInFormation) {
        // Attack queue: pick a few enemies to attack at a time
        if (attackQueue.length === 0 && Math.random() < 0.03 + 0.01*level) {
            let candidates = enemies.filter(e => e.state === ENEMY_STATE.FORMATION && e.alive);
            if (candidates.length > 0) {
                let nAttackers = Math.min(1+Math.floor(level/2), candidates.length);
                for (let i=0; i<nAttackers; i++) {
                    let pick = candidates[Math.floor(Math.random()*candidates.length)];
                    pick.state = ENEMY_STATE.ATTACK;
                    pick.attackTimer = 0;
                    attackQueue.push(pick);
                }
            }
        }
    }
    // 3. ATTACK: Enemies dive toward the player, then return to formation
    attackQueue = attackQueue.filter(e => e.alive && e.state === ENEMY_STATE.ATTACK);
    attackQueue.forEach(e => {
        if (!e.alive) return;
        e.attackTimer++;
        let t = e.attackTimer / 120;
        let px = player.x;
        let py = player.y;
        if (t < 1) {
            e.x += (px - e.x) * 0.05 + Math.sin(t * 8 + e.zigzagPhase) * 3;
            e.y += (py - e.y) * 0.05 + Math.abs(Math.sin(t * 4 + e.zigzagPhase)) * 3;
            if (e.fireCooldown <= 0 && Math.abs(e.x - px) < 50 && Math.random() < 0.3) {
                let dx = px - e.x;
                let dy = py - e.y;
                let mag = Math.sqrt(dx * dx + dy * dy);
                enemyBullets.push({ x: e.x, y: e.y + 10, vy: 3 + level * 0.1, vx: dx / mag * 2, type: e.type });
                e.fireCooldown = 30 + Math.random() * 20;
            }
        } else {
            e.x += (e.formationX - e.x) * 0.08;
            e.y += (e.formationY - e.y) * 0.08;
            if (Math.abs(e.x - e.formationX) < 2 && Math.abs(e.y - e.formationY) < 2) {
                e.x = e.formationX;
                e.y = e.formationY;
                e.state = ENEMY_STATE.FORMATION;
            }
        }
        e.fireCooldown--;
    });
    // 4. FORMATION: Enemies wiggle in place
    enemies.forEach(e => {
        if (!e.alive) return;
        if (e.state === ENEMY_STATE.FORMATION) {
            e.x = e.formationX + Math.sin(Date.now()/400 + e.formationY/30)*4;
            e.y = e.formationY + Math.sin(Date.now()/300 + e.formationX/40)*2;
        }
    });

    // --- End Galaga logic ---
    // Enemy bullets
    enemyBullets.forEach(b => {
        b.y += b.vy;
        if (b.vx) b.x += b.vx;
    });
    enemyBullets = enemyBullets.filter(b => b.y < canvas.height+20 && b.x > -10 && b.x < canvas.width+10);
    // Powerups
    powerups.forEach(p => p.y += 2);
    powerups = powerups.filter(p => p.y < canvas.height+20);
    // Collisions: bullets vs enemies
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (e.alive && Math.abs(b.x - e.x) < 18 && Math.abs(b.y - e.y) < 16) {
                e.hp--;                if (e.hp <= 0) {
                    e.alive = false;
                    score += 100 + level * 10;
                    playExplosionSound();
                    
                    // Create spectacular explosion with multiple particle types
                    // 1. Core explosion particles
                    for (let i = 0; i < 15; i++) {
                        particles.push({
                            x: e.x,
                            y: e.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4,
                            size: 3 + Math.random() * 3,
                            alpha: 1,
                            color: e.color,
                            type: 'explosion',
                            shape: Math.random() < 0.5 ? 'circle' : 'irregular',
                            life: 30 + Math.random() * 20,
                            initialLife: 30 + Math.random() * 20
                        });
                    }
                    
                    // 2. Bright sparks - energy particles
                    for (let i = 0; i < 8; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 3 + Math.random() * 5;
                        particles.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            size: 1 + Math.random() * 2,
                            alpha: 1,
                            color: '#fff',
                            type: 'spark',
                            life: 15 + Math.random() * 10,
                            initialLife: 15 + Math.random() * 10
                        });
                    }
                    
                    // 3. Ship debris - parts of the enemy
                    for (let i = 0; i < 6; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 1 + Math.random() * 3;
                        particles.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            size: 2 + Math.random() * 2,
                            alpha: 1,
                            color: e.color,
                            type: 'debris',
                            rotation: Math.random() * Math.PI * 2,
                            rotationSpeed: (Math.random() - 0.5) * 0.2,
                            life: 40 + Math.random() * 20,
                            initialLife: 40 + Math.random() * 20
                        });
                    }
                    
                    // 4. Smoke cloud
                    for (let i = 0; i < 4; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 0.5 + Math.random() * 1;
                        particles.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            size: 6 + Math.random() * 8,
                            alpha: 0.7,
                            color: '#888',
                            type: 'smoke',
                            life: 50 + Math.random() * 20,
                            initialLife: 50 + Math.random() * 20
                        });
                    }
                    
                    // Add screen shake based on enemy type
                    if (e.type === 'tank' || e.type === 'boss') {
                        screenShake = 8;
                    } else {
                        screenShake = 3;
                    }
                    
                    // Add power-up drops
                    if (Math.random() < 0.2) {
                        powerups.push({ x: e.x, y: e.y, type: ['double', 'shield', 'speed'][Math.floor(Math.random() * 3)] });
                    }
                }
                bullets.splice(bi, 1);
            }
        });
    });
    // Destroy enemy bullets with player bullets
    bullets.forEach((b, bi) => {
        enemyBullets.forEach((eb, ei) => {
            if (Math.abs(b.x-eb.x)<7 && Math.abs(b.y-eb.y)<12) {
                bullets.splice(bi,1);
                enemyBullets.splice(ei,1);
            }
        });
    });
    // Remove dead enemies
    enemies = enemies.filter(e => e.alive);
    // Powerup pickup
    powerups.forEach((p, pi) => {
        if (player.alive && Math.abs(p.x-player.x)<18 && Math.abs(p.y-player.y)<18) {
            if (p.type === 'double') {
                player.power = 'double';
                player.powerTimer = 600 + level*60;
            } else if (p.type === 'shield') {
                player.power = 'shield';
                player.powerTimer = 500 + level*40;
                player.shield = true;
            } else if (p.type === 'speed') {
                player.power = 'speed';
                player.powerTimer = 500 + level*40;
            }
            powerups.splice(pi,1);
        }
    });
    // Enemy bullet hits player
    enemyBullets.forEach((b, bi) => {
        if (player.alive && Math.abs(b.x-player.x)<14 && Math.abs(b.y-player.y)<16) {
            if (player.shield) {
                player.shield = false;
                player.power = 'normal';
                enemyBullets.splice(bi,1);
                screenShake = 5; // Add mild screen shake when shield is hit
            } else {
                lives--;
                player.alive = false;
                playExplosionSound();
                screenShake = 15; // Add stronger screen shake when player loses a life
                setTimeout(()=>{
                    if (lives > 0) {
                        player.x = canvas.width/2;
                        player.y = canvas.height-60;
                        player.alive = true;
                    } else {
                        state = GAME_STATE.GAME_OVER;
                    }
                }, 1000);
            }
        }
    });
    // Win condition: next level
    if (enemies.length === 0 && levelTransition === 0) {
        levelTransition = 60;
    }
    if (levelTransition > 0) {
        levelTransition--;
        if (levelTransition === 0) {
            level++;
            spawnEnemies();
        }
    }
}

// Enhanced particle system for visually spectacular explosions and effects
function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        
        // Apply more realistic physics
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        
        // Update particle life and properties
        p.life--;
        p.alpha = p.life / p.initialLife;
        
        // Skip drawing completely faded particles
        if (p.alpha <= 0) {
            particles.splice(i, 1);
            i--;
            continue;
        }
        
        ctx.save();
        
        // Different rendering based on particle type
        if (p.type === 'explosion') {
            // Core explosion particle
            ctx.globalAlpha = p.alpha;
            
            // Create realistic explosion gradient
            const particleGradient = ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 2
            );
            
            if (p.color === '#f00' || p.color === '#f80' || p.color === '#ff0') {
                // Fire explosion colors
                particleGradient.addColorStop(0, '#fff');
                particleGradient.addColorStop(0.4, p.color);
                particleGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = particleGradient;
                ctx.beginPath();
                
                // Random shapes for fire particles
                if (p.shape === 'circle') {
                    ctx.arc(p.x, p.y, p.size * (0.5 + p.alpha), 0, Math.PI * 2);
                } else {
                    // Irregular shape for flames
                    ctx.beginPath();
                    const sides = 5;
                    const variation = 0.5;
                    
                    for (let j = 0; j < sides; j++) {
                        const angle = (j / sides) * Math.PI * 2;
                        const radius = p.size * (1 + Math.sin(p.life / 5 + j) * variation);
                        const ptX = p.x + Math.cos(angle) * radius;
                        const ptY = p.y + Math.sin(angle) * radius;
                        
                        if (j === 0) {
                            ctx.moveTo(ptX, ptY);
                        } else {
                            ctx.lineTo(ptX, ptY);
                        }
                    }
                    ctx.closePath();
                }
            } else {
                // Energy/tech explosion colors
                particleGradient.addColorStop(0, '#fff');
                particleGradient.addColorStop(0.3, p.color);
                particleGradient.addColorStop(0.8, p.color);
                particleGradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = particleGradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (0.6 + p.alpha * 0.6), 0, Math.PI * 2);
            }
            
            ctx.fill();
            
            // Outer glow for dramatic effect
            ctx.globalAlpha = p.alpha * 0.4;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (p.type === 'spark') {
            // High-energy sparks
            ctx.globalAlpha = p.alpha * 1.2; // Brighter than normal
            ctx.strokeStyle = p.color === '#f00' ? '#ff0' : '#fff';
            ctx.lineWidth = p.size / 2;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            
            // Draw tracer line
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
            ctx.stroke();
            
            // Tip of the spark
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (p.type === 'debris') {
            // Debris/shrapnel particles
            ctx.globalAlpha = p.alpha * 0.8;
            ctx.fillStyle = p.color;
            
            // Rotate for tumbling effect
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            if (Math.random() < 0.5) {
                // Some debris is rectangular
                ctx.fillRect(-p.size, -p.size/2, p.size * 2, p.size);
            } else {
                // Some is triangular
                ctx.beginPath();
                ctx.moveTo(p.size, 0);
                ctx.lineTo(-p.size, -p.size);
                ctx.lineTo(-p.size, p.size);
                ctx.closePath();
                ctx.fill();
            }
            
        } else if (p.type === 'smoke') {
            // Smoke effect
            ctx.globalAlpha = p.alpha * 0.3;
            const smokeGradient = ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 2
            );
            smokeGradient.addColorStop(0, p.color);
            smokeGradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = smokeGradient;
            ctx.beginPath();
            
            // Irregular cloud shape
            ctx.beginPath();
            const sides = 8;
            
            for (let j = 0; j < sides; j++) {
                const angle = (j / sides) * Math.PI * 2;
                const wobble = Math.sin(p.life / 10 + j * 2) * 0.3;
                const radius = p.size * (1 + wobble);
                const ptX = p.x + Math.cos(angle) * radius;
                const ptY = p.y + Math.sin(angle) * radius;
                
                if (j === 0) {
                    ctx.moveTo(ptX, ptY);
                } else {
                    ctx.lineTo(ptX, ptY);
                }
            }
            
            ctx.closePath();
            ctx.fill();
            
        } else {
            // Default particle behavior
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add simple glow
            ctx.globalAlpha = p.alpha * 0.4;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Update rotation for 3D effect on certain particles
        if (p.rotation !== undefined) {
            p.rotation += p.rotationSpeed;
        }
    }
    
    // Create particles in bulk for performance if needed
    if (particles.length > 200) {
        particles = particles.filter(p => p.alpha > 0.2 || p.type === 'explosion');
    }
}

// Enhanced game draw function
function drawGame() {
    // Improved starfield background with parallax effect
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Far stars (small, slow)
    for (let i = 0; i < 70; i++) {
        ctx.fillStyle = '#666';
        let sx = (i * 89) % canvas.width;
        let sy = ((i * 137 + Date.now() / 50) % canvas.height);
        ctx.fillRect(sx, sy, 1, 1);
    }
    
    // Mid stars (medium, faster)
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = '#999';
        let sx = (i * 73) % canvas.width;
        let sy = ((i * 113 + Date.now() / 20) % canvas.height);
        ctx.fillRect(sx, sy, 2, 2);
    }
    
    // Near stars (bright, fastest)
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = arcadeColors[i % arcadeColors.length];
        let sx = (i * 53) % canvas.width;
        let sy = ((i * 97 + Date.now() / 10) % canvas.height);
        ctx.fillRect(sx, sy, 3, 3);
    }
    
    // Draw game objects
    if (player.alive) drawPlayer();
    bullets.forEach(drawBullet);
    enemies.forEach(e => { if (e.alive) drawEnemy(e); });
    
    if (bossGalaga) {
        drawBossGalaga(bossGalaga);
        
        // Draw tractor beam
        if (bossGalaga.tractorBeam) {
            ctx.save();
            ctx.strokeStyle = '#ff0';
            ctx.globalAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 50);
            ctx.lineWidth = 30;
            ctx.beginPath();
            ctx.moveTo(bossGalaga.x, bossGalaga.y + 20);
            ctx.lineTo(player.x, player.y - 20);
            ctx.stroke();
            
            ctx.lineWidth = 10;
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 30);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    enemyBullets.forEach(drawEnemyBullet);
    powerups.forEach(drawPowerup);
    drawParticles();
    drawHUD();
    
    // Level transition
    if (levelTransition > 0) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 32px monospace';
        ctx.fillStyle = '#ff0';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL ' + (level + 1), canvas.width / 2, canvas.height / 2 + 10);
        ctx.restore();
    }
}

function drawGameOver() {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2-20);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('SCORE: ' + score, canvas.width/2, canvas.height/2+20);
    ctx.fillStyle = '#0ff';
    ctx.fillText('PRESS SPACE TO RESTART', canvas.width/2, canvas.height/2+60);
    ctx.restore();
}

// --- Sound Generation ---
let audioCtx = null;
function playShootSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.value = 0.1;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.frequency.linearRampToValueAtTime(440, audioCtx.currentTime+0.08);
    o.stop(audioCtx.currentTime+0.09);
}
function playExplosionSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 220;
    g.gain.value = 0.2;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.frequency.linearRampToValueAtTime(60, audioCtx.currentTime+0.18);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.2);
    o.stop(audioCtx.currentTime+0.21);
}

// --- Main Loop ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each frame
    if (state === GAME_STATE.SPLASH) {
        drawArcadeSplash();
    } else if (state === GAME_STATE.PLAYING) {
        updateGame();
        drawGame();
    } else if (state === GAME_STATE.GAME_OVER) {
        drawGame();
        drawGameOver();
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (state === GAME_STATE.SPLASH && e.key === ' ') {
        resetGame();
        state = GAME_STATE.PLAYING;
    }
    if (state === GAME_STATE.GAME_OVER && e.key === ' ') {
        resetGame();
        state = GAME_STATE.PLAYING;
    }
});
document.addEventListener('keyup', e => {
    keys[e.key] = false;
});

gameLoop();
